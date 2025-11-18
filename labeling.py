"""
labeling.py
-----------
Advanced label generation for time-series prediction with noise reduction.

Key Concepts
------------
**Why smoothing reduces label noise:**

1. **Single-day returns are noisy**: Next-day price changes contain:
   - Microstructure noise (bid-ask bounce, order flow imbalance)
   - Intraday volatility (news, earnings surprises)
   - Mean-reverting components (short-term overreaction)
   
2. **Forward-looking smoothing averages out noise**:
   - Mean/median of next N days filters transient shocks
   - Captures underlying trend direction over prediction horizon
   - Reduces overfitting to random daily fluctuations
   
3. **Example**:
   Day 0: close = 100
   Day 1: 101 (+1%) [temporary spike]
   Day 2: 99 (-2%)  [reversion]
   Day 3: 102 (+3%) [trend continuation]
   
   Single-day label (horizon=1): +1% (misleading - reverses next day)
   Smoothed label (window=3): mean(+1%, -2%, +3%) = +0.67% (captures net trend)

4. **Benefits**:
   - More stable labels → better generalization
   - Aligns prediction horizon with trading strategy holding period
   - Reduces sensitivity to outlier days

Functions
---------
- create_smoothed_labels: Generate smoothed regression or classification targets
- create_triple_barrier_labels: Advanced labeling with profit-taking and stop-loss
- create_quantile_labels: Adaptive binning based on return distribution
"""

import numpy as np
import pandas as pd
import warnings
from typing import Tuple, Union, Literal


