"""
sequence_builder.py
-------------------
Build supervised sequences from multi-ticker time-series data for ML/RL training.

Converts daily OHLCV data into sliding-window sequences:
- X: (n_samples, window, n_features) array of historical observations
- y: (n_samples,) array of target labels (next-day return direction)
- ticker_ids: (n_samples,) array of ticker identifiers for each sequence

Supports:
- Multi-ticker data (ALL tickers combined for cross-ticker generalization)
- Ticker encoding (OneHot or integer ID)
- Configurable window size (lookback period)
- Configurable horizon (prediction offset)
- Configurable stride (sampling interval)
- Return direction classification (up/down/flat)
- Triple-barrier labeling for cleaner targets
"""

import numpy as np
import pandas as pd
from typing import Tuple, Optional
from sklearn.preprocessing import LabelEncoder, OneHotEncoder
from src.barrier_labeling import compute_barrier_labels


def build_sequences(
    df: pd.DataFrame,
    window: int = 30,
    horizon: int = 1,
    stride: int = 1,
    target_col: str = 'close',
    feature_cols: list = None,
    threshold: float = 0.0,
    encode_ticker: str = 'onehot',
    labeling_method: str = 'return',
    take_profit: float = 0.02,
    stop_loss: float = 0.01,
    max_barrier_horizon: int = 5,
    barrier_encoding: str = 'binary'
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, dict]:
    """
    Build supervised sequences from multi-ticker time-series data.
    
    **NEW: Processes ALL tickers together for cross-ticker generalization.**
    Each sequence includes ticker encoding as additional features.
    
    Process:
    1. Encode tickers (OneHot or integer ID)
    2. For each ticker:
       - Sort by date
       - Compute labels using selected method (return or barrier)
       - Create sequences with ticker encoding
    3. Concatenate ALL ticker sequences together
    
    Parameters
    ----------
    df : pd.DataFrame
        Multi-ticker DataFrame with columns: ticker, date, open, high, low, close, volume
        Must be sorted by ticker and date (output from build_unified_df)
    window : int, default=30
        Lookback window size (number of days)
    horizon : int, default=1
        Prediction horizon (days ahead to predict) - used for return method
    stride : int, default=1
        Stride for sliding window (1 = all possible sequences, >1 = subsample)
    target_col : str, default='close'
        Column to use for computing returns
    feature_cols : list, optional
        Columns to use as features. If None, uses: open, high, low, close, volume
    threshold : float, default=0.0
        Return threshold for binary classification (return > threshold → label=1)
        Only used when labeling_method='return'
    encode_ticker : str, default='onehot'
        Ticker encoding method:
        - 'onehot': OneHot encoding (n_tickers binary features per timestep)
        - 'label': Integer encoding (single feature per timestep)
        - 'none': No ticker encoding (original behavior)
    labeling_method : str, default='return'
        Label generation method:
        - 'return': Simple return threshold (original)
        - 'barrier': Triple-barrier labeling (recommended)
    take_profit : float, default=0.02
        Take-profit threshold for barrier method (e.g., 0.02 = 2%)
    stop_loss : float, default=0.01
        Stop-loss threshold for barrier method (e.g., 0.01 = 1%)
    max_barrier_horizon : int, default=5
        Maximum holding period for barrier method
    barrier_encoding : str, default='binary'
        Barrier label encoding: 'binary' or 'ternary'
    
    Returns
    -------
    X : np.ndarray, shape (n_samples, window, n_features + ticker_dims)
        Sequence features with ticker encoding
    y : np.ndarray, shape (n_samples,)
        Target labels (0 or 1 for binary, -1/0/1 for ternary)
    ticker_ids : np.ndarray, shape (n_samples,)
        Ticker identifier for each sequence (integer index)
    encoding_info : dict
        Ticker encoding information (label_encoder, onehot_encoder, ticker_names)
    
    Examples
    --------
    >>> df = build_unified_df('data/all_daily.parquet')
    >>> X, y, ticker_ids, info = build_sequences(df, window=30, encode_ticker='onehot')
    >>> print(X.shape, y.shape, ticker_ids.shape)
    (2500, 30, 10) (2500,) (2500,)  # 5 OHLCV + 5 OneHot features
    >>> print(info['ticker_names'])
    ['AAPL', 'GOOGL', 'MSFT', 'NVDA', 'TSLA']
    """
    if feature_cols is None:
        feature_cols = ['open', 'high', 'low', 'close', 'volume']
    
    # Validate columns
    required_cols = ['ticker', 'date', target_col] + feature_cols
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise ValueError(f"Missing columns: {missing}")
    
    # Encode tickers
    tickers = sorted(df['ticker'].unique())
    n_tickers = len(tickers)
    
    label_encoder = LabelEncoder()
    label_encoder.fit(tickers)
    
    onehot_encoder = None
    if encode_ticker == 'onehot':
        onehot_encoder = OneHotEncoder(sparse_output=False, categories='auto')
        onehot_encoder.fit(np.array(tickers).reshape(-1, 1))
    
    encoding_info = {
        'label_encoder': label_encoder,
        'onehot_encoder': onehot_encoder,
        'ticker_names': tickers,
        'n_tickers': n_tickers,
        'encode_method': encode_ticker
    }
    
    X_list = []
    y_list = []
    ticker_id_list = []
    
    # Process each ticker separately, then combine
    for ticker_idx, ticker in enumerate(tickers):
        ticker_df = df[df['ticker'] == ticker].sort_values('date').reset_index(drop=True)
        
        # Compute labels based on method
        prices = ticker_df[target_col].values
        
        if labeling_method == 'return':
            # Original method: simple forward returns
            returns = np.zeros(len(prices))
            returns[:-horizon] = (prices[horizon:] - prices[:-horizon]) / prices[:-horizon]
            labels = (returns > threshold).astype(int)
            sample_weights = None
            
        elif labeling_method == 'barrier':
            # Triple-barrier method (recommended)
            labels, horizon_to_barrier = compute_barrier_labels(
                prices,
                take_profit=take_profit,
                stop_loss=stop_loss,
                max_horizon=max_barrier_horizon,
                label_encoding=barrier_encoding
            )
            # Store barrier horizons for optional sample weighting
            sample_weights = horizon_to_barrier
        else:
            raise ValueError(f"Unknown labeling_method: {labeling_method}. Use 'return' or 'barrier'")
        
        # Extract feature matrix
        features = ticker_df[feature_cols].values
        
        # Prepare ticker encoding
        if encode_ticker == 'onehot':
            # OneHot: (window, n_tickers)
            ticker_encoding = onehot_encoder.transform([[ticker]])[0]
            ticker_encoding = np.tile(ticker_encoding, (window, 1))  # Repeat for each timestep
        elif encode_ticker == 'label':
            # Integer ID: (window, 1)
            ticker_encoding = np.full((window, 1), ticker_idx, dtype=np.float32)
        else:
            # No encoding
            ticker_encoding = None
        
        # Build sequences
        n_obs = len(ticker_df)
        for i in range(0, n_obs - window - horizon + 1, stride):
            seq_features = features[i:i+window]
            
            # Concatenate ticker encoding if enabled
            if ticker_encoding is not None:
                seq_features = np.concatenate([seq_features, ticker_encoding], axis=1)
            
            X_list.append(seq_features)
            y_list.append(labels[i+window-1])  # Label corresponds to end of window
            ticker_id_list.append(ticker_idx)
    
    if not X_list:
        raise ValueError(f"No sequences created. Check window={window}, horizon={horizon}, data length.")
    
    X = np.array(X_list)
    y = np.array(y_list)
    ticker_ids = np.array(ticker_id_list)
    
    return X, y, ticker_ids, encoding_info


