"""Neural engine endpoints for the brain page."""
from typing import Any

from fastapi import APIRouter

from backend.brain.explain.snapshot import build_explain_snapshot
from backend.brain.learning_gate.gate import build_learning_gate_snapshot
from backend.brain.invariants import (
    EVAL_ONLY_HISTORICAL,
    HISTORICAL_REPLAY_DETERMINISTIC,
    LEARNING_GATE_ALWAYS_BLOCKED,
    SINGLE_MARKET_DATA_SOURCE,
)
from backend.brain.utils.strategy_indicators import get_all_indicator_declarations
from backend.brain.utils.indicator_series import get_all_indicator_series

router = APIRouter(prefix="/api/brain", tags=["brain"])


@router.get("/activity-map")
async def get_activity_map() -> dict[str, Any]:
    """Return neural activity map (placeholder)."""
    return {"detail": "brain activity map placeholder"}


@router.get("/load")
async def get_brain_load() -> dict[str, Any]:
    """Return brain load metrics (placeholder)."""
    return {"detail": "brain load placeholder"}


@router.get("/linkage")
async def get_linkage_graph() -> dict[str, Any]:
    """Return linkage graph (placeholder)."""
    return {"detail": "brain linkage placeholder"}


@router.get("/decisions")
async def get_recent_decisions() -> dict[str, Any]:
    """Return recent decisions (placeholder)."""
    return {"detail": "brain decisions placeholder"}


@router.post("/diagnostic")
async def run_brain_diagnostic() -> dict[str, Any]:
    """Run diagnostics (placeholder)."""
    return {"detail": "brain diagnostic placeholder"}


@router.post("/reset")
async def reset_brain() -> dict[str, Any]:
    """Reset neural engine (placeholder)."""
    return {"detail": "brain reset placeholder"}


@router.get("/explain")
async def get_brain_explain() -> dict[str, Any]:
    """Return a read-only explain snapshot without mutating brain state; envelope mirrors runtime pipeline."""

    gate = build_learning_gate_snapshot(meta={"market_data_source": "MOCK"}, context={"mode": "observe"})
    snapshot = build_explain_snapshot(decision=None, envelope=None, meta={"market_data_source": "MOCK"}, rationale=["no_recent_decision"], learning_gate=gate)
    indicator_declarations = get_all_indicator_declarations()
    indicator_series = get_all_indicator_series()
    return {
        "status": "success",
        "reason": None,
        "rationale": ["no_recent_decision"],
        "brain_decision": None,
        "trade_action": None,
        "router_result": None,
        "intent_preview": None,
        "decisions": None,
        "meta": {
            "pipeline_fake_mode": False,
            "intent_preview_enabled": False,
            "trace_id": None,
            "market_data_source": "MOCK",
            "learning_gate": gate,
            "single_market_data_source": SINGLE_MARKET_DATA_SOURCE,
            "learning_gate_blocked": LEARNING_GATE_ALWAYS_BLOCKED,
            "historical_replay_deterministic": HISTORICAL_REPLAY_DETERMINISTIC,
            "strategy_indicators": indicator_declarations,
            "strategy_indicator_series": indicator_series,
        },
        "explain": snapshot,
    }


@router.get("/eval")
async def get_brain_eval() -> dict[str, Any]:
    """Return a read-only eval snapshot (historical only); envelope mirrors runtime pipeline."""

    from backend.brain.eval.snapshot import build_eval_snapshot

    gate = build_learning_gate_snapshot(meta={"market_data_source": "HISTORICAL"}, context={"mode": "observe"})
    snapshot = build_eval_snapshot(decisions=[], meta={"market_data_source": "HISTORICAL"}, explain=None, learning_gate=gate)
    return {
        "status": "success",
        "reason": None,
        "rationale": ["eval_stub"],
        "brain_decision": None,
        "trade_action": None,
        "router_result": None,
        "intent_preview": None,
        "decisions": [],
        "meta": {
            "pipeline_fake_mode": False,
            "intent_preview_enabled": False,
            "trace_id": None,
            "market_data_source": "HISTORICAL",
            "learning_gate": gate,
            "single_market_data_source": SINGLE_MARKET_DATA_SOURCE,
            "learning_gate_blocked": LEARNING_GATE_ALWAYS_BLOCKED,
            "eval_only_historical": EVAL_ONLY_HISTORICAL,
            "historical_replay_deterministic": HISTORICAL_REPLAY_DETERMINISTIC,
        },
        "explain": None,
        "eval": snapshot,
    }
