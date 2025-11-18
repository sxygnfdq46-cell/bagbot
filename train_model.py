# Enhanced by Copilot for institutional-grade ML pipeline - 2025-11-18
"""
Enhanced training script for The Bag Bot ML model.
Features: Advanced hyperparameter optimization, multiple label strategies,
ensemble methods, and comprehensive model validation.
"""

import pandas as pd
import numpy as np
import lightgbm as lgb
import xgboost as xgb
from sklearn.model_selection import TimeSeriesSplit, RandomizedSearchCV
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, precision_recall_curve
from sklearn.ensemble import VotingClassifier
from sklearn.linear_model import LogisticRegression
import joblib
import json
import shap
import optuna
import os
from typing import Dict, Tuple, Any, List
import argparse
from datetime import datetime
import warnings
import logging
import matplotlib.pyplot as plt
import seaborn as sns

warnings.filterwarnings('ignore')
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_labels(df: pd.DataFrame, lookahead: int = 3, threshold: float = 0.001, strategy: str = 'binary') -> pd.Series:
    """
    Create labels for price prediction with multiple strategies.
    
    Args:
        df: DataFrame with price data
        lookahead: Number of periods to look ahead  
        threshold: Minimum price change threshold for signal
        strategy: Label strategy ('binary', 'ternary', 'quintile', 'regression')
        
    Returns:
        Labels based on selected strategy
    """
    future_returns = df['close'].shift(-lookahead) / df['close'] - 1
    
    if strategy == 'binary':
        # Binary classification: up (1) vs down (0)
        labels = (future_returns > threshold).astype(int)
        
    elif strategy == 'ternary':
        # Three classes: strong up, neutral, strong down
        labels = pd.Series(1, index=df.index)  # Neutral
        labels[future_returns > threshold] = 2   # Strong up
        labels[future_returns < -threshold] = 0  # Strong down
        
    elif strategy == 'quintile':
        # Quintile-based ranking (0-4)
        labels = pd.qcut(future_returns, q=5, labels=False, duplicates='drop')
        
    elif strategy == 'regression':
        # Direct returns prediction
        labels = future_returns
        
    else:
        raise ValueError(f"Unknown strategy: {strategy}")
    
    logger.info(f"Created {strategy} labels with {lookahead} period lookahead")
    if strategy != 'regression':
        logger.info(f"Label distribution: {labels.value_counts().sort_index().to_dict()}")
    
    return labels

def optimize_hyperparameters(X: pd.DataFrame, y: pd.Series, n_trials: int = 100) -> Dict:
    """
    Optimize hyperparameters using Optuna.
    
    Args:
        X: Feature matrix
        y: Target vector
        n_trials: Number of optimization trials
        
    Returns:
        Best parameters found
    """
    def objective(trial):
        params = {
            'objective': 'binary',
            'metric': 'binary_logloss',
            'boosting_type': 'gbdt',
            'num_leaves': trial.suggest_int('num_leaves', 10, 100),
            'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3),
            'feature_fraction': trial.suggest_float('feature_fraction', 0.4, 1.0),
            'bagging_fraction': trial.suggest_float('bagging_fraction', 0.4, 1.0),
            'bagging_freq': trial.suggest_int('bagging_freq', 1, 7),
            'min_child_samples': trial.suggest_int('min_child_samples', 5, 100),
            'lambda_l1': trial.suggest_float('lambda_l1', 0, 10),
            'lambda_l2': trial.suggest_float('lambda_l2', 0, 10),
            'verbosity': -1,
            'random_state': 42,
            'n_estimators': 300
        }
        
        model = lgb.LGBMClassifier(**params)
        
        # Cross-validation score
        tscv = TimeSeriesSplit(n_splits=3)
        scores = []
        
        for train_idx, val_idx in tscv.split(X):
            X_train_fold, X_val_fold = X.iloc[train_idx], X.iloc[val_idx]
            y_train_fold, y_val_fold = y.iloc[train_idx], y.iloc[val_idx]
            
            model.fit(
                X_train_fold, y_train_fold,
                eval_set=[(X_val_fold, y_val_fold)],
                callbacks=[lgb.early_stopping(50), lgb.log_evaluation(0)]
            )
            
            val_pred_proba = model.predict_proba(X_val_fold)[:, 1]
            score = roc_auc_score(y_val_fold, val_pred_proba)
            scores.append(score)
        
        return np.mean(scores)
    
    logger.info("Starting hyperparameter optimization...")
    study = optuna.create_study(direction='maximize')
    study.optimize(objective, n_trials=n_trials)
    
    logger.info(f"Best score: {study.best_value:.4f}")
    logger.info(f"Best params: {study.best_params}")
    
    return study.best_params

