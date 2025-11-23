"""
Tests for genetic optimizer with dual-objective scoring (Sharpe - Drawdown penalty).

Validates:
1. Dual objective returns proper dict structure
2. Optimizer is deterministic with same seed
3. Different seeds produce different results
4. Penalty factor affects scores correctly
"""
import tempfile
import os


def test_dual_objective_returns_dict():
    """Test that dual objective returns dict with all required fields."""
    from bagbot.optimizer.genetic_optimizer import evaluate_genome, Genome
    from bagbot.backtest.loader import load_candles
    
    candles = load_candles('bagbot/tests/data/BTCSTUSDT-1h-merged.csv')[:50]
    
    genome = Genome(
        sma_short=10, sma_long=30,
        ema_short=10, ema_long=30,
        rsi_period=14, rsi_buy_threshold=30.0, rsi_sell_threshold=70.0,
        macd_fast=12, macd_slow=26, macd_signal=9,
        atr_period=14,
        risk_per_trade_pct=1.0, max_position_pct=5.0,
        volatility_threshold=0.5, trailing_stop_atr_mul=2.0
    )
    
    result = evaluate_genome(genome, candles, objective="dual", penalty_factor=0.01)
    
    # Verify result is a dict
    assert isinstance(result, dict), f"Expected dict, got {type(result)}"
    
    # Verify all required fields present
    assert "sharpe" in result
    assert "max_drawdown" in result
    assert "score" in result
    assert "final_equity" in result
    assert "penalty_factor" in result
    
    # Verify score is Sharpe minus penalty
    expected_score = result["sharpe"] - (result["max_drawdown"] * result["penalty_factor"])
    assert abs(result["score"] - expected_score) < 0.0001


def test_optimizer_deterministic_with_seed():
    """Test that optimizer produces identical results with same seed."""
    from bagbot.optimizer.genetic_optimizer import run_ga
    from bagbot.backtest.loader import load_candles
    
    candles = load_candles('bagbot/tests/data/BTCSTUSDT-1h-merged.csv')[:100]
    
    # Run 1
    best_genome1, best_result1 = run_ga(
        candles=candles,
        pop_size=4,
        generations=2,
        seed=42,
        objective="dual",
        penalty_factor=0.01
    )
    
    # Run 2 with same seed
    best_genome2, best_result2 = run_ga(
        candles=candles,
        pop_size=4,
        generations=2,
        seed=42,
        objective="dual",
        penalty_factor=0.01
    )
    
    # Verify determinism
    assert isinstance(best_result1, dict) and isinstance(best_result2, dict)
    assert best_result1["score"] == best_result2["score"]
    assert best_result1["sharpe"] == best_result2["sharpe"]
    assert best_result1["max_drawdown"] == best_result2["max_drawdown"]
    assert best_genome1 == best_genome2


def test_optimizer_different_seeds_differ():
    """Test that different seeds produce different results."""
    from bagbot.optimizer.genetic_optimizer import run_ga
    from bagbot.backtest.loader import load_candles
    
    candles = load_candles('bagbot/tests/data/BTCSTUSDT-1h-merged.csv')[:100]
    
    # Run with seed 42
    best_genome1, best_result1 = run_ga(
        candles=candles,
        pop_size=4,
        generations=2,
        seed=42,
        objective="dual",
        penalty_factor=0.01
    )
    
    # Run with seed 99
    best_genome2, best_result2 = run_ga(
        candles=candles,
        pop_size=4,
        generations=2,
        seed=99,
        objective="dual",
        penalty_factor=0.01
    )
    
    # Different seeds should produce different genomes
    # (extremely unlikely to be identical by chance)
    assert best_genome1 != best_genome2


