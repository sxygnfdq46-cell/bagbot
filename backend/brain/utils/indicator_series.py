"""Static, precomputed indicator series for read-only explain payloads.

These series are observational metadata only and do not drive execution or decisions.
Timestamps align with mock candle sequencing; frontend remains responsible for alignment.
"""

from __future__ import annotations

from typing import Any, Dict, List, TypedDict


class IndicatorPoint(TypedDict):
    time: float
    value: float


class MacdPoint(TypedDict):
    time: float
    macd: float
    signal: float
    histogram: float


IndicatorSeries = List[Dict[str, Any]]
IndicatorSeriesMap = Dict[str, IndicatorSeries]


# Minimal, precomputed mock series keyed by strategy id and indicator name.
STRATEGY_INDICATOR_SERIES: Dict[str, Dict[str, IndicatorSeries]] = {
    "alpha-swing": {
        "EMA_21": [
            {"time": 1734390000, "value": 47385.2},
            {"time": 1734390600, "value": 47392.7},
            {"time": 1734391200, "value": 47410.4},
            {"time": 1734391800, "value": 47428.1},
            {"time": 1734392400, "value": 47435.8},
        ],
        "VWAP": [
            {"time": 1734390000, "value": 47390.0},
            {"time": 1734390600, "value": 47396.3},
            {"time": 1734391200, "value": 47414.2},
            {"time": 1734391800, "value": 47422.9},
            {"time": 1734392400, "value": 47430.1},
        ],
        "RSI_14": [
            {"time": 1734390000, "value": 54.2},
            {"time": 1734390600, "value": 56.8},
            {"time": 1734391200, "value": 59.1},
            {"time": 1734391800, "value": 61.0},
            {"time": 1734392400, "value": 63.4},
        ],
    },
    "pulse-scout": {
        "EMA_9": [
            {"time": 1734390000, "value": 47388.0},
            {"time": 1734390600, "value": 47399.5},
            {"time": 1734391200, "value": 47418.2},
            {"time": 1734391800, "value": 47426.6},
            {"time": 1734392400, "value": 47433.9},
        ],
        "EMA_26": [
            {"time": 1734390000, "value": 47370.4},
            {"time": 1734390600, "value": 47382.1},
            {"time": 1734391200, "value": 47400.7},
            {"time": 1734391800, "value": 47414.3},
            {"time": 1734392400, "value": 47422.5},
        ],
        "ATR_14": [
            {"time": 1734390000, "value": 145.2},
            {"time": 1734390600, "value": 142.7},
            {"time": 1734391200, "value": 139.9},
            {"time": 1734391800, "value": 137.4},
            {"time": 1734392400, "value": 135.8},
        ],
    },
    "dawn-breaker": {
        "SMA_50": [
            {"time": 1734390000, "value": 47310.5},
            {"time": 1734390600, "value": 47322.4},
            {"time": 1734391200, "value": 47340.8},
            {"time": 1734391800, "value": 47359.2},
            {"time": 1734392400, "value": 47376.5},
        ],
        "SMA_200": [
            {"time": 1734390000, "value": 47110.0},
            {"time": 1734390600, "value": 47118.3},
            {"time": 1734391200, "value": 47126.4},
            {"time": 1734391800, "value": 47134.6},
            {"time": 1734392400, "value": 47142.2},
        ],
        "MACD_12_26_9": [
            {"time": 1734390000, "macd": 24.1, "signal": 18.3, "histogram": 5.8},
            {"time": 1734390600, "macd": 26.5, "signal": 19.6, "histogram": 6.9},
            {"time": 1734391200, "macd": 27.2, "signal": 20.4, "histogram": 6.8},
            {"time": 1734391800, "macd": 26.9, "signal": 21.0, "histogram": 5.9},
            {"time": 1734392400, "macd": 26.1, "signal": 21.3, "histogram": 4.8},
        ],
    },
}


def get_indicator_series(strategy_id: str) -> Dict[str, IndicatorSeries]:
    """Return precomputed indicator series for a strategy id."""

    return STRATEGY_INDICATOR_SERIES.get(strategy_id, {})


def get_all_indicator_series() -> Dict[str, Dict[str, IndicatorSeries]]:
    """Return all indicator series keyed by strategy id."""

    return STRATEGY_INDICATOR_SERIES


__all__ = [
    "IndicatorPoint",
    "MacdPoint",
    "IndicatorSeries",
    "IndicatorSeriesMap",
    "get_indicator_series",
    "get_all_indicator_series",
    "STRATEGY_INDICATOR_SERIES",
]
