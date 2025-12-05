"""RQ task entrypoints for strategy lifecycle jobs."""
from __future__ import annotations

import asyncio
import csv
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Tuple
from typing import Literal

from rq import get_current_job

# prefer service-layer helpers (thin wrappers) rather than direct crud imports
from backend.services.report_service import (
    create_report,
    get_report,
    update_report,
)
from backend.services.strategy_service import (
    get_strategy,
    update_strategy,
)
from backend.db import session as db_session
from backend.storage import report_manifest
from backend.ws.manager import broadcast_strategy_state, websocket_broadcast

_CHANNEL = "signals"


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _report_file_paths(report_id: str) -> Tuple[Path, Path]:
    reports_dir = report_manifest.reports_dir()
    reports_dir.mkdir(parents=True, exist_ok=True)
    return reports_dir / f"{report_id}.json", reports_dir / f"{report_id}.csv"


async def _start_strategy_async(strategy_id: str) -> Dict[str, Any]:
    async with db_session.AsyncSessionLocal() as session:
        strategy = await get_strategy(session, strategy_id)
        if strategy is None:
            return {"status": "not_found", "strategy_id": strategy_id}

        stats = dict(strategy.stats or {})
        if stats.get("state") == "running":
            return {"status": "already_running", "strategy_id": strategy_id}

        stats.update({"state": "running", "started_at": _utcnow().isoformat()})
        await update_strategy(
            session,
            strategy_id,
            stats=stats,
            enabled=True,
            last_run=_utcnow(),
        )

        await broadcast_strategy_state(
            strategy_id=strategy_id,
            state="started",
            payload={"state": "running"},
        )
        return {"status": "started", "strategy_id": strategy_id}


async def _stop_strategy_async(strategy_id: str) -> Dict[str, Any]:
    async with db_session.AsyncSessionLocal() as session:
        strategy = await get_strategy(session, strategy_id)
        if strategy is None:
            return {"status": "not_found", "strategy_id": strategy_id}

        stats = dict(strategy.stats or {})
        if stats.get("state") == "stopped":
            return {"status": "already_stopped", "strategy_id": strategy_id}

        stats.update({"state": "stopped", "stopped_at": _utcnow().isoformat()})
        await update_strategy(
            session,
            strategy_id,
            stats=stats,
            enabled=False,
        )

        await broadcast_strategy_state(
            strategy_id=strategy_id,
            state="stopped",
            payload={"state": "stopped"},
        )
        return {"status": "stopped", "strategy_id": strategy_id}


def _write_csv_report(csv_path: Path, report_payload: Dict[str, Any]) -> None:
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["field", "value"])
        stats = report_payload.get("stats") or {}
        for key, value in stats.items():
            writer.writerow([key, value])


async def _finalize_ready_report(
    session,
    *,
    report_id: str,
    strategy_id: str,
    report_path: Path,
    csv_path: Path,
    report_payload: Dict[str, Any],
    job_id: str,
) -> Dict[str, Any]:
    completed_at = _utcnow()
    await update_report(
        session,
        report_id,
        status="ready",
        json_path=str(report_path),
        csv_path=str(csv_path),
        completed_at=completed_at,
        payload=report_payload,
        job_id=job_id,
    )

    report_manifest.upsert_entry(
        {
            "strategy_id": strategy_id,
            "report_id": report_id,
            "json_path": str(report_path),
            "csv_path": str(csv_path),
            "generated_at": report_payload.get("generated_at"),
        }
    )

    await websocket_broadcast(
        channel=_CHANNEL,
        event="strategy.report.ready",
        payload={
            "strategy_id": strategy_id,
            "report_id": report_id,
            "report_path": str(report_path),
            "csv_path": str(csv_path),
        },
    )
    return {
        "status": "ready",
        "strategy_id": strategy_id,
        "report_id": report_id,
        "report_path": str(report_path),
        "csv_path": str(csv_path),
        "job_id": job_id,
    }


async def _generate_report_async(
    strategy_id: str, report_id: str | None = None
) -> Dict[str, Any]:
    async with db_session.AsyncSessionLocal() as session:
        strategy = await get_strategy(session, strategy_id)
        if strategy is None:
            return {"status": "not_found", "strategy_id": strategy_id}

        job = get_current_job()
        job_id = job.id if job else f"manual-{_utcnow().timestamp()}"

        report = await get_report(session, report_id) if report_id else None
        if report is None:
            report = await create_report(
                session,
                strategy_id=strategy_id,
                status="queued",
                job_id=job_id,
            )

        await update_report(
            session,
            report.id,
            status="processing",
            job_id=job_id,
            started_at=_utcnow(),
        )

        report_payload: Dict[str, Any] = {
            "strategy_id": strategy_id,
            "report_id": report.id,
            "generated_at": _utcnow().isoformat(),
            "params": strategy.params or {},
            "stats": strategy.stats or {},
        }

        report_path, csv_path = _report_file_paths(report.id)

        try:
            report_path.write_text(
                json.dumps(report_payload, indent=2)
            )
            _write_csv_report(csv_path, report_payload)
            return await _finalize_ready_report(
                session,
                report_id=report.id,
                strategy_id=strategy_id,
                report_path=report_path,
                csv_path=csv_path,
                report_payload=report_payload,
                job_id=job_id,
            )
        except Exception as exc:  # pragma: no cover
            error_message = str(exc)
            await update_report(
                session,
                report.id,
                status="failed",
                error=error_message,
                completed_at=_utcnow(),
            )
            await websocket_broadcast(
                channel=_CHANNEL,
                event="strategy.report.failed",
                payload={
                    "strategy_id": strategy_id,
                    "report_id": report.id,
                    "error": error_message,
                },
            )
            raise


def start_strategy(strategy_id: str) -> Dict[str, Any]:
    """RQ task entrypoint for starting a strategy."""

    return asyncio.run(_start_strategy_async(strategy_id))


def stop_strategy(strategy_id: str) -> Dict[str, Any]:
    """RQ task entrypoint for stopping a strategy."""

    return asyncio.run(_stop_strategy_async(strategy_id))


def generate_report(
    strategy_id: str, report_id: str | None = None
) -> Dict[str, Any]:
    """Produce a JSON + CSV report for the requested strategy."""

    return asyncio.run(
        _generate_report_async(strategy_id, report_id)
    )


def strategy_toggle(
    strategy_id: str,
    target_state: Literal["started", "stopped"] = "started",
) -> Dict[str, Any]:
    """Small RQ-friendly wrapper around start/stop helpers."""

    try:
        allowed_states = ("started", "stopped")
        ts = target_state if target_state in allowed_states else "started"
        if ts == "started":
            start_strategy(strategy_id=strategy_id)
            return {
                "strategy_id": strategy_id,
                "status": "started",
            }
        stop_strategy(strategy_id=strategy_id)
        return {
            "strategy_id": strategy_id,
            "status": "stopped",
        }
    except Exception as exc:  # pragma: no cover
        return {
            "strategy_id": strategy_id,
            "status": "failed",
            "reason": str(exc),
        }


__all__ = [
    "start_strategy",
    "stop_strategy",
    "generate_report",
    "strategy_toggle",
]