def normalize_sequences(X: np.ndarray, method: str = 'zscore') -> Tuple[np.ndarray, dict]:
    """
    Normalize sequence features.
    
    Parameters
    ----------
    X : np.ndarray, shape (n_samples, window, n_features)
        Raw sequences
    method : str, default='zscore'
        Normalization method: 'zscore', 'minmax', or 'pct_change'
    
    Returns
    -------
    X_norm : np.ndarray
        Normalized sequences
    params : dict
        Normalization parameters (for inverse transform)
    """
    if method == 'zscore':
        mean = X.mean(axis=(0, 1), keepdims=True)
        std = X.std(axis=(0, 1), keepdims=True) + 1e-8
        X_norm = (X - mean) / std
        params = {'mean': mean, 'std': std}
    
    elif method == 'minmax':
        min_val = X.min(axis=(0, 1), keepdims=True)
        max_val = X.max(axis=(0, 1), keepdims=True)
        X_norm = (X - min_val) / (max_val - min_val + 1e-8)
        params = {'min': min_val, 'max': max_val}
    
    elif method == 'pct_change':
        # Normalize each sequence by its first value
        X_norm = np.zeros_like(X)
        for i in range(X.shape[0]):
            first_val = X[i, 0:1, :] + 1e-8
            X_norm[i] = (X[i] - first_val) / first_val
        params = {'method': 'pct_change'}
    
    else:
        raise ValueError(f"Unknown normalization method: {method}")
    
    return X_norm, params