def create_smoothed_labels(
    df: pd.DataFrame,
    forward_window: int = 3,
    smoothing_window: int = 1,
    target: Literal['return', 'log_return', 'price'] = 'return',
    price_col: str = 'close',
    agg_method: Literal['mean', 'median'] = 'mean',
    output_type: Literal['regression', 'binary', 'quantile'] = 'regression',
    threshold: float = 0.0,
    n_quantiles: int = 3,
    quantile_method: Literal['global', 'per_ticker'] = 'global',
    drop_na: bool = True
) -> pd.DataFrame:
    """
    Create smoothed labels by averaging forward returns over a window.
    
    Reduces label noise by computing forward-looking target over multiple days
    instead of single-day prediction. This filters out microstructure noise,
    mean-reverting fluctuations, and transient shocks.
    
    NEW: Supports smoothing forward returns over N days and quantile-based bins
    instead of fixed thresholds for improved accuracy and adaptiveness.
    
    Parameters
    ----------
    df : pd.DataFrame
        Multi-ticker DataFrame with columns: ticker, date, close (+ others)
        Must be sorted by ticker and date
    forward_window : int, default=3
        Number of forward days to look ahead (prediction horizon)
        Typical values: 1 (noisy), 3 (short-term), 5 (medium), 10 (long-term)
    smoothing_window : int, default=1
        Number of days to smooth forward returns over (reduces noise)
        - 1: No smoothing, use single forward day return
        - 3: Average returns over next 3 days
        - 5: Average returns over next 5 days (more stable)
        Must be <= forward_window
    target : {'return', 'log_return', 'price'}, default='return'
        - 'return': Simple return (p[t+h] - p[t]) / p[t]
        - 'log_return': Log return ln(p[t+h] / p[t])
        - 'price': Raw price change p[t+h] - p[t]
    price_col : str, default='close'
        Price column to use for computing returns
    agg_method : {'mean', 'median'}, default='mean'
        Aggregation over smoothing window
        - 'mean': Arithmetic average (sensitive to outliers)
        - 'median': Robust to outliers, better for skewed distributions
    output_type : {'regression', 'binary', 'quantile'}, default='regression'
        - 'regression': Continuous target (smoothed return)
        - 'binary': Binary classification (above/below threshold)
        - 'quantile': Multi-class via QUANTILE binning (adaptive, no fixed threshold)
    threshold : float, default=0.0
        Threshold for binary classification (return > threshold → 1)
        Only used if output_type='binary'
    n_quantiles : int, default=3
        Number of quantile bins for 'quantile' output
        E.g., 3 → terciles (bottom 33%, middle 33%, top 33%)
        5 → quintiles (each 20%)
    quantile_method : {'global', 'per_ticker'}, default='global'
        How to compute quantiles:
        - 'global': Use all tickers combined (better for cross-ticker models)
        - 'per_ticker': Compute per-ticker quantiles (handles asset-specific distributions)
    drop_na : bool, default=True
        Drop rows where labels cannot be computed (last forward_window rows per ticker)
    
    Returns
    -------
    pd.DataFrame
        Copy of input DataFrame with added columns:
        - 'smoothed_target': Regression target (if output_type='regression')
        - 'label': Classification label (if output_type='binary' or 'quantile')
        - 'raw_forward_return': Unsmoothed single-step return (for comparison)
        - 'quantile_edges': Quantile bin edges (if output_type='quantile', global method)
    
    Examples
    --------
    >>> from src.multi_agg import build_unified_df
    >>> df = build_unified_df('data/all_daily.parquet')
    >>> 
    >>> # Regression: predict average next-3-day return (smoothed over 3 days)
    >>> df_reg = create_smoothed_labels(df, forward_window=3, smoothing_window=3, output_type='regression')
    >>> print(df_reg[['ticker', 'date', 'close', 'smoothed_target']].head())
    >>> 
    >>> # Binary classification: predict if smoothed 5-day return > 0
    >>> df_bin = create_smoothed_labels(df, forward_window=5, smoothing_window=5, 
    ...                                  output_type='binary', threshold=0.0)
    >>> print(df_bin['label'].value_counts())
    >>> 
    >>> # Quantile classification: predict return tercile (adaptive thresholds)
    >>> df_quant = create_smoothed_labels(df, forward_window=5, smoothing_window=3,
    ...                                    output_type='quantile', n_quantiles=3)
    >>> print(df_quant['label'].value_counts())
    >>> 
    >>> # Quintile classification with per-ticker quantiles
    >>> df_quint = create_smoothed_labels(df, forward_window=10, smoothing_window=5,
    ...                                    output_type='quantile', n_quantiles=5,
    ...                                    quantile_method='per_ticker')
    """
    # Validate inputs
    required_cols = ['ticker', 'date', price_col]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")
    
    if smoothing_window > forward_window:
        raise ValueError(f"smoothing_window ({smoothing_window}) cannot be > forward_window ({forward_window})")
    
    if smoothing_window < 1:
        raise ValueError(f"smoothing_window must be >= 1, got {smoothing_window}")
    
    df_out = df.copy()
    
    # Process each ticker separately to avoid cross-ticker contamination
    smoothed_targets = []
    raw_returns = []
    
    for ticker in sorted(df['ticker'].unique()):
        ticker_df = df[df['ticker'] == ticker].sort_values('date').reset_index(drop=True)
        prices = ticker_df[price_col].values
        n = len(prices)
        
        # Compute forward returns at the prediction horizon
        # Start at forward_window and look back smoothing_window days
        smoothed = np.full(n, np.nan)
        
        for i in range(n - forward_window):
            # Compute returns from day i to each day in [i+forward_window-smoothing_window+1, i+forward_window]
            returns_in_window = []
            
            for h in range(forward_window - smoothing_window + 1, forward_window + 1):
                if i + h < n:
                    if target == 'return':
                        ret = (prices[i + h] - prices[i]) / prices[i]
                    elif target == 'log_return':
                        ret = np.log(prices[i + h] / prices[i])
                    elif target == 'price':
                        ret = prices[i + h] - prices[i]
                    else:
                        raise ValueError(f"Unknown target type: {target}")
                    returns_in_window.append(ret)
            
            # Aggregate returns over smoothing window
            if len(returns_in_window) > 0:
                with warnings.catch_warnings():
                    warnings.filterwarnings('ignore', message='Mean of empty slice')
                    if agg_method == 'mean':
                        smoothed[i] = np.mean(returns_in_window)
                    elif agg_method == 'median':
                        smoothed[i] = np.median(returns_in_window)
                    else:
                        raise ValueError(f"Unknown aggregation method: {agg_method}")
        
        # Raw single-step return for comparison
        if target == 'return':
            raw = np.full(n, np.nan)
            raw[:-1] = (prices[1:] - prices[:-1]) / prices[:-1]
        elif target == 'log_return':
            raw = np.full(n, np.nan)
            raw[:-1] = np.log(prices[1:] / prices[:-1])
        else:
            raw = np.full(n, np.nan)
            raw[:-1] = prices[1:] - prices[:-1]
        
        smoothed_targets.append(smoothed)
        raw_returns.append(raw)
    
    # Concatenate results
    df_out['smoothed_target'] = np.concatenate(smoothed_targets)
    df_out['raw_forward_return'] = np.concatenate(raw_returns)
    
    # Create classification labels if requested
    if output_type == 'binary':
        df_out['label'] = (df_out['smoothed_target'] > threshold).astype(int)
    
    elif output_type == 'quantile':
        if quantile_method == 'global':
            # Compute quantiles on all non-NaN values across all tickers
            valid_targets = df_out['smoothed_target'].dropna()
            if len(valid_targets) == 0:
                raise ValueError("No valid targets to compute quantiles")
            
            quantile_edges = np.quantile(valid_targets, np.linspace(0, 1, n_quantiles + 1))
            
            # Bin into quantiles (0 = bottom quantile, n_quantiles-1 = top quantile)
            labels = np.full(len(df_out), -1, dtype=int)
            for i in range(len(df_out)):
                val = df_out['smoothed_target'].iloc[i]
                if not np.isnan(val):
                    # Find which quantile bin this value falls into
                    bin_idx = np.searchsorted(quantile_edges[1:-1], val, side='right')
                    labels[i] = bin_idx
            
            df_out['label'] = labels
            df_out.loc[df_out['label'] == -1, 'label'] = np.nan
            
            # Store quantile edges for reference
            df_out.attrs['quantile_edges'] = quantile_edges
            
        elif quantile_method == 'per_ticker':
            # Compute quantiles per ticker (handles asset-specific distributions)
            all_labels = []
            
            for ticker in sorted(df['ticker'].unique()):
                ticker_mask = df_out['ticker'] == ticker
                ticker_targets = df_out.loc[ticker_mask, 'smoothed_target']
                valid_targets = ticker_targets.dropna()
                
                if len(valid_targets) == 0:
                    # No valid targets for this ticker, assign NaN
                    ticker_labels = np.full(ticker_mask.sum(), np.nan)
                else:
                    quantile_edges = np.quantile(valid_targets, np.linspace(0, 1, n_quantiles + 1))
                    
                    ticker_labels = np.full(ticker_mask.sum(), -1, dtype=float)
                    ticker_vals = ticker_targets.values
                    
                    for i in range(len(ticker_vals)):
                        val = ticker_vals[i]
                        if not np.isnan(val):
                            bin_idx = np.searchsorted(quantile_edges[1:-1], val, side='right')
                            ticker_labels[i] = bin_idx
                    
                    ticker_labels[ticker_labels == -1] = np.nan
                
                all_labels.append(ticker_labels)
            
            df_out['label'] = np.concatenate(all_labels)
        else:
            raise ValueError(f"Unknown quantile_method: {quantile_method}")
    
    # Drop rows with NaN labels if requested
    if drop_na:
        if output_type in ['binary', 'quantile']:
            df_out = df_out.dropna(subset=['label'])
        else:
            df_out = df_out.dropna(subset=['smoothed_target'])
    
    return df_out