def create_ensemble_model(X: pd.DataFrame, y: pd.Series, best_lgb_params: Dict) -> VotingClassifier:
    """
    Create ensemble model combining LightGBM, XGBoost, and Logistic Regression.
    
    Args:
        X: Feature matrix
        y: Target vector
        best_lgb_params: Optimized LightGBM parameters
        
    Returns:
        Trained ensemble model
    """
    logger.info("Creating ensemble model...")
    
    # LightGBM
    lgb_model = lgb.LGBMClassifier(**best_lgb_params)
    
    # XGBoost
    xgb_model = xgb.XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        eval_metric='logloss'
    )
    
    # Logistic Regression (as baseline)
    lr_model = LogisticRegression(
        random_state=42,
        max_iter=1000,
        class_weight='balanced'
    )
    
    # Create ensemble
    ensemble = VotingClassifier(
        estimators=[
            ('lgb', lgb_model),
            ('xgb', xgb_model),
            ('lr', lr_model)
        ],
        voting='soft'
    )
    
    # Train ensemble
    ensemble.fit(X, y)
    
    return ensemble

def prepare_features(df: pd.DataFrame, target_col: str = 'target') -> Tuple[pd.DataFrame, pd.Series]:
    """Prepare features and target for training."""
    # Remove non-feature columns
    feature_cols = [col for col in df.columns if col not in [
        'open', 'high', 'low', 'close', 'volume', target_col,
        'timestamp', 'bb_upper', 'bb_middle', 'bb_lower'  # Keep ratios instead
    ]]
    
    X = df[feature_cols].copy()
    y = df[target_col].copy()
    
    # Remove rows with NaN
    valid_idx = (~X.isnull().any(axis=1)) & (~y.isnull())
    X = X[valid_idx]
    y = y[valid_idx]
    
    print(f"Features shape: {X.shape}")
    print(f"Target distribution: {y.value_counts().to_dict()}")
    
    return X, y

def train_lightgbm_model(X: pd.DataFrame, y: pd.Series, params: Dict = None, optimize: bool = True) -> Tuple[lgb.LGBMClassifier, Dict]:
    """
    Train LightGBM model with advanced validation and optional optimization.
    
    Args:
        X: Feature matrix
        y: Target vector  
        params: Model parameters (if None, will use optimized params)
        optimize: Whether to run hyperparameter optimization
        
    Returns:
        Trained model and evaluation metrics
    """
    if params is None or optimize:
        if optimize:
            logger.info("Running hyperparameter optimization...")
            params = optimize_hyperparameters(X, y)
        else:
            params = {
                'objective': 'binary',
                'metric': 'binary_logloss',
                'boosting_type': 'gbdt',
                'num_leaves': 31,
                'learning_rate': 0.05,
                'feature_fraction': 0.8,
                'bagging_fraction': 0.8,
                'bagging_freq': 5,
                'verbosity': -1,
                'random_state': 42,
                'n_estimators': 300
            }
    
    model = lgb.LGBMClassifier(**params)
    
    # Enhanced time series cross-validation
    tscv = TimeSeriesSplit(n_splits=5)
    cv_scores = []
    cv_auc_scores = []
    cv_precision_scores = []
    cv_recall_scores = []
    
    feature_importance_folds = []
    
    for fold, (train_idx, val_idx) in enumerate(tscv.split(X)):
        X_train_fold, X_val_fold = X.iloc[train_idx], X.iloc[val_idx]
        y_train_fold, y_val_fold = y.iloc[train_idx], y.iloc[val_idx]
        
        # Train with early stopping
        model.fit(
            X_train_fold, y_train_fold,
            eval_set=[(X_val_fold, y_val_fold)],
            callbacks=[lgb.early_stopping(50), lgb.log_evaluation(0)]
        )
        
        val_pred = model.predict(X_val_fold)
        val_pred_proba = model.predict_proba(X_val_fold)[:, 1]
        
        # Comprehensive metrics
        accuracy = (val_pred == y_val_fold).mean()
        auc = roc_auc_score(y_val_fold, val_pred_proba)
        
        # Precision and recall for positive class
        from sklearn.metrics import precision_score, recall_score
        precision = precision_score(y_val_fold, val_pred, zero_division=0)
        recall = recall_score(y_val_fold, val_pred, zero_division=0)
        
        cv_scores.append(accuracy)
        cv_auc_scores.append(auc)
        cv_precision_scores.append(precision)
        cv_recall_scores.append(recall)
        
        # Store feature importance
        feature_importance_folds.append(model.feature_importances_)
        
        logger.info(f"Fold {fold + 1}: Acc={accuracy:.4f}, AUC={auc:.4f}, Prec={precision:.4f}, Rec={recall:.4f}")
    
    # Train final model on all data
    logger.info("Training final model on full dataset...")
    model.fit(X, y)
    
    # Aggregate feature importance across folds
    mean_feature_importance = np.mean(feature_importance_folds, axis=0)
    std_feature_importance = np.std(feature_importance_folds, axis=0)
    
    metrics = {
        'cv_accuracy_mean': np.mean(cv_scores),
        'cv_accuracy_std': np.std(cv_scores),
        'cv_auc_mean': np.mean(cv_auc_scores),
        'cv_auc_std': np.std(cv_auc_scores),
        'cv_precision_mean': np.mean(cv_precision_scores),
        'cv_precision_std': np.std(cv_precision_scores),
        'cv_recall_mean': np.mean(cv_recall_scores),
        'cv_recall_std': np.std(cv_recall_scores),
        'feature_importance_mean': dict(zip(X.columns, mean_feature_importance)),
        'feature_importance_std': dict(zip(X.columns, std_feature_importance)),
        'model_params': params
    }
    
    return model, metrics

