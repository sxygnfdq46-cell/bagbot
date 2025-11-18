"""
Multi-Source Data Provider
Unified interface for multiple financial data sources
"""

import asyncio
import aiohttp
import requests
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
import pandas as pd
from datetime import datetime, timedelta
import logging
import time
from dataclasses import dataclass

logger = logging.getLogger(__name__)


class BaseDataProvider(ABC):
    """Abstract base class for data providers"""
    
    def __init__(self, config: 'DataSourceConfig'):
        self.config = config
        self.last_request_time = 0
        self.request_count = 0
        self.session = None
    
    @abstractmethod
    def fetch_data(self, symbol: str, period: str, interval: str, **kwargs) -> pd.DataFrame:
        """Fetch data from the source"""
        pass
    
    def _enforce_rate_limit(self):
        """Enforce rate limiting"""
        if self.config.rate_limit > 0:
            time_since_last = time.time() - self.last_request_time
            min_interval = 1.0 / self.config.rate_limit
            
            if time_since_last < min_interval:
                sleep_time = min_interval - time_since_last
                time.sleep(sleep_time)
        
        self.last_request_time = time.time()
        self.request_count += 1
    
    def _make_request(self, url: str, params: Dict = None, headers: Dict = None) -> Optional[Dict]:
        """Make HTTP request with retry logic"""
        self._enforce_rate_limit()
        
        all_headers = {}
        if self.config.custom_headers:
            all_headers.update(self.config.custom_headers)
        if headers:
            all_headers.update(headers)
        
        for attempt in range(self.config.retry_attempts):
            try:
                response = requests.get(
                    url, 
                    params=params, 
                    headers=all_headers,
                    timeout=self.config.timeout
                )
                response.raise_for_status()
                return response.json()
                
            except requests.exceptions.RequestException as e:
                logger.warning(f"Request failed (attempt {attempt + 1}): {e}")
                if attempt < self.config.retry_attempts - 1:
                    time.sleep(self.config.retry_delay * (2 ** attempt))  # Exponential backoff
                else:
                    logger.error(f"All retry attempts failed for {url}")
                    raise
        
        return None


class YahooFinanceProvider(BaseDataProvider):
    """Yahoo Finance data provider"""
    
    def fetch_data(self, symbol: str, period: str, interval: str, **kwargs) -> pd.DataFrame:
        try:
            import yfinance as yf
            ticker = yf.Ticker(symbol)
            data = ticker.history(period=period, interval=interval)
            
            if data.empty:
                return pd.DataFrame()
            
            # Standardize column names
            data.columns = [col.lower().replace(' ', '_') for col in data.columns]
            data['symbol'] = symbol
            data['source'] = 'yahoo'
            
            return data
            
        except Exception as e:
            logger.error(f"Yahoo Finance error for {symbol}: {e}")
            return pd.DataFrame()


class AlphaVantageProvider(BaseDataProvider):
    """Alpha Vantage data provider"""
    
    def __init__(self, config: 'DataSourceConfig'):
        super().__init__(config)
        if not config.api_key:
            raise ValueError("Alpha Vantage requires API key")
        self.base_url = "https://www.alphavantage.co/query"
    
    def fetch_data(self, symbol: str, period: str, interval: str, **kwargs) -> pd.DataFrame:
        try:
            # Map intervals
            interval_mapping = {
                '1m': '1min', '5m': '5min', '15m': '15min', 
                '30m': '30min', '1h': '60min', '1d': 'daily'
            }
            
            av_interval = interval_mapping.get(interval, 'daily')
            
            if av_interval in ['1min', '5min', '15min', '30min', '60min']:
                function = 'TIME_SERIES_INTRADAY'
                params = {
                    'function': function,
                    'symbol': symbol,
                    'interval': av_interval,
                    'apikey': self.config.api_key,
                    'outputsize': 'full'
                }
            else:
                function = 'TIME_SERIES_DAILY'
                params = {
                    'function': function,
                    'symbol': symbol,
                    'apikey': self.config.api_key,
                    'outputsize': 'full'
                }
            
            response = self._make_request(self.base_url, params)
            
            if not response:
                return pd.DataFrame()
            
            # Parse response
            if 'Error Message' in response:
                logger.error(f"Alpha Vantage error: {response['Error Message']}")
                return pd.DataFrame()
            
            # Get time series data
            time_series_key = [key for key in response.keys() if 'Time Series' in key]
            if not time_series_key:
                return pd.DataFrame()
            
            time_series = response[time_series_key[0]]
            
            # Convert to DataFrame
            data = []
            for timestamp, values in time_series.items():
                row = {
                    'timestamp': pd.to_datetime(timestamp),
                    'open': float(values['1. open']),
                    'high': float(values['2. high']),
                    'low': float(values['3. low']),
                    'close': float(values['4. close']),
                    'volume': int(values['5. volume']) if '5. volume' in values else 0
                }
                data.append(row)
            
            df = pd.DataFrame(data)
            df.set_index('timestamp', inplace=True)
            df.sort_index(inplace=True)
            df['symbol'] = symbol
            df['source'] = 'alpha_vantage'
            
            return df
            
        except Exception as e:
            logger.error(f"Alpha Vantage error for {symbol}: {e}")
            return pd.DataFrame()