def create_triple_barrier_labels(
    df: pd.DataFrame,
    price_col: str = 'close',
    profit_target: float = 0.02,
    stop_loss: float = 0.01,
    max_holding: int = 10,
    min_return: float = 0.0
) -> pd.DataFrame:
    """
    Create labels using triple-barrier method (profit-taking, stop-loss, time-based exit).
    
    For each day, simulate holding a position and label based on which barrier is hit first:
    - Upper barrier: +profit_target return → label = 1 (profitable)
    - Lower barrier: -stop_loss return → label = 0 (stopped out)
    - Time barrier: max_holding days → label based on final return vs min_return
    
    This captures realistic trading outcomes with risk management.
    
    Parameters
    ----------
    df : pd.DataFrame
        Multi-ticker DataFrame with ticker, date, close
    price_col : str, default='close'
        Price column
    profit_target : float, default=0.02
        Upper barrier (2% profit)
    stop_loss : float, default=0.01
        Lower barrier (1% loss)
    max_holding : int, default=10
        Maximum holding period (time barrier)
    min_return : float, default=0.0
        Minimum return to be labeled positive if time barrier hit
    
    Returns
    -------
    pd.DataFrame
        DataFrame with added columns:
        - 'label': Binary label (1=profitable, 0=unprofitable)
        - 'barrier_hit': Which barrier was hit ('profit', 'stop', 'time')
        - 'holding_period': Days held before exit
        - 'exit_return': Return at exit
    """
    df_out = df.copy()
    
    labels = []
    barriers = []
    holdings = []
    exit_returns = []
    
    for ticker in sorted(df['ticker'].unique()):
        ticker_df = df[df['ticker'] == ticker].sort_values('date').reset_index(drop=True)
        prices = ticker_df[price_col].values
        n = len(prices)
        
        for i in range(n):
            entry_price = prices[i]
            label = np.nan
            barrier = 'unknown'
            holding = np.nan
            exit_ret = np.nan
            
            # Check forward prices until barrier hit or max_holding reached
            for h in range(1, min(max_holding + 1, n - i)):
                current_price = prices[i + h]
                ret = (current_price - entry_price) / entry_price
                
                # Check profit target
                if ret >= profit_target:
                    label = 1
                    barrier = 'profit'
                    holding = h
                    exit_ret = ret
                    break
                
                # Check stop loss
                if ret <= -stop_loss:
                    label = 0
                    barrier = 'stop'
                    holding = h
                    exit_ret = ret
                    break
            
            # Time barrier: no profit/stop hit within max_holding
            if np.isnan(label) and i + max_holding < n:
                final_price = prices[i + max_holding]
                exit_ret = (final_price - entry_price) / entry_price
                label = 1 if exit_ret >= min_return else 0
                barrier = 'time'
                holding = max_holding
            
            labels.append(label)
            barriers.append(barrier)
            holdings.append(holding)
            exit_returns.append(exit_ret)
    
    df_out['label'] = labels
    df_out['barrier_hit'] = barriers
    df_out['holding_period'] = holdings
    df_out['exit_return'] = exit_returns
    
    return df_out.dropna(subset=['label'])


