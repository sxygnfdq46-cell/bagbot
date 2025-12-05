"""Stub report manifest helpers."""


def load_manifest(report_id: str):
    """Stub manifest loader."""
    return {"report_id": report_id, "content": "stub-manifest"}


def save_manifest(report_id: str, content: dict):
    """Stub manifest saver."""
    return True
