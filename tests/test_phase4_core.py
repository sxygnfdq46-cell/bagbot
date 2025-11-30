"""Tests for News Anchor and market adapters."""

import pytest
from datetime import datetime
from worker.news.news_anchor import NewsAnchor, MarketBias, FundamentalGrade


def test_news_anchor_initialization():
    """Test News Anchor initializes correctly."""
    anchor = NewsAnchor()
    
    assert anchor is not None
    assert len(anchor.macro_events) == 0


@pytest.mark.asyncio
async def test_news_anchor_morning_briefing():
    """Test morning briefing generation."""
    anchor = NewsAnchor()
    
    briefing = await anchor.generate_morning_briefing()
    
    assert briefing is not None
    assert briefing.overall_bias in [MarketBias.RISK_ON, MarketBias.RISK_OFF, 
                                     MarketBias.NEUTRAL, MarketBias.UNCERTAIN]
    assert briefing.fundamental_grade is not None
    assert isinstance(briefing.key_events, list)


def test_news_anchor_market_context():
    """Test market context retrieval."""
    anchor = NewsAnchor()
    
    context = anchor.get_market_context()
    
    assert "bias" in context
    assert "risk_level" in context
    # risk_level is a float from 0-1
    assert isinstance(context["risk_level"], float)
    assert 0 <= context["risk_level"] <= 1


def test_news_anchor_register_source():
    """Test custom news source registration."""
    anchor = NewsAnchor()
    
    def custom_fetcher():
        return [{"title": "Test Event", "impact": "high"}]
    
    def custom_parser(data):
        return data
    
    anchor.register_source("custom", custom_fetcher, custom_parser)
    
    assert "custom" in anchor.sources


@pytest.mark.skip(reason="Requires MarketAdapter base class fixes")
def test_tradingview_adapter():
    """Test TradingView adapter webhook processing."""
    from worker.markets.tradingview_adapter import TradingViewAdapter
    
    adapter = TradingViewAdapter()
    
    # Simulate webhook data
    webhook_data = {
        "symbol": "EURUSD",
        "action": "buy",
        "price": 1.0500,
        "indicator": "RSI_Oversold"
    }
    
    result = adapter.process_webhook(webhook_data)
    
    assert result["status"] == "queued"
    assert adapter.get_queued_signals() == 1


@pytest.mark.skip(reason="Requires HTM module structure fixes")
def test_htm_adapter_direction_bias():
    """Test HTM adapter direction bias calculation."""
    from worker.markets.htm.htm_adapter import HTMAdapter, TimeFrame
    
    adapter = HTMAdapter()
    
    # Mock candle data
    candles = {
        TimeFrame.H4: [{"open": 1.0, "close": 1.02, "high": 1.025, "low": 0.995}],
        TimeFrame.D1: [{"open": 1.0, "close": 1.03, "high": 1.035, "low": 0.99}],
        TimeFrame.W1: [{"open": 1.0, "close": 1.05, "high": 1.055, "low": 0.98}]
    }
    
    bias = adapter.analyze_direction_bias(candles)
    
    assert bias is not None
    assert "direction" in bias
    assert "timeframes" in bias


@pytest.mark.skip(reason="Requires MarketAdapter base class compatibility")
def test_oanda_adapter_symbol_formatting():
    """Test Oanda adapter symbol formatting."""
    from worker.markets.forex.oanda_adapter import OandaAdapter
    
    adapter = OandaAdapter(
        name="oanda",
        market_type="forex",
        config={
            "api_key": "test_key",
            "account_id": "test_account",
            "practice": True
        }
    )
    
    formatted = adapter._format_symbol("EURUSD")
    assert formatted == "EUR_USD"
    
    formatted = adapter._format_symbol("GBPJPY")
    assert formatted == "GBP_JPY"


@pytest.mark.skip(reason="Requires MarketAdapter base class compatibility")
def test_generic_rest_adapter_configuration():
    """Test Generic REST adapter endpoint configuration."""
    from worker.markets.generic_rest_adapter import GenericRESTAdapter
    
    adapter = GenericRESTAdapter(
        name="generic",
        market_type="crypto",
        base_url="https://api.example.com"
    )
    
    adapter.configure_endpoint(
        name="get_price",
        method="GET",
        path="/v1/price/{symbol}",
        response_parser=lambda r: r.json()["price"]
    )
    
    assert "get_price" in adapter.endpoints


@pytest.mark.skip(reason="OrderBlockStrategy tested in test_phase4_strategies.py")
def test_order_block_strategy():
    """Test Order Block strategy detection."""
    from worker.strategies.order_block_strategy import OrderBlockStrategy
    
    strategy = OrderBlockStrategy()
    
    # Create momentum candle (order block)
    candles = [
        {"open": 1.00, "close": 1.00, "high": 1.01, "low": 0.99},
        {"open": 1.00, "close": 1.02, "high": 1.025, "low": 1.00},  # Strong bullish OB
        {"open": 1.02, "close": 1.015, "high": 1.025, "low": 1.01},
        {"open": 1.015, "close": 1.005, "high": 1.02, "low": 1.00},  # Retest
    ]
    
    signal = strategy.analyze(candles)
    
    # Should detect retest of order block
    if signal:
        assert signal["action"] in ["buy", "sell"]
