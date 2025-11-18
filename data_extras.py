"""Additional data fetchers and aggregators beyond OHLCV.

Provides:
- fetch_trades_range: page ccxt.fetch_trades across a time range and return as DataFrame
- aggregate_trades_to_candles: aggregate trades into per-candle stats aligned with an OHLCV index
- fetch_funding_rates: attempt to fetch funding rates (per-exchange support varies)
- fetch_onchain_from_csv: load user-provided on-chain metrics CSV and resample to candles
- simple orderbook snapshot fetcher (current snapshot only)
"""
import time
import logging
import pandas as pd
import numpy as np
import ccxt

logger = logging.getLogger('src.data_extras')


def _init_exchange(name: str):
    name = name.lower()
    if not hasattr(ccxt, name):
        raise ValueError(f"Unknown exchange: {name}")
    ex = getattr(ccxt, name)({
        'enableRateLimit': True,
    })
    return ex


def fetch_trades_range(symbol: str, exchange_name: str = 'binance', since: int = None, until: int = None, limit_per_call: int = 1000) -> pd.DataFrame:
    """Fetch trades for symbol between since and until (ms timestamps). Returns DataFrame with columns: timestamp, price, amount, side, id

    Note: ccxt behavior varies by exchange. This attempts to page from `since` forward until `until` or no more results.
    """
    ex = _init_exchange(exchange_name)
    all_trades = []
    params = {}
    fetch_since = since
    now = ex.milliseconds()
    stop_at = until or now

    while True:
        try:
            batch = ex.fetch_trades(symbol, since=fetch_since, limit=limit_per_call)
        except Exception as e:
            logger.warning('fetch_trades error: %s — sleeping and retrying', e)
            time.sleep(1)
            continue

        if not batch:
            break

        # convert to standard dicts
        for t in batch:
            ts = int(t.get('timestamp') or t.get('date') or 0)
            if ts == 0:
                continue
            if ts > stop_at:
                break
            all_trades.append({
                'timestamp': ts,
                'price': float(t.get('price', np.nan)),
                'amount': float(t.get('amount', 0.0)),
                'side': t.get('side'),
                'info': t.get('info', {}),
            })

        last_ts = int(batch[-1].get('timestamp') or 0)
        if last_ts == 0 or last_ts >= stop_at:
            break
        fetch_since = last_ts + 1
        time.sleep(ex.rateLimit / 1000)

    if not all_trades:
        return pd.DataFrame(columns=['timestamp', 'price', 'amount', 'side'])

    df = pd.DataFrame(all_trades)
    df['datetime'] = pd.to_datetime(df['timestamp'], unit='ms')
    df.set_index('datetime', inplace=True)
    return df


def aggregate_trades_to_candles(trades_df: pd.DataFrame, ohlcv_index: pd.DatetimeIndex, timeframe: str = '5m') -> pd.DataFrame:
    """Aggregate trades DataFrame into per-candle statistics aligned with `ohlcv_index`.

    Returns DataFrame indexed like `ohlcv_index` with columns:
    - trade_count, buy_volume, sell_volume, buy_volume_ratio, avg_trade_size
    """
    if trades_df is None or trades_df.empty:
        # return zeros
        idx = ohlcv_index
        return pd.DataFrame(index=idx, data={
            'trade_count': 0,
            'buy_volume': 0.0,
            'sell_volume': 0.0,
            'buy_volume_ratio': 0.0,
            'avg_trade_size': 0.0,
        })

    tf = pd.to_timedelta(timeframe)
    # resample trades into timeframe bins
    try:
        res = trades_df.resample(timeframe).apply({
            'price': 'count',
            'amount': 'sum'
        })
    except Exception:
        # fallback: group by floor of timestamp to timeframe
        trades_df = trades_df.copy()
        trades_df['bin'] = trades_df.index.floor(timeframe)
        grp = trades_df.groupby('bin')
        res = grp.agg({'price': 'count', 'amount': 'sum'})

    # Compute buy/sell volumes if 'side' exists
    if 'side' in trades_df.columns:
        bv = trades_df[trades_df['side'] == 'buy'].resample(timeframe).amount.sum().fillna(0)
        sv = trades_df[trades_df['side'] == 'sell'].resample(timeframe).amount.sum().fillna(0)
    else:
        # cannot distinguish; estimate using tick rule: compare price to previous price
        tdf = trades_df.copy()
        tdf['prev_price'] = tdf['price'].shift(1)
        tdf['side_est'] = np.where(tdf['price'] >= tdf['prev_price'], 'buy', 'sell')
        bv = tdf[tdf['side_est'] == 'buy'].resample(timeframe).amount.sum().fillna(0)
        sv = tdf[tdf['side_est'] == 'sell'].resample(timeframe).amount.sum().fillna(0)

    trade_count = trades_df['price'].resample(timeframe).count().fillna(0)
    total_vol = (bv + sv).replace(0, np.nan)
    buy_ratio = (bv / (bv + sv)).fillna(0)
    avg_trade_size = (bv + sv) / trade_count.replace(0, np.nan)
    avg_trade_size = avg_trade_size.fillna(0)

    agg = pd.DataFrame({
        'trade_count': trade_count,
        'buy_volume': bv,
        'sell_volume': sv,
        'buy_volume_ratio': buy_ratio,
        'avg_trade_size': avg_trade_size,
    })

    # Reindex to ohlcv_index and forward/backfill
    agg = agg.reindex(ohlcv_index, method='nearest', tolerance=pd.Timedelta(timeframe)).fillna(0)
    return agg


