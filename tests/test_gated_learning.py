"""Tests for gated online learning workflow."""
from learning.gating_service import GatingService
from learning.learning_proposal import LearningProposal
from learning.proposal_store import ProposalStore


class _StubMetrics:
    def __init__(self):
        self.calls = []

    def inc(self, name, labels=None, **kwargs):
        self.calls.append((name, labels or {}))

    def increment(self, name, value=None, labels=None, **kwargs):  # pragma: no cover
        self.calls.append((name, labels or {}))


def _count(calls, name, **label_eq):
    return sum(1 for metric_name, lbl in calls if metric_name == name and all(lbl.get(k) == v for k, v in label_eq.items()))


def _proposal(proposal_id: str, *, strat: str = "strat-1", change_val: float = 0.2):
    return LearningProposal(
        proposal_id=proposal_id,
        source="replay-123",
        strategy_ids=[strat],
        proposed_changes={strat: {"threshold": change_val}},
        expected_benefit="improved win rate",
        risk_metrics={"drawdown_delta": -0.01, "confidence_loss": 0.0},
    )


def test_proposal_creation_defaults():
    proposal = _proposal("p1")
    assert proposal.status == "draft"
    assert proposal.proposal_id == "p1"
    assert proposal.strategy_ids == ["strat-1"]
    assert proposal.proposed_changes["strat-1"]["threshold"] == 0.2
    assert "drawdown_delta" in proposal.risk_metrics


def test_approval_applies_overrides_and_metrics():
    metrics = _StubMetrics()
    gate = GatingService(ProposalStore(), metrics_client=metrics)
    proposal = gate.submit(_proposal("p-approve", change_val=0.4))

    gate.approve(proposal.proposal_id)

    overrides = gate.get_overrides("strat-1")
    merged = gate.apply_overrides({"alpha": 1.0}, "strat-1")

    assert proposal.status == "approved"
    assert overrides["threshold"] == 0.4
    assert merged["alpha"] == 1.0 and merged["threshold"] == 0.4
    assert _count(metrics.calls, "learning_proposals_total", status="draft") == 1
    assert _count(metrics.calls, "learning_proposals_approved_total", status="approved") == 1


def test_rejection_keeps_overrides_empty():
    gate = GatingService(ProposalStore())
    proposal = gate.submit(_proposal("p-reject", change_val=0.5))

    gate.reject(proposal.proposal_id)

    assert proposal.status == "rejected"
    assert gate.get_overrides("strat-1") == {}


def test_rollback_restores_previous_state():
    metrics = _StubMetrics()
    gate = GatingService(ProposalStore(), metrics_client=metrics)

    p1 = gate.submit(_proposal("p1", change_val=0.1))
    gate.approve(p1.proposal_id)

    p2 = gate.submit(_proposal("p2", change_val=0.3))
    gate.approve(p2.proposal_id)

    # Active override from p2 in effect
    assert gate.get_overrides("strat-1")["threshold"] == 0.3

    gate.rollback(p2.proposal_id)

    # Should restore p1 override and record rollback metric
    assert gate.get_overrides("strat-1")["threshold"] == 0.1
    assert p2.status == "rolled_back"
    assert _count(metrics.calls, "learning_rollbacks_total", status="rolled_back") == 1


def test_runtime_unchanged_without_approval():
    gate = GatingService(ProposalStore())
    gate.submit(_proposal("p-draft", change_val=0.9))

    base = {"alpha": 1.0}
    merged = gate.apply_overrides(base, "strat-1")

    assert merged == base
    assert gate.get_overrides("strat-1") == {}


def test_fake_mock_parity_no_metrics():
    gate = GatingService(ProposalStore(), metrics_client=None)
    proposal = gate.submit(_proposal("p-fake", change_val=0.25))

    gate.approve(proposal.proposal_id)
    override = gate.get_overrides("strat-1")

    assert override["threshold"] == 0.25
    gate.rollback(proposal.proposal_id)
    assert gate.get_overrides("strat-1") == {}
