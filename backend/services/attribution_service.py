"""Decision attribution service (read-only correlation)."""
from __future__ import annotations

import collections
from typing import Any, Dict, Optional

from backend.schemas.decision_attribution import DecisionAttribution
from backend.schemas.decision_outcome import DecisionOutcome

_ATTRIBUTIONS: collections.deque[DecisionAttribution] = collections.deque(maxlen=256)


def _record_attribution(attribution: DecisionAttribution) -> None:
    try:
        _ATTRIBUTIONS.append(attribution)
    except Exception:  # pragma: no cover
        return


def correlate(decision: Dict[str, Any], outcome: DecisionOutcome) -> Optional[DecisionAttribution]:
    try:
        attribution = DecisionAttribution(
            decision_id=decision.get("decision_id"),
            trace_id=decision.get("trace_id"),
            decision=decision,
            outcome=outcome,
        )
        _record_attribution(attribution)
        return attribution
    except Exception:  # pragma: no cover
        return None


def attributions() -> list[DecisionAttribution]:
    return list(_ATTRIBUTIONS)


def reset() -> None:
    try:
        _ATTRIBUTIONS.clear()
    except Exception:  # pragma: no cover
        return


__all__ = ["correlate", "attributions", "reset"]
