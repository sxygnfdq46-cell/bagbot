"""
Data Utilities for ML Trading Bot
Provides data loading, preprocessing, and management utilities
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple, Union, Any, Callable
import yfinance as yf
from datetime import datetime, timedelta
import logging
from pathlib import Path
import joblib
import warnings
import hashlib
import sqlite3
import json
import asyncio
import aiohttp
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
from functools import wraps, lru_cache
from dataclasses import dataclass, asdict
from enum import Enum
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)


class DataSource(Enum):
    """Supported data sources"""
    YAHOO = "yahoo"
    ALPHA_VANTAGE = "alpha_vantage"
    BINANCE = "binance"
    COINBASE = "coinbase"
    IEX = "iex"
    POLYGON = "polygon"
    QUANDL = "quandl"
    CUSTOM_API = "custom_api"


@dataclass
class CacheConfig:
    """Cache configuration"""
    enabled: bool = True
    ttl_hours: int = 1  # Time to live in hours
    max_size_mb: int = 500  # Maximum cache size in MB
    compression: bool = True
    auto_cleanup: bool = True
    backup_enabled: bool = True


@dataclass
class DataSourceConfig:
    """Data source configuration"""
    source: DataSource
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    rate_limit: int = 5  # requests per second
    timeout: int = 30
    retry_attempts: int = 3
    retry_delay: float = 1.0
    custom_headers: Optional[Dict[str, str]] = None


@dataclass
class DataRequest:
    """Data request specification"""
    symbol: str
    period: str
    interval: str
    source: DataSource = DataSource.YAHOO
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    adjustments: bool = True
    metadata: Optional[Dict] = None


class DataLoader:
    """Advanced data loading with multi-source support and intelligent caching"""
    
    def __init__(self, data_dir: str = "data/raw", cache_config: CacheConfig = None):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize advanced cache
        from .advanced_cache import AdvancedCache
        self.cache = AdvancedCache(str(self.data_dir / "cache"), cache_config or CacheConfig())
        
        # Initialize multi-source provider
        from .multi_source_provider import MultiSourceDataProvider
        self.multi_provider = MultiSourceDataProvider()
        
        # Setup default providers
        self._setup_default_providers()
        
        # Performance tracking
        self.fetch_stats = {
            'total_requests': 0,
            'cache_hits': 0,
            'cache_misses': 0,
            'source_usage': {},
            'errors': []
        }
    
    def _setup_default_providers(self):
        """Setup default data providers"""
        try:
            # Yahoo Finance (always available)
            yahoo_config = DataSourceConfig(
                source=DataSource.YAHOO,
                rate_limit=5,
                timeout=30,
                retry_attempts=3
            )
            self.multi_provider.add_provider(DataSource.YAHOO, yahoo_config)
            
            # Add other providers based on availability
            # Binance for crypto
            binance_config = DataSourceConfig(
                source=DataSource.BINANCE,
                rate_limit=10,
                timeout=15
            )
            self.multi_provider.add_provider(DataSource.BINANCE, binance_config)
            
            # Coinbase for crypto
            coinbase_config = DataSourceConfig(
                source=DataSource.COINBASE,
                rate_limit=10,
                timeout=15
            )
            self.multi_provider.add_provider(DataSource.COINBASE, coinbase_config)
            
            logger.info("Initialized multi-source data provider")
            
        except Exception as e:
            logger.error(f"Error setting up data providers: {e}")
    
    def add_custom_provider(self, source_config: DataSourceConfig):
        """Add custom data provider"""
        self.multi_provider.add_provider(source_config.source, source_config)
    
    def fetch_data(self, symbol: str, period: str = "2y", interval: str = "1h", 
                   source: DataSource = None, force_refresh: bool = False) -> pd.DataFrame:
        """
        Fetch data with intelligent caching and multi-source support
        
        Args:
            symbol: Trading symbol (e.g., 'BTC-USD', 'AAPL')
            period: Time period ('1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', 'max')
            interval: Data interval ('1m', '5m', '15m', '30m', '1h', '1d')
            source: Preferred data source
            force_refresh: Force fresh data fetch (bypass cache)
            
        Returns:
            DataFrame with OHLCV data
        """
        self.fetch_stats['total_requests'] += 1
        
        try:
            # Try cache first (unless force refresh)
            if not force_refresh:
                source_str = source.value if source else 'auto'
                cached_data = self.cache.get(symbol, source_str, period, interval)
                
                if cached_data is not None and not cached_data.empty:
                    self.fetch_stats['cache_hits'] += 1
                    logger.debug(f"Cache hit for {symbol} ({source_str})")
                    return cached_data
            
            self.fetch_stats['cache_misses'] += 1
            
            # Fetch from source
            data, used_source = self.multi_provider.fetch_data(
                symbol, period, interval, preferred_source=source
            )
            
            if data.empty:
                logger.warning(f"No data returned for {symbol}")
                return pd.DataFrame()
            
            # Update stats
            if used_source:
                source_name = used_source.value
                self.fetch_stats['source_usage'][source_name] = \
                    self.fetch_stats['source_usage'].get(source_name, 0) + 1
            
            # Cache the result
            cache_key = self.cache.put(
                data, symbol, used_source.value if used_source else 'unknown', 
                period, interval
            )
            
            logger.info(f"Fetched {len(data)} records for {symbol} from {used_source.value if used_source else 'unknown'}")
            return data
            
        except Exception as e:
            error_msg = f"Error fetching data for {symbol}: {e}"
            logger.error(error_msg)
            self.fetch_stats['errors'].append({
                'symbol': symbol,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            })
            return pd.DataFrame()
    
    def fetch_multiple_symbols(self, symbols: List[str], period: str = "2y", 
                             interval: str = "1h", source: DataSource = None,
                             concurrent: bool = True, max_workers: int = 5) -> Dict[str, pd.DataFrame]:
        """
        Fetch data for multiple symbols efficiently
        
        Args:
            symbols: List of symbols to fetch
            period: Time period
            interval: Data interval
            source: Preferred data source
            concurrent: Use concurrent fetching
            max_workers: Maximum concurrent workers
            
        Returns:
            Dictionary with symbol as key and DataFrame as value
        """
        data_dict = {}
        
        if concurrent and len(symbols) > 1:
            # Use concurrent fetching
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                # Submit all tasks
                future_to_symbol = {
                    executor.submit(self.fetch_data, symbol, period, interval, source): symbol
                    for symbol in symbols
                }
                
                # Collect results
                for future in as_completed(future_to_symbol):
                    symbol = future_to_symbol[future]
                    try:
                        data = future.result(timeout=60)
                        if not data.empty:
                            data_dict[symbol] = data
                    except Exception as e:
                        logger.error(f"Concurrent fetch failed for {symbol}: {e}")
        else:
            # Sequential fetching
            for symbol in symbols:
                data = self.fetch_data(symbol, period, interval, source)
                if not data.empty:
                    data_dict[symbol] = data
        
        logger.info(f"Fetched data for {len(data_dict)}/{len(symbols)} symbols")
        return data_dict
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get comprehensive cache and fetch statistics"""
        cache_stats = self.cache.get_cache_stats()
        
        total_requests = self.fetch_stats['total_requests']
        cache_hit_ratio = (self.fetch_stats['cache_hits'] / total_requests * 100) if total_requests > 0 else 0
        
        return {
            'fetch_stats': self.fetch_stats,
            'cache_hit_ratio': cache_hit_ratio,
            'cache_stats': cache_stats,
            'available_sources': [s.value for s in self.multi_provider.get_available_sources()]
        }
    
    def test_connectivity(self) -> Dict[str, bool]:
        """Test connectivity to all data sources"""
        results = self.multi_provider.test_connectivity()
        return {source.value: status for source, status in results.items()}
    
    def clear_cache(self, symbol: str = None, source: str = None) -> int:
        """Clear cache entries"""
        return self.cache.clear_cache(symbol, source)
    
    def cleanup_cache(self) -> int:
        """Clean up expired cache entries"""
        return self.cache.cleanup_expired()
    
    # Legacy methods for backward compatibility
    def fetch_yahoo_data(self, symbol: str, period: str = "2y", interval: str = "1h") -> pd.DataFrame:
        """Legacy method - use fetch_data instead"""
        return self.fetch_data(symbol, period, interval, DataSource.YAHOO)
    
    def get_multiple_symbols(self, symbols: List[str], period: str = "2y", 
                           interval: str = "1h", use_cache: bool = True) -> Dict[str, pd.DataFrame]:
        """Legacy method - use fetch_multiple_symbols instead"""
        return self.fetch_multiple_symbols(symbols, period, interval)
    
    def load_cached_data(self, symbol: str, period: str = "2y", interval: str = "1h") -> pd.DataFrame:
        """Legacy method for backward compatibility"""
        return self.cache.get(symbol, 'yahoo', period, interval) or pd.DataFrame()


