"""
Feature Selection for ML Trading Bot
Advanced feature selection techniques for trading models
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional, Union
from sklearn.feature_selection import (
    SelectKBest, f_regression, mutual_info_regression,
    RFE, SelectFromModel, VarianceThreshold
)
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.linear_model import LassoCV, RidgeCV
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from scipy import stats
from scipy.stats import spearmanr, pearsonr
import logging
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)


class FeatureSelector:
    """Comprehensive feature selection toolkit"""
    
    def __init__(self, task_type: str = 'regression'):
        """
        Initialize feature selector
        
        Args:
            task_type: 'regression' or 'classification'
        """
        self.task_type = task_type
        self.selected_features = None
        self.feature_scores = {}
        self.selection_history = []
        
    def variance_filter(self, X: pd.DataFrame, threshold: float = 0.01) -> pd.DataFrame:
        """
        Remove features with low variance
        
        Args:
            X: Feature matrix
            threshold: Variance threshold
            
        Returns:
            Filtered feature matrix
        """
        selector = VarianceThreshold(threshold=threshold)
        X_filtered = selector.fit_transform(X)
        
        selected_features = X.columns[selector.get_support()]
        removed_count = len(X.columns) - len(selected_features)
        
        logger.info(f"Variance filter: Removed {removed_count} low-variance features")
        
        self.selection_history.append({
            'method': 'variance_filter',
            'threshold': threshold,
            'features_removed': removed_count,
            'remaining_features': len(selected_features)
        })
        
        return pd.DataFrame(X_filtered, columns=selected_features, index=X.index)
    
    def correlation_filter(self, X: pd.DataFrame, threshold: float = 0.95) -> pd.DataFrame:
        """
        Remove highly correlated features
        
        Args:
            X: Feature matrix
            threshold: Correlation threshold
            
        Returns:
            Filtered feature matrix
        """
        # Calculate correlation matrix
        corr_matrix = X.corr().abs()
        
        # Find highly correlated pairs
        upper_triangle = corr_matrix.where(
            np.triu(np.ones(corr_matrix.shape), k=1).astype(bool)
        )
        
        # Select features to drop
        to_drop = [column for column in upper_triangle.columns if any(upper_triangle[column] > threshold)]
        
        X_filtered = X.drop(columns=to_drop)
        
        logger.info(f"Correlation filter: Removed {len(to_drop)} highly correlated features")
        
        self.selection_history.append({
            'method': 'correlation_filter',
            'threshold': threshold,
            'features_removed': len(to_drop),
            'dropped_features': to_drop,
            'remaining_features': len(X_filtered.columns)
        })
        
        return X_filtered
    
    def univariate_selection(self, X: pd.DataFrame, y: pd.Series, 
                           k: int = 50) -> Tuple[pd.DataFrame, Dict]:
        """
        Univariate feature selection
        
        Args:
            X: Feature matrix
            y: Target variable
            k: Number of features to select
            
        Returns:
            Tuple of (selected features, scores)
        """
        if self.task_type == 'regression':
            # Use F-test for regression
            selector = SelectKBest(f_regression, k=k)
        else:
            # Use mutual information for classification
            selector = SelectKBest(mutual_info_regression, k=k)
        
        X_selected = selector.fit_transform(X, y)
        selected_features = X.columns[selector.get_support()]
        
        # Get scores
        scores = dict(zip(X.columns, selector.scores_))
        selected_scores = dict(zip(selected_features, selector.scores_[selector.get_support()]))
        
        logger.info(f"Univariate selection: Selected {k} features")
        
        self.feature_scores.update(scores)
        self.selection_history.append({
            'method': 'univariate_selection',
            'k': k,
            'selected_features': list(selected_features),
            'scores': selected_scores
        })
        
        return pd.DataFrame(X_selected, columns=selected_features, index=X.index), selected_scores
    
    def recursive_feature_elimination(self, X: pd.DataFrame, y: pd.Series, 
                                    n_features: int = 20) -> Tuple[pd.DataFrame, List[str]]:
        """
        Recursive Feature Elimination (RFE)
        
        Args:
            X: Feature matrix
            y: Target variable
            n_features: Number of features to select
            
        Returns:
            Tuple of (selected features, feature names)
        """
        if self.task_type == 'regression':
            estimator = RandomForestRegressor(n_estimators=100, random_state=42)
        else:
            estimator = RandomForestClassifier(n_estimators=100, random_state=42)
        
        selector = RFE(estimator, n_features_to_select=n_features)
        X_selected = selector.fit_transform(X, y)
        
        selected_features = X.columns[selector.get_support()]
        
        # Get feature rankings
        rankings = dict(zip(X.columns, selector.ranking_))
        
        logger.info(f"RFE: Selected {n_features} features")
        
        self.selection_history.append({
            'method': 'recursive_feature_elimination',
            'n_features': n_features,
            'selected_features': list(selected_features),
            'rankings': rankings
        })
        
        return pd.DataFrame(X_selected, columns=selected_features, index=X.index), list(selected_features)
    
    def lasso_selection(self, X: pd.DataFrame, y: pd.Series, 
                       alpha: Optional[float] = None) -> Tuple[pd.DataFrame, Dict]:
        """
        LASSO-based feature selection
        
        Args:
            X: Feature matrix
            y: Target variable
            alpha: Regularization strength (auto-selected if None)
            
        Returns:
            Tuple of (selected features, coefficients)
        """
        # Standardize features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        X_scaled = pd.DataFrame(X_scaled, columns=X.columns, index=X.index)
        
        # Fit LASSO with cross-validation
        if alpha is None:
            lasso = LassoCV(cv=5, random_state=42)
        else:
            lasso = LassoCV(alphas=[alpha], cv=5, random_state=42)
        
        lasso.fit(X_scaled, y)
        
        # Select features with non-zero coefficients
        selected_mask = lasso.coef_ != 0
        selected_features = X.columns[selected_mask]
        coefficients = dict(zip(selected_features, lasso.coef_[selected_mask]))
        
        X_selected = X[selected_features]
        
        logger.info(f"LASSO selection: Selected {len(selected_features)} features (alpha={lasso.alpha_:.6f})")
        
        self.selection_history.append({
            'method': 'lasso_selection',
            'alpha': lasso.alpha_,
            'selected_features': list(selected_features),
            'coefficients': coefficients
        })
        
        return X_selected, coefficients
    
    def random_forest_importance(self, X: pd.DataFrame, y: pd.Series, 
                                n_features: int = 30) -> Tuple[pd.DataFrame, Dict]:
        """
        Random Forest feature importance selection
        
        Args:
            X: Feature matrix
            y: Target variable
            n_features: Number of top features to select
            
        Returns:
            Tuple of (selected features, importance scores)
        """
        if self.task_type == 'regression':
            rf = RandomForestRegressor(n_estimators=200, random_state=42)
        else:
            rf = RandomForestClassifier(n_estimators=200, random_state=42)
        
        rf.fit(X, y)
        
        # Get feature importances
        importances = dict(zip(X.columns, rf.feature_importances_))
        
        # Select top features
        top_features = sorted(importances.items(), key=lambda x: x[1], reverse=True)[:n_features]
        selected_features = [feat[0] for feat in top_features]
        selected_importances = dict(top_features)
        
        X_selected = X[selected_features]
        
        logger.info(f"Random Forest: Selected {n_features} most important features")
        
        self.feature_scores.update(importances)
        self.selection_history.append({
            'method': 'random_forest_importance',
            'n_features': n_features,
            'selected_features': selected_features,
            'importances': selected_importances
        })
        
        return X_selected, selected_importances
    
    def mutual_information_selection(self, X: pd.DataFrame, y: pd.Series, 
                                   k: int = 25) -> Tuple[pd.DataFrame, Dict]:
        """
        Mutual Information based feature selection
        
        Args:
            X: Feature matrix
            y: Target variable
            k: Number of features to select
            
        Returns:
            Tuple of (selected features, MI scores)
        """
        mi_scores = mutual_info_regression(X, y)
        mi_dict = dict(zip(X.columns, mi_scores))
        
        # Select top k features
        top_features = sorted(mi_dict.items(), key=lambda x: x[1], reverse=True)[:k]
        selected_features = [feat[0] for feat in top_features]
        selected_scores = dict(top_features)
        
        X_selected = X[selected_features]
        
        logger.info(f"Mutual Information: Selected {k} features")
        
        self.feature_scores.update(mi_dict)
        self.selection_history.append({
            'method': 'mutual_information',
            'k': k,
            'selected_features': selected_features,
            'mi_scores': selected_scores
        })
        
        return X_selected, selected_scores
    
    def pca_selection(self, X: pd.DataFrame, n_components: float = 0.95) -> Tuple[pd.DataFrame, PCA]:
        """
        Principal Component Analysis for dimensionality reduction
        
        Args:
            X: Feature matrix
            n_components: Number of components or variance ratio to retain
            
        Returns:
            Tuple of (transformed features, fitted PCA object)
        """
        # Standardize features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Apply PCA
        pca = PCA(n_components=n_components)
        X_pca = pca.fit_transform(X_scaled)
        
        # Create column names
        n_comp = X_pca.shape[1]
        columns = [f'PC_{i+1}' for i in range(n_comp)]
        
        X_pca_df = pd.DataFrame(X_pca, columns=columns, index=X.index)
        
        explained_variance = pca.explained_variance_ratio_.sum()
        
        logger.info(f"PCA: Reduced to {n_comp} components, explaining {explained_variance:.3f} of variance")
        
        self.selection_history.append({
            'method': 'pca',
            'n_components': n_comp,
            'explained_variance_ratio': explained_variance,
            'component_names': columns
        })
        
        return X_pca_df, pca
    
    def ensemble_selection(self, X: pd.DataFrame, y: pd.Series, 
                          methods: List[str] = None, voting: str = 'rank') -> pd.DataFrame:
        """
        Ensemble feature selection using multiple methods
        
        Args:
            X: Feature matrix
            y: Target variable
            methods: List of methods to use
            voting: 'rank' or 'score' based voting
            
        Returns:
            Selected features based on ensemble voting
        """
        if methods is None:
            methods = ['univariate', 'rf_importance', 'mutual_info', 'lasso']
        
        feature_votes = {}
        all_scores = {}
        
        for method in methods:
            if method == 'univariate':
                _, scores = self.univariate_selection(X, y, k=min(50, len(X.columns)))
            elif method == 'rf_importance':
                _, scores = self.random_forest_importance(X, y, n_features=min(50, len(X.columns)))
            elif method == 'mutual_info':
                _, scores = self.mutual_information_selection(X, y, k=min(50, len(X.columns)))
            elif method == 'lasso':
                _, coefs = self.lasso_selection(X, y)
                scores = {k: abs(v) for k, v in coefs.items()}
            
            all_scores[method] = scores
            
            # Convert scores to ranks
            if voting == 'rank':
                sorted_features = sorted(scores.keys(), key=lambda x: scores[x], reverse=True)
                for i, feat in enumerate(sorted_features):
                    if feat not in feature_votes:
                        feature_votes[feat] = 0
                    feature_votes[feat] += len(sorted_features) - i
            else:
                # Use normalized scores
                max_score = max(scores.values()) if scores else 1
                for feat, score in scores.items():
                    if feat not in feature_votes:
                        feature_votes[feat] = 0
                    feature_votes[feat] += score / max_score
        
        # Select top features based on ensemble votes
        top_features = sorted(feature_votes.items(), key=lambda x: x[1], reverse=True)
        n_select = min(30, len(X.columns) // 2)  # Select top 30 or half of features
        selected_features = [feat[0] for feat in top_features[:n_select]]
        
        X_selected = X[selected_features]
        
        logger.info(f"Ensemble selection: Selected {len(selected_features)} features using {methods}")
        
        self.selection_history.append({
            'method': 'ensemble_selection',
            'sub_methods': methods,
            'voting': voting,
            'selected_features': selected_features,
            'vote_scores': dict(top_features[:n_select])
        })
        
        self.selected_features = selected_features
        return X_selected


class FeatureAnalyzer:
    """Analyze feature importance and relationships"""
    
    @staticmethod
    def feature_importance_analysis(X: pd.DataFrame, y: pd.Series) -> Dict:
        """Comprehensive feature importance analysis"""
        results = {}
        
        # Random Forest importance
        rf = RandomForestRegressor(n_estimators=200, random_state=42)
        rf.fit(X, y)
        results['rf_importance'] = dict(zip(X.columns, rf.feature_importances_))
        
        # Correlation with target
        correlations = {}
        for col in X.columns:
            corr, p_value = pearsonr(X[col].fillna(0), y)
            correlations[col] = {'correlation': corr, 'p_value': p_value}
        results['correlations'] = correlations
        
        # Mutual information
        mi_scores = mutual_info_regression(X.fillna(0), y)
        results['mutual_info'] = dict(zip(X.columns, mi_scores))
        
        return results
    
    @staticmethod
    def correlation_analysis(X: pd.DataFrame) -> Dict:
        """Analyze feature correlations"""
        corr_matrix = X.corr()
        
        # Find highly correlated pairs
        high_corr_pairs = []
        for i in range(len(corr_matrix.columns)):
            for j in range(i+1, len(corr_matrix.columns)):
                corr_val = abs(corr_matrix.iloc[i, j])
                if corr_val > 0.8:
                    high_corr_pairs.append({
                        'feature1': corr_matrix.columns[i],
                        'feature2': corr_matrix.columns[j],
                        'correlation': corr_val
                    })
        
        return {
            'correlation_matrix': corr_matrix,
            'high_correlations': high_corr_pairs
        }


def select_best_features(X: pd.DataFrame, y: pd.Series, 
                        target_features: int = 30, 
                        task_type: str = 'regression') -> Dict:
    """
    Automated feature selection pipeline
    
    Args:
        X: Feature matrix
        y: Target variable
        target_features: Target number of features
        task_type: 'regression' or 'classification'
        
    Returns:
        Dictionary with selected features and analysis results
    """
    selector = FeatureSelector(task_type)
    
    # Step 1: Remove low variance features
    X_filtered = selector.variance_filter(X, threshold=0.01)
    
    # Step 2: Remove highly correlated features
    X_filtered = selector.correlation_filter(X_filtered, threshold=0.95)
    
    # Step 3: Ensemble selection
    X_selected = selector.ensemble_selection(X_filtered, y)
    
    # Analysis
    analyzer = FeatureAnalyzer()
    importance_analysis = analyzer.feature_importance_analysis(X_selected, y)
    
    return {
        'selected_features': X_selected,
        'feature_names': list(X_selected.columns),
        'selection_history': selector.selection_history,
        'importance_analysis': importance_analysis,
        'final_shape': X_selected.shape
    }


if __name__ == "__main__":
    # Example usage
    logging.basicConfig(level=logging.INFO)
    
    # Generate sample data
    np.random.seed(42)
    n_samples, n_features = 1000, 100
    X = pd.DataFrame(np.random.randn(n_samples, n_features), 
                     columns=[f'feature_{i}' for i in range(n_features)])
    y = pd.Series(X.iloc[:, :5].sum(axis=1) + np.random.randn(n_samples) * 0.1)
    
    # Test feature selection
    results = select_best_features(X, y, target_features=20)
    print(f"Selected {results['final_shape'][1]} features from {n_features} original features")
    print(f"Selected features: {results['feature_names'][:10]}...")  # Show first 10