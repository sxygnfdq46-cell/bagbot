from __future__ import annotations

import asyncio
import logging
import signal
import uuid
from typing import Optional

from backend.workers import job_store
from backend.workers.orchestration import WorkerCoordinator
from backend.workers.runner import runner_loop

logger = logging.getLogger(__name__)


async def _run_worker(
    worker_id: Optional[str] = None,
    redis_url: Optional[str] = None,
    *,
    shutdown_event: Optional[asyncio.Event] = None,
    heartbeat_interval: float = 5.0,
    poll_interval_ms: int = 500,
) -> None:
    coord = WorkerCoordinator(redis_url=redis_url)
    worker_identifier = worker_id or f"worker-{uuid.uuid4().hex[:8]}"
    await coord.register(worker_identifier)

    stop_event = shutdown_event or asyncio.Event()

    hb_task = asyncio.create_task(
        coord.heartbeat_loop(
            worker_identifier,
            interval=heartbeat_interval,
            shutdown_event=stop_event,
        )
    )

    runner_task = asyncio.create_task(
        runner_loop(
            shutdown_event=stop_event,
            store=job_store.default_store,
            poll_interval_ms=poll_interval_ms,
        )
    )

    loop = asyncio.get_running_loop()
    try:
        loop.add_signal_handler(signal.SIGINT, stop_event.set)
        loop.add_signal_handler(signal.SIGTERM, stop_event.set)
    except NotImplementedError:
        logger.debug(
            "Signal handler registration not supported on this platform"
        )

    try:
        await stop_event.wait()
        logger.info("Shutdown signal received, starting graceful shutdown")
    finally:
        stop_event.set()
        try:
            await asyncio.wait_for(runner_task, timeout=10)
        except asyncio.TimeoutError:
            logger.warning("Runner did not exit in time, cancelling")
            runner_task.cancel()
            await asyncio.gather(runner_task, return_exceptions=True)

        hb_task.cancel()
        await asyncio.gather(hb_task, return_exceptions=True)
        await coord.deregister(worker_identifier)
        await coord.close()
        logger.info("Worker shutdown complete")


def main() -> None:
    asyncio.run(_run_worker())


if __name__ == "__main__":
    main()