class BinanceProvider(BaseDataProvider):
    """Binance data provider"""
    
    def __init__(self, config: 'DataSourceConfig'):
        super().__init__(config)
        self.base_url = "https://api.binance.com/api/v3/klines"
    
    def fetch_data(self, symbol: str, period: str, interval: str, **kwargs) -> pd.DataFrame:
        try:
            # Map intervals to Binance format
            interval_mapping = {
                '1m': '1m', '3m': '3m', '5m': '5m', '15m': '15m',
                '30m': '30m', '1h': '1h', '2h': '2h', '4h': '4h',
                '6h': '6h', '8h': '8h', '12h': '12h', '1d': '1d',
                '3d': '3d', '1w': '1w', '1M': '1M'
            }
            
            binance_interval = interval_mapping.get(interval, '1h')
            
            # Calculate limit based on period
            period_mapping = {
                '1d': 1440, '7d': 1440, '30d': 1440, '90d': 1440,
                '1y': 1000, '2y': 1000, '5y': 1000, 'max': 1000
            }
            
            limit = period_mapping.get(period, 1000)
            
            params = {
                'symbol': symbol.replace('-', '').replace('/', ''),
                'interval': binance_interval,
                'limit': limit
            }
            
            response = requests.get(self.base_url, params=params, timeout=self.config.timeout)
            response.raise_for_status()
            
            data = response.json()
            
            if not data:
                return pd.DataFrame()
            
            # Convert to DataFrame
            df = pd.DataFrame(data, columns=[
                'timestamp', 'open', 'high', 'low', 'close', 'volume',
                'close_time', 'quote_asset_volume', 'number_of_trades',
                'taker_buy_base_asset_volume', 'taker_buy_quote_asset_volume', 'ignore'
            ])
            
            # Process data
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
            df.set_index('timestamp', inplace=True)
            
            # Keep only OHLCV columns
            df = df[['open', 'high', 'low', 'close', 'volume']].astype(float)
            df['symbol'] = symbol
            df['source'] = 'binance'
            
            return df
            
        except Exception as e:
            logger.error(f"Binance error for {symbol}: {e}")
            return pd.DataFrame()


class CoinbaseProvider(BaseDataProvider):
    """Coinbase Pro data provider"""
    
    def __init__(self, config: 'DataSourceConfig'):
        super().__init__(config)
        self.base_url = "https://api.exchange.coinbase.com/products"
    
    def fetch_data(self, symbol: str, period: str, interval: str, **kwargs) -> pd.DataFrame:
        try:
            # Format symbol for Coinbase (e.g., BTC-USD)
            if '/' in symbol:
                cb_symbol = symbol.replace('/', '-')
            else:
                cb_symbol = symbol
            
            # Map intervals
            granularity_mapping = {
                '1m': 60, '5m': 300, '15m': 900, 
                '1h': 3600, '6h': 21600, '1d': 86400
            }
            
            granularity = granularity_mapping.get(interval, 3600)
            
            # Calculate start/end times
            end_time = datetime.now()
            period_mapping = {
                '1d': 1, '7d': 7, '30d': 30, '90d': 90,
                '1y': 365, '2y': 730
            }
            
            days = period_mapping.get(period, 30)
            start_time = end_time - timedelta(days=days)
            
            url = f"{self.base_url}/{cb_symbol}/candles"
            params = {
                'start': start_time.isoformat(),
                'end': end_time.isoformat(),
                'granularity': granularity
            }
            
            response = requests.get(url, params=params, timeout=self.config.timeout)
            response.raise_for_status()
            
            data = response.json()
            
            if not data:
                return pd.DataFrame()
            
            # Convert to DataFrame
            df = pd.DataFrame(data, columns=['timestamp', 'low', 'high', 'open', 'close', 'volume'])
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='s')
            df.set_index('timestamp', inplace=True)
            df.sort_index(inplace=True)
            
            # Ensure numeric types
            df = df.astype(float)
            df['symbol'] = symbol
            df['source'] = 'coinbase'
            
            return df
            
        except Exception as e:
            logger.error(f"Coinbase error for {symbol}: {e}")
            return pd.DataFrame()


