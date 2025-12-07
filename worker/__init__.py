<<<<<<< HEAD
"""package marker (created to make imports work in tests)."""
__all__ = []
=======
# keep package importable
"""
bagbot.worker package.

This package contains the worker runtime scaffolding.
All modules contain only typed function/class stubs raising NotImplementedError.
Do not implement logic here yet — we will add real implementations after design review.
"""

__all__ = ["engine", "tasks", "strategies", "queue", "utils"]
>>>>>>> f482c6b (fix: restore model exports and deps)
