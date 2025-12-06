"""Settings service with DB-first, in-memory fallback implementation."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

try:  # SQLAlchemy is optional in current scaffold
    from sqlalchemy.orm import Session
except Exception:  # pragma: no cover - fallback when SQLAlchemy absent
    Session = None  # type: ignore

from backend.schemas.settings import ApiKeyOut, PreferencesOut
from backend.services.encryption import decrypt_text, encrypt_text, redact_key


DEFAULT_PREFS = {"notify_on_failure": True, "max_worker_count": 1}


class InMemorySettingsStore:
    """Simple in-memory store for preferences, API keys, and audit."""

    def __init__(self) -> None:
        self._prefs: Dict[str, Dict[str, Any]] = {}
        self._api_keys: Dict[str, List[Dict[str, Any]]] = {}
        self._audit: List[Dict[str, Any]] = []
        self._key_counter = 0
        self._audit_counter = 0

    def get_preferences(self, owner_id: str) -> Dict[str, Any]:
        return self._prefs.get(owner_id, DEFAULT_PREFS.copy())

    def save_preferences(self, owner_id: str, prefs: Dict[str, Any]) -> Dict[str, Any]:
        merged = DEFAULT_PREFS.copy()
        merged.update(prefs)
        self._prefs[owner_id] = merged
        return merged

    def add_api_key(self, owner_id: str, name: str, secret: str) -> Dict[str, Any]:
        self._key_counter += 1
        entry = {
            "id": self._key_counter,
            "owner_id": owner_id,
            "name": name,
            "encrypted_key": encrypt_text(secret),
            "created_at": datetime.utcnow(),
        }
        self._api_keys.setdefault(owner_id, []).append(entry)
        return entry

    def list_api_keys(self, owner_id: str) -> List[Dict[str, Any]]:
        return self._api_keys.get(owner_id, [])

    def get_api_key(self, owner_id: str, key_id: int) -> Optional[Dict[str, Any]]:
        for entry in self._api_keys.get(owner_id, []):
            if entry["id"] == key_id:
                return entry
        return None

    def record_audit(self, actor_id: str, action: str, detail: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        self._audit_counter += 1
        entry = {
            "id": self._audit_counter,
            "actor_id": actor_id,
            "action": action,
            "detail": detail,
            "created_at": datetime.utcnow(),
        }
        self._audit.append(entry)
        return entry

    def audit_entries(self) -> List[Dict[str, Any]]:
        return list(self._audit)


class SettingsService:
    """Facade over the configured settings store."""

    def __init__(self, store: Optional[Any] = None) -> None:
        self._store = store or InMemorySettingsStore()

    def _redact_api_key(self, entry: Dict[str, Any]) -> ApiKeyOut:
        redacted = redact_key(decrypt_text(entry["encrypted_key"]))
        return ApiKeyOut(
            id=entry["id"],
            name=entry["name"],
            key_redacted=redacted,
            created_at=entry.get("created_at"),
        )

    def get_preferences(self, owner_id: str) -> PreferencesOut:
        prefs = self._store.get_preferences(owner_id)
        return PreferencesOut(**prefs)

    def save_preferences(self, owner_id: str, prefs: Dict[str, Any]) -> PreferencesOut:
        saved = self._store.save_preferences(owner_id, prefs)
        self.record_audit(actor_id=owner_id, action="settings.update", detail={"prefs": saved})
        return PreferencesOut(**saved)

    def add_api_key(self, owner_id: str, name: str, secret: str) -> ApiKeyOut:
        entry = self._store.add_api_key(owner_id, name, secret)
        self.record_audit(actor_id=owner_id, action="settings.api_key.add", detail={"name": name})
        return self._redact_api_key(entry)

    def list_api_keys(self, owner_id: str) -> List[ApiKeyOut]:
        return [self._redact_api_key(e) for e in self._store.list_api_keys(owner_id)]

    def get_api_key(self, owner_id: str, key_id: int) -> Optional[str]:
        entry = self._store.get_api_key(owner_id, key_id)
        if not entry:
            return None
        return decrypt_text(entry["encrypted_key"])

    def record_audit(self, actor_id: str, action: str, detail: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        return self._store.record_audit(actor_id, action, detail)

    def audit_entries(self) -> List[Dict[str, Any]]:
        return self._store.audit_entries()


settings_service = SettingsService()
