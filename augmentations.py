"""
augmentations.py
----------------
Time-series data augmentation for financial sequences.

⚠️ CRITICAL WARNINGS ⚠️
-----------------------
1. **ONLY use augmentations on TRAINING data** - never on validation/test sets
2. **DO NOT break temporal order** - financial time series have autocorrelation
3. **Apply augmentations PER-SEQUENCE** - not across different time periods
4. **Preserve causality** - augmentations should not introduce lookahead bias
5. **Use sparingly** - excessive augmentation can destroy predictive patterns

When to Use Augmentations
--------------------------
✓ Small datasets (< 5000 sequences)
✓ High-variance models prone to overfitting (deep neural networks)
✓ Imbalanced classes (augment minority class more)
✓ Robustness testing (evaluate model under noisy conditions)

When NOT to Use
---------------
✗ Large datasets (> 50k sequences) - risk of degrading signal
✗ Linear models (RF, GBM) - they handle noise well without augmentation
✗ If augmented performance >> real performance - indicates overfitting to noise
✗ High-frequency data - microstructure noise already high

Augmentation Methods
--------------------
1. **Window Bootstrap**: Sample random contiguous subwindow from sequence
   - Preserves temporal order within window
   - Good for: learning patterns at different time scales
   - Risk: shorter windows may miss long-term dependencies

2. **Jittering**: Add small Gaussian noise to price returns
   - Simulates microstructure noise, bid-ask bounce
   - Good for: robustness to measurement error
   - Risk: too much noise destroys predictive signal

3. **Scaling**: Multiply returns by random factor (e.g., 0.95-1.05)
   - Simulates volatility regime changes
   - Good for: generalization across different market conditions
   - Risk: changes risk/reward profile of patterns

4. **Time Warp**: Slight time-axis interpolation (compress/stretch)
   - Simulates faster/slower price dynamics
   - Good for: robustness to varying market speeds
   - Risk: computationally expensive, can introduce artifacts

Best Practices
--------------
- Start with jittering (simplest, safest)
- Use small augmentation factors (n_aug_per_sample = 1-2)
- Validate augmented model on real (non-augmented) test set
- Compare augmented vs non-augmented performance
- Monitor for degradation in test performance
"""

import numpy as np
from typing import List, Tuple, Literal, Callable
from scipy.interpolate import interp1d