def evaluate_model_performance(model, X_test: pd.DataFrame, y_test: pd.Series, output_dir: str) -> Dict:
    """
    Comprehensive model evaluation with visualizations.
    
    Args:
        model: Trained model
        X_test: Test features
        y_test: Test targets
        output_dir: Directory to save plots
        
    Returns:
        Dictionary of evaluation metrics
    """
    test_pred = model.predict(X_test)
    test_pred_proba = model.predict_proba(X_test)[:, 1]
    
    # Basic metrics
    test_accuracy = (test_pred == y_test).mean()
    test_auc = roc_auc_score(y_test, test_pred_proba)
    
    from sklearn.metrics import precision_score, recall_score, f1_score
    test_precision = precision_score(y_test, test_pred, zero_division=0)
    test_recall = recall_score(y_test, test_pred, zero_division=0)
    test_f1 = f1_score(y_test, test_pred, zero_division=0)
    
    # Create evaluation plots
    fig, axes = plt.subplots(2, 2, figsize=(15, 12))
    
    # 1. ROC Curve
    from sklearn.metrics import roc_curve
    fpr, tpr, _ = roc_curve(y_test, test_pred_proba)
    axes[0, 0].plot(fpr, tpr, label=f'ROC (AUC = {test_auc:.3f})')
    axes[0, 0].plot([0, 1], [0, 1], 'k--')
    axes[0, 0].set_xlabel('False Positive Rate')
    axes[0, 0].set_ylabel('True Positive Rate')
    axes[0, 0].set_title('ROC Curve')
    axes[0, 0].legend()
    
    # 2. Precision-Recall Curve
    precision_vals, recall_vals, _ = precision_recall_curve(y_test, test_pred_proba)
    axes[0, 1].plot(recall_vals, precision_vals)
    axes[0, 1].set_xlabel('Recall')
    axes[0, 1].set_ylabel('Precision')
    axes[0, 1].set_title('Precision-Recall Curve')
    
    # 3. Confusion Matrix
    cm = confusion_matrix(y_test, test_pred)
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=axes[1, 0])
    axes[1, 0].set_title('Confusion Matrix')
    axes[1, 0].set_ylabel('True Label')
    axes[1, 0].set_xlabel('Predicted Label')
    
    # 4. Prediction Distribution
    axes[1, 1].hist(test_pred_proba[y_test == 0], alpha=0.5, label='Negative', bins=30)
    axes[1, 1].hist(test_pred_proba[y_test == 1], alpha=0.5, label='Positive', bins=30)
    axes[1, 1].set_xlabel('Predicted Probability')
    axes[1, 1].set_ylabel('Frequency')
    axes[1, 1].set_title('Prediction Distribution')
    axes[1, 1].legend()
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'evaluation_plots.png'), dpi=300, bbox_inches='tight')
    plt.close()
    
    # Calculate Sharpe-like ratio for trading
    # Simulate daily returns based on predictions
    returns_when_predicted_up = y_test[test_pred == 1]
    if len(returns_when_predicted_up) > 0:
        trading_accuracy = returns_when_predicted_up.mean()
        trading_sharpe = returns_when_predicted_up.mean() / returns_when_predicted_up.std() if returns_when_predicted_up.std() > 0 else 0
    else:
        trading_accuracy = 0
        trading_sharpe = 0
    
    metrics = {
        'test_accuracy': test_accuracy,
        'test_auc': test_auc,
        'test_precision': test_precision,
        'test_recall': test_recall,
        'test_f1': test_f1,
        'trading_accuracy': trading_accuracy,
        'trading_sharpe': trading_sharpe,
        'confusion_matrix': cm.tolist()
    }
    
    logger.info("Test Set Performance:")
    logger.info(f"  Accuracy: {test_accuracy:.4f}")
    logger.info(f"  AUC: {test_auc:.4f}")
    logger.info(f"  Precision: {test_precision:.4f}")
    logger.info(f"  Recall: {test_recall:.4f}")
    logger.info(f"  F1-Score: {test_f1:.4f}")
    
    return metrics

