"""
Tests for genetic optimizer determinism and dual-objective scoring.

Validates that:
1. Optimizer produces deterministic results with same seed
2. Dual-objective scoring works correctly
3. Sharpe and equity objectives work as expected
4. Genome evaluation is consistent
"""
import tempfile
import os
import json


def test_optimizer_deterministic_with_seed():
    """Test that optimizer produces identical results with same seed."""
    from bagbot.optimizer.genetic_optimizer import run_ga, Genome
    from bagbot.backtest.loader import load_candles
    
    # Create sample CSV
    csv_content = """timestamp,open,high,low,close,volume
2024-01-01T00:00:00,100.0,101.0,99.0,100.0,1000.0
2024-01-01T01:00:00,100.0,102.0,99.5,101.0,1500.0
2024-01-01T02:00:00,101.0,103.0,100.0,102.0,2000.0
2024-01-01T03:00:00,102.0,104.0,101.0,103.0,2500.0
2024-01-01T04:00:00,103.0,105.0,102.0,104.0,3000.0
2024-01-01T05:00:00,104.0,106.0,103.0,105.0,3500.0
2024-01-01T06:00:00,105.0,107.0,104.0,106.0,4000.0
2024-01-01T07:00:00,106.0,108.0,105.0,107.0,4500.0
2024-01-01T08:00:00,107.0,109.0,106.0,108.0,5000.0
2024-01-01T09:00:00,108.0,110.0,107.0,109.0,5500.0
"""
    
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.csv') as f:
        f.write(csv_content)
        temp_path = f.name
    
    try:
        candles = load_candles(temp_path)
        
        # Run 1 with seed 42
        best1, score1 = run_ga(candles, pop_size=4, generations=2, seed=42, objective="sharpe")
        
        # Run 2 with same seed 42
        best2, score2 = run_ga(candles, pop_size=4, generations=2, seed=42, objective="sharpe")
        
        # Assert identical results
        assert score1 == score2, f"Scores differ: {score1} vs {score2}"
        assert best1.sma_short == best2.sma_short
        assert best1.sma_long == best2.sma_long
        assert best1.rsi_period == best2.rsi_period
        assert best1.risk_per_trade_pct == best2.risk_per_trade_pct
        
    finally:
        os.unlink(temp_path)


def test_optimizer_dual_objective_scoring():
    """Test that dual-objective returns proper breakdown."""
    from bagbot.optimizer.genetic_optimizer import evaluate_genome, random_genome
    from bagbot.backtest.loader import load_candles
    import random
    
    # Create sample CSV
    csv_content = """timestamp,open,high,low,close,volume
2024-01-01T00:00:00,100.0,101.0,99.0,100.0,1000.0
2024-01-01T01:00:00,100.0,102.0,99.5,101.0,1500.0
2024-01-01T02:00:00,101.0,103.0,100.0,102.0,2000.0
2024-01-01T03:00:00,102.0,104.0,101.0,103.0,2500.0
2024-01-01T04:00:00,103.0,105.0,102.0,104.0,3000.0
"""
    
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.csv') as f:
        f.write(csv_content)
        temp_path = f.name
    
    try:
        candles = load_candles(temp_path)
        rng = random.Random(42)
        genome = random_genome(rng)
        
        # Evaluate with dual objective
        result = evaluate_genome(genome, candles, objective="dual", penalty_factor=0.01)
        
        # Verify result is a dict with required fields
        assert isinstance(result, dict), "Dual objective should return dict"
        assert "sharpe" in result
        assert "max_drawdown" in result
        assert "score" in result
        assert "final_equity" in result
        assert "penalty_factor" in result
        
        # Verify score calculation
        expected_score = result["sharpe"] - (result["max_drawdown"] * result["penalty_factor"])
        assert abs(result["score"] - expected_score) < 0.001, "Score calculation incorrect"
        
    finally:
        os.unlink(temp_path)


def test_optimizer_sharpe_objective():
    """Test that sharpe objective returns float."""
    from bagbot.optimizer.genetic_optimizer import evaluate_genome, random_genome
    from bagbot.backtest.loader import load_candles
    import random
    
    csv_content = """timestamp,open,high,low,close,volume
2024-01-01T00:00:00,100.0,101.0,99.0,100.0,1000.0
2024-01-01T01:00:00,100.0,102.0,99.5,101.0,1500.0
2024-01-01T02:00:00,101.0,103.0,100.0,102.0,2000.0
"""
    
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.csv') as f:
        f.write(csv_content)
        temp_path = f.name
    
    try:
        candles = load_candles(temp_path)
        rng = random.Random(42)
        genome = random_genome(rng)
        
        # Evaluate with sharpe objective
        result = evaluate_genome(genome, candles, objective="sharpe")
        
        # Verify result is a float
        assert isinstance(result, (int, float)), f"Sharpe objective should return number, got {type(result)}"
        
    finally:
        os.unlink(temp_path)


def test_optimizer_equity_objective():
    """Test that equity objective returns final equity."""
    from bagbot.optimizer.genetic_optimizer import evaluate_genome, random_genome
    from bagbot.backtest.loader import load_candles
    import random
    
    csv_content = """timestamp,open,high,low,close,volume
2024-01-01T00:00:00,100.0,101.0,99.0,100.0,1000.0
2024-01-01T01:00:00,100.0,102.0,99.5,101.0,1500.0
2024-01-01T02:00:00,101.0,103.0,100.0,102.0,2000.0
"""
    
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.csv') as f:
        f.write(csv_content)
        temp_path = f.name
    
    try:
        candles = load_candles(temp_path)
        rng = random.Random(42)
        genome = random_genome(rng)
        
        # Evaluate with equity objective
        result = evaluate_genome(genome, candles, objective="equity")
        
        # Verify result is a number (final equity)
        assert isinstance(result, (int, float)), "Equity objective should return number"
        assert result >= 0, "Final equity should be non-negative"
        
    finally:
        os.unlink(temp_path)


