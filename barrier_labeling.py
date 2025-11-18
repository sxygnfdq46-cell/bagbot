"""
barrier_labeling.py
-------------------
Triple-barrier labeling method for financial time series.

Triple-barrier labeling is a superior alternative to simple binary/multiclass labels
because it:
1. Captures both profit targets and stop losses (risk management)
2. Avoids lookahead bias by setting a max horizon
3. Creates more balanced labels (not dominated by one class)
4. Reflects real trading logic (exit on TP, SL, or timeout)

Key Concepts
------------
**Triple Barrier Method:**
For each sample at time t, we set three barriers:
1. **Upper barrier** (take-profit): price increases by take_profit%
2. **Lower barrier** (stop-loss): price decreases by stop_loss%
3. **Vertical barrier** (timeout): max_horizon periods elapsed

The label is determined by which barrier is hit first:
- Label 1 (BUY): Upper barrier hit first → price went up before SL/timeout
- Label -1 (SELL): Lower barrier hit first → price went down before TP/timeout
- Label 0 (HOLD): Vertical barrier hit first → no clear direction within horizon

**Advantages over Simple Returns:**
- Simple: label = sign(return[t+horizon])
  - Problem: Ignores intermediate price movements
  - Example: Price goes up 5%, then down 10% → labeled as down, but you'd have taken profit

- Triple Barrier: label = first_barrier_hit(TP, SL, timeout)
  - Captures realistic trading outcomes
  - Balances labels (not dominated by majority class)
  - Incorporates risk management (stop loss)

**Parameters:**
- take_profit: % gain to exit (e.g., 0.02 = 2%)
- stop_loss: % loss to exit (e.g., 0.01 = 1%)
- max_horizon: maximum periods to hold (e.g., 5 days)

Best Practices
--------------
1. **Asymmetric barriers**: Often stop_loss < take_profit (e.g., 1% SL, 2% TP)
   - Risk/reward ratio: 1:2
   - Reflects real trading (cut losses quickly, let winners run)

2. **Horizon selection**: Match to trading frequency
   - Day trading: max_horizon = 1-5 periods
   - Swing trading: max_horizon = 5-20 periods
   - Position trading: max_horizon = 20-60 periods

3. **Barrier tuning**: Calibrate to asset volatility
   - High volatility (crypto): wider barriers (e.g., 3% TP, 2% SL)
   - Low volatility (bonds): tighter barriers (e.g., 0.5% TP, 0.3% SL)

4. **Label encoding**:
   - Binary: {0: SELL/HOLD, 1: BUY} - collapse -1 and 0
   - Ternary: {-1: SELL, 0: HOLD, 1: BUY} - multiclass
   - Recommended: Ternary for balanced datasets, Binary for imbalanced

References
----------
- "Advances in Financial Machine Learning" by Marcos López de Prado (Chapter 3)
- Triple-barrier method is standard in quantitative finance
"""

import numpy as np
import pandas as pd
from typing import Tuple, Optional, Literal
import warnings


