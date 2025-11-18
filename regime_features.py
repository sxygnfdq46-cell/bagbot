"""
regime_features.py
------------------
Market regime detection using k-means clustering on volatility, ATR, volume, and returns.

Market regimes represent different market states (e.g., low volatility/trending, high volatility/choppy).
Identifying regimes helps models adapt their strategies to current market conditions.

Key Concepts
------------
**Regime Features:**
1. **Volatility**: Rolling standard deviation of returns (20-day window)
2. **ATR** (Average True Range): Measure of volatility considering gaps
3. **Volume**: Trading volume (normalized)
4. **Returns**: Price momentum/direction

**K-Means Clustering:**
- Unsupervised learning algorithm
- Groups similar market conditions into clusters
- Each cluster = market regime (e.g., Regime 0 = low vol, Regime 1 = high vol)

**Typical Regimes:**
- Regime 0: Low volatility, steady trend, normal volume
- Regime 1: High volatility, choppy, high volume (crisis/news events)
- Regime 2: Medium volatility, ranging market
- Regime 3: Breakout/momentum regime

Best Practices
--------------
1. **Fit on training data only** (avoid lookahead bias)
2. **Use 3-5 clusters** (too many = overfitting, too few = underfitting)
3. **Standardize features** before clustering (different scales)
4. **Rolling windows** for regime features (use recent market state)
5. **Save clusterer** with model for production inference

Usage Example
-------------
>>> from regime_features import compute_regime_features, fit_regime_clusterer
>>> 
>>> # Compute regime features
>>> df_with_regimes = compute_regime_features(df, window=20)
>>> 
>>> # Fit k-means on training data
>>> clusterer = fit_regime_clusterer(df_train, n_regimes=3)
>>> 
>>> # Predict regimes for new data
>>> regime_ids = clusterer.predict(scaler.transform(features))
"""

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from typing import Tuple, Optional, Union
import warnings


def compute_atr(df: pd.DataFrame, window: int = 14) -> pd.Series:
    """
    Compute Average True Range (ATR).
    
    ATR measures volatility by considering:
    - High - Low
    - High - Previous Close (gap up)
    - Previous Close - Low (gap down)
    
    Parameters
    ----------
    df : pd.DataFrame
        DataFrame with columns: high, low, close
    window : int, default=14
        Rolling window for ATR calculation
    
    Returns
    -------
    atr : pd.Series
        Average True Range values
    """
    high = df['high']
    low = df['low']
    close = df['close']
    
    # True Range = max(H-L, |H-C_prev|, |L-C_prev|)
    prev_close = close.shift(1)
    
    tr1 = high - low
    tr2 = (high - prev_close).abs()
    tr3 = (low - prev_close).abs()
    
    true_range = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    
    # Average True Range (moving average of TR)
    atr = true_range.rolling(window=window, min_periods=1).mean()
    
    return atr


def compute_regime_features(
    df: pd.DataFrame,
    vol_window: int = 20,
    atr_window: int = 14,
    return_window: int = 5
) -> pd.DataFrame:
    """
    Compute features for regime detection.
    
    Adds the following columns to DataFrame:
    - volatility: Rolling std of returns
    - atr: Average True Range
    - volume_norm: Normalized volume (z-score)
    - returns: Rolling returns
    
    Parameters
    ----------
    df : pd.DataFrame
        OHLCV data with columns: open, high, low, close, volume
    vol_window : int, default=20
        Window for volatility calculation
    atr_window : int, default=14
        Window for ATR calculation
    return_window : int, default=5
        Window for returns calculation
    
    Returns
    -------
    df_regime : pd.DataFrame
        DataFrame with added regime feature columns
    
    Examples
    --------
    >>> df_with_features = compute_regime_features(df)
    >>> print(df_with_features[['volatility', 'atr', 'volume_norm', 'returns']])
    """
    df = df.copy()
    
    # Compute returns
    df['returns'] = df['close'].pct_change()
    
    # 1. Volatility (rolling std of returns)
    df['volatility'] = df['returns'].rolling(window=vol_window, min_periods=1).std()
    
    # 2. ATR
    df['atr'] = compute_atr(df, window=atr_window)
    
    # 3. Normalized volume (z-score over rolling window)
    volume_mean = df['volume'].rolling(window=vol_window, min_periods=1).mean()
    volume_std = df['volume'].rolling(window=vol_window, min_periods=1).std()
    df['volume_norm'] = (df['volume'] - volume_mean) / (volume_std + 1e-8)
    
    # 4. Rolling returns (momentum)
    df['returns_rolling'] = df['close'].pct_change(periods=return_window)
    
    return df


