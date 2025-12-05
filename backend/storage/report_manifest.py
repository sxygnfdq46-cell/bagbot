"""Lightweight report manifest helpers (stub for tests)."""
from __future__ import annotations

from pathlib import Path
from typing import Dict, Any


_BASE_DIR = Path("artifacts/reports")


def reports_dir() -> Path:
    """Return the reports directory path (stub)."""
    return _BASE_DIR


def upsert_entry(entry: Dict[str, Any]) -> None:
    """Placeholder to record manifest entries (no-op for tests)."""
    _BASE_DIR.mkdir(parents=True, exist_ok=True)
    # In a real implementation, we would persist the manifest; tests only need the call to succeed.
    return None


def override_reports_dir(path: Path | None) -> None:
    """Compatibility shim for tests expecting override hook."""
    global _BASE_DIR  # noqa: PLW0603
    _BASE_DIR = Path(path) if path else Path("artifacts/reports")


__all__ = ["reports_dir", "upsert_entry"]