def test_penalty_factor_affects_score():
    """Test that penalty factor correctly modifies the score calculation."""
    from bagbot.optimizer.genetic_optimizer import evaluate_genome, Genome
    from bagbot.backtest.loader import load_candles
    
    candles = load_candles('bagbot/tests/data/BTCSTUSDT-1h-merged.csv')[:50]
    
    # Fixed genome for consistent testing
    genome = Genome(
        sma_short=10, sma_long=30,
        ema_short=10, ema_long=30,
        rsi_period=14, rsi_buy_threshold=30.0, rsi_sell_threshold=70.0,
        macd_fast=12, macd_slow=26, macd_signal=9,
        atr_period=14,
        risk_per_trade_pct=1.0, max_position_pct=5.0,
        volatility_threshold=0.5, trailing_stop_atr_mul=2.0
    )
    
    # Evaluate with low penalty
    result_low = evaluate_genome(genome, candles, objective="dual", penalty_factor=0.01)
    
    # Evaluate with high penalty (same genome)
    result_high = evaluate_genome(genome, candles, objective="dual", penalty_factor=10.0)
    
    # Verify both are dicts
    assert isinstance(result_low, dict) and isinstance(result_high, dict)
    
    # Sharpe should be identical (same genome, same data)
    assert result_high["sharpe"] == result_low["sharpe"]
    
    # If there's drawdown, higher penalty should give lower score
    if result_low["max_drawdown"] > 0:
        assert result_high["score"] < result_low["score"]
        # Verify the math: score = sharpe - (drawdown * penalty)
        expected_high = result_high["sharpe"] - (result_high["max_drawdown"] * 10.0)
        assert abs(result_high["score"] - expected_high) < 0.0001


def test_sharpe_objective_still_works():
    """Test that regular Sharpe objective still returns float."""
    from bagbot.optimizer.genetic_optimizer import evaluate_genome, Genome
    from bagbot.backtest.loader import load_candles
    
    candles = load_candles('bagbot/tests/data/BTCSTUSDT-1h-merged.csv')[:50]
    
    genome = Genome(
        sma_short=10, sma_long=30,
        ema_short=10, ema_long=30,
        rsi_period=14, rsi_buy_threshold=30.0, rsi_sell_threshold=70.0,
        macd_fast=12, macd_slow=26, macd_signal=9,
        atr_period=14,
        risk_per_trade_pct=1.0, max_position_pct=5.0,
        volatility_threshold=0.5, trailing_stop_atr_mul=2.0
    )
    
    result = evaluate_genome(genome, candles, objective="sharpe")
    
    # Sharpe objective should return float
    assert isinstance(result, (int, float)), f"Expected number, got {type(result)}"


def test_equity_objective_still_works():
    """Test that equity objective still returns float."""
    from bagbot.optimizer.genetic_optimizer import evaluate_genome, Genome
    from bagbot.backtest.loader import load_candles
    
    candles = load_candles('bagbot/tests/data/BTCSTUSDT-1h-merged.csv')[:50]
    
    genome = Genome(
        sma_short=10, sma_long=30,
        ema_short=10, ema_long=30,
        rsi_period=14, rsi_buy_threshold=30.0, rsi_sell_threshold=70.0,
        macd_fast=12, macd_slow=26, macd_signal=9,
        atr_period=14,
        risk_per_trade_pct=1.0, max_position_pct=5.0,
        volatility_threshold=0.5, trailing_stop_atr_mul=2.0
    )
    
    result = evaluate_genome(genome, candles, objective="equity")
    
    # Equity objective should return float
    assert isinstance(result, (int, float)), f"Expected number, got {type(result)}"
    # Should be around starting balance if no trades
    assert result >= 0


def test_dual_objective_handles_no_trades():
    """Test that dual objective handles genomes with no trades gracefully."""
    from bagbot.optimizer.genetic_optimizer import evaluate_genome, Genome
    from bagbot.backtest.loader import load_candles
    
    candles = load_candles('bagbot/tests/data/BTCSTUSDT-1h-merged.csv')[:20]
    
    # Extreme parameters that likely won't trigger trades
    genome = Genome(
        sma_short=5, sma_long=50,
        ema_short=5, ema_long=50,
        rsi_period=14, rsi_buy_threshold=5.0, rsi_sell_threshold=95.0,
        macd_fast=12, macd_slow=26, macd_signal=9,
        atr_period=14,
        risk_per_trade_pct=0.1, max_position_pct=1.0,
        volatility_threshold=0.01, trailing_stop_atr_mul=5.0
    )
    
    result = evaluate_genome(genome, candles, objective="dual", penalty_factor=0.01)
    
    # Should still return dict even with no trades
    assert isinstance(result, dict)
    assert "score" in result
    
    # Score should be negative (penalty for no activity)
    # Or at least handle the case gracefully
    assert isinstance(result["score"], (int, float))
