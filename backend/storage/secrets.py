"""Encrypted secret storage placeholder."""


class SecretStore:
    """Handles AES/KMS key operations (placeholder)."""

    def save(self, key: str, value: str) -> None:
        """TODO: encrypt and persist API keys."""
        raise NotImplementedError

    def load(self, key: str) -> str:
        """TODO: decrypt and return stored values."""
        raise NotImplementedError
