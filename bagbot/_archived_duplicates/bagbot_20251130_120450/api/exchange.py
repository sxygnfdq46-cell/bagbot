"""
Binance Exchange API Adapter

This module provides a clean interface for fetching cryptocurrency prices
from the Binance API with retry logic and error handling.
"""

import requests
import time
from typing import Dict, List, Optional


class ExchangeError(Exception):
    """Custom exception for exchange API errors."""
    pass


class BinanceAdapter:
    """
    Binance API adapter for fetching cryptocurrency prices.
    
    This class provides methods to fetch current market prices from Binance
    with built-in retry logic and error handling.
    
    Attributes:
        base_url (str): The base URL for Binance API
        session (requests.Session): HTTP session for making requests
    """
    
    def __init__(self):
        """Initialize the Binance adapter with session and base URL."""
        self.base_url = "https://api.binance.com/api/v3"
        self.session = requests.Session()
        # Set a reasonable timeout for requests
        self.session.timeout = 10
        
    def _make_request_with_retry(self, url: str, max_retries: int = 2) -> dict:
        """
        Make HTTP request with exponential backoff retry logic.
        
        Args:
            url (str): The URL to make request to
            max_retries (int): Maximum number of retry attempts (default: 2)
            
        Returns:
            dict: JSON response from the API
            
        Raises:
            ExchangeError: If all retry attempts fail
        """
        for attempt in range(max_retries + 1):
            try:
                response = self.session.get(url)
                response.raise_for_status()  # Raise exception for HTTP errors
                return response.json()
                
            except requests.exceptions.RequestException as e:
                if attempt == max_retries:
                    # Final attempt failed
                    raise ExchangeError(f"Failed to fetch data after {max_retries + 1} attempts: {str(e)}")
                
                # Exponential backoff: 0.5s, 1.0s
                wait_time = 0.5 * (2 ** attempt)
                print(f"Request failed (attempt {attempt + 1}/{max_retries + 1}), retrying in {wait_time}s...")
                time.sleep(wait_time)
    
    def fetch_all_prices(self) -> Dict[str, float]:
        """
        Fetch all cryptocurrency prices from Binance.
        
        Returns:
            Dict[str, float]: Dictionary mapping symbol to price
            Example: {'BTCUSDT': 45000.50, 'ETHUSDT': 3200.75, ...}
            
        Raises:
            ExchangeError: If API request fails after retries
        """
        url = f"{self.base_url}/ticker/price"
        
        try:
            data = self._make_request_with_retry(url)
            
            # Convert list of {symbol, price} to dict {symbol: price}
            prices = {}
            for item in data:
                symbol = item['symbol']
                price = float(item['price'])
                prices[symbol] = price
                
            return prices
            
        except (KeyError, ValueError, TypeError) as e:
            raise ExchangeError(f"Failed to parse price data: {str(e)}")
    
    def fetch_prices(self, symbols: List[str]) -> Dict[str, float]:
        """
        Fetch prices for specific cryptocurrency symbols.
        
        Args:
            symbols (List[str]): List of trading symbols to fetch
            Example: ['BTCUSDT', 'ETHUSDT', 'ADAUSDT']
            
        Returns:
            Dict[str, float]: Dictionary mapping symbol to price for requested symbols only
            Example: {'BTCUSDT': 45000.50, 'ETHUSDT': 3200.75}
            
        Raises:
            ExchangeError: If API request fails after retries
        """
        if not symbols:
            return {}
            
        # Fetch all prices then filter
        all_prices = self.fetch_all_prices()
        
        # Filter to only requested symbols
        filtered_prices = {}
        for symbol in symbols:
            if symbol in all_prices:
                filtered_prices[symbol] = all_prices[symbol]
            else:
                print(f"Warning: Symbol {symbol} not found in Binance data")
                
        return filtered_prices
    
    def close(self):
        """Close the HTTP session."""
        if self.session:
            self.session.close()
    
    def __enter__(self):
        """Context manager entry."""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit - ensures session is closed."""
        self.close()


# Usage Example
if __name__ == "__main__":
    """
    Example usage of the BinanceAdapter class.
    """
    
    # Example 1: Fetch all prices
    print("=== Fetching all cryptocurrency prices ===")
    
    try:
        with BinanceAdapter() as binance:
            all_prices = binance.fetch_all_prices()
            print(f"Fetched {len(all_prices)} cryptocurrency prices")
            
            # Show first 5 prices as example
            for i, (symbol, price) in enumerate(all_prices.items()):
                if i >= 5:  # Only show first 5
                    break
                print(f"{symbol}: ${price:,.2f}")
            print("...")
                
    except ExchangeError as e:
        print(f"Error fetching all prices: {e}")
    
    print("\n" + "="*50 + "\n")
    
    # Example 2: Fetch specific symbols
    print("=== Fetching specific cryptocurrency prices ===")
    
    symbols_to_fetch = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'DOGEUSDT']
    
    try:
        with BinanceAdapter() as binance:
            prices = binance.fetch_prices(symbols_to_fetch)
            
            print(f"Requested symbols: {symbols_to_fetch}")
            print(f"Fetched {len(prices)} prices:")
            
            for symbol, price in prices.items():
                print(f"  {symbol}: ${price:,.2f}")
                
    except ExchangeError as e:
        print(f"Error fetching specific prices: {e}")