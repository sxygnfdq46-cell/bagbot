"""Simulated order executor and account tracking for backtesting."""
from typing import List, Dict, Optional


class BacktestExecutor:
    """
    Lightweight deterministic backtest executor that calls strategy hooks and forwards
    execution decisions to a virtual account if present.
    """
    
    def __init__(self, account: object, strategy: object) -> None:
        """
        Initialize backtest executor.
        
        Args:
            account: Account object with execute_order/apply_order and update_equity methods
            strategy: Strategy object with on_price_update method
        """
        self.account = account
        self.strategy = strategy
    
    def run(self, candles: List[dict]) -> None:
        """
        Iterate candles oldest → newest and call process_candle for each.
        
        Args:
            candles: List of candle dicts
        """
        for candle in candles:
            self.process_candle(candle)
    
    def run_from_to(self, candles: List[dict], start_idx: int, end_idx: int) -> None:
        """
        Run process_candle for candles[start_idx:end_idx] (Python slicing semantics).
        
        Args:
            candles: List of candle dicts
            start_idx: Starting index (inclusive)
            end_idx: Ending index (inclusive)
        """
        for i in range(start_idx, end_idx + 1):
            if 0 <= i < len(candles):
                self.process_candle(candles[i])
    
    def process_candle(self, candle: dict) -> None:
        """
        Process a single candle: call strategy, handle decision, update equity.
        
        Args:
            candle: Candle dict with timestamp, open, high, low, close, volume
        """
        decision = None
        
        # Call strategy.on_price_update(candle) and allow None
        try:
            decision = self.strategy.on_price_update(candle)
        except (KeyboardInterrupt, SystemExit):
            raise
        except Exception:
            pass
        
        # If decision is a dict and decision.get("type") == "EXECUTE_ORDER"
        if isinstance(decision, dict) and decision.get("type") == "EXECUTE_ORDER":
            # Extract order = decision.get("order", {}) (a dict)
            order = decision.get("order", {})
            
            # If self.account has a callable attribute execute_order, call it
            if hasattr(self.account, "execute_order") and callable(getattr(self.account, "execute_order")):
                try:
                    self.account.execute_order(order)
                except (KeyboardInterrupt, SystemExit):
                    raise
                except Exception:
                    pass
            # Otherwise, if self.account has apply_order, call it
            elif hasattr(self.account, "apply_order") and callable(getattr(self.account, "apply_order")):
                try:
                    self.account.apply_order(order)
                except (KeyboardInterrupt, SystemExit):
                    raise
                except Exception:
                    pass
        
        # After handling decision, if self.account has a callable update_equity, call it
        if hasattr(self.account, "update_equity") and callable(getattr(self.account, "update_equity")):
            snapshot = {
                "timestamp": candle.get("timestamp"),
                "price": candle.get("close")
            }
            try:
                self.account.update_equity(snapshot)
            except (KeyboardInterrupt, SystemExit):
                raise
            except Exception:
                pass
