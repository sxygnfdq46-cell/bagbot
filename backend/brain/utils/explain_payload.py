"""Static explainability payload for the brain explain endpoint.

This module is read-only and contains declarative data only. All timestamps are
UTC epoch seconds and align across candles, indicator series, and decisions.
"""
from __future__ import annotations

from typing import Any, Dict, List

from backend.brain.utils.indicator_series import STRATEGY_INDICATOR_SERIES

# Canonical, shared timestamps in ascending order (UTC epoch seconds).
_BASE_TIMESTAMPS: List[int] = [1734390000, 1734390600, 1734391200, 1734391800, 1734392400]

# Minimal mock candle ladder aligned to the base timestamps.
CANDLE_SEQUENCE: List[Dict[str, Any]] = [
    {"time": _BASE_TIMESTAMPS[0], "open": 47360.0, "high": 47410.0, "low": 47340.0, "close": 47395.0, "volume": 128.4},
    {"time": _BASE_TIMESTAMPS[1], "open": 47395.0, "high": 47430.0, "low": 47380.0, "close": 47425.0, "volume": 142.7},
    {"time": _BASE_TIMESTAMPS[2], "open": 47425.0, "high": 47455.0, "low": 47405.0, "close": 47445.0, "volume": 151.2},
    {"time": _BASE_TIMESTAMPS[3], "open": 47445.0, "high": 47470.0, "low": 47420.0, "close": 47430.0, "volume": 133.9},
    {"time": _BASE_TIMESTAMPS[4], "open": 47430.0, "high": 47460.0, "low": 47405.0, "close": 47415.0, "volume": 120.6},
]


def _indicator_value(strategy_id: str, key: str, index: int) -> Dict[str, Any]:
    series = STRATEGY_INDICATOR_SERIES.get(strategy_id, {}).get(key, [])
    if index >= len(series):
        return {"time": None, "value": None}
    return series[index]


def _macd_value(strategy_id: str, key: str, index: int) -> Dict[str, Any]:
    series = STRATEGY_INDICATOR_SERIES.get(strategy_id, {}).get(key, [])
    if index >= len(series):
        return {"time": None, "macd": None, "signal": None, "histogram": None}
    return series[index]


# Declarative reasoning timeline; one entry per candle that matters.
DECISION_TIMELINE: List[Dict[str, Any]] = [
    {
        "time": _BASE_TIMESTAMPS[1],
        "action": "BUY",
        "phase": "entry",
        "strategy": "alpha-swing",
        "confidence": 0.64,
        "indicator_states": {
            "EMA_21": {"value": _indicator_value("alpha-swing", "EMA_21", 1).get("value"), "state": "bullish_trend"},
            "VWAP": {"value": _indicator_value("alpha-swing", "VWAP", 1).get("value"), "state": "price_above_value"},
            "RSI_14": {"value": _indicator_value("alpha-swing", "RSI_14", 1).get("value"), "state": "rising_momentum"},
        },
        "indicator_votes": [
            {"indicator": "EMA_21", "role": "trend", "state": "bullish", "support": "long", "strength": 0.55},
            {"indicator": "VWAP", "role": "value", "state": "supporting", "support": "long", "strength": 0.35},
            {"indicator": "RSI_14", "role": "momentum_filter", "state": "rising", "support": "long", "strength": 0.25},
        ],
        "blocks": [],
        "reasoning": "Trend and value aligned; momentum rising; no risk blocks.",
    },
    {
        "time": _BASE_TIMESTAMPS[2],
        "action": "HOLD",
        "phase": "hold",
        "strategy": "pulse-scout",
        "confidence": 0.48,
        "indicator_states": {
            "EMA_9": {"value": _indicator_value("pulse-scout", "EMA_9", 2).get("value"), "state": "drifting_up"},
            "EMA_26": {"value": _indicator_value("pulse-scout", "EMA_26", 2).get("value"), "state": "supportive_trend"},
            "ATR_14": {"value": _indicator_value("pulse-scout", "ATR_14", 2).get("value"), "state": "volatility_cooling"},
        },
        "indicator_votes": [
            {"indicator": "EMA_9", "role": "signal", "state": "slightly_bullish", "support": "hold", "strength": 0.3},
            {"indicator": "EMA_26", "role": "baseline", "state": "bullish", "support": "hold", "strength": 0.25},
            {"indicator": "ATR_14", "role": "volatility_filter", "state": "cooling", "support": "hold", "strength": 0.15},
        ],
        "blocks": ["no_new_setup"],
        "reasoning": "Trend intact but no fresh signal; volatility easing so stay in position.",
    },
    {
        "time": _BASE_TIMESTAMPS[3],
        "action": "SELL",
        "phase": "exit",
        "strategy": "dawn-breaker",
        "confidence": 0.58,
        "indicator_states": {
            "SMA_50": {"value": _indicator_value("dawn-breaker", "SMA_50", 3).get("value"), "state": "flattening"},
            "SMA_200": {"value": _indicator_value("dawn-breaker", "SMA_200", 3).get("value"), "state": "macro_flat"},
            "MACD_12_26_9": {
                "macd": _macd_value("dawn-breaker", "MACD_12_26_9", 3).get("macd"),
                "signal": _macd_value("dawn-breaker", "MACD_12_26_9", 3).get("signal"),
                "histogram": _macd_value("dawn-breaker", "MACD_12_26_9", 3).get("histogram"),
                "state": "momentum_fading",
            },
        },
        "indicator_votes": [
            {"indicator": "SMA_50", "role": "trend", "state": "flattening", "support": "exit", "strength": 0.35},
            {"indicator": "MACD_12_26_9", "role": "confirmation", "state": "bearish_cross_risk", "support": "exit", "strength": 0.4},
        ],
        "blocks": ["macro_trend_flat"],
        "reasoning": "Momentum fading against flat macro trend; lock in gains and exit.",
    },
]


def get_candle_sequence() -> List[Dict[str, Any]]:
    return CANDLE_SEQUENCE


def get_decision_timeline() -> List[Dict[str, Any]]:
    return DECISION_TIMELINE


__all__ = [
    "CANDLE_SEQUENCE",
    "DECISION_TIMELINE",
    "get_candle_sequence",
    "get_decision_timeline",
]