def create_quantile_labels(
    df: pd.DataFrame,
    forward_window: int = 5,
    price_col: str = 'close',
    n_quantiles: int = 5,
    method: Literal['per_ticker', 'global'] = 'global'
) -> pd.DataFrame:
    """
    Create quantile-based labels (adaptive binning based on return distribution).
    
    Parameters
    ----------
    df : pd.DataFrame
        Multi-ticker DataFrame
    forward_window : int, default=5
        Forward return horizon
    price_col : str, default='close'
        Price column
    n_quantiles : int, default=5
        Number of quantile bins (5 = quintiles)
    method : {'per_ticker', 'global'}, default='global'
        - 'global': Compute quantiles across all tickers (same bins for all)
        - 'per_ticker': Compute separate quantiles per ticker (relative ranking)
    
    Returns
    -------
    pd.DataFrame
        DataFrame with 'label' column (0 = bottom quantile, n_quantiles-1 = top)
    """
    df_out = df.copy()
    
    # Compute forward returns
    forward_rets = []
    for ticker in sorted(df['ticker'].unique()):
        ticker_df = df[df['ticker'] == ticker].sort_values('date').reset_index(drop=True)
        prices = ticker_df[price_col].values
        rets = np.full(len(prices), np.nan)
        rets[:-forward_window] = (prices[forward_window:] - prices[:-forward_window]) / prices[:-forward_window]
        forward_rets.append(rets)
    
    df_out['forward_return'] = np.concatenate(forward_rets)
    
    # Compute quantiles
    if method == 'global':
        valid_rets = df_out['forward_return'].dropna()
        edges = np.quantile(valid_rets, np.linspace(0, 1, n_quantiles + 1))
        df_out['label'] = pd.cut(df_out['forward_return'], bins=edges, labels=False, include_lowest=True)
    
    elif method == 'per_ticker':
        labels = []
        for ticker in sorted(df['ticker'].unique()):
            ticker_mask = df_out['ticker'] == ticker
            ticker_rets = df_out.loc[ticker_mask, 'forward_return']
            valid_rets = ticker_rets.dropna()
            
            if len(valid_rets) > 0:
                edges = np.quantile(valid_rets, np.linspace(0, 1, n_quantiles + 1))
                ticker_labels = pd.cut(ticker_rets, bins=edges, labels=False, include_lowest=True)
            else:
                ticker_labels = pd.Series([np.nan] * len(ticker_rets), index=ticker_rets.index)
            
            labels.append(ticker_labels)
        
        df_out['label'] = pd.concat(labels)
    
    return df_out.dropna(subset=['label'])


