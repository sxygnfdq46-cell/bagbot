import logging

import pytest

from backend.utils.logging import log_event
from backend.utils.metrics import MetricsClient, CounterStub, GaugeStub


def test_log_event_contains_keys():
    logger = logging.getLogger("test_logger")
    logger.handlers.clear()
    logger.setLevel(logging.INFO)
    logger.propagate = False
    events = []

    class CaptureHandler(logging.Handler):
        def emit(self, record):
            events.append(record.event)

    handler = CaptureHandler()
    logger.addHandler(handler)

    event = log_event(
        logger,
        "test.message",
        request_id="req-123",
        route="/api/admin",
        action="pause",
        extra={"token": "secret"},
    )

    assert event["request_id"] == "req-123"
    assert event["route"] == "/api/admin"
    assert event["action"] == "pause"
    assert event["extra"]["token"] == "[REDACTED]"
    assert events and events[0] == event


def test_metrics_client_counters_and_gauges():
    client = MetricsClient(registry=None)
    counter = client.counter("admin_pause_total")
    gauge = client.gauge("ws_connections_active")

    client.inc_counter("admin_pause_total")
    client.inc_gauge("ws_connections_active")
    client.dec_gauge("ws_connections_active")
    client.set_gauge("ws_connections_active", 5)

    if isinstance(counter, CounterStub):
        assert counter.value == 1
    if isinstance(gauge, GaugeStub):
        assert gauge.value == 5


@pytest.mark.parametrize("name", ["admin_pause_total", "admin_resume_total", "scheduler_cycles_total", "ws_disconnects_total"])
def test_metrics_client_reuses_counters(name):
    client = MetricsClient(registry=None)
    first = client.counter(name)
    second = client.counter(name)
    assert first is second
