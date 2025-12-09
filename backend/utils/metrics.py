from __future__ import annotations

"""Metrics helper with optional Prometheus integration and no import-time side effects."""

import os
from typing import Any, Dict, Optional

try:  # pragma: no cover - exercised via fallback when missing
    from prometheus_client import CollectorRegistry, Counter, Gauge, multiprocess
except Exception:  # pragma: no cover
    CollectorRegistry = None
    Counter = None
    Gauge = None
    multiprocess = None


class CounterStub:
    def __init__(self, name: str):
        self.name = name
        self.value = 0

    def inc(self, amount: float = 1, **_: Any) -> None:
        self.value += amount


class GaugeStub:
    def __init__(self, name: str):
        self.name = name
        self.value = 0

    def inc(self, amount: float = 1, **_: Any) -> None:
        self.value += amount

    def dec(self, amount: float = 1, **_: Any) -> None:
        self.value -= amount

    def set(self, value: float, **_: Any) -> None:
        self.value = value


def _build_registry(registry: Any | None) -> Any:
    if registry is not None:
        return registry
    if CollectorRegistry is None:
        return None
    reg = CollectorRegistry()
    multiproc_dir = os.getenv("PROMETHEUS_MULTIPROC_DIR")
    if multiprocess and multiproc_dir:
        multiprocess.MultiProcessCollector(reg)
    return reg


class MetricsClient:
    """Lightweight metrics adapter that can wrap Prometheus or stub collectors."""

    def __init__(self, registry: Any | None = None) -> None:
        self.registry = _build_registry(registry)
        self._counters: Dict[str, Any] = {}
        self._gauges: Dict[str, Any] = {}

    def counter(self, name: str, description: str = "") -> Any:
        if name in self._counters:
            return self._counters[name]
        if Counter and self.registry:
            self._counters[name] = Counter(name, description, registry=self.registry)
        else:
            self._counters[name] = CounterStub(name)
        return self._counters[name]

    def gauge(self, name: str, description: str = "") -> Any:
        if name in self._gauges:
            return self._gauges[name]
        if Gauge and self.registry:
            self._gauges[name] = Gauge(name, description, registry=self.registry)
        else:
            self._gauges[name] = GaugeStub(name)
        return self._gauges[name]

    def inc_counter(self, name: str, amount: float = 1) -> None:
        self.counter(name).inc(amount)

    def inc_gauge(self, name: str, amount: float = 1) -> None:
        self.gauge(name).inc(amount)

    def dec_gauge(self, name: str, amount: float = 1) -> None:
        self.gauge(name).dec(amount)

    def set_gauge(self, name: str, value: float) -> None:
        self.gauge(name).set(value)


__all__ = ["MetricsClient", "CounterStub", "GaugeStub"]