def generate_shap_analysis(model: lgb.LGBMClassifier, X: pd.DataFrame, output_dir: str):
    """Generate SHAP feature importance analysis."""
    print("Generating SHAP analysis...")
    
    # Use a sample for SHAP if dataset is large
    sample_size = min(1000, len(X))
    X_sample = X.sample(n=sample_size, random_state=42)
    
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_sample)
    
    # If binary classification, take positive class
    if isinstance(shap_values, list):
        shap_values = shap_values[1]
    
    # Create SHAP summary
    shap_summary = pd.DataFrame({
        'feature': X.columns,
        'mean_abs_shap': np.abs(shap_values).mean(axis=0)
    }).sort_values('mean_abs_shap', ascending=False)
    
    shap_summary.to_csv(os.path.join(output_dir, 'shap_summary.csv'), index=False)
    
    # Save SHAP values
    np.save(os.path.join(output_dir, 'shap_values.npy'), shap_values)
    
    print(f"Top 10 SHAP features:\n{shap_summary.head(10)}")
    
    return shap_summary

def save_model_artifacts(model: lgb.LGBMClassifier, metrics: Dict, feature_names: list, output_dir: str):
    """Save model and metadata."""
    os.makedirs(output_dir, exist_ok=True)
    
    # Save model
    model_path = os.path.join(output_dir, 'best_model.joblib')
    joblib.dump(model, model_path)
    
    # Save metadata
    metadata = {
        'model_type': 'LightGBM',
        'feature_names': feature_names,
        'n_features': len(feature_names),
        'training_date': datetime.now().isoformat(),
        'metrics': metrics,
        'model_params': model.get_params()
    }
    
    metadata_path = os.path.join(output_dir, 'metadata.json')
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"Model saved to {model_path}")
    print(f"Metadata saved to {metadata_path}")
    
    return model_path, metadata_path

