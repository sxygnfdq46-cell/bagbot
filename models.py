"""Model loading and inference wrapper for trading bot."""
import logging
import joblib
import numpy as np
from pathlib import Path


logger = logging.getLogger(__name__)


class ModelPredictor:
    """Wrapper to load a trained model and make predictions."""
    
    def __init__(self, model_path: str = "models/model.joblib"):
        """
        Load a pre-trained model artifact.
        
        Args:
            model_path: Path to joblib model file
        """
        self.model_path = model_path
        self.model = None
        self.scaler = None
        self.feature_names = None
        self.symbol = None
        self.timeframe = None
        
        self._load_model()
    
    def _load_model(self):
        """Load model artifact from disk."""
        try:
            artifact = joblib.load(self.model_path)
            self.model = artifact['model']
            self.scaler = artifact['scaler']
            self.feature_names = artifact['feature_names']
            self.symbol = artifact.get('symbol', 'BTC/USD')
            self.timeframe = artifact.get('timeframe', '5m')
            logger.info(f"Loaded model from {self.model_path}")
            logger.info(f"Model trained on {self.symbol} {self.timeframe}")
        except FileNotFoundError:
            logger.warning(f"Model not found at {self.model_path}. Running without ML predictions.")
            self.model = None
    
    def predict_proba(self, features: np.ndarray) -> float:
        """
        Get probability of positive class (uptrend).
        
        Args:
            features: Scaled feature array (1D)
        
        Returns:
            Probability of positive class (0-1)
        """
        if self.model is None:
            return 0.5  # neutral if no model
        
        try:
            # Ensure features are 2D
            if features.ndim == 1:
                features = features.reshape(1, -1)
            
            proba = self.model.predict_proba(features)[0, 1]
            return float(proba)
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            return 0.5
    
    def is_ready(self) -> bool:
        """Check if model is loaded and ready."""
        return self.model is not None
