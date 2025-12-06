from __future__ import annotations

import asyncio
import time
from typing import Any, Awaitable, Callable, Dict, List, Optional

from redis.asyncio import Redis


def _now_ms() -> int:
    return int(time.time() * 1000)


class WorkerCoordinator:
    """Redis-backed worker registry and coordination helpers."""

    def __init__(
        self,
        *,
        redis_url: str | None = None,
        client: Optional[Redis] = None,
        namespace: str = "worker",
        ttl_seconds: float = 60,
    ) -> None:
        if client is not None:
            self._redis = client
            self._own_client = False
        else:
            self._redis = Redis.from_url(
                redis_url or "redis://localhost:6379/0",
                decode_responses=True,
            )
            self._own_client = True
        self._namespace = namespace
        self._workers_key = f"{namespace}:workers"
        self._ttl_ms = int(ttl_seconds * 1000)

    def _worker_key(self, worker_id: str) -> str:
        return f"{self._namespace}:{worker_id}:info"

    def _shutdown_key(self, worker_id: str) -> str:
        return f"{self._namespace}:{worker_id}:shutdown"

    async def register(
        self,
        worker_id: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        now = _now_ms()
        mapping: Dict[str, Any] = {
            "worker_id": worker_id,
            "status": "online",
            "last_seen_ms": now,
        }
        if metadata:
            mapping.update({f"meta_{k}": v for k, v in metadata.items()})

        pipe = self._redis.pipeline()
        pipe.sadd(self._workers_key, worker_id)
        pipe.hset(self._worker_key(worker_id), mapping=mapping)
        pipe.pexpire(self._worker_key(worker_id), self._ttl_ms)
        await pipe.execute()

    async def heartbeat(self, worker_id: str) -> None:
        await self._redis.hset(
            self._worker_key(worker_id),
            mapping={"last_seen_ms": _now_ms(), "status": "online"},
        )
        await self._redis.pexpire(self._worker_key(worker_id), self._ttl_ms)

    async def heartbeat_loop(
        self,
        worker_id: str,
        *,
        interval: float = 5.0,
        shutdown_event: Optional[asyncio.Event] = None,
    ) -> None:
        """Send periodic heartbeats until shutdown_event is set."""

        poll_ms = int(interval * 1000)
        while True:
            if shutdown_event and shutdown_event.is_set():
                break
            await self.heartbeat(worker_id)
            should_stop = await _wait_or_timeout(poll_ms, shutdown_event)
            if should_stop:
                break

    async def deregister(self, worker_id: str) -> None:
        pipe = self._redis.pipeline()
        pipe.srem(self._workers_key, worker_id)
        pipe.delete(self._worker_key(worker_id))
        pipe.delete(self._shutdown_key(worker_id))
        await pipe.execute()

    async def active_workers(self) -> List[str]:
        await self.cleanup_stale()
        members = await self._redis.smembers(self._workers_key)
        return list(members)

    async def get_worker(self, worker_id: str) -> Dict[str, Any]:
        return await self._redis.hgetall(self._worker_key(worker_id))

    async def cleanup_stale(self) -> List[str]:
        now = _now_ms()
        stale: List[str] = []
        workers = await self._redis.smembers(self._workers_key)
        for worker_id in workers:
            data = await self._redis.hgetall(self._worker_key(worker_id))
            last_seen = int(data.get("last_seen_ms", 0)) if data else 0
            if not data or now - last_seen > self._ttl_ms:
                stale.append(worker_id)
                await self._redis.delete(self._worker_key(worker_id))
                await self._redis.delete(self._shutdown_key(worker_id))
                await self._redis.srem(self._workers_key, worker_id)
        return stale

    async def mark_shutdown(
        self,
        worker_id: str,
        *,
        ttl_seconds: Optional[int] = None,
    ) -> None:
        ttl_ms = int((ttl_seconds or self._ttl_ms / 1000) * 1000)
        await self._redis.set(self._shutdown_key(worker_id), "1", px=ttl_ms)

    async def clear_shutdown(self, worker_id: str) -> None:
        await self._redis.delete(self._shutdown_key(worker_id))

    async def should_shutdown(self, worker_id: str) -> bool:
        flag = await self._redis.get(self._shutdown_key(worker_id))
        return bool(flag)

    async def close(self) -> None:
        if getattr(self, "_own_client", False):
            await self._redis.close()


async def _wait_or_timeout(
    poll_interval_ms: int,
    shutdown_event: Optional[asyncio.Event],
) -> bool:
    if poll_interval_ms <= 0:
        return False
    if shutdown_event is None:
        await asyncio.sleep(poll_interval_ms / 1000.0)
        return False
    try:
        await asyncio.wait_for(
            shutdown_event.wait(), timeout=poll_interval_ms / 1000.0
        )
        return True
    except asyncio.TimeoutError:
        return False


async def worker_loop(
    run_once: Callable[[], Awaitable[Any]],
    *,
    poll_interval_ms: int = 1000,
    shutdown_event: Optional[asyncio.Event] = None,
) -> None:
    """Generic worker loop that can be stopped via an asyncio.Event."""

    while True:
        if shutdown_event and shutdown_event.is_set():
            break
        await run_once()
        should_stop = await _wait_or_timeout(poll_interval_ms, shutdown_event)
        if should_stop:
            break


async def retry_worker_loop(
    run_once: Callable[[], Awaitable[Any]],
    *,
    poll_interval_ms: int = 500,
    shutdown_event: Optional[asyncio.Event] = None,
) -> None:
    """Loop runner for retry/monitor workers with graceful shutdown."""

    while True:
        if shutdown_event and shutdown_event.is_set():
            break
        await run_once()
        should_stop = await _wait_or_timeout(poll_interval_ms, shutdown_event)
        if should_stop:
            break
