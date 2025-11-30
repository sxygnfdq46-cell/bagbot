"""Tests for backtest CSV loader parsing and range slice."""
import tempfile
import os
from bagbot.backtest.loader import load_candles, slice_by_range


def test_load_candles_valid_csv():
    """Test loading valid CSV with proper header and data."""
    csv_content = """timestamp,open,high,low,close,volume
2024-01-01T00:00:00,100.0,101.0,99.0,100.5,1000.0
2024-01-01T01:00:00,100.5,102.0,100.0,101.5,1500.0
2024-01-01T02:00:00,101.5,103.0,101.0,102.0,2000.0
"""
    
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.csv') as f:
        f.write(csv_content)
        temp_path = f.name
    
    try:
        candles = load_candles(temp_path)
        
        assert len(candles) == 3
        assert candles[0]["timestamp"] == "2024-01-01T00:00:00"
        assert candles[0]["open"] == 100.0
        assert candles[0]["high"] == 101.0
        assert candles[0]["low"] == 99.0
        assert candles[0]["close"] == 100.5
        assert candles[0]["volume"] == 1000.0
        
        # Verify sorted oldest to newest
        assert candles[0]["timestamp"] < candles[1]["timestamp"] < candles[2]["timestamp"]
    finally:
        os.unlink(temp_path)


def test_load_candles_missing_file():
    """Test that missing file raises ValueError."""
    try:
        load_candles("/nonexistent/path/to/file.csv")
        assert False, "Should have raised ValueError"
    except ValueError as e:
        assert "Failed to load candles" in str(e)


def test_slice_by_range_both_bounds():
    """Test slicing with both start and end timestamps."""
    candles = [
        {"timestamp": "2024-01-01T00:00:00", "close": 100.0},
        {"timestamp": "2024-01-01T01:00:00", "close": 101.0},
        {"timestamp": "2024-01-01T02:00:00", "close": 102.0},
        {"timestamp": "2024-01-01T03:00:00", "close": 103.0},
        {"timestamp": "2024-01-01T04:00:00", "close": 104.0},
    ]
    
    result = slice_by_range(candles, start_ts="2024-01-01T01:00:00", end_ts="2024-01-01T03:00:00")
    
    assert len(result) == 3
    assert result[0]["timestamp"] == "2024-01-01T01:00:00"
    assert result[2]["timestamp"] == "2024-01-01T03:00:00"


def test_slice_by_range_no_mutation():
    """Test that original list is not mutated."""
    candles = [
        {"timestamp": "2024-01-01T00:00:00", "close": 100.0},
        {"timestamp": "2024-01-01T01:00:00", "close": 101.0},
    ]
    
    original_len = len(candles)
    slice_by_range(candles, start_ts="2024-01-01T01:00:00")
    
    assert len(candles) == original_len
