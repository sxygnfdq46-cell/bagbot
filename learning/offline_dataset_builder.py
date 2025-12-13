"""Offline dataset builder for decision/outcome/score attributions (read-only).

- Deterministic ordering
- Filterable by strategy, symbol, time window
- No runtime or live calls
"""
from __future__ import annotations

from typing import Dict, Iterable, Iterator, List, Optional, Tuple

from backend.schemas.decision_attribution import DecisionAttribution
from backend.schemas.decision_score import DecisionScore


class OfflineDataset:
    """Container for offline attributions and scores matched by decision id."""

    def __init__(
        self,
        attributions: List[DecisionAttribution],
        scores: List[DecisionScore],
    ) -> None:
        self.attributions = attributions
        self.scores = scores
        self._score_by_id: Dict[str, DecisionScore] = {s.decision_id: s for s in scores}

    def iter_pairs(self) -> Iterator[Tuple[DecisionAttribution, Optional[DecisionScore]]]:
        """Yield attribution + optional score in chronological order."""

        for attrib in self.attributions:
            yield attrib, self._score_by_id.get(attrib.decision_id)

    def __len__(self) -> int:  # pragma: no cover - trivial
        return len(self.attributions)


def build_dataset(
    attributions: Iterable[DecisionAttribution],
    scores: Iterable[DecisionScore],
    *,
    strategy_id: Optional[str] = None,
    symbol: Optional[str] = None,
    timeframe: Optional[str] = None,
    start_ts: Optional[float] = None,
    end_ts: Optional[float] = None,
) -> OfflineDataset:
    filtered_attribs: List[DecisionAttribution] = []
    filtered_scores: List[DecisionScore] = []

    for attrib in attributions:
        decision = attrib.decision or {}
        payload = decision.get("payload", {})
        strat = payload.get("strategy_id") or payload.get("strategy") or "unknown"
        sym = payload.get("symbol")
        tf = payload.get("timeframe") or payload.get("tf")
        ts = attrib.timestamp
        if strategy_id and strat != strategy_id:
            continue
        if symbol and sym != symbol:
            continue
        if timeframe and tf != timeframe:
            continue
        if start_ts and ts < start_ts:
            continue
        if end_ts and ts > end_ts:
            continue
        filtered_attribs.append(attrib)

    attr_ids = {a.decision_id for a in filtered_attribs}
    for score in scores:
        if strategy_id and score.strategy_id != strategy_id:
            continue
        if symbol and score.symbol != symbol:
            continue
        if timeframe and score.timeframe != timeframe:
            continue
        if start_ts and score.timestamp < start_ts:
            continue
        if end_ts and score.timestamp > end_ts:
            continue
        if score.decision_id not in attr_ids:
            continue
        filtered_scores.append(score)

    filtered_attribs.sort(key=lambda a: a.timestamp)
    filtered_scores.sort(key=lambda s: s.timestamp)

    return OfflineDataset(filtered_attribs, filtered_scores)


__all__ = ["OfflineDataset", "build_dataset"]
