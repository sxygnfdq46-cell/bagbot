"""Unit tests for Binance connector.

These tests verify the connector can be instantiated and configured properly.
They use sandbox/testnet mode and do not execute live orders.
"""

import pytest
import os
from unittest.mock import patch, AsyncMock, MagicMock
import ccxt.async_support as ccxt

from trading.connectors.binance_connector import BinanceConnector


class TestBinanceConnectorInstantiation:
    """Test connector initialization and configuration."""
    
    def test_init_with_explicit_credentials(self):
        """Test connector initialization with explicit API credentials."""
        connector = BinanceConnector(
            api_key="test_key",
            api_secret="test_secret",
            testnet=True,
        )
        
        assert connector.api_key == "test_key"
        assert connector.api_secret == "test_secret"
        assert connector.testnet is True
        assert connector.futures is False
        assert connector._exchange is None
    
    def test_init_with_env_credentials(self):
        """Test connector initialization reading from environment variables."""
        with patch.dict(os.environ, {
            "BINANCE_API_KEY": "env_key",
            "BINANCE_API_SECRET": "env_secret"
        }):
            connector = BinanceConnector(testnet=True)
            
            assert connector.api_key == "env_key"
            assert connector.api_secret == "env_secret"
    
    def test_init_futures_mode(self):
        """Test connector initialization in futures mode."""
        connector = BinanceConnector(
            api_key="test_key",
            api_secret="test_secret",
            testnet=True,
            futures=True,
        )
        
        assert connector.futures is True
    
    def test_init_without_credentials(self):
        """Test connector initialization without credentials."""
        with patch.dict(os.environ, {}, clear=True):
            connector = BinanceConnector(testnet=True)
            
            assert connector.api_key == ""
            assert connector.api_secret == ""


class TestBinanceConnectorConfiguration:
    """Test connector configuration and setup."""
    
    @pytest.mark.asyncio
    async def test_get_exchange_testnet_spot(self):
        """Test exchange instance creation for testnet spot trading."""
        connector = BinanceConnector(
            api_key="test_key",
            api_secret="test_secret",
            testnet=True,
            futures=False,
        )
        
        with patch("ccxt.async_support.binance") as mock_binance:
            mock_exchange = AsyncMock()
            mock_binance.return_value = mock_exchange
            
            exchange = await connector._get_exchange()
            
            # Verify exchange was created with correct config
            mock_binance.assert_called_once()
            call_args = mock_binance.call_args[0][0]
            
            assert call_args["apiKey"] == "test_key"
            assert call_args["secret"] == "test_secret"
            assert call_args["enableRateLimit"] is True
            assert "urls" in call_args
            assert "testnet.binance.vision" in str(call_args["urls"])
            
            # Verify futures not enabled
            assert call_args["options"].get("defaultType") != "future"
    
    @pytest.mark.asyncio
    async def test_get_exchange_testnet_futures(self):
        """Test exchange instance creation for testnet futures trading."""
        connector = BinanceConnector(
            api_key="test_key",
            api_secret="test_secret",
            testnet=True,
            futures=True,
        )
        
        with patch("ccxt.async_support.binance") as mock_binance:
            mock_exchange = AsyncMock()
            mock_binance.return_value = mock_exchange
            
            exchange = await connector._get_exchange()
            
            # Verify futures mode enabled
            call_args = mock_binance.call_args[0][0]
            assert call_args["options"]["defaultType"] == "future"
    
    @pytest.mark.asyncio
    async def test_get_exchange_singleton(self):
        """Test that _get_exchange returns the same instance."""
        connector = BinanceConnector(
            api_key="test_key",
            api_secret="test_secret",
            testnet=True,
        )
        
        with patch("ccxt.async_support.binance") as mock_binance:
            mock_exchange = AsyncMock()
            mock_binance.return_value = mock_exchange
            
            exchange1 = await connector._get_exchange()
            exchange2 = await connector._get_exchange()
            
            # Should only create exchange once
            mock_binance.assert_called_once()
            assert exchange1 is exchange2
    
    @pytest.mark.asyncio
    async def test_close(self):
        """Test closing the connector."""
        connector = BinanceConnector(
            api_key="test_key",
            api_secret="test_secret",
            testnet=True,
        )
        
        with patch("ccxt.async_support.binance") as mock_binance:
            mock_exchange = AsyncMock()
            mock_binance.return_value = mock_exchange
            
            await connector._get_exchange()
            await connector.close()
            
            # Verify close was called
            mock_exchange.close.assert_called_once()
            assert connector._exchange is None