class DataPreprocessor:
    """Handles data preprocessing and cleaning"""
    
    @staticmethod
    def clean_data(df: pd.DataFrame) -> pd.DataFrame:
        """
        Clean and preprocess raw data
        
        Args:
            df: Raw OHLCV DataFrame
            
        Returns:
            Cleaned DataFrame
        """
        df_clean = df.copy()
        
        # Remove duplicates
        df_clean = df_clean[~df_clean.index.duplicated(keep='first')]
        
        # Handle missing values
        numeric_cols = df_clean.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            df_clean[col] = df_clean[col].fillna(method='ffill').fillna(method='bfill')
        
        # Remove outliers (basic approach)
        for col in ['open', 'high', 'low', 'close']:
            if col in df_clean.columns:
                Q1 = df_clean[col].quantile(0.01)
                Q3 = df_clean[col].quantile(0.99)
                df_clean = df_clean[(df_clean[col] >= Q1) & (df_clean[col] <= Q3)]
        
        # Ensure proper data types
        price_cols = ['open', 'high', 'low', 'close']
        for col in price_cols:
            if col in df_clean.columns:
                df_clean[col] = pd.to_numeric(df_clean[col], errors='coerce')
        
        if 'volume' in df_clean.columns:
            df_clean['volume'] = pd.to_numeric(df_clean['volume'], errors='coerce')
        
        logger.info(f"Cleaned data: {len(df_clean)} records remaining")
        return df_clean
    
    @staticmethod
    def resample_data(df: pd.DataFrame, timeframe: str) -> pd.DataFrame:
        """
        Resample data to different timeframe
        
        Args:
            df: Input DataFrame
            timeframe: Target timeframe ('5T', '15T', '1H', '4H', '1D', etc.)
            
        Returns:
            Resampled DataFrame
        """
        agg_dict = {
            'open': 'first',
            'high': 'max',
            'low': 'min',
            'close': 'last',
            'volume': 'sum'
        }
        
        # Filter available columns
        available_agg = {k: v for k, v in agg_dict.items() if k in df.columns}
        
        df_resampled = df.resample(timeframe).agg(available_agg)
        df_resampled = df_resampled.dropna()
        
        logger.info(f"Resampled to {timeframe}: {len(df_resampled)} records")
        return df_resampled
    
    @staticmethod
    def split_data(df: pd.DataFrame, train_ratio: float = 0.7, 
                  val_ratio: float = 0.15) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """
        Split data into train, validation, and test sets
        
        Args:
            df: Input DataFrame
            train_ratio: Ratio for training data
            val_ratio: Ratio for validation data
            
        Returns:
            Tuple of (train_df, val_df, test_df)
        """
        n_samples = len(df)
        train_size = int(n_samples * train_ratio)
        val_size = int(n_samples * val_ratio)
        
        train_df = df.iloc[:train_size]
        val_df = df.iloc[train_size:train_size + val_size]
        test_df = df.iloc[train_size + val_size:]
        
        logger.info(f"Data split - Train: {len(train_df)}, Val: {len(val_df)}, Test: {len(test_df)}")
        return train_df, val_df, test_df


