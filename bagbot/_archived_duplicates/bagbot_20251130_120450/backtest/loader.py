"""Data loader for historical candle CSV files."""
import csv
from typing import List, Optional


def load_candles(filepath: str) -> List[dict]:
    """
    Load historical candles from CSV file.
    
    Args:
        filepath: Path to CSV file with header: timestamp,open,high,low,close,volume
                 OR headerless Binance Kline format (timestamp is first column)
        
    Returns:
        List of candle dicts sorted oldest to newest by timestamp.
        Each dict contains: {"timestamp": str, "open": float, "high": float, 
                            "low": float, "close": float, "volume": float}
    
    Raises:
        ValueError: If file missing or CSV parsing error
    """
    try:
        candles = []
        with open(filepath, 'r') as f:
            # Try to detect if file has headers
            first_line = f.readline()
            f.seek(0)
            
            has_headers = 'timestamp' in first_line.lower() or 'open' in first_line.lower()
            
            if has_headers:
                reader = csv.DictReader(f)
                for row in reader:
                    candle = {
                        "timestamp": row["timestamp"],
                        "open": float(row["open"]),
                        "high": float(row["high"]),
                        "low": float(row["low"]),
                        "close": float(row["close"]),
                        "volume": float(row["volume"])
                    }
                    candles.append(candle)
            else:
                # Headerless Binance Kline format
                reader = csv.reader(f)
                for row in reader:
                    if len(row) >= 6:
                        candle = {
                            "timestamp": row[0],
                            "open": float(row[1]),
                            "high": float(row[2]),
                            "low": float(row[3]),
                            "close": float(row[4]),
                            "volume": float(row[5])
                        }
                        candles.append(candle)
        
        # Sort by timestamp (oldest to newest)
        candles.sort(key=lambda c: c["timestamp"])
        return candles
        
    except FileNotFoundError as e:
        raise ValueError(f"Failed to load candles: file not found - {filepath}")
    except (IndexError, ValueError, TypeError) as e:
        raise ValueError(f"Failed to load candles: parse error - {e}")


def slice_by_range(candles: List[dict], start_ts: Optional[str] = None, 
                   end_ts: Optional[str] = None) -> List[dict]:
    """
    Filter candles by timestamp range.
    
    Args:
        candles: List of candle dicts with "timestamp" key
        start_ts: If provided, return only rows with timestamp >= start_ts
        end_ts: If provided, return only rows with timestamp <= end_ts
        
    Returns:
        Filtered list maintaining chronological order. Does not mutate original.
    """
    result = []
    for candle in candles:
        ts = candle.get("timestamp", "")
        
        # Apply start filter
        if start_ts is not None and ts < start_ts:
            continue
            
        # Apply end filter
        if end_ts is not None and ts > end_ts:
            continue
            
        result.append(candle)
    
    return result