class TestBinanceConnectorMethods:
    """Test connector interface methods (mocked)."""
    
    @pytest.mark.asyncio
    async def test_fetch_balance(self):
        """Test fetching account balance."""
        connector = BinanceConnector(
            api_key="test_key",
            api_secret="test_secret",
            testnet=True,
        )
        
        mock_balance = {
            "total": {"USDT": 1000.0, "BTC": 0.5},
            "free": {"USDT": 800.0, "BTC": 0.3},
            "used": {"USDT": 200.0, "BTC": 0.2},
        }
        
        with patch("ccxt.async_support.binance") as mock_binance:
            mock_exchange = AsyncMock()
            mock_exchange.fetch_balance = AsyncMock(return_value=mock_balance)
            mock_binance.return_value = mock_exchange
            
            result = await connector.fetch_balance()
            
            assert "USDT" in result
            assert "BTC" in result
            assert result["USDT"]["total"] == 1000.0
            assert result["USDT"]["free"] == 800.0
            assert result["USDT"]["used"] == 200.0
            assert result["BTC"]["total"] == 0.5
    
    @pytest.mark.asyncio
    async def test_create_market_order(self):
        """Test creating a market order."""
        connector = BinanceConnector(
            api_key="test_key",
            api_secret="test_secret",
            testnet=True,
        )
        
        mock_order = {
            "id": "12345",
            "symbol": "BTC/USDT",
            "side": "buy",
            "type": "market",
            "status": "closed",
            "amount": 0.001,
            "filled": 0.001,
        }
        
        with patch("ccxt.async_support.binance") as mock_binance:
            mock_exchange = AsyncMock()
            mock_exchange.create_market_order = AsyncMock(return_value=mock_order)
            mock_binance.return_value = mock_exchange
            
            order_payload = {
                "symbol": "BTC/USDT",
                "side": "buy",
                "type": "market",
                "amount": 0.001,
            }
            
            result = await connector.create_order(order_payload)
            
            assert result["id"] == "12345"
            assert result["symbol"] == "BTC/USDT"
            assert result["side"] == "buy"
            assert result["type"] == "market"
            
            mock_exchange.create_market_order.assert_called_once_with(
                "BTC/USDT", "buy", 0.001, {}
            )
    
    @pytest.mark.asyncio
    async def test_create_limit_order(self):
        """Test creating a limit order."""
        connector = BinanceConnector(
            api_key="test_key",
            api_secret="test_secret",
            testnet=True,
        )
        
        mock_order = {
            "id": "67890",
            "symbol": "BTC/USDT",
            "side": "sell",
            "type": "limit",
            "status": "open",
            "amount": 0.001,
            "price": 50000.0,
            "filled": 0.0,
        }
        
        with patch("ccxt.async_support.binance") as mock_binance:
            mock_exchange = AsyncMock()
            mock_exchange.create_limit_order = AsyncMock(return_value=mock_order)
            mock_binance.return_value = mock_exchange
            
            order_payload = {
                "symbol": "BTC/USDT",
                "side": "sell",
                "type": "limit",
                "amount": 0.001,
                "price": 50000.0,
            }
            
            result = await connector.create_order(order_payload)
            
            assert result["id"] == "67890"
            assert result["price"] == 50000.0
            
            mock_exchange.create_limit_order.assert_called_once_with(
                "BTC/USDT", "sell", 0.001, 50000.0, {}
            )
    
    @pytest.mark.asyncio
    async def test_cancel_order(self):
        """Test canceling an order."""
        connector = BinanceConnector(
            api_key="test_key",
            api_secret="test_secret",
            testnet=True,
        )
        
        mock_result = {
            "id": "12345",
            "status": "canceled",
        }
        
        with patch("ccxt.async_support.binance") as mock_binance:
            mock_exchange = AsyncMock()
            mock_exchange.cancel_order = AsyncMock(return_value=mock_result)
            mock_binance.return_value = mock_exchange
            
            result = await connector.cancel_order("12345", "BTC/USDT")
            
            assert result["id"] == "12345"
            assert result["status"] == "canceled"
            
            mock_exchange.cancel_order.assert_called_once_with("12345", "BTC/USDT")
    
    @pytest.mark.asyncio
    async def test_fetch_positions_spot(self):
        """Test fetching positions for spot trading (should return empty)."""
        connector = BinanceConnector(
            api_key="test_key",
            api_secret="test_secret",
            testnet=True,
            futures=False,  # Spot mode
        )
        
        result = await connector.fetch_positions()
        
        # Spot trading has no positions
        assert result == {}
    
    @pytest.mark.asyncio
    async def test_fetch_positions_futures(self):
        """Test fetching positions for futures trading."""
        connector = BinanceConnector(
            api_key="test_key",
            api_secret="test_secret",
            testnet=True,
            futures=True,
        )
        
        mock_positions = [
            {
                "symbol": "BTC/USDT",
                "side": "long",
                "contracts": 0.1,
                "unrealizedPnl": 50.0,
                "leverage": 10.0,
                "entryPrice": 49000.0,
                "markPrice": 50000.0,
                "liquidationPrice": 44000.0,
                "marginType": "isolated",
                "timestamp": 1234567890000,
            },
            {
                "symbol": "ETH/USDT",
                "side": "short",
                "contracts": 0.0,  # Closed position
                "unrealizedPnl": 0.0,
            },
        ]
        
        with patch("ccxt.async_support.binance") as mock_binance:
            mock_exchange = AsyncMock()
            mock_exchange.fetch_positions = AsyncMock(return_value=mock_positions)
            mock_binance.return_value = mock_exchange
            
            result = await connector.fetch_positions()
            
            # Should only include open positions
            assert "BTC/USDT" in result
            assert "ETH/USDT" not in result  # Closed position excluded
            
            btc_position = result["BTC/USDT"]
            assert btc_position["side"] == "long"
            assert btc_position["contracts"] == 0.1
            assert btc_position["unrealizedPnl"] == 50.0
            assert btc_position["leverage"] == 10.0
    
    @pytest.mark.asyncio
    async def test_fetch_ticker(self):
        """Test fetching ticker data."""
        connector = BinanceConnector(
            api_key="test_key",
            api_secret="test_secret",
            testnet=True,
        )
        
        mock_ticker = {
            "symbol": "BTC/USDT",
            "last": 50000.0,
            "bid": 49999.0,
            "ask": 50001.0,
            "high": 51000.0,
            "low": 49000.0,
            "volume": 1234.5,
        }
        
        with patch("ccxt.async_support.binance") as mock_binance:
            mock_exchange = AsyncMock()
            mock_exchange.fetch_ticker = AsyncMock(return_value=mock_ticker)
            mock_binance.return_value = mock_exchange
            
            result = await connector.fetch_ticker("BTC/USDT")
            
            assert result["symbol"] == "BTC/USDT"
            assert result["last"] == 50000.0
            assert result["bid"] == 49999.0
            assert result["ask"] == 50001.0
            
            mock_exchange.fetch_ticker.assert_called_once_with("BTC/USDT")
    
    @pytest.mark.asyncio
    async def test_fetch_order(self):
        """Test fetching order details."""
        connector = BinanceConnector(
            api_key="test_key",
            api_secret="test_secret",
            testnet=True,
        )
        
        mock_order = {
            "id": "12345",
            "symbol": "BTC/USDT",
            "status": "filled",
            "side": "buy",
            "type": "limit",
            "amount": 0.001,
            "price": 50000.0,
            "filled": 0.001,
        }
        
        with patch("ccxt.async_support.binance") as mock_binance:
            mock_exchange = AsyncMock()
            mock_exchange.fetch_order = AsyncMock(return_value=mock_order)
            mock_binance.return_value = mock_exchange
            
            result = await connector.fetch_order("12345", "BTC/USDT")
            
            assert result["id"] == "12345"
            assert result["status"] == "filled"
            
            mock_exchange.fetch_order.assert_called_once_with("12345", "BTC/USDT")