def test_genome_to_config_mapping():
    """Test that Genome correctly maps to AIFusionConfig."""
    from bagbot.optimizer.genetic_optimizer import Genome
    
    genome = Genome(
        sma_short=10,
        sma_long=50,
        ema_short=12,
        ema_long=26,
        rsi_period=14,
        rsi_buy_threshold=30.0,
        rsi_sell_threshold=70.0,
        macd_fast=12,
        macd_slow=26,
        macd_signal=9,
        atr_period=14,
        risk_per_trade_pct=1.0,
        max_position_pct=5.0,
        volatility_threshold=0.5,
        trailing_stop_atr_mul=2.0,
    )
    
    config = genome.to_config()
    
    # Verify all fields mapped correctly
    assert config.sma_short == 10
    assert config.sma_long == 50
    assert config.ema_short == 12
    assert config.ema_long == 26
    assert config.rsi_period == 14
    assert config.macd_fast == 12
    assert config.macd_slow == 26
    assert config.macd_signal == 9
    assert config.atr_period == 14
    assert config.risk_per_trade_pct == 1.0
    assert config.max_position_pct == 5.0
    assert config.volatility_atr_threshold == 0.5
    assert config.trailing_atr_multiplier == 2.0


def test_dual_objective_deterministic():
    """Test that dual objective evaluation is deterministic."""
    from bagbot.optimizer.genetic_optimizer import evaluate_genome, Genome
    from bagbot.backtest.loader import load_candles
    
    csv_content = """timestamp,open,high,low,close,volume
2024-01-01T00:00:00,100.0,101.0,99.0,100.0,1000.0
2024-01-01T01:00:00,100.0,102.0,99.5,101.0,1500.0
2024-01-01T02:00:00,101.0,103.0,100.0,102.0,2000.0
2024-01-01T03:00:00,102.0,104.0,101.0,103.0,2500.0
2024-01-01T04:00:00,103.0,105.0,102.0,104.0,3000.0
"""
    
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.csv') as f:
        f.write(csv_content)
        temp_path = f.name
    
    try:
        candles = load_candles(temp_path)
        
        # Fixed genome
        genome = Genome(
            sma_short=10,
            sma_long=50,
            ema_short=12,
            ema_long=26,
            rsi_period=14,
            rsi_buy_threshold=30.0,
            rsi_sell_threshold=70.0,
            macd_fast=12,
            macd_slow=26,
            macd_signal=9,
            atr_period=14,
            risk_per_trade_pct=1.0,
            max_position_pct=5.0,
            volatility_threshold=0.5,
            trailing_stop_atr_mul=2.0,
        )
        
        # Evaluate multiple times
        result1 = evaluate_genome(genome, candles, objective="dual", penalty_factor=0.01)
        result2 = evaluate_genome(genome, candles, objective="dual", penalty_factor=0.01)
        result3 = evaluate_genome(genome, candles, objective="dual", penalty_factor=0.01)
        
        # Verify all runs produce identical results
        assert result1["score"] == result2["score"] == result3["score"]
        assert result1["sharpe"] == result2["sharpe"] == result3["sharpe"]
        assert result1["max_drawdown"] == result2["max_drawdown"] == result3["max_drawdown"]
        assert result1["final_equity"] == result2["final_equity"] == result3["final_equity"]
        
    finally:
        os.unlink(temp_path)


def test_dual_objective_penalty_factor():
    """Test that penalty factor affects dual objective score correctly."""
    from bagbot.optimizer.genetic_optimizer import evaluate_genome, Genome
    from bagbot.backtest.loader import load_candles
    
    csv_content = """timestamp,open,high,low,close,volume
2024-01-01T00:00:00,100.0,101.0,99.0,100.0,1000.0
2024-01-01T01:00:00,100.0,102.0,99.5,101.0,1500.0
2024-01-01T02:00:00,101.0,103.0,100.0,102.0,2000.0
2024-01-01T03:00:00,102.0,104.0,101.0,103.0,2500.0
"""
    
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.csv') as f:
        f.write(csv_content)
        temp_path = f.name
    
    try:
        candles = load_candles(temp_path)
        
        genome = Genome(
            sma_short=10,
            sma_long=50,
            ema_short=12,
            ema_long=26,
            rsi_period=14,
            rsi_buy_threshold=30.0,
            rsi_sell_threshold=70.0,
            macd_fast=12,
            macd_slow=26,
            macd_signal=9,
            atr_period=14,
            risk_per_trade_pct=1.0,
            max_position_pct=5.0,
            volatility_threshold=0.5,
            trailing_stop_atr_mul=2.0,
        )
        
        # Evaluate with different penalty factors
        result1 = evaluate_genome(genome, candles, objective="dual", penalty_factor=0.01)
        result2 = evaluate_genome(genome, candles, objective="dual", penalty_factor=0.05)
        
        # Verify sharpe and max_drawdown are same (they're independent of penalty)
        assert result1["sharpe"] == result2["sharpe"]
        assert result1["max_drawdown"] == result2["max_drawdown"]
        
        # Verify scores differ based on penalty (higher penalty = lower score if drawdown > 0)
        if result1["max_drawdown"] > 0:
            assert result2["score"] < result1["score"], "Higher penalty should lower score when drawdown exists"
        
    finally:
        os.unlink(temp_path)
