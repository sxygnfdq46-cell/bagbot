#!/usr/bin/env python3
"""Fail the check if backup/duplicate artifacts are present (pure Python)."""
from __future__ import annotations

import argparse
import fnmatch
import sys
from pathlib import Path
from typing import Iterable

PATTERNS: tuple[str, ...] = ("* 2.*", "*.bak", "*-copy.*")
SKIP_DIRS: tuple[str, ...] = (
    ".git",
    ".venv",
    ".mypy_cache",
    ".pytest_cache",
    "node_modules",
    "archives",
    "artifacts",
    "scripts_NEW",
)


def walk_hits(root: Path) -> list[Path]:
    """Recursively find backup/duplicate artifacts, skipping known tool dirs."""
    hits: list[Path] = []
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if any(fnmatch.fnmatch(path.name, pattern) for pattern in PATTERNS):
            hits.append(path)
    return sorted(hits)


def format_hits(hits: Iterable[Path]) -> str:
    return "\n".join(f" - {p}" for p in hits)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Detect backup/duplicate artifacts in the repo.")
    parser.add_argument("--root", type=Path, default=Path("."), help="Root directory to scan (default: .)")
    args = parser.parse_args(argv)

    hits = walk_hits(args.root)
    if hits:
        print("Backup or duplicate files were detected. BagBot enforces a clean repository tree. See offending files below.")
        print(format_hits(hits))
        return 1

    print("No backup/duplicate artifacts detected.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
