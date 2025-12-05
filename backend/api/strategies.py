"""Strategy control endpoints for the strategies page."""
from typing import Any

from fastapi import APIRouter

from backend.services.manager import websocket_broadcast
from backend.workers.queue import enqueue_task

router = APIRouter(prefix="/api/strategies", tags=["strategies"])


@router.get("/list")
async def list_strategies() -> dict[str, Any]:
    """Return the available strategies (placeholder)."""
    return {"detail": "strategy list placeholder"}


@router.post("/{strategy_id}/enable")
async def enable_strategy(strategy_id: str) -> dict[str, Any]:
    """Enable a strategy (placeholder)."""
    return {"detail": f"enable {strategy_id} placeholder"}


@router.post("/{strategy_id}/disable")
async def disable_strategy(strategy_id: str) -> dict[str, Any]:
    """Disable a strategy (placeholder)."""
    return {"detail": f"disable {strategy_id} placeholder"}


@router.post("/{strategy_id}/config")
async def update_strategy_config(strategy_id: str) -> dict[str, Any]:
    """Update strategy configuration (placeholder)."""
    return {"detail": f"config {strategy_id} placeholder"}


@router.post("/{strategy_id}/optimize")
async def optimize_strategy(strategy_id: str) -> dict[str, Any]:
    """Kick off a strategy optimization (placeholder)."""
    return {"detail": f"optimize {strategy_id} placeholder"}


@router.get("/{strategy_id}/export")
async def export_strategy(strategy_id: str) -> dict[str, Any]:
    """Export a strategy report (placeholder)."""
    return {"detail": f"export {strategy_id} placeholder"}

@router.post("/{strategy_id}/toggle")
async def toggle_strategy(strategy_id: str) -> dict[str, Any]:
    """Flip enabled state and enqueue worker job (minimal stub)."""

    status_label = "started"
    await websocket_broadcast(
        channel="signals",
        event="strategy.toggle.requested",
        payload={"strategy_id": strategy_id, "target_state": status_label},
    )

    task_id = enqueue_task("backend.workers.tasks.strategy_toggle", strategy_id, target_state=status_label)
    return {
        "strategy_id": strategy_id,
        "status": status_label,
        "task_id": task_id,
        "enabled": True,
    }
