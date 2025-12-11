"""Unit coverage for signals ingest_frame."""

from backend.signals.ingest import ingest_frame


def test_ingest_frame_normalizes_basic_frame(monkeypatch):
    monkeypatch.delenv("SIGNALS_FAKE_MODE", raising=False)
    monkeypatch.delenv("BRAIN_FAKE_MODE", raising=False)
    frame = {"instrument": "BTC-USD", "timestamp": 123, "features": {"price": 1.0}}
    resp = ingest_frame(frame)

    assert resp["status"] == "success"
    env = resp["envelope"]
    assert env["instrument"] == "BTC-USD"
    assert env["snapshot"]["instrument"] == "BTC-USD"
    assert env["snapshot"]["features"]["price"] == 1.0


def test_ingest_frame_fake_mode(monkeypatch):
    monkeypatch.setenv("SIGNALS_FAKE_MODE", "1")
    frame = {"instrument": "ETH-USD", "timestamp": 123}

    resp = ingest_frame(frame)

    assert resp["status"] == "success"
    env = resp["envelope"]
    assert env["fake_mode"] is True
    assert env["snapshot"]["instrument"] == "ETH-USD"