def window_bootstrap(
    X: np.ndarray,
    y: np.ndarray,
    min_window_ratio: float = 0.7,
    seed: int = None
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Sample random contiguous subwindow from each sequence.
    
    Preserves temporal order by taking consecutive time steps.
    Window size is randomly chosen between min_window_ratio * original_length and original_length.
    
    Parameters
    ----------
    X : np.ndarray, shape (n_samples, window, n_features)
        Input sequences
    y : np.ndarray, shape (n_samples,)
        Target labels
    min_window_ratio : float, default=0.7
        Minimum window size as fraction of original (0.7 = at least 70% of original)
    seed : int, optional
        Random seed for reproducibility
    
    Returns
    -------
    X_aug : np.ndarray, shape (n_samples, window, n_features)
        Augmented sequences (padded to original window size)
    y_aug : np.ndarray
        Original labels (unchanged)
    
    Example
    -------
    >>> X_aug, y_aug = window_bootstrap(X_train, y_train, min_window_ratio=0.8)
    """
    if seed is not None:
        np.random.seed(seed)
    
    n_samples, window, n_features = X.shape
    X_aug = np.zeros_like(X)
    
    for i in range(n_samples):
        # Random window size
        min_len = int(window * min_window_ratio)
        win_len = np.random.randint(min_len, window + 1)
        
        # Random start position
        max_start = window - win_len
        start = np.random.randint(0, max_start + 1) if max_start > 0 else 0
        
        # Extract subwindow
        subwindow = X[i, start:start + win_len, :]
        
        # Pad to original window size (zero-pad at beginning)
        pad_len = window - win_len
        if pad_len > 0:
            X_aug[i] = np.vstack([np.zeros((pad_len, n_features)), subwindow])
        else:
            X_aug[i] = subwindow
    
    return X_aug, y.copy()


def jittering(
    X: np.ndarray,
    y: np.ndarray,
    noise_std: float = 0.01,
    seed: int = None
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Add small Gaussian noise to price features.
    
    Simulates microstructure noise, bid-ask bounce, and measurement error.
    Noise is added to RETURNS, not raw prices, to preserve scale invariance.
    
    Parameters
    ----------
    X : np.ndarray, shape (n_samples, window, n_features)
        Input sequences
    y : np.ndarray
        Target labels
    noise_std : float, default=0.01
        Standard deviation of noise relative to data std
        0.01 = add 1% of feature std as noise
    seed : int, optional
        Random seed
    
    Returns
    -------
    X_aug : np.ndarray
        Noisy sequences
    y_aug : np.ndarray
        Original labels
    
    Example
    -------
    >>> X_aug, y_aug = jittering(X_train, y_train, noise_std=0.02)
    """
    if seed is not None:
        np.random.seed(seed)
    
    n_samples, window, n_features = X.shape
    
    # Compute feature-wise std across all samples and time steps
    feature_stds = X.reshape(-1, n_features).std(axis=0)
    
    # Generate noise with magnitude proportional to feature std
    noise = np.random.normal(0, noise_std, size=X.shape)
    noise = noise * feature_stds[None, None, :]
    
    X_aug = X + noise
    
    return X_aug, y.copy()


def scaling(
    X: np.ndarray,
    y: np.ndarray,
    scale_range: Tuple[float, float] = (0.95, 1.05),
    seed: int = None
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Scale returns by random factor to simulate volatility regime changes.
    
    Each sequence gets a random scaling factor applied uniformly across all time steps.
    This preserves relative relationships while changing overall magnitude.
    
    Parameters
    ----------
    X : np.ndarray, shape (n_samples, window, n_features)
        Input sequences
    y : np.ndarray
        Target labels
    scale_range : tuple, default=(0.95, 1.05)
        Range for uniform sampling of scale factors
        (0.95, 1.05) = scale by 95%-105% of original
    seed : int, optional
        Random seed
    
    Returns
    -------
    X_aug : np.ndarray
        Scaled sequences
    y_aug : np.ndarray
        Original labels
    
    Example
    -------
    >>> X_aug, y_aug = scaling(X_train, y_train, scale_range=(0.9, 1.1))
    """
    if seed is not None:
        np.random.seed(seed)
    
    n_samples = X.shape[0]
    
    # Sample scale factor per sequence
    scales = np.random.uniform(scale_range[0], scale_range[1], size=n_samples)
    
    # Apply scaling (broadcast across window and features)
    X_aug = X * scales[:, None, None]
    
    return X_aug, y.copy()


def time_warp(
    X: np.ndarray,
    y: np.ndarray,
    warp_range: Tuple[float, float] = (0.9, 1.1),
    seed: int = None
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Warp time axis by slight interpolation (compress/stretch).
    
    ⚠️ WARNING: This is computationally expensive and can introduce interpolation artifacts.
    Use sparingly and only when temporal dynamics variability is important.
    
    Warping simulates faster/slower market dynamics (e.g., volatile vs calm periods).
    
    Parameters
    ----------
    X : np.ndarray, shape (n_samples, window, n_features)
        Input sequences
    y : np.ndarray
        Target labels
    warp_range : tuple, default=(0.9, 1.1)
        Range for time compression/expansion
        0.9 = compress (faster dynamics), 1.1 = stretch (slower)
    seed : int, optional
        Random seed
    
    Returns
    -------
    X_aug : np.ndarray
        Time-warped sequences
    y_aug : np.ndarray
        Original labels
    
    Example
    -------
    >>> X_aug, y_aug = time_warp(X_train, y_train, warp_range=(0.95, 1.05))
    """
    if seed is not None:
        np.random.seed(seed)
    
    n_samples, window, n_features = X.shape
    X_aug = np.zeros_like(X)
    
    for i in range(n_samples):
        # Sample warp factor
        warp_factor = np.random.uniform(warp_range[0], warp_range[1])
        
        # Original time axis
        t_orig = np.arange(window)
        
        # Warped time axis
        t_warp = np.linspace(0, window - 1, int(window * warp_factor))
        
        # Interpolate each feature
        for j in range(n_features):
            interp_func = interp1d(t_orig, X[i, :, j], kind='linear', fill_value='extrapolate')
            
            # Resample to original window size
            t_resample = np.linspace(t_warp[0], t_warp[-1], window)
            X_aug[i, :, j] = interp_func(t_resample)
    
    return X_aug, y.copy()


def augment_dataset(
    X: np.ndarray,
    y: np.ndarray,
    methods: List[Literal['window_bootstrap', 'jittering', 'scaling', 'time_warp']] = None,
    n_aug_per_sample: int = 2,
    method_params: dict = None,
    seed: int = None
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Apply multiple augmentation methods to dataset.
    
    ⚠️ CRITICAL: Only use on TRAINING data. Never augment validation/test sets.
    
    For each original sample, generate n_aug_per_sample augmented versions by randomly
    selecting augmentation methods from the provided list.
    
    Parameters
    ----------
    X : np.ndarray, shape (n_samples, window, n_features)
        Original sequences
    y : np.ndarray, shape (n_samples,)
        Original labels
    methods : list, optional
        List of augmentation methods to use. If None, uses ['jittering', 'scaling']
        Options: 'window_bootstrap', 'jittering', 'scaling', 'time_warp'
    n_aug_per_sample : int, default=2
        Number of augmented versions to create per original sample
        Final dataset size = n_samples * (1 + n_aug_per_sample)
    method_params : dict, optional
        Parameters for each method, e.g.:
        {
            'jittering': {'noise_std': 0.01},
            'scaling': {'scale_range': (0.95, 1.05)},
            'time_warp': {'warp_range': (0.9, 1.1)},
            'window_bootstrap': {'min_window_ratio': 0.7}
        }
    seed : int, optional
        Random seed for reproducibility
    
    Returns
    -------
    X_aug : np.ndarray, shape (n_samples * (1 + n_aug_per_sample), window, n_features)
        Combined original + augmented sequences
    y_aug : np.ndarray, shape (n_samples * (1 + n_aug_per_sample),)
        Combined labels
    
    Examples
    --------
    >>> # Simple usage: jittering + scaling
    >>> X_aug, y_aug = augment_dataset(X_train, y_train, n_aug_per_sample=1)
    >>> print(f"Original: {X_train.shape}, Augmented: {X_aug.shape}")
    Original: (1000, 30, 5), Augmented: (2000, 30, 5)
    
    >>> # Custom parameters
    >>> params = {
    ...     'jittering': {'noise_std': 0.02},
    ...     'scaling': {'scale_range': (0.9, 1.1)}
    ... }
    >>> X_aug, y_aug = augment_dataset(
    ...     X_train, y_train,
    ...     methods=['jittering', 'scaling'],
    ...     n_aug_per_sample=2,
    ...     method_params=params
    ... )
    
    >>> # All methods
    >>> X_aug, y_aug = augment_dataset(
    ...     X_train, y_train,
    ...     methods=['window_bootstrap', 'jittering', 'scaling', 'time_warp'],
    ...     n_aug_per_sample=3
    ... )
    """
    if methods is None:
        methods = ['jittering', 'scaling']  # Safe defaults
    
    if method_params is None:
        method_params = {}
    
    if seed is not None:
        np.random.seed(seed)
    
    # Map method names to functions
    aug_funcs = {
        'window_bootstrap': window_bootstrap,
        'jittering': jittering,
        'scaling': scaling,
        'time_warp': time_warp
    }
    
    # Validate methods
    invalid = [m for m in methods if m not in aug_funcs]
    if invalid:
        raise ValueError(f"Invalid augmentation methods: {invalid}. Choose from {list(aug_funcs.keys())}")
    
    # Start with original data
    X_combined = [X]
    y_combined = [y]
    
    # Generate augmented samples
    n_samples = len(X)
    for _ in range(n_aug_per_sample):
        # Randomly select method for each sample
        selected_methods = np.random.choice(methods, size=n_samples)
        
        X_aug_batch = np.zeros_like(X)
        
        for i, method in enumerate(selected_methods):
            # Get augmentation function and parameters
            aug_func = aug_funcs[method]
            params = method_params.get(method, {})
            
            # Augment single sample
            X_single = X[i:i+1]
            y_single = y[i:i+1]
            
            X_aug_single, _ = aug_func(X_single, y_single, **params)
            X_aug_batch[i] = X_aug_single[0]
        
        X_combined.append(X_aug_batch)
        y_combined.append(y.copy())
    
    # Concatenate all batches
    X_final = np.concatenate(X_combined, axis=0)
    y_final = np.concatenate(y_combined, axis=0)
    
    return X_final, y_final


def balanced_augmentation(
    X: np.ndarray,
    y: np.ndarray,
    target_ratio: float = 1.0,
    methods: List[str] = None,
    method_params: dict = None,
    seed: int = None
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Augment minority class to balance dataset.
    
    Useful for imbalanced binary classification (e.g., rare events).
    
    Parameters
    ----------
    X : np.ndarray, shape (n_samples, window, n_features)
        Original sequences
    y : np.ndarray, shape (n_samples,)
        Binary labels (0 or 1)
    target_ratio : float, default=1.0
        Target ratio of minority/majority class
        1.0 = perfectly balanced, 0.5 = minority is half of majority
    methods : list, optional
        Augmentation methods to use
    method_params : dict, optional
        Parameters for augmentation methods
    seed : int, optional
        Random seed
    
    Returns
    -------
    X_balanced : np.ndarray
        Balanced sequences
    y_balanced : np.ndarray
        Balanced labels
    
    Example
    -------
    >>> # Original: 800 class 0, 200 class 1
    >>> X_bal, y_bal = balanced_augmentation(X_train, y_train, target_ratio=1.0)
    >>> # Result: 800 class 0, 800 class 1 (augmented 600 minority samples)
    """
    if methods is None:
        methods = ['jittering', 'scaling']
    
    if seed is not None:
        np.random.seed(seed)
    
    # Identify minority and majority classes
    unique, counts = np.unique(y, return_counts=True)
    if len(unique) != 2:
        raise ValueError("balanced_augmentation only supports binary classification")
    
    minority_class = unique[np.argmin(counts)]
    majority_class = unique[np.argmax(counts)]
    minority_count = counts.min()
    majority_count = counts.max()
    
    # Calculate number of augmentations needed
    target_minority_count = int(majority_count * target_ratio)
    n_aug_needed = target_minority_count - minority_count
    
    if n_aug_needed <= 0:
        print(f"Dataset already balanced (minority: {minority_count}, majority: {majority_count})")
        return X.copy(), y.copy()
    
    # Extract minority samples
    minority_mask = y == minority_class
    X_minority = X[minority_mask]
    y_minority = y[minority_mask]
    
    # Augment minority class
    n_aug_per_sample = n_aug_needed // minority_count + 1
    X_minority_aug, y_minority_aug = augment_dataset(
        X_minority, y_minority,
        methods=methods,
        n_aug_per_sample=n_aug_per_sample,
        method_params=method_params,
        seed=seed
    )
    
    # Take only the needed number of augmented samples
    X_minority_aug = X_minority_aug[:target_minority_count]
    y_minority_aug = y_minority_aug[:target_minority_count]
    
    # Combine with original data
    X_balanced = np.concatenate([X, X_minority_aug], axis=0)
    y_balanced = np.concatenate([y, y_minority_aug], axis=0)
    
    # Shuffle
    shuffle_idx = np.random.permutation(len(y_balanced))
    X_balanced = X_balanced[shuffle_idx]
    y_balanced = y_balanced[shuffle_idx]
    
    print(f"Augmentation complete:")
    print(f"  Original - Class {minority_class}: {minority_count}, Class {majority_class}: {majority_count}")
    print(f"  Balanced - Class {minority_class}: {(y_balanced == minority_class).sum()}, Class {majority_class}: {(y_balanced == majority_class).sum()}")
    
    return X_balanced, y_balanced


if __name__ == '__main__':
    """
    Example usage and sanity checks for augmentation functions.
    """
    import sys
    import os
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    print("=" * 80)
    print("Time-Series Augmentation Demonstration")
    print("=" * 80)
    
    # Load sequences
    import joblib
    try:
        X, y = joblib.load('data/train_sequences.joblib')
        print(f"\n1. Loaded sequences: X shape = {X.shape}, y shape = {y.shape}")
        print(f"   Class distribution: {dict(zip(*np.unique(y, return_counts=True)))}")
    except FileNotFoundError:
        print("\n⚠️  No sequences found. Run this first:")
        print("   python -c \"from src.multi_agg import build_unified_df; from src.sequence_builder import build_sequences; ...")
        sys.exit(1)
    
    # Take small subset for demo
    X_demo = X[:100]
    y_demo = y[:100]
    
    print(f"\n2. Testing individual augmentation methods (using first 100 samples)...")
    
    # Window bootstrap
    X_wb, y_wb = window_bootstrap(X_demo, y_demo, min_window_ratio=0.7, seed=42)
    print(f"   Window Bootstrap: X shape = {X_wb.shape}, labels preserved = {np.array_equal(y_wb, y_demo)}")
    
    # Jittering
    X_jit, y_jit = jittering(X_demo, y_demo, noise_std=0.01, seed=42)
    noise_magnitude = np.abs(X_jit - X_demo).mean()
    print(f"   Jittering: X shape = {X_jit.shape}, avg noise = {noise_magnitude:.6f}")
    
    # Scaling
    X_scl, y_scl = scaling(X_demo, y_demo, scale_range=(0.95, 1.05), seed=42)
    scale_ratio = (X_scl / (X_demo + 1e-8)).mean()
    print(f"   Scaling: X shape = {X_scl.shape}, avg scale factor = {scale_ratio:.4f}")
    
    # Time warp (small sample due to computational cost)
    X_tw, y_tw = time_warp(X_demo[:10], y_demo[:10], warp_range=(0.95, 1.05), seed=42)
    print(f"   Time Warp: X shape = {X_tw.shape} (tested on 10 samples only)")
    
    print(f"\n3. Testing combined augmentation...")
    X_aug, y_aug = augment_dataset(
        X_demo, y_demo,
        methods=['jittering', 'scaling'],
        n_aug_per_sample=2,
        seed=42
    )
    print(f"   Input: {X_demo.shape}")
    print(f"   Output: {X_aug.shape} (3x original: 1 original + 2 augmented)")
    print(f"   Label distribution: {dict(zip(*np.unique(y_aug, return_counts=True)))}")
    
    print(f"\n4. Testing balanced augmentation...")
    # Create imbalanced subset
    mask_0 = y_demo == 0
    mask_1 = y_demo == 1
    n_minority = min(mask_0.sum(), mask_1.sum())
    
    # Keep all minority, subsample majority to create imbalance
    if mask_0.sum() < mask_1.sum():
        minority_mask = mask_0
        majority_mask = mask_1
    else:
        minority_mask = mask_1
        majority_mask = mask_0
    
    # Create imbalance (keep all minority, reduce majority)
    majority_idx = np.where(majority_mask)[0]
    minority_idx = np.where(minority_mask)[0]
    
    # Only keep half of majority class to create 2:1 imbalance
    n_majority_keep = min(len(majority_idx), int(n_minority * 2))
    keep_majority = np.random.choice(majority_idx, size=n_majority_keep, replace=False)
    
    imbalanced_idx = np.concatenate([minority_idx, keep_majority])
    X_imb = X_demo[imbalanced_idx]
    y_imb = y_demo[imbalanced_idx]
    
    print(f"   Original imbalanced: {dict(zip(*np.unique(y_imb, return_counts=True)))}")
    
    X_bal, y_bal = balanced_augmentation(
        X_imb, y_imb,
        target_ratio=1.0,
        methods=['jittering', 'scaling'],
        seed=42
    )
    
    print(f"\n5. ⚠️  CRITICAL REMINDERS:")
    print(f"   • Only augment TRAINING data")
    print(f"   • Validate on non-augmented test set")
    print(f"   • Use sparingly (1-2 aug per sample)")
    print(f"   • Monitor for performance degradation")
    print(f"   • Temporal order must be preserved")
    
    print("\n" + "=" * 80)
    print("Demonstration complete!")
    print("=" * 80)
