"""Key/value cache placeholder."""

from typing import Optional


class KeyValueStore:
    """Simple abstraction over Redis or similar (placeholder)."""

    def set(self, key: str, value: str) -> None:
        """TODO: write to KV store."""
        raise NotImplementedError

    def get(self, key: str) -> Optional[str]:
        """TODO: read from KV store."""
        raise NotImplementedError