class MultiSourceDataProvider:
    """Unified multi-source data provider with fallback support"""
    
    def __init__(self):
        self.providers = {}
        self.fallback_order = [
            DataSource.YAHOO,
            DataSource.BINANCE,
            DataSource.COINBASE,
            DataSource.ALPHA_VANTAGE
        ]
    
    def add_provider(self, source: 'DataSource', config: 'DataSourceConfig'):
        """Add a data provider"""
        provider_classes = {
            DataSource.YAHOO: YahooFinanceProvider,
            DataSource.ALPHA_VANTAGE: AlphaVantageProvider,
            DataSource.BINANCE: BinanceProvider,
            DataSource.COINBASE: CoinbaseProvider
        }
        
        if source in provider_classes:
            self.providers[source] = provider_classes[source](config)
            logger.info(f"Added {source.value} provider")
        else:
            logger.warning(f"Unknown provider: {source}")
    
    def fetch_data(self, symbol: str, period: str, interval: str, 
                   preferred_source: Optional['DataSource'] = None,
                   fallback: bool = True) -> Tuple[pd.DataFrame, 'DataSource']:
        """Fetch data with automatic fallback"""
        
        # Determine source order
        if preferred_source and preferred_source in self.providers:
            sources_to_try = [preferred_source]
            if fallback:
                sources_to_try.extend([s for s in self.fallback_order if s != preferred_source])
        else:
            sources_to_try = self.fallback_order if fallback else [DataSource.YAHOO]
        
        last_error = None
        
        for source in sources_to_try:
            if source not in self.providers:
                continue
            
            try:
                logger.info(f"Trying {source.value} for {symbol}")
                data = self.providers[source].fetch_data(symbol, period, interval)
                
                if not data.empty:
                    logger.info(f"Successfully fetched {len(data)} records from {source.value}")
                    return data, source
                else:
                    logger.warning(f"No data returned from {source.value}")
                    
            except Exception as e:
                last_error = e
                logger.warning(f"Error with {source.value}: {e}")
                continue
        
        logger.error(f"All data sources failed for {symbol}")
        if last_error:
            raise last_error
        
        return pd.DataFrame(), None
    
    def get_available_sources(self) -> List['DataSource']:
        """Get list of available data sources"""
        return list(self.providers.keys())
    
    def test_connectivity(self) -> Dict['DataSource', bool]:
        """Test connectivity to all configured sources"""
        results = {}
        test_symbol = "AAPL"
        test_period = "1d"
        test_interval = "1h"
        
        for source, provider in self.providers.items():
            try:
                data = provider.fetch_data(test_symbol, test_period, test_interval)
                results[source] = not data.empty
            except Exception as e:
                logger.error(f"Connectivity test failed for {source}: {e}")
                results[source] = False
        
        return results


# Async version for high-performance data fetching
class AsyncMultiSourceProvider:
    """Asynchronous multi-source data provider"""
    
    def __init__(self, max_concurrent: int = 5):
        self.max_concurrent = max_concurrent
        self.session = None
        
    async def __aenter__(self):
        connector = aiohttp.TCPConnector(limit=self.max_concurrent)
        self.session = aiohttp.ClientSession(connector=connector)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def fetch_multiple_symbols(self, requests: List['DataRequest']) -> Dict[str, pd.DataFrame]:
        """Fetch data for multiple symbols concurrently"""
        semaphore = asyncio.Semaphore(self.max_concurrent)
        
        async def fetch_single(request: 'DataRequest') -> Tuple[str, pd.DataFrame]:
            async with semaphore:
                # For now, use sync providers (can be enhanced for true async)
                provider = MultiSourceDataProvider()
                # Add providers based on request.source
                try:
                    data, source = provider.fetch_data(
                        request.symbol, request.period, request.interval,
                        preferred_source=request.source
                    )
                    return request.symbol, data
                except Exception as e:
                    logger.error(f"Async fetch failed for {request.symbol}: {e}")
                    return request.symbol, pd.DataFrame()
        
        # Execute all requests concurrently
        tasks = [fetch_single(req) for req in requests]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        data_dict = {}
        for result in results:
            if isinstance(result, Exception):
                logger.error(f"Task failed: {result}")
                continue
            symbol, data = result
            data_dict[symbol] = data
        
        return data_dict