def fit_regime_clusterer(
    df: pd.DataFrame,
    n_regimes: int = 3,
    feature_cols: Optional[list] = None,
    random_state: int = 42
) -> Tuple[KMeans, StandardScaler]:
    """
    Fit k-means clusterer on regime features.
    
    Parameters
    ----------
    df : pd.DataFrame
        DataFrame with regime features (volatility, atr, volume_norm, returns_rolling)
    n_regimes : int, default=3
        Number of market regimes (clusters)
    feature_cols : list, optional
        List of feature columns to use for clustering
        Default: ['volatility', 'atr', 'volume_norm', 'returns_rolling']
    random_state : int, default=42
        Random seed for reproducibility
    
    Returns
    -------
    clusterer : KMeans
        Fitted k-means clusterer
    scaler : StandardScaler
        Fitted scaler for features
    
    Examples
    --------
    >>> clusterer, scaler = fit_regime_clusterer(df_train, n_regimes=3)
    >>> # Save for production
    >>> import joblib
    >>> joblib.dump((clusterer, scaler), 'regime_model.joblib')
    """
    if feature_cols is None:
        feature_cols = ['volatility', 'atr', 'volume_norm', 'returns_rolling']
    
    # Extract features
    X = df[feature_cols].copy()
    
    # Handle NaN values (from rolling windows)
    X = X.bfill().fillna(0)
    
    # Standardize features (important for k-means)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Fit k-means
    clusterer = KMeans(
        n_clusters=n_regimes,
        random_state=random_state,
        n_init=10,
        max_iter=300
    )
    clusterer.fit(X_scaled)
    
    print(f"✓ Fitted k-means with {n_regimes} regimes")
    print(f"  Inertia: {clusterer.inertia_:.2f}")
    
    # Show cluster sizes
    labels = clusterer.labels_
    for i in range(n_regimes):
        count = (labels == i).sum()
        pct = count / len(labels) * 100
        print(f"  Regime {i}: {count} samples ({pct:.1f}%)")
    
    return clusterer, scaler


def predict_regime(
    df: pd.DataFrame,
    clusterer: KMeans,
    scaler: StandardScaler,
    feature_cols: Optional[list] = None
) -> np.ndarray:
    """
    Predict regime IDs for new data.
    
    Parameters
    ----------
    df : pd.DataFrame
        DataFrame with regime features
    clusterer : KMeans
        Fitted k-means clusterer
    scaler : StandardScaler
        Fitted scaler
    feature_cols : list, optional
        Feature columns (must match training)
    
    Returns
    -------
    regime_ids : np.ndarray
        Regime ID for each sample (0, 1, 2, ...)
    
    Examples
    --------
    >>> regime_ids = predict_regime(df_test, clusterer, scaler)
    >>> df_test['regime_id'] = regime_ids
    """
    if feature_cols is None:
        feature_cols = ['volatility', 'atr', 'volume_norm', 'returns_rolling']
    
    # Extract features
    X = df[feature_cols].copy()
    
    # Handle NaN values
    X = X.bfill().fillna(0)
    
    # Scale and predict
    X_scaled = scaler.transform(X)
    regime_ids = clusterer.predict(X_scaled)
    
    return regime_ids


