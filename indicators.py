"""Technical indicators for trading signals and feature engineering.
Optimized for crypto 5m candles.
"""
import numpy as np
import pandas as pd


def sma(prices: pd.Series, period: int) -> pd.Series:
    """Simple Moving Average."""
    return prices.rolling(window=period).mean()


def ema(prices: pd.Series, period: int) -> pd.Series:
    """Exponential Moving Average."""
    return prices.ewm(span=period, adjust=False).mean()


def rsi(prices: pd.Series, period: int = 14) -> pd.Series:
    """Relative Strength Index (0-100)."""
    delta = prices.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi


def macd(prices: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> tuple:
    """MACD line, signal line, and histogram.
    Returns: (macd_line, signal_line, histogram)
    """
    ema_fast = ema(prices, fast)
    ema_slow = ema(prices, slow)
    macd_line = ema_fast - ema_slow
    signal_line = ema(macd_line, signal)
    histogram = macd_line - signal_line
    return macd_line, signal_line, histogram


def atr(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> pd.Series:
    """Average True Range."""
    tr1 = high - low
    tr2 = abs(high - close.shift(1))
    tr3 = abs(low - close.shift(1))
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    atr = tr.rolling(window=period).mean()
    return atr


def bollinger_bands(prices: pd.Series, period: int = 20, num_std: float = 2.0) -> tuple:
    """Bollinger Bands (upper, middle, lower).
    Returns: (upper, middle, lower)
    """
    middle = sma(prices, period)
    std = prices.rolling(window=period).std()
    upper = middle + (num_std * std)
    lower = middle - (num_std * std)
    return upper, middle, lower


def roc(prices: pd.Series, period: int = 12) -> pd.Series:
    """Rate of Change (percentage)."""
    return ((prices - prices.shift(period)) / prices.shift(period)) * 100


def obv(close: pd.Series, volume: pd.Series) -> pd.Series:
    """On-Balance Volume."""
    obv = (np.sign(close.diff()) * volume).fillna(0).cumsum()
    return obv


def adx(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> pd.Series:
    """Average Directional Index (trend strength, 0-100)."""
    # Simplified ADX calculation
    plus_dm = high.diff()
    minus_dm = -low.diff()
    
    plus_dm = plus_dm.where((plus_dm > 0) & (plus_dm > minus_dm), 0)
    minus_dm = minus_dm.where((minus_dm > 0) & (minus_dm > plus_dm), 0)
    
    tr1 = high - low
    tr2 = abs(high - close.shift(1))
    tr3 = abs(low - close.shift(1))
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    
    atr = tr.rolling(window=period).mean()
    plus_di = 100 * (plus_dm.rolling(window=period).mean() / atr)
    minus_di = 100 * (minus_dm.rolling(window=period).mean() / atr)
    
    di_diff = abs(plus_di - minus_di)
    di_sum = plus_di + minus_di
    di_diff_smoothed = di_diff.rolling(window=period).mean()
    adx = 100 * (di_diff_smoothed / di_sum)
    return adx


def stochastic(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14, smooth_k: int = 3) -> tuple:
    """Stochastic Oscillator.
    Returns: (k_line, d_line)
    """
    lowest_low = low.rolling(window=period).min()
    highest_high = high.rolling(window=period).max()
    k_line = 100 * ((close - lowest_low) / (highest_high - lowest_low))
    d_line = k_line.rolling(window=smooth_k).mean()
    return k_line, d_line


def vpt(close: pd.Series, volume: pd.Series) -> pd.Series:
    """Volume Price Trend."""
    roc_val = roc(close, period=1)
    vpt = (roc_val / 100 * volume).fillna(0).cumsum()
    return vpt


def kama(prices: pd.Series, period: int = 10, fast: int = 2, slow: int = 30) -> pd.Series:
    """Kaufman's Adaptive Moving Average (KAMA)."""
    change = prices.diff(period)
    volatility = prices.diff().abs().rolling(window=period).sum()
    er = change.abs() / (volatility + 1e-8)
    fast_sc = 2.0 / (fast + 1)
    slow_sc = 2.0 / (slow + 1)
    sc = (er * (fast_sc - slow_sc) + slow_sc) ** 2
    kama = prices.copy() * 0.0
    kama.iloc[0] = prices.iloc[0]
    for i in range(1, len(prices)):  # iterative because SC depends on prior value
        kama.iloc[i] = kama.iloc[i - 1] + sc.iloc[i] * (prices.iloc[i] - kama.iloc[i - 1])
    return kama


def cci(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 20) -> pd.Series:
    """Commodity Channel Index."""
    tp = (high + low + close) / 3.0
    ma = tp.rolling(period).mean()
    md = tp.rolling(period).apply(lambda x: np.mean(np.abs(x - x.mean())), raw=True)
    cci = (tp - ma) / (0.015 * (md + 1e-8))
    return cci


def williams_r(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> pd.Series:
    """Williams %R oscillator (-100 to 0)."""
    highest = high.rolling(period).max()
    lowest = low.rolling(period).min()
    wr = -100 * (highest - close) / (highest - lowest + 1e-8)
    return wr


def _wma(series: pd.Series, period: int) -> pd.Series:
    weights = np.arange(1, period + 1)
    def calc(x):
        return np.dot(x, weights) / weights.sum()
    return series.rolling(period).apply(calc, raw=True)


def hma(prices: pd.Series, period: int = 16) -> pd.Series:
    """Hull Moving Average."""
    half = int(period / 2)
    sqrt_n = int(np.sqrt(period))
    wma1 = _wma(prices, half)
    wma2 = _wma(prices, period)
    raw_hma = 2 * wma1 - wma2
    hma_series = _wma(raw_hma, sqrt_n)
    return hma_series


def vwap(df: pd.DataFrame, period: int = None) -> pd.Series:
    """Volume Weighted Average Price. If period is None returns cumulative VWAP."""
    tp = (df['high'] + df['low'] + df['close']) / 3.0
    pv = tp * df['volume']
    if period is None:
        return pv.cumsum() / (df['volume'].cumsum() + 1e-8)
    else:
        pv_roll = pv.rolling(window=period).sum()
        vol_roll = df['volume'].rolling(window=period).sum()
        return pv_roll / (vol_roll + 1e-8)


def fisher_transform(prices: pd.Series, period: int = 10) -> pd.Series:
    """Fisher Transform of price series."""
    max_h = prices.rolling(period).max()
    min_l = prices.rolling(period).min()
    x = 0.33 * 2 * ((prices - min_l) / (max_h - min_l + 1e-8) - 0.5) + 0.67 * 0
    # iterative transform
    ft = pd.Series(index=prices.index, dtype=float)
    prev = 0.0
    for i in range(len(prices)):
        xi = x.iloc[i]
        if np.isnan(xi):
            ft.iloc[i] = np.nan
            continue
        val = 0.5 * np.log((1 + xi) / (1 - xi + 1e-8) + 1e-8)
        ft.iloc[i] = val + 0.5 * prev
        prev = ft.iloc[i]
    return ft


def ema_volume(volume: pd.Series, period: int = 20) -> pd.Series:
    """EMA of volume to detect surges."""
    return volume.ewm(span=period, adjust=False).mean()


def supertrend(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 10, multiplier: float = 3.0) -> pd.Series:
    """SuperTrend indicator returning SuperTrend band. True/False trend can be derived externally.

    This returns the SuperTrend value (the band). Use comparisons with close to infer trend.
    """
    atrv = atr(high, low, close, period)
    hl2 = (high + low) / 2.0
    upperband = hl2 + multiplier * atrv
    lowerband = hl2 - multiplier * atrv

    final_upper = upperband.copy()
    final_lower = lowerband.copy()
    supertrend = pd.Series(index=close.index, dtype=float)
    trend = True  # True = uptrend, False = downtrend

    for i in range(len(close)):
        if i == 0:
            final_upper.iloc[i] = upperband.iloc[i]
            final_lower.iloc[i] = lowerband.iloc[i]
            supertrend.iloc[i] = final_upper.iloc[i]
            continue

        if upperband.iloc[i] < final_upper.iloc[i - 1] or close.iloc[i - 1] > final_upper.iloc[i - 1]:
            final_upper.iloc[i] = upperband.iloc[i]
        else:
            final_upper.iloc[i] = final_upper.iloc[i - 1]

        if lowerband.iloc[i] > final_lower.iloc[i - 1] or close.iloc[i - 1] < final_lower.iloc[i - 1]:
            final_lower.iloc[i] = lowerband.iloc[i]
        else:
            final_lower.iloc[i] = final_lower.iloc[i - 1]

        # determine trend
        if supertrend.iloc[i - 1] == final_upper.iloc[i - 1]:
            if close.iloc[i] <= final_upper.iloc[i]:
                supertrend.iloc[i] = final_upper.iloc[i]
            else:
                supertrend.iloc[i] = final_lower.iloc[i]
        else:
            if close.iloc[i] >= final_lower.iloc[i]:
                supertrend.iloc[i] = final_lower.iloc[i]
            else:
                supertrend.iloc[i] = final_upper.iloc[i]

    return supertrend
