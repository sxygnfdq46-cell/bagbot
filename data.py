"""Utility to fetch historical OHLCV data from CCXT exchanges."""
import ccxt
import pandas as pd
import logging


logger = logging.getLogger(__name__)


def fetch_ohlcv_ccxt(
    symbol: str = "BTC/USD",
    exchange_name: str = "binance",
    timeframe: str = "5m",
    limit: int = 5000,
) -> pd.DataFrame:
    """
    Fetch historical OHLCV data from a CCXT exchange.
    
    Args:
        symbol: Trading pair (e.g., 'BTC/USD')
        exchange_name: CCXT exchange name (e.g., 'binance', 'kraken', 'bybit')
        timeframe: Timeframe (e.g., '5m', '1h', '1d')
        limit: Number of candles to fetch (max depends on exchange)
    
    Returns:
        DataFrame with columns [timestamp, open, high, low, close, volume]
    """
    try:
        ExchangeClass = getattr(ccxt, exchange_name)
        exchange = ExchangeClass({'enableRateLimit': True})
        
        logger.info(f"Fetching {limit} {timeframe} candles for {symbol} from {exchange_name}...")
        ohlcv = exchange.fetch_ohlcv(symbol, timeframe=timeframe, limit=limit)
        
        df = pd.DataFrame(
            ohlcv,
            columns=['timestamp', 'open', 'high', 'low', 'close', 'volume']
        )
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        df = df.set_index('timestamp')
        
        logger.info(f"Fetched {len(df)} candles. Date range: {df.index.min()} to {df.index.max()}")
        return df
    
    except Exception as e:
        logger.error(f"Failed to fetch data: {e}")
        raise
