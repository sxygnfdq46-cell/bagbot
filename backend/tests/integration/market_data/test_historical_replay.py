import importlib

from backend.brain import invariants
from backtest.replay import ReplayEngine


CANDLES = [
    {"timestamp": 1, "open": 100, "high": 105, "low": 99, "close": 104, "symbol": "BTC-USD"},
    {"timestamp": 2, "open": 104, "high": 108, "low": 103, "close": 107, "symbol": "BTC-USD"},
    {"timestamp": 3, "open": 107, "high": 109, "low": 106, "close": 108, "symbol": "BTC-USD"},
]


def _reload_runtime(monkeypatch, env_source: str):
    monkeypatch.setenv("MARKET_DATA_SOURCE", env_source)
    import backend.worker.runtime_pipeline as runtime_pipeline

    return importlib.reload(runtime_pipeline)


def _collect(candles):
    return [
        {
            "timestamp": c["timestamp"],
            "open": c["open"],
            "high": c["high"],
            "low": c["low"],
            "close": c["close"],
        }
        for c in candles
    ]


def test_single_market_data_source_per_session(monkeypatch):
    runtime_pipeline = _reload_runtime(monkeypatch, env_source="HISTORICAL")
    assert runtime_pipeline.MARKET_DATA_SOURCE == "HISTORICAL"
    assert invariants.SINGLE_MARKET_DATA_SOURCE is True

    runtime_pipeline = _reload_runtime(monkeypatch, env_source="MOCK")
    assert runtime_pipeline.MARKET_DATA_SOURCE == "MOCK"
    assert invariants.SINGLE_MARKET_DATA_SOURCE is True


def test_historical_replay_determinism_same_input_same_ohlc():
    out_a: list[dict] = []
    out_b: list[dict] = []

    ReplayEngine(CANDLES, tick_callback=lambda c: out_a.append(c)).run()
    ReplayEngine(CANDLES, tick_callback=lambda c: out_b.append(c)).run()

    assert _collect(out_a) == _collect(out_b)
    assert out_a[-1]["close"] == CANDLES[-1]["close"]


def test_replay_pause_stops_new_candles():
    partial: list[dict] = []
    engine = ReplayEngine(CANDLES, tick_callback=lambda c: partial.append(c))

    engine.run_from_to(0, 1)
    assert len(partial) == 2
    assert partial[-1]["timestamp"] == 2


def test_end_of_tape_terminal_state_stable():
    captured: list[dict] = []
    engine = ReplayEngine(CANDLES, tick_callback=lambda c: captured.append(c))

    engine.run()
    last_first_run = captured[-1]

    captured.clear()
    engine = ReplayEngine(CANDLES, tick_callback=lambda c: captured.append(c))
    engine.run_from_to(len(CANDLES) - 1, len(CANDLES) - 1)

    assert captured[-1] == last_first_run
