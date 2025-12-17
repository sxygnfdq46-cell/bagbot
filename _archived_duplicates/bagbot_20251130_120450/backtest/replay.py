"""Replay engine for feeding historical candles sequentially."""
from typing import List, Callable, Optional


class ReplayEngine:
    """
    Replay engine that feeds historical candles sequentially to a callback.
    
    No threading, no sleeping, no concurrency. Pure deterministic iteration.
    """
    
    def __init__(self, candles: List[dict], tick_callback: Optional[Callable[[dict], None]] = None):
        """
        Initialize replay engine.
        
        Args:
            candles: List of candle dicts ordered oldest to newest
            tick_callback: Optional callback function called once per candle with the candle dict
        """
        self.candles = candles
        self.tick_callback = tick_callback
    
    def run(self) -> None:
        """
        Iterate through all candles and call tick_callback(candle) for each sequentially.
        """
        if self.tick_callback is None:
            return
            
        for candle in self.candles:
            self.tick_callback(candle)
    
    def run_from_to(self, start_idx: int, end_idx: int) -> None:
        """
        Run subset of candles by index range.
        
        Args:
            start_idx: Starting index (inclusive)
            end_idx: Ending index (inclusive)
        """
        if self.tick_callback is None:
            return
            
        for i in range(start_idx, end_idx + 1):
            if 0 <= i < len(self.candles):
                self.tick_callback(self.candles[i])


def create_brain_adapter(brain: object, executor: object) -> Callable[[dict], None]:
    """
    Create adapter function that bridges ReplayEngine tick_callback to Brain/Executor.
    
    The tick callback must create a snapshot payload dict compatible with Brain's
    on_price_update path. For each candle, form snapshot = {"symbol": <symbol>, 
    "price": candle["close"], "timestamp": candle["timestamp"]}.
    
    Call the Brain method used by the rest of project for price updates — call
    brain.on_price_update(snapshot) (or the correct public method name used in current
    Brain code). If Brain expects job-based flow, do NOT change Brain. Instead call the
    Brain method that strategies expect; if only job_queue interface exists, then create a
    job object and push to JobQueue — but do not modify Brain's public API here, adapt
    to existing interface.
    
    After Brain/Strategy produces a decision (strategy returns a decision dict or None), if
    decision requests EXECUTE_ORDER then translate that to
    BacktestExecutor.open_position or close_position calls (use decision fields
    exactly as existing strategy returns: e.g.
    {"type":"EXECUTE_ORDER","symbol":..., "side":"LONG"|"SHORT","size":..., "price": ...}).
    
    On every tick call executor.update_equity({"symbol": symbol, "price": candle["close"]}).
    
    Args:
        brain: TradingBrain instance
        executor: BacktestExecutor instance
        
    Returns:
        Callable that takes candle dict and processes it through brain/executor
    """
    def tick_callback(candle: dict) -> None:
        # Form snapshot payload compatible with Brain's on_price_update
        snapshot = {
            "symbol": candle.get("symbol", "BTCUSDT"),
            "price": candle["close"],
            "timestamp": candle["timestamp"]
        }
        
        # Call Brain's on_price_update method (current Brain code uses this)
        decision = None
        try:
            if hasattr(brain, 'on_price_update') and callable(getattr(brain, 'on_price_update')):
                decision = brain.on_price_update(snapshot)
        except (KeyboardInterrupt, SystemExit):
            raise
        except Exception:
            pass
        
        # If decision requests EXECUTE_ORDER, translate to executor calls
        if isinstance(decision, dict) and decision.get("type") == "EXECUTE_ORDER":
            order = {
                "symbol": decision.get("symbol", snapshot["symbol"]),
                "side": decision.get("side"),
                "size": decision.get("size"),
                "price": decision.get("price")
            }
            
            # Call executor's appropriate method
            try:
                if hasattr(executor, 'execute_order') and callable(getattr(executor, 'execute_order')):
                    executor.execute_order(order)
                elif hasattr(executor, 'open_position') and callable(getattr(executor, 'open_position')):
                    executor.open_position(order)
            except (KeyboardInterrupt, SystemExit):
                raise
            except Exception:
                pass
        
        # On every tick call executor.update_equity
        try:
            if hasattr(executor, 'update_equity') and callable(getattr(executor, 'update_equity')):
                executor.update_equity({"symbol": snapshot["symbol"], "price": candle["close"]})
        except (KeyboardInterrupt, SystemExit):
            raise
        except Exception:
            pass
    
    return tick_callback
