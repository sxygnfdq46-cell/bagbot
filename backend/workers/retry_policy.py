from __future__ import annotations

from typing import Callable


class RetryPolicy:
    def __init__(
        self,
        max_attempts: int = 3,
        backoff_fn: Callable[[int], float] | None = None,
    ) -> None:
        self.max_attempts = max_attempts
        self.backoff_fn = backoff_fn or (lambda n: 0.1 * (2 ** max(n - 1, 0)))


default_retry = RetryPolicy()