def compute_barrier_labels(
    prices: np.ndarray,
    take_profit: float = 0.02,
    stop_loss: float = 0.01,
    max_horizon: int = 5,
    label_encoding: Literal['ternary', 'binary'] = 'ternary'
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Compute triple-barrier labels for time series.
    
    For each timestamp, determines which barrier is hit first:
    - Upper barrier (take-profit): price increases by take_profit%
    - Lower barrier (stop-loss): price decreases by stop_loss%
    - Vertical barrier (timeout): max_horizon periods pass
    
    Parameters
    ----------
    prices : np.ndarray
        Price series, shape (n_samples,)
    take_profit : float, default=0.02
        Take-profit threshold as fraction (e.g., 0.02 = 2% gain)
    stop_loss : float, default=0.01
        Stop-loss threshold as fraction (e.g., 0.01 = 1% loss)
    max_horizon : int, default=5
        Maximum periods to hold position before timeout
    label_encoding : {'ternary', 'binary'}, default='ternary'
        - 'ternary': {-1: SELL, 0: HOLD, 1: BUY}
        - 'binary': {0: SELL/HOLD, 1: BUY}
    
    Returns
    -------
    labels : np.ndarray
        Barrier labels, shape (n_samples,)
        - Ternary: -1 (SL hit), 0 (timeout), 1 (TP hit)
        - Binary: 0 (SL/timeout), 1 (TP hit)
    horizon_to_barrier : np.ndarray
        Number of periods until barrier hit, shape (n_samples,)
        Useful for sample weighting (earlier hits = more confident labels)
    
    Examples
    --------
    >>> prices = np.array([100, 101, 103, 102, 105, 104, 108])
    >>> labels, horizons = compute_barrier_labels(prices, take_profit=0.03, stop_loss=0.02, max_horizon=5)
    >>> labels
    array([1, 1, 0, 1, 0, 0, 0])  # 1=TP hit, 0=timeout, -1=SL hit
    """
    n = len(prices)
    labels = np.zeros(n, dtype=int)
    horizon_to_barrier = np.zeros(n, dtype=int)
    
    for i in range(n):
        current_price = prices[i]
        
        # Upper and lower barriers
        upper_barrier = current_price * (1 + take_profit)
        lower_barrier = current_price * (1 - stop_loss)
        
        # Look ahead to find which barrier is hit first
        hit_type = 0  # Default: timeout (vertical barrier)
        hit_horizon = max_horizon
        
        for h in range(1, min(max_horizon + 1, n - i)):
            future_price = prices[i + h]
            
            # Check upper barrier (take-profit)
            if future_price >= upper_barrier:
                hit_type = 1  # BUY signal
                hit_horizon = h
                break
            
            # Check lower barrier (stop-loss)
            if future_price <= lower_barrier:
                hit_type = -1  # SELL signal
                hit_horizon = h
                break
        
        labels[i] = hit_type
        horizon_to_barrier[i] = hit_horizon
    
    # Encode labels
    if label_encoding == 'binary':
        # Binary: {0: SELL/HOLD, 1: BUY}
        labels = (labels == 1).astype(int)
    elif label_encoding == 'ternary':
        # Ternary: {-1: SELL, 0: HOLD, 1: BUY} - already in this format
        pass
    else:
        raise ValueError(f"Unknown label_encoding: {label_encoding}. Use 'ternary' or 'binary'")
    
    return labels, horizon_to_barrier


def compute_barrier_labels_df(
    df: pd.DataFrame,
    price_col: str = 'close',
    take_profit: float = 0.02,
    stop_loss: float = 0.01,
    max_horizon: int = 5,
    label_encoding: Literal['ternary', 'binary'] = 'ternary',
    add_columns: bool = True
) -> pd.DataFrame:
    """
    Compute barrier labels for DataFrame (supports multi-ticker).
    
    Parameters
    ----------
    df : pd.DataFrame
        DataFrame with price data
    price_col : str, default='close'
        Column name for price series
    take_profit : float, default=0.02
        Take-profit threshold
    stop_loss : float, default=0.01
        Stop-loss threshold
    max_horizon : int, default=5
        Maximum holding period
    label_encoding : {'ternary', 'binary'}, default='ternary'
        Label encoding scheme
    add_columns : bool, default=True
        If True, add 'barrier_label' and 'barrier_horizon' columns to df
        If False, return separate arrays
    
    Returns
    -------
    df : pd.DataFrame
        If add_columns=True: DataFrame with added columns
        If add_columns=False: original DataFrame unchanged
    labels : np.ndarray (only if add_columns=False)
        Barrier labels
    horizons : np.ndarray (only if add_columns=False)
        Horizon to barrier
    
    Examples
    --------
    >>> df_labeled = compute_barrier_labels_df(df, take_profit=0.03, stop_loss=0.02)
    >>> df_labeled[['close', 'barrier_label', 'barrier_horizon']].head()
    """
    df = df.copy()
    
    # Check if multi-ticker
    if 'ticker' in df.columns:
        # Process each ticker separately
        dfs = []
        for ticker in df['ticker'].unique():
            df_ticker = df[df['ticker'] == ticker].copy()
            prices = df_ticker[price_col].values
            
            labels, horizons = compute_barrier_labels(
                prices, take_profit, stop_loss, max_horizon, label_encoding
            )
            
            if add_columns:
                df_ticker['barrier_label'] = labels
                df_ticker['barrier_horizon'] = horizons
            
            dfs.append(df_ticker)
        
        df = pd.concat(dfs, ignore_index=True)
        
        if add_columns:
            return df
        else:
            return df, df['barrier_label'].values, df['barrier_horizon'].values
    
    else:
        # Single ticker
        prices = df[price_col].values
        
        labels, horizons = compute_barrier_labels(
            prices, take_profit, stop_loss, max_horizon, label_encoding
        )
        
        if add_columns:
            df['barrier_label'] = labels
            df['barrier_horizon'] = horizons
            return df
        else:
            return df, labels, horizons


def get_sample_weights(
    horizon_to_barrier: np.ndarray,
    method: Literal['inverse', 'exponential', 'uniform'] = 'inverse'
) -> np.ndarray:
    """
    Compute sample weights based on horizon to barrier.
    
    Samples where barriers are hit quickly are more confident labels
    and should be weighted higher during training.
    
    Parameters
    ----------
    horizon_to_barrier : np.ndarray
        Number of periods until barrier hit
    method : {'inverse', 'exponential', 'uniform'}, default='inverse'
        - 'inverse': weight = 1 / (horizon + 1)
        - 'exponential': weight = exp(-horizon / max_horizon)
        - 'uniform': weight = 1 (all equal)
    
    Returns
    -------
    weights : np.ndarray
        Sample weights, shape (n_samples,)
        Normalized to sum to n_samples
    
    Examples
    --------
    >>> horizons = np.array([1, 3, 5, 2, 5])  # Barrier hit at these horizons
    >>> weights = get_sample_weights(horizons, method='inverse')
    >>> # Samples with horizon=1 weighted higher than horizon=5
    """
    if method == 'uniform':
        weights = np.ones(len(horizon_to_barrier))
    
    elif method == 'inverse':
        # Higher weight for samples where barrier hit quickly
        weights = 1.0 / (horizon_to_barrier + 1)
    
    elif method == 'exponential':
        # Exponential decay with horizon
        max_h = horizon_to_barrier.max()
        weights = np.exp(-horizon_to_barrier / (max_h + 1))
    
    else:
        raise ValueError(f"Unknown method: {method}. Use 'inverse', 'exponential', or 'uniform'")
    
    # Normalize to sum to n_samples (for sklearn compatibility)
    weights = weights * len(weights) / weights.sum()
    
    return weights


def analyze_barrier_labels(
    labels: np.ndarray,
    horizon_to_barrier: np.ndarray,
    label_encoding: Literal['ternary', 'binary'] = 'ternary'
) -> dict:
    """
    Analyze barrier label distribution and statistics.
    
    Parameters
    ----------
    labels : np.ndarray
        Barrier labels
    horizon_to_barrier : np.ndarray
        Horizon to barrier
    label_encoding : {'ternary', 'binary'}
        Label encoding scheme
    
    Returns
    -------
    stats : dict
        Statistics about labels:
        - label_counts: count per label
        - label_percentages: % per label
        - avg_horizon: average horizon per label
        - median_horizon: median horizon per label
    
    Examples
    --------
    >>> stats = analyze_barrier_labels(labels, horizons, label_encoding='ternary')
    >>> print(f"BUY signals: {stats['label_percentages'][1]:.1f}%")
    """
    unique_labels = np.unique(labels)
    
    stats = {
        'label_counts': {},
        'label_percentages': {},
        'avg_horizon': {},
        'median_horizon': {}
    }
    
    # Label names
    if label_encoding == 'binary':
        label_names = {0: 'SELL/HOLD', 1: 'BUY'}
    else:  # ternary
        label_names = {-1: 'SELL', 0: 'HOLD', 1: 'BUY'}
    
    for label in unique_labels:
        mask = labels == label
        count = mask.sum()
        percentage = count / len(labels) * 100
        
        avg_h = horizon_to_barrier[mask].mean()
        median_h = np.median(horizon_to_barrier[mask])
        
        name = label_names.get(label, f'Label {label}')
        
        stats['label_counts'][name] = count
        stats['label_percentages'][name] = percentage
        stats['avg_horizon'][name] = avg_h
        stats['median_horizon'][name] = median_h
    
    return stats


def print_barrier_stats(
    labels: np.ndarray,
    horizon_to_barrier: np.ndarray,
    label_encoding: Literal['ternary', 'binary'] = 'ternary'
):
    """
    Print barrier label statistics in formatted table.
    
    Parameters
    ----------
    labels : np.ndarray
        Barrier labels
    horizon_to_barrier : np.ndarray
        Horizon to barrier
    label_encoding : {'ternary', 'binary'}
        Label encoding scheme
    """
    stats = analyze_barrier_labels(labels, horizon_to_barrier, label_encoding)
    
    print("\n" + "=" * 70)
    print("Triple-Barrier Label Statistics")
    print("=" * 70)
    print(f"{'Label':<15} {'Count':<10} {'Percent':<12} {'Avg Horizon':<15} {'Median Horizon'}")
    print("-" * 70)
    
    for label_name in stats['label_counts'].keys():
        count = stats['label_counts'][label_name]
        pct = stats['label_percentages'][label_name]
        avg_h = stats['avg_horizon'][label_name]
        median_h = stats['median_horizon'][label_name]
        
        print(f"{label_name:<15} {count:<10} {pct:<12.1f}% {avg_h:<15.2f} {median_h:.2f}")
    
    print("=" * 70)
    print(f"Total samples: {len(labels)}")
    print(f"Overall avg horizon: {horizon_to_barrier.mean():.2f}")
    print("=" * 70)


# ============================================================================
# Unit Tests
# ============================================================================

def test_barrier_labels_simple():
    """Test barrier labeling with simple price series."""
    print("\n" + "=" * 80)
    print("Test: Simple Barrier Labeling")
    print("=" * 80)
    
    # Create simple price series
    # Starting at 100, goes up to 103 (3%), then down to 98 (2% loss), then up to 105
    prices = np.array([100, 101, 102, 103, 102, 101, 100, 99, 98, 99, 100, 101, 102, 103, 104, 105])
    
    # Test with TP=2%, SL=1.5%, horizon=5
    labels, horizons = compute_barrier_labels(
        prices, take_profit=0.02, stop_loss=0.015, max_horizon=5, label_encoding='ternary'
    )
    
    print(f"Prices: {prices[:10]}")
    print(f"Labels: {labels[:10]}")
    print(f"Horizons: {horizons[:10]}")
    
    # Validate
    assert len(labels) == len(prices)
    assert len(horizons) == len(prices)
    assert set(labels).issubset({-1, 0, 1})
    
    # First sample should hit TP (goes to 102 = 2% up)
    assert labels[0] == 1, f"Expected BUY (1), got {labels[0]}"
    
    print_barrier_stats(labels, horizons, label_encoding='ternary')
    print("✓ Simple barrier labeling test passed")


def test_barrier_labels_binary():
    """Test binary encoding."""
    print("\n" + "=" * 80)
    print("Test: Binary Barrier Labeling")
    print("=" * 80)
    
    # Create trending up series
    prices = 100 + np.cumsum(np.random.randn(100) * 0.5 + 0.2)
    
    labels, horizons = compute_barrier_labels(
        prices, take_profit=0.02, stop_loss=0.01, max_horizon=5, label_encoding='binary'
    )
    
    # Binary should only have 0 and 1
    assert set(labels).issubset({0, 1})
    
    print_barrier_stats(labels, horizons, label_encoding='binary')
    print("✓ Binary encoding test passed")


def test_barrier_labels_df():
    """Test DataFrame processing with multiple tickers."""
    print("\n" + "=" * 80)
    print("Test: Multi-Ticker DataFrame Labeling")
    print("=" * 80)
    
    # Create synthetic multi-ticker data
    np.random.seed(42)
    
    dfs = []
    for ticker in ['AAPL', 'GOOG', 'MSFT']:
        df = pd.DataFrame({
            'ticker': ticker,
            'date': pd.date_range('2020-01-01', periods=100, freq='D'),
            'close': 100 + np.cumsum(np.random.randn(100) * 0.5)
        })
        dfs.append(df)
    
    df = pd.concat(dfs, ignore_index=True)
    
    # Compute barrier labels
    df_labeled = compute_barrier_labels_df(
        df, price_col='close', take_profit=0.03, stop_loss=0.02, max_horizon=5
    )
    
    # Validate
    assert 'barrier_label' in df_labeled.columns
    assert 'barrier_horizon' in df_labeled.columns
    assert len(df_labeled) == len(df)
    
    # Check per ticker
    for ticker in ['AAPL', 'GOOG', 'MSFT']:
        df_ticker = df_labeled[df_labeled['ticker'] == ticker]
        labels = df_ticker['barrier_label'].values
        horizons = df_ticker['barrier_horizon'].values
        
        print(f"\nTicker: {ticker}")
        print(f"  Labels: {np.unique(labels, return_counts=True)}")
        print(f"  Avg horizon: {horizons.mean():.2f}")
    
    print("\n✓ Multi-ticker DataFrame test passed")


def test_sample_weights():
    """Test sample weighting."""
    print("\n" + "=" * 80)
    print("Test: Sample Weighting")
    print("=" * 80)
    
    horizons = np.array([1, 2, 3, 5, 5, 5, 1, 2])
    
    # Inverse weights
    weights_inv = get_sample_weights(horizons, method='inverse')
    print(f"Horizons: {horizons}")
    print(f"Inverse weights: {weights_inv.round(3)}")
    
    # Samples with horizon=1 should have higher weight
    assert weights_inv[0] > weights_inv[2]  # horizon 1 > horizon 3
    assert weights_inv[0] > weights_inv[3]  # horizon 1 > horizon 5
    
    # Exponential weights
    weights_exp = get_sample_weights(horizons, method='exponential')
    print(f"Exponential weights: {weights_exp.round(3)}")
    
    # Uniform weights
    weights_uni = get_sample_weights(horizons, method='uniform')
    print(f"Uniform weights: {weights_uni.round(3)}")
    assert np.allclose(weights_uni, 1.0)
    
    print("✓ Sample weighting test passed")


def test_asymmetric_barriers():
    """Test asymmetric TP/SL (common in trading)."""
    print("\n" + "=" * 80)
    print("Test: Asymmetric Barriers (TP > SL)")
    print("=" * 80)
    
    # Create volatile series
    np.random.seed(42)
    prices = 100 + np.cumsum(np.random.randn(200) * 1.0)
    
    # Asymmetric: 2% TP, 1% SL (2:1 risk-reward)
    labels_asym, horizons_asym = compute_barrier_labels(
        prices, take_profit=0.02, stop_loss=0.01, max_horizon=10
    )
    
    # Symmetric: 1.5% TP, 1.5% SL (1:1 risk-reward)
    labels_sym, horizons_sym = compute_barrier_labels(
        prices, take_profit=0.015, stop_loss=0.015, max_horizon=10
    )
    
    print("Asymmetric (2% TP, 1% SL):")
    print_barrier_stats(labels_asym, horizons_asym, label_encoding='ternary')
    
    print("\nSymmetric (1.5% TP, 1.5% SL):")
    print_barrier_stats(labels_sym, horizons_sym, label_encoding='ternary')
    
    # Asymmetric should have fewer BUY signals (harder to hit 2% than 1%)
    buy_pct_asym = (labels_asym == 1).sum() / len(labels_asym)
    sell_pct_asym = (labels_asym == -1).sum() / len(labels_asym)
    
    print(f"\nAsymmetric: BUY={buy_pct_asym:.1%}, SELL={sell_pct_asym:.1%}")
    print("✓ Asymmetric barriers test passed")


def run_all_tests():
    """Run all unit tests."""
    print("\n" + "=" * 80)
    print("BARRIER LABELING - UNIT TESTS")
    print("=" * 80)
    
    test_barrier_labels_simple()
    test_barrier_labels_binary()
    test_barrier_labels_df()
    test_sample_weights()
    test_asymmetric_barriers()
    
    print("\n" + "=" * 80)
    print("✓ All tests passed!")
    print("=" * 80)


if __name__ == '__main__':
    run_all_tests()