def add_regime_to_sequences(
    X: np.ndarray,
    regime_ids: np.ndarray,
    encoding: str = 'onehot'
) -> Tuple[np.ndarray, dict]:
    """
    Add regime IDs as features to sequence data.
    
    For sequences of shape (n_samples, window, n_features), adds regime ID
    as additional feature(s) at each timestep.
    
    Parameters
    ----------
    X : np.ndarray
        Sequences, shape (n_samples, window, n_features)
    regime_ids : np.ndarray
        Regime ID for each sample, shape (n_samples,)
    encoding : {'onehot', 'label'}, default='onehot'
        - 'onehot': Add n_regimes binary features
        - 'label': Add single integer ID feature
    
    Returns
    -------
    X_with_regime : np.ndarray
        Sequences with regime features added
    encoding_info : dict
        Metadata about encoding
    
    Examples
    --------
    >>> X_regime, info = add_regime_to_sequences(X, regime_ids, encoding='onehot')
    >>> print(X.shape)  # (1000, 30, 5)
    >>> print(X_regime.shape)  # (1000, 30, 8) if 3 regimes
    """
    n_samples, window, n_features = X.shape
    n_regimes = len(np.unique(regime_ids))
    
    if encoding == 'onehot':
        # Create one-hot encoding for each regime
        regime_onehot = np.zeros((n_samples, n_regimes))
        regime_onehot[np.arange(n_samples), regime_ids] = 1
        
        # Repeat for each timestep in window
        # Shape: (n_samples, window, n_regimes)
        regime_features = np.repeat(regime_onehot[:, np.newaxis, :], window, axis=1)
        
        # Concatenate with original features
        X_with_regime = np.concatenate([X, regime_features], axis=2)
        
        encoding_info = {
            'type': 'onehot',
            'n_regimes': n_regimes,
            'n_features_added': n_regimes
        }
        
    elif encoding == 'label':
        # Add regime ID as single feature
        # Shape: (n_samples, window, 1)
        regime_features = np.repeat(regime_ids[:, np.newaxis, np.newaxis], window, axis=1)
        
        # Concatenate with original features
        X_with_regime = np.concatenate([X, regime_features], axis=2)
        
        encoding_info = {
            'type': 'label',
            'n_regimes': n_regimes,
            'n_features_added': 1
        }
    else:
        raise ValueError(f"Unknown encoding: {encoding}. Use 'onehot' or 'label'")
    
    return X_with_regime, encoding_info


def analyze_regime_transitions(regime_ids: np.ndarray) -> pd.DataFrame:
    """
    Analyze regime transitions (how often regimes change).
    
    Parameters
    ----------
    regime_ids : np.ndarray
        Sequence of regime IDs
    
    Returns
    -------
    transition_matrix : pd.DataFrame
        Transition probability matrix (rows=from, cols=to)
    
    Examples
    --------
    >>> transitions = analyze_regime_transitions(regime_ids)
    >>> print(transitions)
    """
    n_regimes = len(np.unique(regime_ids))
    
    # Count transitions
    transition_counts = np.zeros((n_regimes, n_regimes))
    
    for i in range(len(regime_ids) - 1):
        from_regime = regime_ids[i]
        to_regime = regime_ids[i + 1]
        transition_counts[from_regime, to_regime] += 1
    
    # Convert to probabilities
    row_sums = transition_counts.sum(axis=1, keepdims=True)
    transition_probs = transition_counts / (row_sums + 1e-8)
    
    # Create DataFrame
    df = pd.DataFrame(
        transition_probs,
        index=[f'Regime {i}' for i in range(n_regimes)],
        columns=[f'Regime {i}' for i in range(n_regimes)]
    )
    
    return df


# ============================================================================
# Unit Tests
# ============================================================================

def test_regime_features():
    """Test regime feature computation."""
    print("\n" + "=" * 80)
    print("Test: Regime Feature Computation")
    print("=" * 80)
    
    # Create synthetic OHLCV data
    np.random.seed(42)
    n = 100
    
    df = pd.DataFrame({
        'open': 100 + np.cumsum(np.random.randn(n) * 0.5),
        'high': 100 + np.cumsum(np.random.randn(n) * 0.5) + 1,
        'low': 100 + np.cumsum(np.random.randn(n) * 0.5) - 1,
        'close': 100 + np.cumsum(np.random.randn(n) * 0.5),
        'volume': 1000000 + np.random.randint(-100000, 100000, n)
    })
    
    # Compute regime features
    df_regime = compute_regime_features(df, vol_window=20, atr_window=14)
    
    # Validate
    assert 'volatility' in df_regime.columns
    assert 'atr' in df_regime.columns
    assert 'volume_norm' in df_regime.columns
    assert 'returns_rolling' in df_regime.columns
    
    assert not df_regime['volatility'].isna().all()
    assert not df_regime['atr'].isna().all()
    
    print(f"✓ Computed regime features for {len(df)} samples")
    print(f"  Volatility: min={df_regime['volatility'].min():.4f}, max={df_regime['volatility'].max():.4f}")
    print(f"  ATR: min={df_regime['atr'].min():.4f}, max={df_regime['atr'].max():.4f}")
    print(f"  Volume (norm): min={df_regime['volume_norm'].min():.4f}, max={df_regime['volume_norm'].max():.4f}")


