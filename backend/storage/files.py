"""File storage helpers placeholder."""


class FileStore:
    """Manages artifact and report files (placeholder)."""

    def save_report(self, content: bytes, filename: str) -> None:
        """TODO: persist reports for download."""
        raise NotImplementedError

    def list_reports(self) -> list[str]:
        """TODO: enumerate available reports."""
        raise NotImplementedError
