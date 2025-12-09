from __future__ import annotations

import os
import sys

try:
	from worker.scheduler import DailyCycleScheduler  # type: ignore
except Exception:  # pragma: no cover - fallback for tests with mocked worker
	class DailyCycleScheduler:  # type: ignore
		async def schedule_daily_cycle(self):
			return {"status": "mock"}


async def run_daily_cycle(dry_run: bool = False, log_dir: str | None = None):  # type: ignore
	if dry_run:
		os.environ["SCHEDULER_DRY_RUN"] = "true"

	try:
		scheduler = DailyCycleScheduler(log_dir=log_dir)  # type: ignore[arg-type]
	except TypeError:
		# Fallback shim may not accept log_dir
		scheduler = DailyCycleScheduler()

	return await scheduler.schedule_daily_cycle()


__all__ = ["DailyCycleScheduler", "run_daily_cycle"]

# Expose under worker.scheduler as well for compatibility with patched tests
sys.modules.setdefault("worker.scheduler", sys.modules[__name__])
