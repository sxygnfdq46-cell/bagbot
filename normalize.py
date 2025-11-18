"""
normalize.py
------------
Feature normalization for time-series sequences and tabular data.

Normalization is critical for ML models to:
1. Make features comparable (price vs volume have very different scales)
2. Improve gradient-based optimization convergence
3. Prevent features with large magnitude from dominating
4. Enable meaningful regularization (L1/L2 penalties)

Key Concepts
------------
**Global vs Per-Ticker Normalization:**

1. **Global normalization** (default):
   - Compute mean/std across ALL tickers and time steps
   - Pros: Preserves relative differences between tickers
   - Cons: May not handle ticker-specific regimes well
   - Use when: Tickers are similar (e.g., all tech stocks)

2. **Per-ticker normalization**:
   - Compute mean/std separately for each ticker
   - Pros: Handles different price scales and volatility regimes
   - Cons: Loses cross-ticker comparisons
   - Use when: Tickers have vastly different scales (e.g., BTC vs penny stocks)

**StandardScaler vs RobustScaler:**

- StandardScaler: (X - mean) / std
  - Assumes Gaussian distribution
  - Sensitive to outliers (extreme prices skew mean/std)
  - Use when: Data is relatively clean, few outliers

- RobustScaler: (X - median) / IQR
  - Uses median and interquartile range (IQR)
  - Robust to outliers and extreme events
  - Use when: Financial data with tail events (recommended)

Best Practices
--------------
1. Fit normalizer ONLY on training data
2. Apply same normalizer to validation and test sets
3. Save normalizer with model for production inference
4. Consider per-feature normalization (different scales for OHLCV)
5. For sequences: flatten time dimension before fitting
"""

import numpy as np
import joblib
from sklearn.preprocessing import StandardScaler, RobustScaler
from typing import Tuple, Literal, Union, Dict


def fit_normalizer(
    X_train: np.ndarray,
    method: Literal['standard', 'robust'] = 'robust',
    per_ticker: bool = False,
    ticker_ids: np.ndarray = None
) -> Union[object, Dict[int, object]]:
    """
    Fit normalization scaler on training sequences.
    
    For sequence data (n_samples, window, n_features), flattens the time dimension
    and fits scaler across (n_samples * window, n_features).
    
    Parameters
    ----------
    X_train : np.ndarray
        Training data, shape (n_samples, window, n_features) for sequences
        or (n_samples, n_features) for tabular data
    method : {'standard', 'robust'}, default='robust'
        - 'standard': StandardScaler (mean/std, sensitive to outliers)
        - 'robust': RobustScaler (median/IQR, robust to outliers)
    per_ticker : bool, default=False
        If True, fit separate scaler per ticker
    ticker_ids : np.ndarray, optional
        Ticker IDs for each sample, shape (n_samples,)
        Required if per_ticker=True
    
    Returns
    -------
    scaler : sklearn scaler or dict
        If per_ticker=False: single scaler object
        If per_ticker=True: dict mapping ticker_id -> scaler
    
    Examples
    --------
    >>> # Global normalization
    >>> scaler = fit_normalizer(X_train, method='robust')
    >>> X_train_norm = apply_normalizer(scaler, X_train)
    >>> X_test_norm = apply_normalizer(scaler, X_test)
    >>> joblib.dump(scaler, 'scaler.joblib')
    
    >>> # Per-ticker normalization
    >>> ticker_ids = np.array([0, 0, 1, 1, 2, 2, ...])  # ticker ID per sample
    >>> scaler = fit_normalizer(X_train, per_ticker=True, ticker_ids=ticker_ids)
    >>> X_train_norm = apply_normalizer(scaler, X_train, ticker_ids=ticker_ids)
    """
    # Select scaler type
    if method == 'standard':
        ScalerClass = StandardScaler
    elif method == 'robust':
        ScalerClass = RobustScaler
    else:
        raise ValueError(f"Unknown method: {method}. Choose 'standard' or 'robust'")
    
    # Check if sequences (3D) or tabular (2D)
    is_sequence = X_train.ndim == 3
    
    if per_ticker:
        if ticker_ids is None:
            raise ValueError("ticker_ids required when per_ticker=True")
        if len(ticker_ids) != len(X_train):
            raise ValueError(f"ticker_ids length ({len(ticker_ids)}) must match X_train samples ({len(X_train)})")
        
        # Fit separate scaler per ticker
        scalers = {}
        for ticker_id in np.unique(ticker_ids):
            ticker_mask = ticker_ids == ticker_id
            X_ticker = X_train[ticker_mask]
            
            # Flatten time dimension if sequence
            if is_sequence:
                n_samples, window, n_features = X_ticker.shape
                X_flat = X_ticker.reshape(n_samples * window, n_features)
            else:
                X_flat = X_ticker
            
            scaler = ScalerClass()
            scaler.fit(X_flat)
            scalers[ticker_id] = scaler
        
        return scalers
    
    else:
        # Global normalization across all samples
        if is_sequence:
            n_samples, window, n_features = X_train.shape
            X_flat = X_train.reshape(n_samples * window, n_features)
        else:
            X_flat = X_train
        
        scaler = ScalerClass()
        scaler.fit(X_flat)
        
        return scaler