def main():
    parser = argparse.ArgumentParser(description='Enhanced Training for The Bag Bot ML Model')
    parser.add_argument('--data', required=True, help='Input features parquet file')
    parser.add_argument('--out', default='models/', help='Output directory')
    parser.add_argument('--lookahead', type=int, default=3, help='Prediction lookahead periods')
    parser.add_argument('--threshold', type=float, default=0.001, help='Price change threshold')
    parser.add_argument('--test-split', type=float, default=0.2, help='Test set proportion')
    parser.add_argument('--strategy', default='binary', choices=['binary', 'ternary', 'quintile', 'regression'],
                       help='Label creation strategy')
    parser.add_argument('--optimize', action='store_true', help='Run hyperparameter optimization')
    parser.add_argument('--ensemble', action='store_true', help='Train ensemble model')
    parser.add_argument('--n-trials', type=int, default=50, help='Optimization trials')
    
    args = parser.parse_args()
    
    # Setup directories
    os.makedirs(args.out, exist_ok=True)
    os.makedirs(os.path.join(args.out, '../reports'), exist_ok=True)
    
    # Load data
    logger.info(f"Loading data from {args.data}")
    df = pd.read_parquet(args.data)
    logger.info(f"Loaded {len(df)} rows, {len(df.columns)} columns")
    
    # Create labels
    logger.info(f"Creating {args.strategy} labels with {args.lookahead} period lookahead")
    df['target'] = create_labels(df, lookahead=args.lookahead, threshold=args.threshold, strategy=args.strategy)
    df = df.dropna(subset=['target'])
    
    logger.info(f"Dataset shape after labeling: {df.shape}")
    
    # Prepare features
    X, y = prepare_features(df)
    
    # Time-based train-test split
    split_idx = int(len(X) * (1 - args.test_split))
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
    
    logger.info(f"Train set: {X_train.shape}, Test set: {X_test.shape}")
    
    # Model training
    if args.ensemble:
        logger.info("Training ensemble model...")
        # First get best LightGBM params
        best_params = optimize_hyperparameters(X_train, y_train, n_trials=args.n_trials) if args.optimize else None
        if best_params is None:
            best_params = {
                'objective': 'binary', 'metric': 'binary_logloss', 'boosting_type': 'gbdt',
                'num_leaves': 31, 'learning_rate': 0.05, 'feature_fraction': 0.8,
                'bagging_fraction': 0.8, 'bagging_freq': 5, 'verbosity': -1,
                'random_state': 42, 'n_estimators': 300
            }
        
        model = create_ensemble_model(X_train, y_train, best_params)
        
        # Evaluate ensemble
        test_pred = model.predict(X_test)
        test_pred_proba = model.predict_proba(X_test)[:, 1]
        test_accuracy = (test_pred == y_test).mean()
        test_auc = roc_auc_score(y_test, test_pred_proba)
        
        metrics = {
            'model_type': 'ensemble',
            'test_accuracy': test_accuracy,
            'test_auc': test_auc,
            'ensemble_params': best_params
        }
        
    else:
        logger.info("Training single LightGBM model...")
        model, cv_metrics = train_lightgbm_model(X_train, y_train, optimize=args.optimize)
        
        # Comprehensive evaluation
        test_metrics = evaluate_model_performance(model, X_test, y_test, os.path.join(args.out, '../reports'))
        
        # Combine metrics
        metrics = {**cv_metrics, **test_metrics, 'model_type': 'lightgbm'}
    
    logger.info(f"Final Test Accuracy: {metrics['test_accuracy']:.4f}")
    logger.info(f"Final Test AUC: {metrics['test_auc']:.4f}")
    
    # Generate enhanced reports
    reports_dir = os.path.join(args.out, '../reports')
    
    # Classification report
    test_pred = model.predict(X_test)
    with open(os.path.join(reports_dir, 'classification_report.txt'), 'w') as f:
        f.write("Enhanced Test Set Classification Report\n")
        f.write("=" * 50 + "\n")
        f.write(f"Model Type: {metrics['model_type']}\n")
        f.write(f"Label Strategy: {args.strategy}\n")
        f.write(f"Lookahead: {args.lookahead} periods\n")
        f.write(f"Threshold: {args.threshold}\n\n")
        f.write(classification_report(y_test, test_pred))
        f.write("\nConfusion Matrix:\n")
        f.write(str(confusion_matrix(y_test, test_pred)))
    
    # Feature importance analysis (for single models)
    if hasattr(model, 'feature_importances_'):
        feature_importance = pd.DataFrame({
            'feature': X.columns,
            'importance': model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        feature_importance.to_csv(os.path.join(reports_dir, 'feature_importance.csv'), index=False)
        
        # SHAP analysis
        try:
            shap_summary = generate_shap_analysis(model, X_train, reports_dir)
        except Exception as e:
            logger.warning(f"SHAP analysis failed: {e}")
    
    # Save model artifacts
    model_path, metadata_path = save_model_artifacts(model, metrics, X.columns.tolist(), args.out)
    
    # Summary
    logger.info("\n" + "="*60)
    logger.info("TRAINING COMPLETED SUCCESSFULLY!")
    logger.info("="*60)
    logger.info(f"Model Type: {metrics['model_type'].upper()}")
    logger.info(f"Test Accuracy: {metrics['test_accuracy']:.4f}")
    logger.info(f"Test AUC: {metrics['test_auc']:.4f}")
    if 'test_precision' in metrics:
        logger.info(f"Test Precision: {metrics['test_precision']:.4f}")
        logger.info(f"Test Recall: {metrics['test_recall']:.4f}")
    logger.info(f"Model saved: {model_path}")
    logger.info(f"Reports saved: {reports_dir}")
    logger.info("="*60)

if __name__ == "__main__":
    main()