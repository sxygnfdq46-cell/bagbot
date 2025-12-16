"""Static, read-only indicator declarations for strategies.

These declarations are metadata only and do not alter execution or chart rendering.
"""

from __future__ import annotations

from typing import Any, Dict, List

IndicatorDeclaration = Dict[str, Any]


# Declarative, non-executable indicator metadata by strategy id.
STRATEGY_INDICATORS: Dict[str, List[IndicatorDeclaration]] = {
    "alpha-swing": [
        {"type": "EMA", "params": {"period": 21}, "role": "trend"},
        {"type": "VWAP", "params": {}, "role": "value"},
        {"type": "RSI", "params": {"period": 14, "source": "close"}, "role": "momentum_filter"},
    ],
    "pulse-scout": [
        {"type": "EMA", "params": {"period": 9}, "role": "signal"},
        {"type": "EMA", "params": {"period": 26}, "role": "baseline"},
        {"type": "ATR", "params": {"period": 14}, "role": "volatility_filter"},
    ],
    "dawn-breaker": [
        {"type": "SMA", "params": {"period": 50}, "role": "trend"},
        {"type": "SMA", "params": {"period": 200}, "role": "macro_trend"},
        {"type": "MACD", "params": {"fast": 12, "slow": 26, "signal": 9}, "role": "confirmation"},
    ],
}


def get_indicator_declarations(strategy_id: str) -> List[IndicatorDeclaration]:
    """Return declarations for a strategy id; immutable view."""

    return STRATEGY_INDICATORS.get(strategy_id, [])


def get_all_indicator_declarations() -> Dict[str, List[IndicatorDeclaration]]:
    """Return all indicator declarations keyed by strategy id."""

    return STRATEGY_INDICATORS


__all__ = ["IndicatorDeclaration", "STRATEGY_INDICATORS", "get_indicator_declarations", "get_all_indicator_declarations"]
