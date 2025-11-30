"""Metrics and reporting functions for backtest performance analysis."""
import math
import statistics
from typing import List, Dict, Optional


def compute_sharpe(equity_series: List[float], risk_free_rate: float = 0.0) -> Optional[float]:
    """
    Calculate annualized Sharpe ratio from equity series.
    
    Args:
        equity_series: List of equity values over time
        risk_free_rate: Risk-free rate (default 0.0)
    
    Returns:
        Annualized Sharpe ratio or None if less than 2 returns
    
    Uses daily returns; implements simple annualized Sharpe = mean(returns)/std(returns) * sqrt(252).
    If less than 2 returns, return None.
    """
    if len(equity_series) < 2:
        return None
    
    # Calculate returns
    returns = []
    for i in range(1, len(equity_series)):
        if equity_series[i - 1] != 0:
            ret = (equity_series[i] - equity_series[i - 1]) / equity_series[i - 1]
            returns.append(ret)
    
    if len(returns) < 2:
        return None
    
    mean_return = statistics.mean(returns)
    std_return = statistics.stdev(returns)
    
    if std_return == 0:
        return None
    
    # Annualized Sharpe = mean(returns)/std(returns) * sqrt(252)
    sharpe = (mean_return / std_return) * math.sqrt(252)
    return float(sharpe)


def compute_max_drawdown(equity_series: List[float]) -> float:
    """
    Calculate peak-to-trough % drawdown (positive number).
    
    Args:
        equity_series: List of equity values over time
    
    Returns:
        Maximum drawdown as positive percentage (e.g., 0.15 for 15% drawdown)
    """
    if not equity_series:
        return 0.0
    
    max_dd = 0.0
    peak = equity_series[0]
    
    for equity in equity_series:
        if equity > peak:
            peak = equity
        
        if peak > 0:
            drawdown = (peak - equity) / peak
            if drawdown > max_dd:
                max_dd = drawdown
    
    return float(max_dd)


def compute_total_return(equity_series: List[float]) -> float:
    """
    Calculate total return (last/first - 1).
    
    Args:
        equity_series: List of equity values over time
    
    Returns:
        Total return as decimal (e.g., 0.25 for 25% return)
    """
    if not equity_series or equity_series[0] == 0:
        return 0.0
    
    return float((equity_series[-1] / equity_series[0]) - 1.0)


def generate_report(trade_history: List[dict], equity_history: List[float]) -> dict:
    """
    Generate performance report with key metrics.
    
    Args:
        trade_history: List of trade dicts
        equity_history: List of equity values over time
    
    Returns:
        Dict with metrics: num_trades, win_rate, sharpe, max_drawdown, total_return
        If no trades, return None for win_rate
    """
    num_trades = len(trade_history)
    
    # Calculate win rate
    win_rate = None
    if num_trades > 0:
        winning_trades = sum(1 for trade in trade_history if trade.get("pnl", 0) > 0)
        win_rate = float(winning_trades / num_trades)
    
    # Calculate metrics
    sharpe = compute_sharpe(equity_history)
    max_dd = compute_max_drawdown(equity_history)
    total_ret = compute_total_return(equity_history)
    
    return {
        "num_trades": num_trades,
        "win_rate": win_rate,
        "sharpe": sharpe,
        "max_drawdown": max_dd,
        "total_return": total_ret
    }
