"""Feature engineering pipeline for ML model training.
Builds lookahead-safe features from OHLCV and indicators.
"""
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from . import indicators
from . import data_extras


def build_features(ohlcv_df: pd.DataFrame, lookahead_bars: int = 5, symbol: str = 'BTC/USDT', exchange_name: str = 'binance') -> pd.DataFrame:
    """
    Build a feature DataFrame from OHLCV data.
    
    Args:
        ohlcv_df: DataFrame with columns [timestamp, open, high, low, close, volume]
        lookahead_bars: number of bars to look ahead for labeling (avoid lookahead bias)
    
    Returns:
        DataFrame with features and labels, NaNs removed.
    """
    df = ohlcv_df.copy()
    # ensure a DatetimeIndex for downstream aggregation (trades/funding/onchain)
    if not pd.api.types.is_datetime64_any_dtype(df.index):
        # try common timestamp column names
        for col in ['timestamp', 'ts', 'date', 'datetime']:
            if col in df.columns:
                try:
                    df.index = pd.to_datetime(df[col], unit='ms', errors='coerce')
                except Exception:
                    df.index = pd.to_datetime(df[col], errors='coerce')
                break
    # if still not datetime, attempt to infer from first column
    if not pd.api.types.is_datetime64_any_dtype(df.index):
        try:
            df.index = pd.to_datetime(df.index)
        except Exception:
            # fallback: create a simple RangeIndex (some features still valid)
            df = df.reset_index(drop=True)
    
    # Ensure numeric
    for col in ['open', 'high', 'low', 'close', 'volume']:
        df[col] = pd.to_numeric(df[col], errors='coerce')
    
    # Price returns at multiple scales
    df['return_1'] = df['close'].pct_change(1)
    df['return_3'] = df['close'].pct_change(3)
    df['return_5'] = df['close'].pct_change(5)
    df['return_10'] = df['close'].pct_change(10)
    df['return_20'] = df['close'].pct_change(20)
    
    # Volume features
    df['volume_sma'] = indicators.sma(df['volume'], 20)
    df['volume_ratio'] = df['volume'] / (df['volume_sma'] + 1e-8)
    df['volume_std'] = df['volume'].rolling(20).std()
    
    # Volatility
    df['volatility'] = df['close'].rolling(20).std() / (df['close'].rolling(20).mean() + 1e-8)
    df['atr'] = indicators.atr(df['high'], df['low'], df['close'], 14)
    df['atr_ratio'] = df['atr'] / df['close']
    
    # Trend indicators
    df['sma_5'] = indicators.sma(df['close'], 5)
    df['sma_20'] = indicators.sma(df['close'], 20)
    df['sma_50'] = indicators.sma(df['close'], 50)
    df['ema_12'] = indicators.ema(df['close'], 12)
    df['ema_26'] = indicators.ema(df['close'], 26)
    
    df['sma_5_diff'] = (df['sma_5'] - df['close']) / df['close']
    df['sma_20_diff'] = (df['sma_20'] - df['close']) / df['close']
    df['sma_5_20_cross'] = df['sma_5'] - df['sma_20']
    
    # Momentum
    df['rsi_14'] = indicators.rsi(df['close'], 14)
    df['rsi_7'] = indicators.rsi(df['close'], 7)
    
    macd_line, signal_line, histogram = indicators.macd(df['close'], 12, 26, 9)
    df['macd'] = macd_line
    df['macd_signal'] = signal_line
    df['macd_histogram'] = histogram
    
    df['roc_12'] = indicators.roc(df['close'], 12)
    
    # Bollinger Bands
    upper_bb, middle_bb, lower_bb = indicators.bollinger_bands(df['close'], 20, 2.0)
    df['bb_upper'] = upper_bb
    df['bb_middle'] = middle_bb
    df['bb_lower'] = lower_bb
    df['bb_width'] = (upper_bb - lower_bb) / middle_bb
    df['bb_position'] = (df['close'] - lower_bb) / (upper_bb - lower_bb + 1e-8)
    
    # OBV
    df['obv'] = indicators.obv(df['close'], df['volume'])
    df['obv_sma'] = indicators.sma(df['obv'], 20)
    
    # Stochastic
    stoch_k, stoch_d = indicators.stochastic(df['high'], df['low'], df['close'], 14, 3)
    df['stoch_k'] = stoch_k
    df['stoch_d'] = stoch_d
    
    # High-Low spread
    df['hl_spread'] = (df['high'] - df['low']) / df['close']
    df['oc_spread'] = abs(df['open'] - df['close']) / df['close']
    
    # Multi-bar highs/lows
    df['high_20'] = df['high'].rolling(20).max()
    df['low_20'] = df['low'].rolling(20).min()
    df['close_pct_from_high'] = (df['close'] - df['low_20']) / (df['high_20'] - df['low_20'] + 1e-8)
    
    # --- Advanced indicators (new additions) ---
    try:
        df['kama_10'] = indicators.kama(df['close'], period=10)
    except Exception:
        df['kama_10'] = np.nan

    try:
        df['cci_20'] = indicators.cci(df['high'], df['low'], df['close'], period=20)
    except Exception:
        df['cci_20'] = np.nan

    try:
        df['williams_r_14'] = indicators.williams_r(df['high'], df['low'], df['close'], period=14)
    except Exception:
        df['williams_r_14'] = np.nan

    try:
        df['hma_16'] = indicators.hma(df['close'], period=16)
    except Exception:
        df['hma_16'] = np.nan

    try:
        df['vwap_50'] = indicators.vwap(df, period=50)
    except Exception:
        df['vwap_50'] = np.nan

    try:
        df['fisher_10'] = indicators.fisher_transform(df['close'], period=10)
    except Exception:
        df['fisher_10'] = np.nan

    try:
        df['ema_volume_20'] = indicators.ema_volume(df['volume'], period=20)
    except Exception:
        df['ema_volume_20'] = np.nan

    try:
        st = indicators.supertrend(df['high'], df['low'], df['close'], period=10, multiplier=3.0)
        # represent supertrend as distance from close (normalized)
        df['supertrend_10'] = (df['close'] - st) / (df['close'] + 1e-8)
    except Exception:
        df['supertrend_10'] = np.nan

    # Create lookahead-safe label: next N-bar return
    # shift by -lookahead_bars to avoid lookahead bias
    df['future_return'] = df['close'].shift(-lookahead_bars).pct_change(lookahead_bars)
    
    # Binary label: +1 if next return > median (uptrend), else 0 (downtrend)
    median_return = df['future_return'].median()
    df['label'] = (df['future_return'] > median_return).astype(int)
    
    # Fill NaNs conservatively (forward then backward) and finally with zeros
    # This avoids dropping all rows when some advanced indicators have initial NaNs
    df = df.fillna(method='ffill').fillna(method='bfill').fillna(0)

    # Remove last N rows to avoid incomplete future returns
    df = df.iloc[:-lookahead_bars]

    # --- Additional data sources: trades, funding, on-chain, orderbook (best-effort) ---
    try:
        # determine timeframe string from index frequency if available
        timeframe = '5min'
        if hasattr(df.index, 'freq') and df.index.freq is not None:
            timeframe = pd.tseries.frequencies.to_offset(df.index.freq).freqstr
        # fetch trades across entire span and aggregate per-candle
        if pd.api.types.is_datetime64_any_dtype(df.index):
            start_ts = int(df.index[0].timestamp() * 1000)
            end_ts = int(df.index[-1].timestamp() * 1000)
            trades = data_extras.fetch_trades_range(symbol=symbol, exchange_name=exchange_name, since=start_ts, until=end_ts)
        else:
            trades = pd.DataFrame()
        # The above uses a default symbol; callers may want to pass symbol through in future.
        trades_agg = data_extras.aggregate_trades_to_candles(trades, df.index, timeframe='5min')
        # merge trade aggregates
        for col in ['trade_count', 'buy_volume', 'sell_volume', 'buy_volume_ratio', 'avg_trade_size']:
            if col in trades_agg.columns:
                df[col] = trades_agg[col].values
            else:
                df[col] = 0
    except Exception:
        # if anything fails, add zero/NaN columns
        df['trade_count'] = 0
        df['buy_volume'] = 0.0
        df['sell_volume'] = 0.0
        df['buy_volume_ratio'] = 0.0
        df['avg_trade_size'] = 0.0

    # funding & basis: best-effort
    try:
        fr_df = data_extras.fetch_funding_rates(symbol='BTC/USDT', exchange_name='binance')
        if not fr_df.empty:
            # align to candles by nearest timestamp
            fr_series = fr_df['funding_rate'].reindex(df.index, method='nearest', tolerance=pd.Timedelta('1h')).fillna(0)
            df['funding_rate'] = fr_series.values
        else:
            df['funding_rate'] = 0.0
    except Exception:
        df['funding_rate'] = 0.0

    # on-chain metrics: allow user to provide CSV at reports/onchain.csv
    try:
        onchain = data_extras.fetch_onchain_from_csv('reports/onchain.csv')
        if not onchain.empty:
            # join onchain metrics by nearest timestamp (daily -> forward-fill)
            onchain_resampled = onchain.reindex(df.index, method='ffill').fillna(0)
            for c in onchain_resampled.columns:
                df[c] = onchain_resampled[c].values
        else:
            df['tx_volume'] = 0.0
            df['active_addresses'] = 0.0
    except Exception:
        df['tx_volume'] = 0.0
        df['active_addresses'] = 0.0

    # orderbook snapshot (current, broadcast to rows) — best-effort and not historical
    try:
        ob = data_extras.fetch_orderbook_snapshot('BTC/USDT', 'binance')
        if ob and 'bids' in ob and 'asks' in ob:
            bids_sum = sum([b[1] for b in ob['bids'][:10]])
            asks_sum = sum([a[1] for a in ob['asks'][:10]])
            imbalance = (bids_sum - asks_sum) / (bids_sum + asks_sum + 1e-8)
            df['ob_imbalance'] = imbalance
            df['ob_bid_depth'] = bids_sum
            df['ob_ask_depth'] = asks_sum
        else:
            df['ob_imbalance'] = 0.0
            df['ob_bid_depth'] = 0.0
            df['ob_ask_depth'] = 0.0
    except Exception:
        df['ob_imbalance'] = 0.0
        df['ob_bid_depth'] = 0.0
        df['ob_ask_depth'] = 0.0

    # final fill for any newly added columns
    df = df.fillna(0)
    
    return df


