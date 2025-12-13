"""Learning proposal artifact for gated online learning."""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Dict, List, Literal, Optional

ProposalStatus = Literal["draft", "approved", "rejected", "rolled_back"]


@dataclass
class LearningProposal:
    proposal_id: str
    source: str
    strategy_ids: List[str]
    proposed_changes: Dict[str, Dict[str, object]]
    expected_benefit: Optional[str] = None
    risk_metrics: Dict[str, float] = field(default_factory=dict)
    timestamp: float = field(default_factory=lambda: time.time())
    status: ProposalStatus = "draft"


__all__ = ["LearningProposal", "ProposalStatus"]