if __name__ == '__main__':
    """
    Example CLI usage demonstrating label smoothing benefits.
    
    Run with:
        python src/labeling.py
    
    This will:
    1. Load processed data
    2. Create labels with different smoothing windows
    3. Compare label noise and autocorrelation
    4. Show how smoothing improves signal quality
    """
    import sys
    import os
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    from src.multi_agg import build_unified_df
    
    print("=" * 80)
    print("Label Smoothing Demonstration")
    print("=" * 80)
    
    # Load data
    print("\n1. Loading data...")
    df = build_unified_df('data/all_daily.parquet')
    print(f"   Loaded {len(df)} rows, {df['ticker'].nunique()} tickers")
    
    # Test different smoothing configurations
    configs = [
        (1, 1, "No smoothing"),
        (3, 1, "3-day horizon, no smoothing"),
        (3, 3, "3-day horizon, 3-day smoothing"),
        (5, 3, "5-day horizon, 3-day smoothing"),
        (10, 5, "10-day horizon, 5-day smoothing"),
    ]
    
    print("\n2. Creating labels with different smoothing configurations...")
    print(f"   {'Config':<35} {'Mean':<10} {'Std':<10} {'Autocorr':<10} {'Balance'}")
    print("   " + "-" * 75)
    
    for fw, sw, desc in configs:
        df_labeled = create_smoothed_labels(
            df, 
            forward_window=fw,
            smoothing_window=sw,
            output_type='binary',
            threshold=0.0,
            drop_na=True
        )
        
        # Compute statistics
        mean_ret = df_labeled['smoothed_target'].mean()
        std_ret = df_labeled['smoothed_target'].std()
        
        # Autocorrelation of labels (lower = less noise)
        labels_series = df_labeled.groupby('ticker')['label'].apply(lambda x: x.autocorr(lag=1))
        mean_autocorr = labels_series.mean()
        
        # Class balance
        class_balance = df_labeled['label'].mean()
        
        print(f"   {desc:<35} {mean_ret:<10.4f} {std_ret:<10.4f} {mean_autocorr:<10.4f} {class_balance:<10.3f}")
    
    print("\n3. Interpretation:")
    print("   - Mean: Average forward return (should be ~0 for efficient markets)")
    print("   - Std: Volatility decreases with smoothing (noise reduction)")
    print("   - Autocorr: Lower autocorr with smoothing (less label flickering)")
    print("   - Balance: Proportion of positive labels (~0.5 = balanced)")
    
    print("\n4. Testing quantile-based classification...")
    
    # Global quantiles (3 classes)
    df_q3_global = create_smoothed_labels(
        df, forward_window=5, smoothing_window=3,
        output_type='quantile', n_quantiles=3, quantile_method='global'
    )
    print(f"   Terciles (global): {df_q3_global['label'].value_counts().sort_index().to_dict()}")
    if 'quantile_edges' in df_q3_global.attrs:
        edges = df_q3_global.attrs['quantile_edges']
        print(f"   Edges: {[f'{e:.4f}' for e in edges]}")
    
    # Global quantiles (5 classes)
    df_q5_global = create_smoothed_labels(
        df, forward_window=5, smoothing_window=3,
        output_type='quantile', n_quantiles=5, quantile_method='global'
    )
    print(f"   Quintiles (global): {df_q5_global['label'].value_counts().sort_index().to_dict()}")
    
    # Per-ticker quantiles
    df_q3_ticker = create_smoothed_labels(
        df, forward_window=5, smoothing_window=3,
        output_type='quantile', n_quantiles=3, quantile_method='per_ticker'
    )
    print(f"   Terciles (per-ticker): {df_q3_ticker['label'].value_counts().sort_index().to_dict()}")
    
    print("\n5. Creating different label types...")
    
    # Regression with smoothing
    df_reg = create_smoothed_labels(df, forward_window=5, smoothing_window=3, output_type='regression')
    print(f"   Regression: {len(df_reg)} samples, target range [{df_reg['smoothed_target'].min():.4f}, {df_reg['smoothed_target'].max():.4f}]")
    
    # Binary with smoothing
    df_bin = create_smoothed_labels(df, forward_window=5, smoothing_window=3, output_type='binary', threshold=0.0)
    print(f"   Binary: {df_bin['label'].value_counts().to_dict()}")
    
    # Triple barrier
    print("\n6. Testing triple-barrier labels...")
    df_tb = create_triple_barrier_labels(
        df, 
        profit_target=0.02, 
        stop_loss=0.01, 
        max_holding=10
    )
    print(f"   Triple-barrier: {len(df_tb)} samples")
    print(f"   Label distribution: {df_tb['label'].value_counts().to_dict()}")
    print(f"   Barrier breakdown: {df_tb['barrier_hit'].value_counts().to_dict()}")
    print(f"   Avg holding period: {df_tb['holding_period'].mean():.2f} days")
    
    print("\n" + "=" * 80)
    print("Demonstration complete!")
    print("=" * 80)
    print("\nKey takeaways:")
    print("  1. Smoothing reduces label noise and volatility")
    print("  2. Quantile-based bins adapt to return distribution (no fixed thresholds)")
    print("  3. Per-ticker quantiles handle asset-specific characteristics")
    print("  4. Choose smoothing_window based on noise level in your data")
    print("  5. Choose forward_window based on trading strategy holding period")