def test_regime_clustering():
    """Test k-means regime clustering."""
    print("\n" + "=" * 80)
    print("Test: Regime Clustering")
    print("=" * 80)
    
    # Create synthetic data with 2 clear regimes
    np.random.seed(42)
    n = 200
    
    # Regime 1: Low volatility, low volume
    regime1 = pd.DataFrame({
        'volatility': np.random.uniform(0.01, 0.02, n // 2),
        'atr': np.random.uniform(0.5, 1.0, n // 2),
        'volume_norm': np.random.uniform(-1, 0, n // 2),
        'returns_rolling': np.random.uniform(-0.01, 0.01, n // 2)
    })
    
    # Regime 2: High volatility, high volume
    regime2 = pd.DataFrame({
        'volatility': np.random.uniform(0.05, 0.08, n // 2),
        'atr': np.random.uniform(2.0, 3.0, n // 2),
        'volume_norm': np.random.uniform(0.5, 2.0, n // 2),
        'returns_rolling': np.random.uniform(-0.05, 0.05, n // 2)
    })
    
    df = pd.concat([regime1, regime2], ignore_index=True)
    
    # Fit clusterer
    clusterer, scaler = fit_regime_clusterer(df, n_regimes=2)
    
    # Predict regimes
    regime_ids = predict_regime(df, clusterer, scaler)
    
    # Validate
    assert len(regime_ids) == len(df)
    assert len(np.unique(regime_ids)) <= 2
    
    print(f"✓ Clustered {len(df)} samples into {len(np.unique(regime_ids))} regimes")
    
    # Analyze transitions
    transitions = analyze_regime_transitions(regime_ids)
    print("\nTransition Matrix:")
    print(transitions)


def test_add_regime_to_sequences():
    """Test adding regime IDs to sequence data."""
    print("\n" + "=" * 80)
    print("Test: Add Regime to Sequences")
    print("=" * 80)
    
    # Create fake sequences
    np.random.seed(42)
    n_samples = 50
    window = 30
    n_features = 5
    
    X = np.random.randn(n_samples, window, n_features)
    regime_ids = np.random.randint(0, 3, n_samples)  # 3 regimes
    
    # Test OneHot encoding
    X_onehot, info_onehot = add_regime_to_sequences(X, regime_ids, encoding='onehot')
    
    assert X_onehot.shape == (n_samples, window, n_features + 3)  # +3 for 3 regimes
    assert info_onehot['type'] == 'onehot'
    assert info_onehot['n_regimes'] == 3
    
    print(f"✓ OneHot encoding: {X.shape} -> {X_onehot.shape}")
    
    # Test Label encoding
    X_label, info_label = add_regime_to_sequences(X, regime_ids, encoding='label')
    
    assert X_label.shape == (n_samples, window, n_features + 1)  # +1 for regime ID
    assert info_label['type'] == 'label'
    
    print(f"✓ Label encoding: {X.shape} -> {X_label.shape}")


def run_all_tests():
    """Run all unit tests."""
    print("\n" + "=" * 80)
    print("REGIME FEATURES - UNIT TESTS")
    print("=" * 80)
    
    test_regime_features()
    test_regime_clustering()
    test_add_regime_to_sequences()
    
    print("\n" + "=" * 80)
    print("✓ All tests passed!")
    print("=" * 80)


if __name__ == '__main__':
    run_all_tests()