class DataManager:
    """High-level data management class"""
    
    def __init__(self, data_dir: str = "data"):
        self.data_dir = Path(data_dir)
        self.raw_dir = self.data_dir / "raw"
        self.processed_dir = self.data_dir / "processed"
        
        # Create directories
        self.raw_dir.mkdir(parents=True, exist_ok=True)
        self.processed_dir.mkdir(parents=True, exist_ok=True)
        
        self.loader = DataLoader(str(self.raw_dir))
        self.preprocessor = DataPreprocessor()
    
    def prepare_dataset(self, symbols: List[str], period: str = "2y", 
                       interval: str = "1h", clean: bool = True, 
                       save: bool = True) -> Dict[str, pd.DataFrame]:
        """
        Prepare complete dataset for ML training
        
        Args:
            symbols: List of symbols to process
            period: Time period
            interval: Data interval
            clean: Whether to clean the data
            save: Whether to save processed data
            
        Returns:
            Dictionary with processed data for each symbol
        """
        # Load raw data
        raw_data = self.loader.get_multiple_symbols(symbols, period, interval)
        
        processed_data = {}
        for symbol, df in raw_data.items():
            if df.empty:
                continue
                
            # Clean data if requested
            if clean:
                df = self.preprocessor.clean_data(df)
            
            processed_data[symbol] = df
            
            # Save processed data
            if save:
                save_path = self.processed_dir / f"{symbol}_processed.csv"
                df.to_csv(save_path)
                logger.info(f"Saved processed data for {symbol}")
        
        return processed_data
    
    def load_processed_data(self, symbol: str) -> pd.DataFrame:
        """Load processed data for a symbol"""
        file_path = self.processed_dir / f"{symbol}_processed.csv"
        
        if file_path.exists():
            return pd.read_csv(file_path, index_col=0, parse_dates=True)
        else:
            logger.warning(f"No processed data found for {symbol}")
            return pd.DataFrame()
    
    def save_features(self, features: Dict[str, pd.DataFrame], 
                     filename: str = "features.joblib"):
        """Save feature data"""
        save_path = self.processed_dir / filename
        joblib.dump(features, save_path)
        logger.info(f"Features saved to {save_path}")
    
    def load_features(self, filename: str = "features.joblib") -> Dict[str, pd.DataFrame]:
        """Load feature data"""
        load_path = self.processed_dir / filename
        
        if load_path.exists():
            features = joblib.load(load_path)
            logger.info(f"Features loaded from {load_path}")
            return features
        else:
            logger.warning(f"No features file found: {load_path}")
            return {}


def get_data_info(df: pd.DataFrame) -> Dict:
    """Get comprehensive information about a dataset"""
    info = {
        'shape': df.shape,
        'columns': list(df.columns),
        'dtypes': df.dtypes.to_dict(),
        'missing_values': df.isnull().sum().to_dict(),
        'date_range': (df.index.min(), df.index.max()) if hasattr(df.index, 'min') else None,
        'numeric_summary': df.describe().to_dict() if len(df.select_dtypes(include=[np.number]).columns) > 0 else {}
    }
    return info


if __name__ == "__main__":
    # Example usage
    logging.basicConfig(level=logging.INFO)
    
    # Initialize data manager
    dm = DataManager()
    
    # Test with a single symbol
    symbols = ['BTC-USD']
    data = dm.prepare_dataset(symbols, period='1mo', interval='1h')
    
    for symbol, df in data.items():
        print(f"\n{symbol} Data Info:")
        info = get_data_info(df)
        print(f"Shape: {info['shape']}")
        print(f"Date Range: {info['date_range']}")
        print(f"Columns: {info['columns']}")