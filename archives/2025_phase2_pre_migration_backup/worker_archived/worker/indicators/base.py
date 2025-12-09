from typing import Any, Dict

class BaseIndicator:
    """
    Base indicator interface. Subclasses implement calculate(...) and return
    either a numeric value (float) or a dict/tuple for multi-valued indicators,
    or None when history is insufficient.
    """
    def calculate(self, data: Any):
        raise NotImplementedError("calculate not implemented")
