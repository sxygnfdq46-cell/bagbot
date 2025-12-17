from pathlib import Path

PATTERNS = ["* 2.*", "*.bak", "*-copy.*"]
SKIP_DIRS = {
    ".git",
    ".venv",
    ".mypy_cache",
    ".pytest_cache",
    "node_modules",
    "archives",
    "artifacts",
    "scripts_NEW",
}


def find_backup_artifacts() -> list[Path]:
    root = Path(".")
    hits: list[Path] = []
    for pattern in PATTERNS:
        for path in root.glob(f"**/{pattern}"):
            if any(part in SKIP_DIRS for part in path.parts):
                continue
            hits.append(path)
    return sorted(set(hits))


def test_no_backup_artifacts_present():
    hits = find_backup_artifacts()
    assert not hits, f"Remove backup/duplicate artifacts: {[str(p) for p in hits]}"