def get_feature_names() -> list:
    """List of feature column names (excludes label, timestamp, OHLCV)."""
    base = [
        'return_1', 'return_3', 'return_5', 'return_10', 'return_20',
        'volume_ratio', 'volume_std',
        'volatility', 'atr_ratio',
        'sma_5_diff', 'sma_20_diff', 'sma_5_20_cross',
        'rsi_14', 'rsi_7',
        'macd', 'macd_signal', 'macd_histogram', 'roc_12',
        'bb_width', 'bb_position',
        'obv_sma',
        'stoch_k', 'stoch_d',
        'hl_spread', 'oc_spread',
        'close_pct_from_high', 'volume_ratio',
        # Advanced indicators
        'kama_10', 'cci_20', 'williams_r_14', 'hma_16', 'vwap_50',
        'fisher_10', 'ema_volume_20', 'supertrend_10'
    ]
    # Extended market microstructure / on-chain features
    ext = [
        'trade_count', 'buy_volume', 'sell_volume', 'buy_volume_ratio', 'avg_trade_size',
        'funding_rate', 'tx_volume', 'active_addresses',
        'ob_imbalance', 'ob_bid_depth', 'ob_ask_depth'
    ]
    return base + ext


def prepare_data_for_training(df: pd.DataFrame, test_size: float = 0.2) -> tuple:
    """
    Split data into train/test with time-series respect (no random shuffle).
    
    Returns:
        (X_train, X_test, y_train, y_test, scaler)
    """
    feature_cols = get_feature_names()
    feature_cols = [c for c in feature_cols if c in df.columns]
    
    X = df[feature_cols].fillna(0)
    y = df['label']
    
    # Time-series split: no random shuffle
    split_idx = int(len(X) * (1 - test_size))
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    return X_train_scaled, X_test_scaled, y_train.values, y_test.values, scaler


def prepare_data_for_inference(df: pd.DataFrame, scaler: StandardScaler) -> np.ndarray:
    """
    Prepare the latest bar's features for model inference.
    
    Args:
        df: DataFrame with all features (latest row will be used)
        scaler: fitted StandardScaler
    
    Returns:
        Scaled feature array (1D, ready for predict_proba)
    """
    feature_cols = get_feature_names()
    feature_cols = [c for c in feature_cols if c in df.columns]
    
    X = df[feature_cols].iloc[-1:].fillna(0)
    X_scaled = scaler.transform(X)
    return X_scaled