def fetch_funding_rates(symbol: str, exchange_name: str = 'binance', since: int = None, limit: int = 1000) -> pd.DataFrame:
    """Attempt to fetch funding rates for a perpetual symbol. Returns DataFrame with index datetime and column 'funding_rate'.

    Support varies; function is best-effort and will return empty DataFrame on failure.
    """
    ex = _init_exchange(exchange_name)
    try:
        if hasattr(ex, 'fetch_funding_rate'):
            fr = ex.fetch_funding_rate(symbol)
            ts = int(fr.get('timestamp') or 0)
            df = pd.DataFrame([{'timestamp': ts, 'funding_rate': float(fr.get('fundingRate', fr.get('funding_rate', 0)))}])
            df['datetime'] = pd.to_datetime(df['timestamp'], unit='ms')
            df.set_index('datetime', inplace=True)
            return df
        elif hasattr(ex, 'fetch_funding_rates'):
            frs = ex.fetch_funding_rates(symbol)
            rows = []
            for fr in frs:
                ts = int(fr.get('timestamp') or 0)
                rows.append({'timestamp': ts, 'funding_rate': float(fr.get('fundingRate', fr.get('funding_rate', 0)))})
            df = pd.DataFrame(rows)
            df['datetime'] = pd.to_datetime(df['timestamp'], unit='ms')
            df.set_index('datetime', inplace=True)
            return df
    except Exception as e:
        logger.warning('fetch_funding_rates failed: %s', e)
    return pd.DataFrame()


def fetch_onchain_from_csv(path: str, timestamp_col: str = 'timestamp', metrics: list = None) -> pd.DataFrame:
    """Load on-chain metrics CSV with a timestamp column and return a DataFrame indexed by datetime.

    CSV must contain a timestamp column (ms or ISO). Metrics can include 'tx_volume', 'active_addresses', etc.
    """
    if not metrics:
        metrics = ['tx_volume', 'active_addresses']
    try:
        df = pd.read_csv(path)
    except Exception as e:
        logger.warning('Could not read on-chain csv %s: %s', path, e)
        return pd.DataFrame()

    if timestamp_col in df.columns:
        # detect ms vs ISO
        if pd.api.types.is_integer_dtype(df[timestamp_col]):
            df['datetime'] = pd.to_datetime(df[timestamp_col], unit='ms')
        else:
            df['datetime'] = pd.to_datetime(df[timestamp_col])
        df.set_index('datetime', inplace=True)
        return df.reindex(columns=[c for c in metrics if c in df.columns])
    else:
        logger.warning('Timestamp column %s not found in on-chain CSV', timestamp_col)
        return pd.DataFrame()


def fetch_orderbook_snapshot(symbol: str, exchange_name: str = 'binance', limit: int = 50) -> dict:
    """Fetch a single current orderbook snapshot. Returns ccxt orderbook dict or empty dict on failure."""
    ex = _init_exchange(exchange_name)
    try:
        ob = ex.fetch_order_book(symbol, limit=limit)
        return ob
    except Exception as e:
        logger.warning('fetch_orderbook_snapshot failed: %s', e)
        return {}
