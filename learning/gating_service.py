"""Gated learning service with explicit approval and rollback."""
from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from learning.learning_proposal import LearningProposal
from learning.proposal_store import ProposalStore

logger = logging.getLogger(__name__)


def _safe_inc(metrics: Any, name: str, labels: Optional[Dict[str, Any]] = None) -> None:
    if not metrics:
        return
    inc = getattr(metrics, "inc", None) or getattr(metrics, "increment", None)
    if callable(inc):
        try:
            inc(name, labels=labels or {})
        except Exception:
            return


def _safe_log(message: str, **kwargs: Any) -> None:
    try:
        logger.info(message, extra={"learning": kwargs})
    except Exception:
        return


class GatingService:
    def __init__(self, store: Optional[ProposalStore] = None, *, metrics_client: Any = None) -> None:
        self.store = store or ProposalStore()
        self.metrics = metrics_client
        self._active_overrides: Dict[str, Dict[str, object]] = {}
        self._history: Dict[str, Dict[str, Optional[Dict[str, object]]]] = {}

    def submit(self, proposal: LearningProposal) -> LearningProposal:
        proposal.status = "draft"
        saved = self.store.add(proposal)
        _safe_inc(self.metrics, "learning_proposals_total", {"status": "draft"})
        _safe_log("learning proposal submitted", proposal_id=proposal.proposal_id, status=proposal.status)
        return saved

    def approve(self, proposal_id: str) -> LearningProposal:
        proposal = self._require(proposal_id)
        if proposal.status == "approved":
            return proposal
        if proposal.status == "rejected":
            raise ValueError(f"proposal {proposal_id} already rejected")

        history: Dict[str, Optional[Dict[str, object]]] = {}
        for strategy_id in proposal.strategy_ids:
            previous = self._active_overrides.get(strategy_id)
            history[strategy_id] = dict(previous) if previous is not None else None
            overrides = proposal.proposed_changes.get(strategy_id, {})
            self._active_overrides[strategy_id] = dict(overrides)
        self._history[proposal_id] = history

        self.store.update_status(proposal_id, "approved")
        _safe_inc(self.metrics, "learning_proposals_approved_total", {"status": "approved"})
        _safe_log("learning proposal approved", proposal_id=proposal.proposal_id, status="approved")
        return proposal

    def reject(self, proposal_id: str) -> LearningProposal:
        proposal = self._require(proposal_id)
        self.store.update_status(proposal_id, "rejected")
        _safe_log("learning proposal rejected", proposal_id=proposal.proposal_id, status="rejected")
        return proposal

    def rollback(self, proposal_id: str) -> LearningProposal:
        proposal = self._require(proposal_id)
        history = self._history.get(proposal_id, {})
        for strategy_id, previous in history.items():
            if previous is None:
                self._active_overrides.pop(strategy_id, None)
            else:
                self._active_overrides[strategy_id] = dict(previous)
        self.store.update_status(proposal_id, "rolled_back")
        _safe_inc(self.metrics, "learning_rollbacks_total", {"status": "rolled_back"})
        _safe_log("learning proposal rolled back", proposal_id=proposal.proposal_id, status="rolled_back")
        return proposal

    def get_overrides(self, strategy_id: str) -> Dict[str, object]:
        overrides = self._active_overrides.get(strategy_id, {})
        return dict(overrides)

    def apply_overrides(self, base_config: Optional[Dict[str, object]], strategy_id: str) -> Dict[str, object]:
        config = dict(base_config or {})
        overrides = self._active_overrides.get(strategy_id)
        if overrides:
            config.update(overrides)
        return config

    def _require(self, proposal_id: str) -> LearningProposal:
        proposal = self.store.get(proposal_id)
        if not proposal:
            raise KeyError(f"proposal {proposal_id} not found")
        return proposal


__all__ = ["GatingService"]
