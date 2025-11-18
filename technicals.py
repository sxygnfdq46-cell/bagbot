"""Extended technical indicators and aggregation utilities.

This module provides additional technical indicators beyond src/indicators.py:
- ROC (Rate of Change) - already in indicators.py but wrapped here
- ATR (Average True Range) - already in indicators.py but wrapped here  
- OBV (On-Balance Volume) - already in indicators.py but wrapped here
- Volatility ratios (Parkinson, Garman-Klass, Yang-Zhang)
- EMA slope (rate of change of EMA)

Also provides utilities for computing all indicators and ensuring proper aggregation.
"""
import numpy as np
import pandas as pd
from typing import Optional, Dict, List

# Handle imports for both module usage and standalone execution
try:
    from src.indicators import roc as ind_roc, atr as ind_atr, obv as ind_obv, ema as ind_ema
except ModuleNotFoundError:
    from indicators import roc as ind_roc, atr as ind_atr, obv as ind_obv, ema as ind_ema


def roc(close: pd.Series, period: int = 12) -> pd.Series:
    """Rate of Change (percentage).
    
    Args:
        close: Close prices
        period: Lookback period
        
    Returns:
        ROC values as percentage
    """
    return ind_roc(close, period=period)


def atr(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> pd.Series:
    """Average True Range.
    
    Args:
        high: High prices
        low: Low prices
        close: Close prices
        period: ATR period
        
    Returns:
        ATR values
    """
    return ind_atr(high, low, close, period=period)


def obv(close: pd.Series, volume: pd.Series) -> pd.Series:
    """On-Balance Volume.
    
    Args:
        close: Close prices
        volume: Volume
        
    Returns:
        OBV cumulative values
    """
    return ind_obv(close, volume)


def parkinson_volatility(high: pd.Series, low: pd.Series, period: int = 20) -> pd.Series:
    """Parkinson volatility estimator (uses high-low range).
    
    More efficient than close-to-close volatility when using OHLC data.
    
    Args:
        high: High prices
        low: Low prices
        period: Rolling window period
        
    Returns:
        Parkinson volatility estimate
    """
    hl_ratio = (high / low).apply(np.log)
    parkinson = np.sqrt((1 / (4 * np.log(2))) * (hl_ratio ** 2))
    return parkinson.rolling(window=period).mean()


def garman_klass_volatility(high: pd.Series, low: pd.Series, close: pd.Series, 
                            open_: pd.Series, period: int = 20) -> pd.Series:
    """Garman-Klass volatility estimator.
    
    Uses OHLC data for more efficient volatility estimation than close-to-close.
    
    Args:
        high: High prices
        low: Low prices
        close: Close prices
        open_: Open prices
        period: Rolling window period
        
    Returns:
        Garman-Klass volatility estimate
    """
    log_hl = (high / low).apply(np.log)
    log_co = (close / open_).apply(np.log)
    
    gk = 0.5 * (log_hl ** 2) - (2 * np.log(2) - 1) * (log_co ** 2)
    return np.sqrt(gk.rolling(window=period).mean())


def yang_zhang_volatility(high: pd.Series, low: pd.Series, close: pd.Series, 
                          open_: pd.Series, period: int = 20) -> pd.Series:
    """Yang-Zhang volatility estimator.
    
    Combines overnight and intraday volatility. Most efficient OHLC volatility estimator.
    
    Args:
        high: High prices
        low: Low prices
        close: Close prices
        open_: Open prices
        period: Rolling window period
        
    Returns:
        Yang-Zhang volatility estimate
    """
    log_ho = (high / open_).apply(np.log)
    log_lo = (low / open_).apply(np.log)
    log_co = (close / open_).apply(np.log)
    
    log_oc = (open_ / close.shift(1)).apply(np.log)
    log_oc_sq = log_oc ** 2
    
    log_cc = (close / close.shift(1)).apply(np.log)
    log_cc_sq = log_cc ** 2
    
    rs = log_ho * (log_ho - log_co) + log_lo * (log_lo - log_co)
    
    # Compute components
    close_vol = log_cc_sq.rolling(window=period).mean()
    open_vol = log_oc_sq.rolling(window=period).mean()
    window_rs = rs.rolling(window=period).mean()
    
    k = 0.34 / (1.34 + (period + 1) / (period - 1))
    yang_zhang = open_vol + k * close_vol + (1 - k) * window_rs
    
    return np.sqrt(yang_zhang)


def ema_slope(close: pd.Series, ema_period: int = 20, slope_period: int = 5) -> pd.Series:
    """EMA slope (rate of change of EMA).
    
    Measures the momentum/trend strength of the EMA itself.
    Positive slope = uptrend, negative = downtrend.
    
    Args:
        close: Close prices
        ema_period: EMA period
        slope_period: Period over which to compute slope (ROC of EMA)
        
    Returns:
        EMA slope (percentage change over slope_period)
    """
    ema_values = ind_ema(close, period=ema_period)
    slope = ((ema_values - ema_values.shift(slope_period)) / ema_values.shift(slope_period)) * 100
    return slope


def volatility_ratio(close: pd.Series, short_period: int = 10, long_period: int = 30) -> pd.Series:
    """Volatility ratio (short-term vol / long-term vol).
    
    Values > 1 indicate increasing volatility (potential breakout).
    Values < 1 indicate decreasing volatility (consolidation).
    
    Args:
        close: Close prices
        short_period: Short-term volatility period
        long_period: Long-term volatility period
        
    Returns:
        Volatility ratio
    """
    short_vol = close.pct_change().rolling(window=short_period).std()
    long_vol = close.pct_change().rolling(window=long_period).std()
    return short_vol / (long_vol + 1e-8)


def add_all_technicals(df: pd.DataFrame, 
                       roc_periods: List[int] = [5, 10, 20],
                       atr_periods: List[int] = [14],
                       ema_periods: List[int] = [10, 20, 50],
                       vol_periods: List[int] = [20],
                       vol_ratio_params: Optional[List[tuple]] = None) -> pd.DataFrame:
    """Add all technical indicators to a DataFrame.
    
    Args:
        df: DataFrame with OHLCV columns (open, high, low, close, volume)
        roc_periods: List of ROC periods to compute
        atr_periods: List of ATR periods to compute
        ema_periods: List of EMA periods for slope calculation
        vol_periods: List of periods for volatility estimators
        vol_ratio_params: List of (short, long) tuples for volatility ratios
        
    Returns:
        DataFrame with all technical indicators added as new columns
    """
    df = df.copy()
    
    # Validate required columns
    required = ['open', 'high', 'low', 'close', 'volume']
    missing = [col for col in required if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")
    
    # ROC indicators
    for period in roc_periods:
        df[f'roc_{period}'] = roc(df['close'], period=period)
    
    # ATR indicators
    for period in atr_periods:
        df[f'atr_{period}'] = atr(df['high'], df['low'], df['close'], period=period)
        # ATR as percentage of close (normalized)
        df[f'atr_{period}_pct'] = (df[f'atr_{period}'] / df['close']) * 100
    
    # OBV
    df['obv'] = obv(df['close'], df['volume'])
    # OBV momentum (ROC of OBV) - clip to prevent inf from zero OBV values
    df['obv_roc_5'] = roc(df['obv'], period=5).clip(-100, 100)
    df['obv_roc_10'] = roc(df['obv'], period=10).clip(-100, 100)
    
    # Volatility estimators
    for period in vol_periods:
        df[f'parkinson_vol_{period}'] = parkinson_volatility(df['high'], df['low'], period=period)
        df[f'garman_klass_vol_{period}'] = garman_klass_volatility(
            df['high'], df['low'], df['close'], df['open'], period=period
        )
        df[f'yang_zhang_vol_{period}'] = yang_zhang_volatility(
            df['high'], df['low'], df['close'], df['open'], period=period
        )
    
    # EMA slopes
    for period in ema_periods:
        df[f'ema_{period}_slope_5'] = ema_slope(df['close'], ema_period=period, slope_period=5)
    
    # Volatility ratios
    if vol_ratio_params is None:
        vol_ratio_params = [(10, 30), (5, 20)]
    
    for short, long in vol_ratio_params:
        df[f'vol_ratio_{short}_{long}'] = volatility_ratio(df['close'], short_period=short, long_period=long)
    
    return df


def aggregate_technicals(df: pd.DataFrame, freq: str = 'W') -> pd.DataFrame:
    """Aggregate technical indicators for resampling (daily -> weekly, etc).
    
    Proper aggregation rules for technical indicators:
    - Price-based: Use last value (EMA, ROC, slopes)
    - Volatility: Use mean or last
    - OBV: Use last (cumulative)
    - ATR: Use mean
    
    Args:
        df: DataFrame with datetime index and technical indicators
        freq: Pandas frequency string ('W' for weekly, 'M' for monthly, etc)
        
    Returns:
        Resampled DataFrame with proper aggregation
    """
    if not isinstance(df.index, pd.DatetimeIndex):
        raise ValueError("DataFrame must have DatetimeIndex for resampling")
    
    agg_dict = {
        'open': 'first',
        'high': 'max',
        'low': 'min',
        'close': 'last',
        'volume': 'sum'
    }
    
    # Identify technical indicator columns
    for col in df.columns:
        if col in agg_dict:
            continue
            
        # ROC: last value (represents change at period end)
        if col.startswith('roc_'):
            agg_dict[col] = 'last'
        
        # ATR: mean (average range over period)
        elif col.startswith('atr_'):
            agg_dict[col] = 'mean'
        
        # OBV: last (cumulative)
        elif col.startswith('obv'):
            agg_dict[col] = 'last'
        
        # Volatility: mean (average volatility)
        elif any(v in col for v in ['vol_', 'volatility']):
            agg_dict[col] = 'mean'
        
        # EMA slope: last
        elif 'slope' in col:
            agg_dict[col] = 'last'
        
        # Default: last value
        else:
            agg_dict[col] = 'last'
    
    return df.resample(freq).agg(agg_dict).dropna()


def get_technical_features_list(roc_periods: List[int] = [5, 10, 20],
                                atr_periods: List[int] = [14],
                                ema_periods: List[int] = [10, 20, 50],
                                vol_periods: List[int] = [20],
                                vol_ratio_params: Optional[List[tuple]] = None) -> List[str]:
    """Get list of technical feature column names that will be created.
    
    Useful for feature selection and validation.
    
    Args:
        roc_periods: List of ROC periods
        atr_periods: List of ATR periods
        ema_periods: List of EMA periods for slope
        vol_periods: List of volatility periods
        vol_ratio_params: List of (short, long) tuples for volatility ratios
        
    Returns:
        List of feature column names
    """
    features = []
    
    # ROC
    for period in roc_periods:
        features.append(f'roc_{period}')
    
    # ATR
    for period in atr_periods:
        features.append(f'atr_{period}')
        features.append(f'atr_{period}_pct')
    
    # OBV
    features.extend(['obv', 'obv_roc_5', 'obv_roc_10'])
    
    # Volatility estimators
    for period in vol_periods:
        features.append(f'parkinson_vol_{period}')
        features.append(f'garman_klass_vol_{period}')
        features.append(f'yang_zhang_vol_{period}')
    
    # EMA slopes
    for period in ema_periods:
        features.append(f'ema_{period}_slope_5')
    
    # Volatility ratios
    if vol_ratio_params is None:
        vol_ratio_params = [(10, 30), (5, 20)]
    
    for short, long in vol_ratio_params:
        features.append(f'vol_ratio_{short}_{long}')
    
    return features


# Unit tests
if __name__ == '__main__':
    import sys
    
    print("Running src/technicals.py unit tests...")
    
    # Generate synthetic OHLCV data
    np.random.seed(42)
    dates = pd.date_range('2023-01-01', periods=100, freq='D')
    
    base_price = 100
    returns = np.random.normal(0.001, 0.02, len(dates))
    close_prices = base_price * np.cumprod(1 + returns)
    
    df = pd.DataFrame({
        'open': close_prices * (1 + np.random.uniform(-0.01, 0.01, len(dates))),
        'high': close_prices * (1 + np.random.uniform(0.005, 0.03, len(dates))),
        'low': close_prices * (1 + np.random.uniform(-0.03, -0.005, len(dates))),
        'close': close_prices,
        'volume': np.random.uniform(1000, 10000, len(dates))
    }, index=dates)
    
    # Ensure high is actually highest
    df['high'] = df[['open', 'close', 'high']].max(axis=1)
    df['low'] = df[['open', 'close', 'low']].min(axis=1)
    
    print("\n1. Testing individual indicators...")
    
    # Test ROC
    roc_12 = roc(df['close'], period=12)
    assert not roc_12.isna().all(), "ROC should have non-NaN values"
    print(f"   ✓ ROC(12): mean={roc_12.mean():.3f}%, std={roc_12.std():.3f}%")
    
    # Test ATR
    atr_14 = atr(df['high'], df['low'], df['close'], period=14)
    assert not atr_14.isna().all(), "ATR should have non-NaN values"
    print(f"   ✓ ATR(14): mean={atr_14.mean():.3f}, std={atr_14.std():.3f}")
    
    # Test OBV
    obv_val = obv(df['close'], df['volume'])
    assert not obv_val.isna().all(), "OBV should have non-NaN values"
    print(f"   ✓ OBV: final={obv_val.iloc[-1]:.0f}")
    
    # Test Parkinson volatility
    park_vol = parkinson_volatility(df['high'], df['low'], period=20)
    assert not park_vol.isna().all(), "Parkinson vol should have non-NaN values"
    print(f"   ✓ Parkinson Vol(20): mean={park_vol.mean():.6f}")
    
    # Test Garman-Klass volatility
    gk_vol = garman_klass_volatility(df['high'], df['low'], df['close'], df['open'], period=20)
    assert not gk_vol.isna().all(), "GK vol should have non-NaN values"
    print(f"   ✓ Garman-Klass Vol(20): mean={gk_vol.mean():.6f}")
    
    # Test Yang-Zhang volatility
    yz_vol = yang_zhang_volatility(df['high'], df['low'], df['close'], df['open'], period=20)
    assert not yz_vol.isna().all(), "YZ vol should have non-NaN values"
    print(f"   ✓ Yang-Zhang Vol(20): mean={yz_vol.mean():.6f}")
    
    # Test EMA slope
    ema_sl = ema_slope(df['close'], ema_period=20, slope_period=5)
    assert not ema_sl.isna().all(), "EMA slope should have non-NaN values"
    print(f"   ✓ EMA(20) Slope: mean={ema_sl.mean():.3f}%, std={ema_sl.std():.3f}%")
    
    # Test volatility ratio
    vol_rat = volatility_ratio(df['close'], short_period=10, long_period=30)
    assert not vol_rat.isna().all(), "Vol ratio should have non-NaN values"
    print(f"   ✓ Vol Ratio(10/30): mean={vol_rat.mean():.3f}, std={vol_rat.std():.3f}")
    
    print("\n2. Testing add_all_technicals()...")
    df_with_tech = add_all_technicals(df)
    
    expected_features = get_technical_features_list()
    missing = [f for f in expected_features if f not in df_with_tech.columns]
    assert len(missing) == 0, f"Missing features: {missing}"
    print(f"   ✓ Added {len(expected_features)} technical features")
    print(f"   ✓ Total columns: {len(df_with_tech.columns)}")
    
    # Check for NaN ratio
    nan_ratio = df_with_tech.isna().sum().sum() / (df_with_tech.shape[0] * df_with_tech.shape[1])
    print(f"   ✓ NaN ratio: {nan_ratio*100:.2f}% (expected due to lookback periods)")
    
    print("\n3. Testing aggregate_technicals()...")
    df_weekly = aggregate_technicals(df_with_tech, freq='W')
    assert len(df_weekly) > 0, "Weekly aggregation should produce data"
    assert len(df_weekly) < len(df), "Weekly data should be shorter than daily"
    print(f"   ✓ Daily: {len(df)} rows -> Weekly: {len(df_weekly)} rows")
    print(f"   ✓ Preserved columns: {len(df_weekly.columns)}")
    
    # Verify OHLCV aggregation
    assert (df_weekly['high'] >= df_weekly['close']).all(), "High should be >= close"
    assert (df_weekly['low'] <= df_weekly['close']).all(), "Low should be <= close"
    print(f"   ✓ OHLCV relationships preserved")
    
    print("\n4. Testing get_technical_features_list()...")
    feature_list = get_technical_features_list()
    print(f"   ✓ Generated {len(feature_list)} feature names")
    print(f"   Features: {', '.join(feature_list[:5])}...")
    
    print("\n5. Edge case testing...")
    
    # Test with minimal data
    df_small = df.head(25).copy()
    try:
        df_small_tech = add_all_technicals(df_small)
        print(f"   ✓ Works with small dataset ({len(df_small)} rows)")
    except Exception as e:
        print(f"   ✗ Failed with small dataset: {e}")
        sys.exit(1)
    
    # Test missing columns error
    try:
        bad_df = df[['close', 'volume']].copy()
        add_all_technicals(bad_df)
        print(f"   ✗ Should have raised error for missing columns")
        sys.exit(1)
    except ValueError as e:
        print(f"   ✓ Properly validates required columns")
    
    print("\n✅ All tests passed!")
    print(f"\nSummary:")
    print(f"  - ROC periods: 3 (5, 10, 20)")
    print(f"  - ATR periods: 1 (14) + normalized version")
    print(f"  - OBV: 1 base + 2 momentum (5, 10)")
    print(f"  - Volatility estimators: 3 types x 1 period (Parkinson, GK, YZ)")
    print(f"  - EMA slopes: 3 periods (10, 20, 50)")
    print(f"  - Volatility ratios: 2 (10/30, 5/20)")
    print(f"  - Total features: {len(feature_list)}")
