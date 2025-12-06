"""Bot control service with persisted state and audit hooks."""
from __future__ import annotations

from datetime import datetime
from typing import Dict

from backend.services.settings_service import settings_service


class BotControlService:
    """Track bot state transitions and record audits."""

    def __init__(self) -> None:
        self._state = "stopped"
        self._updated_at = datetime.utcnow()

    def _set_state(self, actor_id: str, state: str, detail: Dict[str, str]) -> Dict[str, str]:
        self._state = state
        self._updated_at = datetime.utcnow()
        settings_service.record_audit(actor_id=actor_id, action=f"bot.{state}", detail=detail)
        return {"state": self._state, "updated_at": self._updated_at.isoformat()}

    def get_state(self) -> Dict[str, str]:
        return {"state": self._state, "updated_at": self._updated_at.isoformat()}

    def start(self, actor_id: str) -> Dict[str, str]:
        return self._set_state(actor_id, "running", {"reason": "start"})

    def stop(self, actor_id: str) -> Dict[str, str]:
        return self._set_state(actor_id, "stopped", {"reason": "stop"})

    def restart(self, actor_id: str) -> Dict[str, str]:
        # minimal restart semantics: mark restarting then running
        self._set_state(actor_id, "restarting", {"reason": "restart"})
        return self._set_state(actor_id, "running", {"reason": "restart"})


bot_control_service = BotControlService()
