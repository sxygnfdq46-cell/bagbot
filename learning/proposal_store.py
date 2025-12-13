"""In-memory store for learning proposals."""
from __future__ import annotations

from typing import Dict, List, Optional

from learning.learning_proposal import LearningProposal, ProposalStatus


class ProposalStore:
    def __init__(self) -> None:
        self._proposals: Dict[str, LearningProposal] = {}

    def add(self, proposal: LearningProposal) -> LearningProposal:
        if proposal.proposal_id in self._proposals:
            raise ValueError(f"proposal {proposal.proposal_id} already exists")
        self._proposals[proposal.proposal_id] = proposal
        return proposal

    def get(self, proposal_id: str) -> Optional[LearningProposal]:
        return self._proposals.get(proposal_id)

    def list_all(self) -> List[LearningProposal]:
        return list(self._proposals.values())

    def update_status(self, proposal_id: str, status: ProposalStatus) -> LearningProposal:
        proposal = self._proposals.get(proposal_id)
        if not proposal:
            raise KeyError(f"proposal {proposal_id} not found")
        proposal.status = status
        return proposal


__all__ = ["ProposalStore"]
