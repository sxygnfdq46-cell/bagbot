from __future__ import annotations

import json
import time
from typing import Any, Dict, List, Optional, Tuple

from redis.asyncio import Redis
from redis.exceptions import WatchError


def _now_ms() -> int:
    return int(time.time() * 1000)


class RedisJobStore:
    """Async Redis-backed JobStore matching the in-memory interface."""

    def __init__(
        self,
        *,
        redis_url: str | None = None,
        client: Optional[Redis] = None,
        namespace: str = "job",
    ) -> None:
        if client is not None:
            self._redis = client
            self._own_client = False
        else:
            self._redis = Redis.from_url(
                redis_url or "redis://localhost:6379/0", decode_responses=True
            )
            self._own_client = True
        self._namespace = namespace
        self._retry_zset = f"{namespace}:retry_zset"

    def _job_key(self, job_id: str) -> str:
        return f"{self._namespace}:{job_id}"

    async def claim(self, job_id: str) -> bool:
        now_ms = _now_ms()
        hkey = self._job_key(job_id)
        while True:
            try:
                async with self._redis.pipeline(transaction=True) as pipe:
                    await pipe.watch(hkey)
                    state = await pipe.hget(hkey, "state")
                    attempts_raw = await pipe.hget(hkey, "attempts")

                    if state in ("running", "done"):
                        await pipe.reset()
                        return False

                    attempts_val = int(attempts_raw or 0)
                    if state != "retry_scheduled":
                        attempts_val += 1

                    pipe.multi()
                    pipe.hset(
                        hkey,
                        mapping={
                            "state": "running",
                            "attempts": attempts_val,
                            "updated_at": now_ms,
                        },
                    )
                    await pipe.execute()
                    return True
            except WatchError:
                continue

    async def set_state(
        self,
        job_id: str,
        state: str,
        last_error: Optional[str] = None,
    ) -> None:
        mapping: Dict[str, Any] = {"state": state, "updated_at": _now_ms()}
        if last_error is not None:
            mapping["last_error"] = last_error
        if state != "retry_scheduled":
            mapping["next_retry_at"] = ""
            await self._redis.zrem(self._retry_zset, job_id)
        await self._redis.hset(self._job_key(job_id), mapping=mapping)

    async def set_last_job(self, job_id: str, job: Dict) -> None:
        await self._redis.hset(
            self._job_key(job_id), mapping={"last_job": json.dumps(job)}
        )

    async def get_state(self, job_id: str) -> Optional[str]:
        return await self._redis.hget(self._job_key(job_id), "state")

    async def increment_attempts(self, job_id: str) -> int:
        attempts = await self._redis.hincrby(
            self._job_key(job_id), "attempts", 1
        )
        await self._redis.hset(
            self._job_key(job_id), mapping={"updated_at": _now_ms()}
        )
        return int(attempts)

    async def schedule_retry(self, job_id: str, epoch_ms: float) -> None:
        now_ms = _now_ms()
        async with self._redis.pipeline(transaction=True) as pipe:
            pipe.hset(
                self._job_key(job_id),
                mapping={
                    "state": "retry_scheduled",
                    "next_retry_at": epoch_ms,
                    "updated_at": now_ms,
                },
            )
            pipe.zadd(self._retry_zset, {job_id: epoch_ms})
            await pipe.execute()

    async def next_retry_jobs(self, now_ms: float) -> List[Tuple[str, Dict]]:
        members = await self._redis.zrangebyscore(
            self._retry_zset, min=0, max=now_ms
        )
        jobs: List[Tuple[str, Dict]] = []
        if not members:
            return jobs

        for job_id in members:
            last_job_json = await self._redis.hget(
                self._job_key(job_id), "last_job"
            )
            await self._redis.hset(
                self._job_key(job_id), mapping={"next_retry_at": ""}
            )
            await self._redis.zrem(self._retry_zset, job_id)
            if last_job_json:
                jobs.append((job_id, json.loads(last_job_json)))
        return jobs

    async def attempts(self, job_id: str) -> int:
        attempts = await self._redis.hget(self._job_key(job_id), "attempts")
        return int(attempts or 0)

    async def reset(self, job_id: str) -> None:
        await self._redis.delete(self._job_key(job_id))
        await self._redis.zrem(self._retry_zset, job_id)

    async def dump(self) -> Dict[str, Dict[str, Any]]:
        snapshot: Dict[str, Dict[str, Any]] = {}
        pattern = f"{self._namespace}:*"
        async for key in self._redis.scan_iter(match=pattern):
            if key.endswith("retry_zset"):
                continue
            data = await self._redis.hgetall(key)
            snapshot[key] = data
        return snapshot

    async def close(self) -> None:
        if self._own_client:
            await self._redis.close()