def apply_normalizer(
    scaler: Union[object, Dict[int, object]],
    X: np.ndarray,
    ticker_ids: np.ndarray = None
) -> np.ndarray:
    """
    Apply fitted normalizer to data.
    
    Handles both global and per-ticker scalers, and both sequence and tabular data.
    
    Parameters
    ----------
    scaler : sklearn scaler or dict
        Fitted scaler from fit_normalizer()
        If dict: per-ticker scalers {ticker_id: scaler}
    X : np.ndarray
        Data to normalize, shape (n_samples, window, n_features) or (n_samples, n_features)
    ticker_ids : np.ndarray, optional
        Ticker IDs for each sample, required if scaler is dict
    
    Returns
    -------
    X_norm : np.ndarray
        Normalized data, same shape as input
    
    Examples
    --------
    >>> # Global scaler
    >>> X_norm = apply_normalizer(scaler, X_test)
    
    >>> # Per-ticker scaler
    >>> X_norm = apply_normalizer(scaler_dict, X_test, ticker_ids=test_ticker_ids)
    """
    is_sequence = X.ndim == 3
    is_per_ticker = isinstance(scaler, dict)
    
    if is_per_ticker:
        if ticker_ids is None:
            raise ValueError("ticker_ids required when scaler is dict (per-ticker normalization)")
        if len(ticker_ids) != len(X):
            raise ValueError(f"ticker_ids length ({len(ticker_ids)}) must match X samples ({len(X)})")
        
        # Apply per-ticker normalization
        X_norm = np.zeros_like(X)
        
        for ticker_id in np.unique(ticker_ids):
            if ticker_id not in scaler:
                raise ValueError(f"Ticker {ticker_id} not found in scaler dict. Available: {list(scaler.keys())}")
            
            ticker_mask = ticker_ids == ticker_id
            X_ticker = X[ticker_mask]
            
            if is_sequence:
                n_samples, window, n_features = X_ticker.shape
                X_flat = X_ticker.reshape(n_samples * window, n_features)
                X_flat_norm = scaler[ticker_id].transform(X_flat)
                X_norm[ticker_mask] = X_flat_norm.reshape(n_samples, window, n_features)
            else:
                X_norm[ticker_mask] = scaler[ticker_id].transform(X_ticker)
        
        return X_norm
    
    else:
        # Global normalization
        if is_sequence:
            n_samples, window, n_features = X.shape
            X_flat = X.reshape(n_samples * window, n_features)
            X_flat_norm = scaler.transform(X_flat)
            return X_flat_norm.reshape(n_samples, window, n_features)
        else:
            return scaler.transform(X)