class TestBinanceConnectorErrorHandling:
    """Test error handling in connector methods."""
    
    @pytest.mark.asyncio
    async def test_fetch_balance_error(self):
        """Test error handling when fetching balance fails."""
        connector = BinanceConnector(
            api_key="test_key",
            api_secret="test_secret",
            testnet=True,
        )
        
        with patch("ccxt.async_support.binance") as mock_binance:
            mock_exchange = AsyncMock()
            mock_exchange.fetch_balance = AsyncMock(
                side_effect=ccxt.NetworkError("Connection failed")
            )
            mock_binance.return_value = mock_exchange
            
            with pytest.raises(ccxt.NetworkError):
                await connector.fetch_balance()
    
    @pytest.mark.asyncio
    async def test_create_order_without_price(self):
        """Test that limit orders without price raise an error."""
        connector = BinanceConnector(
            api_key="test_key",
            api_secret="test_secret",
            testnet=True,
        )
        
        with patch("ccxt.async_support.binance") as mock_binance:
            mock_exchange = AsyncMock()
            mock_binance.return_value = mock_exchange
            
            order_payload = {
                "symbol": "BTC/USDT",
                "side": "buy",
                "type": "limit",
                "amount": 0.001,
                # Missing price!
            }
            
            with pytest.raises(ValueError, match="Limit orders require a price"):
                await connector.create_order(order_payload)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