def inverse_transform(
    scaler: Union[object, Dict[int, object]],
    X_norm: np.ndarray,
    ticker_ids: np.ndarray = None
) -> np.ndarray:
    """
    Inverse transform normalized data back to original scale.
    
    Useful for interpreting model outputs or reconstructing prices.
    
    Parameters
    ----------
    scaler : sklearn scaler or dict
        Fitted scaler from fit_normalizer()
    X_norm : np.ndarray
        Normalized data
    ticker_ids : np.ndarray, optional
        Ticker IDs for per-ticker scalers
    
    Returns
    -------
    X : np.ndarray
        Data in original scale
    
    Example
    -------
    >>> X_pred_norm = model.predict(X_test_norm)
    >>> X_pred_original = inverse_transform(scaler, X_pred_norm)
    """
    is_sequence = X_norm.ndim == 3
    is_per_ticker = isinstance(scaler, dict)
    
    if is_per_ticker:
        if ticker_ids is None:
            raise ValueError("ticker_ids required for per-ticker inverse transform")
        
        X = np.zeros_like(X_norm)
        
        for ticker_id in np.unique(ticker_ids):
            ticker_mask = ticker_ids == ticker_id
            X_ticker_norm = X_norm[ticker_mask]
            
            if is_sequence:
                n_samples, window, n_features = X_ticker_norm.shape
                X_flat_norm = X_ticker_norm.reshape(n_samples * window, n_features)
                X_flat = scaler[ticker_id].inverse_transform(X_flat_norm)
                X[ticker_mask] = X_flat.reshape(n_samples, window, n_features)
            else:
                X[ticker_mask] = scaler[ticker_id].inverse_transform(X_ticker_norm)
        
        return X
    
    else:
        if is_sequence:
            n_samples, window, n_features = X_norm.shape
            X_flat_norm = X_norm.reshape(n_samples * window, n_features)
            X_flat = scaler.inverse_transform(X_flat_norm)
            return X_flat.reshape(n_samples, window, n_features)
        else:
            return scaler.inverse_transform(X_norm)


def normalize_sequences_returns(
    X: np.ndarray,
    price_indices: list = None
) -> Tuple[np.ndarray, dict]:
    """
    Alternative normalization: convert prices to returns.
    
    For each sequence, compute returns relative to first time step.
    This is scale-invariant and doesn't require fitting a scaler.
    
    Parameters
    ----------
    X : np.ndarray, shape (n_samples, window, n_features)
        Sequences with price features
    price_indices : list, optional
        Indices of features that are prices (default: [0,1,2,3] for OHLC)
        Volume and other features are left unchanged
    
    Returns
    -------
    X_returns : np.ndarray
        Sequences with prices converted to returns
    params : dict
        Normalization parameters (first prices for inverse transform)
    
    Example
    -------
    >>> # Convert OHLC to returns, leave volume as-is
    >>> X_returns, params = normalize_sequences_returns(X, price_indices=[0,1,2,3])
    >>> # Feature 0-3 (OHLC): returns, Feature 4 (volume): original scale
    """
    if price_indices is None:
        price_indices = [0, 1, 2, 3]  # Default: OHLC
    
    n_samples, window, n_features = X.shape
    X_returns = X.copy()
    
    # Store first prices for inverse transform
    first_prices = X[:, 0, price_indices].copy()
    
    # Convert each price feature to returns
    for idx in price_indices:
        for i in range(n_samples):
            base_price = X[i, 0, idx]
            if base_price > 0:
                X_returns[i, :, idx] = (X[i, :, idx] - base_price) / base_price
            else:
                # Handle zero/negative prices (shouldn't happen in real data)
                X_returns[i, :, idx] = 0
    
    params = {
        'first_prices': first_prices,
        'price_indices': price_indices
    }
    
    return X_returns, params


if __name__ == '__main__':
    """
    Example usage and comparison of normalization methods.
    """
    import sys
    import os
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    print("=" * 80)
    print("Normalization Demonstration")
    print("=" * 80)
    
    # Load sequences
    try:
        X, y = joblib.load('data/train_sequences.joblib')
        print(f"\n1. Loaded sequences: X shape = {X.shape}, y shape = {y.shape}")
    except FileNotFoundError:
        print("\n⚠️  No sequences found. Run this first:")
        print("   python -c \"from src.sequence_builder import build_sequences; ...\"")
        sys.exit(1)
    
    # Create train/test split
    from sklearn.model_selection import train_test_split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print(f"\n2. Train/test split:")
    print(f"   Train: {X_train.shape}, Test: {X_test.shape}")
    
    # Compare normalization methods
    print(f"\n3. Testing normalization methods...")
    
    print(f"\n   a) Original data statistics:")
    print(f"      Train mean: {X_train.mean(axis=(0,1))}")
    print(f"      Train std:  {X_train.std(axis=(0,1))}")
    
    # StandardScaler (global)
    print(f"\n   b) StandardScaler (global):")
    scaler_std = fit_normalizer(X_train, method='standard')
    X_train_std = apply_normalizer(scaler_std, X_train)
    X_test_std = apply_normalizer(scaler_std, X_test)
    print(f"      Train mean: {X_train_std.mean(axis=(0,1))}")
    print(f"      Train std:  {X_train_std.std(axis=(0,1))}")
    print(f"      Test mean:  {X_test_std.mean(axis=(0,1))}")
    print(f"      Test std:   {X_test_std.std(axis=(0,1))}")
    
    # RobustScaler (global)
    print(f"\n   c) RobustScaler (global):")
    scaler_rob = fit_normalizer(X_train, method='robust')
    X_train_rob = apply_normalizer(scaler_rob, X_train)
    X_test_rob = apply_normalizer(scaler_rob, X_test)
    print(f"      Train median: {np.median(X_train_rob, axis=(0,1))}")
    print(f"      Train IQR:    {np.percentile(X_train_rob, 75, axis=(0,1)) - np.percentile(X_train_rob, 25, axis=(0,1))}")
    
    # Create synthetic ticker IDs for per-ticker demo
    # Assume first 1000 samples are ticker 0, next 1000 are ticker 1, etc.
    n_tickers = 5
    ticker_ids_train = np.repeat(np.arange(n_tickers), len(X_train) // n_tickers)[:len(X_train)]
    ticker_ids_test = np.repeat(np.arange(n_tickers), len(X_test) // n_tickers)[:len(X_test)]
    
    # Per-ticker normalization
    print(f"\n   d) RobustScaler (per-ticker):")
    scaler_pt = fit_normalizer(X_train, method='robust', per_ticker=True, ticker_ids=ticker_ids_train)
    X_train_pt = apply_normalizer(scaler_pt, X_train, ticker_ids=ticker_ids_train)
    X_test_pt = apply_normalizer(scaler_pt, X_test, ticker_ids=ticker_ids_test)
    print(f"      Number of ticker-specific scalers: {len(scaler_pt)}")
    print(f"      Train mean (ticker 0): {X_train_pt[ticker_ids_train == 0].mean(axis=(0,1))}")
    print(f"      Train mean (ticker 1): {X_train_pt[ticker_ids_train == 1].mean(axis=(0,1))}")
    
    # Returns-based normalization
    print(f"\n   e) Returns-based normalization:")
    X_train_ret, params_ret = normalize_sequences_returns(X_train, price_indices=[0,1,2,3])
    print(f"      First sequence, first time step (original prices): {X_train[0, 0, :4]}")
    print(f"      First sequence, first time step (returns): {X_train_ret[0, 0, :4]}")
    print(f"      First sequence, last time step (returns): {X_train_ret[0, -1, :4]}")
    
    # Save scalers
    print(f"\n4. Saving scalers...")
    joblib.dump(scaler_std, 'data/scaler_standard.joblib')
    joblib.dump(scaler_rob, 'data/scaler_robust.joblib')
    joblib.dump(scaler_pt, 'data/scaler_per_ticker.joblib')
    print(f"   ✓ Saved: data/scaler_standard.joblib")
    print(f"   ✓ Saved: data/scaler_robust.joblib")
    print(f"   ✓ Saved: data/scaler_per_ticker.joblib")
    
    # Test inverse transform
    print(f"\n5. Testing inverse transform...")
    X_train_reconstructed = inverse_transform(scaler_rob, X_train_rob)
    reconstruction_error = np.abs(X_train - X_train_reconstructed).mean()
    print(f"   Reconstruction error (should be ~0): {reconstruction_error:.2e}")
    
    print(f"\n6. Recommendations:")
    print(f"   • Use RobustScaler for financial data (handles outliers)")
    print(f"   • Use per-ticker normalization if tickers have vastly different scales")
    print(f"   • Always fit on training data, apply to test/validation")
    print(f"   • Save scaler with model for production deployment")
    print(f"   • Consider returns-based normalization for scale invariance")
    
    print("\n" + "=" * 80)
    print("Demonstration complete!")
    print("=" * 80)
