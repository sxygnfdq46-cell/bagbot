"""
Deterministic Genetic Optimizer for the AI Fusion Strategy.

Usage:
    python -m optimizer.genetic_optimizer --data ./BTCSTUSDT-1h-merged.csv --pop 24 --gens 30

Notes:
  - Deterministic (seedable)
  - Runs backtests in-process using project's backtest API (no subprocesses)
  - Uses simple GA: tournament selection, one-point crossover, gaussian mutation
  - Objective: maximize final equity (last equity point)
  - No threads or network calls
"""

from __future__ import annotations
import argparse
import copy
import json
import math
import os
import random
import statistics
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Any, List, Tuple, Callable, Optional

# IMPORTS — adapt to your project layout
from backtest.loader import load_candles
from backtest.executor import BacktestExecutor
from backtest.replay import ReplayEngine
from backtest.reporting import generate_report, compute_sharpe
from worker.strategies.ai_fusion import AIFusionStrategy, AIFusionConfig
from worker.executor.account import VirtualAccount

# ——————————————————————————
# Helper dataclasses
# ——————————————————————————
@dataclass
class Genome:
    """Container for parameters to optimize."""
    sma_short: int
    sma_long: int
    ema_short: int
    ema_long: int
    rsi_period: int
    rsi_buy_threshold: float
    rsi_sell_threshold: float
    macd_fast: int
    macd_slow: int
    macd_signal: int
    atr_period: int
    risk_per_trade_pct: float
    max_position_pct: float
    volatility_threshold: float
    trailing_stop_atr_mul: float

    def to_config(self) -> AIFusionConfig:
        """Map genome to AIFusionConfig dataclass used by strategy."""
        # adjust names to AIFusionConfig fields if they differ in your code
        cfg = AIFusionConfig(
            sma_short=self.sma_short,
            sma_long=self.sma_long,
            ema_short=self.ema_short,
            ema_long=self.ema_long,
            rsi_period=self.rsi_period,
            macd_fast=self.macd_fast,
            macd_slow=self.macd_slow,
            macd_signal=self.macd_signal,
            atr_period=self.atr_period,
            risk_per_trade_pct=self.risk_per_trade_pct,
            max_position_pct=self.max_position_pct,
            volatility_atr_threshold=self.volatility_threshold,
            trailing_atr_multiplier=self.trailing_stop_atr_mul,
        )
        return cfg

# ——————————————————————————
# Search space & utils
# ——————————————————————————
def random_genome(rng: random.Random) -> Genome:
    return Genome(
        sma_short=rng.randint(5, 20),
        sma_long=rng.randint(21, 60),
        ema_short=rng.randint(5, 20),
        ema_long=rng.randint(21, 60),
        rsi_period=rng.randint(7, 21),
        rsi_buy_threshold=round(rng.uniform(28.0, 40.0), 1),
        rsi_sell_threshold=round(rng.uniform(60.0, 80.0), 1),
        macd_fast=rng.randint(8, 16),
        macd_slow=rng.randint(18, 36),
        macd_signal=rng.randint(5, 12),
        atr_period=rng.randint(7, 21),
        risk_per_trade_pct=round(rng.uniform(0.25, 2.0), 3),
        max_position_pct=round(rng.uniform(1.0, 10.0), 2),
        volatility_threshold=round(rng.uniform(0.05, 0.9), 3),
        trailing_stop_atr_mul=round(rng.uniform(1.0, 4.0), 2),
    )

def mutate_genome(g: Genome, rng: random.Random, mutation_rate: float) -> Genome:
    child = copy.deepcopy(g)
    def maybe_mut(field_name: str, mutate_fn: Callable):
        if rng.random() < mutation_rate:
            setattr(child, field_name, mutate_fn(getattr(child, field_name)))
    
    # integer tweaks (clamped)
    maybe_mut("sma_short", lambda v: max(3, min(50, v + rng.randint(-3, 3))))
    maybe_mut("sma_long", lambda v: max(8, min(200, v + rng.randint(-7, 7))))
    maybe_mut("ema_short", lambda v: max(5, min(50, v + rng.randint(-3, 3))))
    maybe_mut("ema_long", lambda v: max(8, min(200, v + rng.randint(-7, 7))))
    maybe_mut("rsi_period", lambda v: max(5, min(50, v + rng.randint(-2, 2))))
    maybe_mut("rsi_buy_threshold", lambda v: round(max(15.0, min(50.0, v + rng.uniform(-3.0, 3.0))), 1))
    maybe_mut("rsi_sell_threshold", lambda v: round(max(50.0, min(95.0, v + rng.uniform(-2.0, 2.0))), 1))
    maybe_mut("macd_fast", lambda v: max(6, min(60, v + rng.randint(-3, 3))))
    maybe_mut("macd_slow", lambda v: max(6, min(60, v + rng.randint(-3, 3))))
    maybe_mut("macd_signal", lambda v: max(3, min(50, v + rng.randint(-2, 2))))
    maybe_mut("atr_period", lambda v: max(3, min(50, v + rng.randint(-2, 2))))
    maybe_mut("risk_per_trade_pct", lambda v: round(max(0.25, min(5.0, v + rng.uniform(-0.2, 0.2))), 3))
    maybe_mut("max_position_pct", lambda v: round(max(0.5, min(25.0, v + rng.uniform(-1.0, 1.0))), 2))
    maybe_mut("volatility_threshold", lambda v: round(max(0.05, min(2.0, v + rng.uniform(-0.1, 0.1))), 3))
    maybe_mut("trailing_stop_atr_mul", lambda v: round(max(0.5, min(6.0, v + rng.uniform(-0.5, 0.5))), 2))
    
    return child

def crossover(p1: Genome, p2: Genome, rng: random.Random) -> Tuple[Genome, Genome]:
    # one-point crossover on the dataclass fields list
    fields = list(asdict(p1).keys())
    if len(fields) < 2:
        return copy.deepcopy(p1), copy.deepcopy(p2)
    point = rng.randrange(1, len(fields)-1)
    a, b = copy.deepcopy(p1), copy.deepcopy(p2)
    for f in fields[point:]:
        setattr(a, f, getattr(p2, f))
        setattr(b, f, getattr(p1, f))
    return a, b

# ——————————————————————————
# Objective: run backtest and return objective score
# ——————————————————————————
from typing import Union

def evaluate_genome(genome: Genome, candles: List[dict], objective: str = "sharpe", penalty_factor: float = 0.01) -> Union[float, dict]:
    """
    Run a backtest with the genome parameters and return objective score.
    
    Objectives:
    - 'sharpe': Returns Sharpe ratio (higher = better)
    - 'equity': Returns final equity
    - 'dual': Returns dict with breakdown {sharpe, max_drawdown, score, final_equity}
              Score = sharpe - (max_drawdown * penalty_factor)
              Balances risk-adjusted returns with drawdown stability
    """
    # 1) run backtest (existing logic) -> should produce `trade_history` and `equity_history`
    try:
        cfg = genome.to_config()
        strategy = AIFusionStrategy(cfg)
        account = VirtualAccount(starting_balance=10000.0)
        executor = BacktestExecutor(account, strategy)
        replay = ReplayEngine(candles, executor.process_candle)
        
        # Run (deterministic)
        replay.run()
        
        # Get equity history - it might be empty if executor doesn't track it
        # equity_history could be list[dict] or list[float]
        equity_history = getattr(account, "equity_history", None)
        
        # Handle the objective
        if objective == "sharpe" or objective == "dual":
            # 2) compute sharpe using your backtest reporting function
            # 3) extract equity as list[float] if needed
            if equity_history and isinstance(equity_history, list) and len(equity_history) > 0:
                # Check if it's list of dicts (extract value) or list of floats
                if isinstance(equity_history[0], dict):
                    equity_series = [e.get("price", e.get("value", 10000.0)) for e in equity_history]
                else:
                    equity_series = list(equity_history)
                
                sharpe = compute_sharpe(equity_series, risk_free_rate=0.0)
            else:
                sharpe = None
            
            # Handle None (insufficient data) -> give a low score so optimizer avoids it
            if sharpe is None:
                # For dual objective, still return dict structure
                if objective == "dual":
                    return {
                        "sharpe": -999.0,
                        "max_drawdown": 0.0,
                        "score": -999.0,
                        "final_equity": 10000.0,
                        "penalty_factor": penalty_factor
                    }
                # For sharpe objective, return float
                return -999.0
            
            # For dual objective, compute max drawdown and apply penalty
            if objective == "dual":
                # Compute max drawdown from equity curve
                if equity_history and len(equity_history) > 0:
                    if isinstance(equity_history[0], dict):
                        equity_series = [e.get("price", e.get("value", 10000.0)) for e in equity_history]
                    else:
                        equity_series = list(equity_history)
                    
                    # Calculate max drawdown as fraction (0-1)
                    peak = equity_series[0]
                    max_dd = 0.0
                    for eq in equity_series:
                        if eq > peak:
                            peak = eq
                        dd = (peak - eq) / peak if peak > 0 else 0.0
                        if dd > max_dd:
                            max_dd = dd
                    
                    # Dual objective: sharpe - (max_drawdown * penalty_factor)
                    score = float(sharpe) - (max_dd * penalty_factor)
                    final_equity = equity_series[-1] if equity_series else 10000.0
                    
                    # Return breakdown as dict (will be stored separately)
                    return {
                        "sharpe": float(sharpe),
                        "max_drawdown": max_dd,
                        "score": score,
                        "final_equity": final_equity,
                        "penalty_factor": penalty_factor
                    }
                else:
                    # No equity history, return low score
                    return {"sharpe": -999.0, "max_drawdown": 1.0, "score": -999.0, "final_equity": 10000.0, "penalty_factor": penalty_factor}
            
            # Return Sharpe as the objective
            return float(sharpe)
        else:
            # objective == "equity" - return final equity
            if equity_history and isinstance(equity_history, list) and len(equity_history) > 0:
                if isinstance(equity_history[0], dict):
                    return float(equity_history[-1].get("price", equity_history[-1].get("value", 10000.0)))
                else:
                    return float(equity_history[-1])
            # fallback: just use final balance attr
            bal = getattr(account, "balance", None)
            if bal is not None:
                return float(bal)
            return 10000.0
    except Exception as e:
        # fail-safe: return very poor fitness
        # (do not re-raise to keep optimizer running)
        # print(f"eval error:", e)  # silent by design
        return float("-1e9")

# ——————————————————————————
# Genetic algorithm
# ——————————————————————————
def run_ga(candles: List[dict], pop_size: int, generations: int, seed: int, objective: str = "sharpe", penalty_factor: float = 0.01):
    rng = random.Random(seed)
    # init population
    pop: List[Genome] = [random_genome(rng) for _ in range(pop_size)]
    # evaluate - store both results and breakdowns for dual
    results = [evaluate_genome(g, candles, objective, penalty_factor) for g in pop]
    
    # Extract fitness scores (handle both float and dict returns)
    if objective == "dual":
        fitnesses = [float(r["score"]) if isinstance(r, dict) else float(r) for r in results]
        breakdowns = results  # Keep full breakdown for dual
    else:
        fitnesses = [float(r) if not isinstance(r, dict) else float(r.get("score", -999.0)) for r in results]
        breakdowns = None
    
    for gen in range(generations):
        # selection: tournament
        next_pop: List[Genome] = []
        while len(next_pop) < pop_size:
            # tournament
            i1, i2 = rng.randrange(pop_size), rng.randrange(pop_size)
            p1 = pop[i1] if fitnesses[i1] >= fitnesses[i2] else pop[i2]
            i3, i4 = rng.randrange(pop_size), rng.randrange(pop_size)
            p2 = pop[i3] if fitnesses[i3] >= fitnesses[i4] else pop[i4]
            
            # crossover
            c1, c2 = crossover(p1, p2, rng)
            
            # mutation
            c1 = mutate_genome(c1, rng, 0.14)
            c2 = mutate_genome(c2, rng, 0.14)
            
            next_pop.extend([c1, c2])
        
        next_pop = next_pop[:pop_size]
        # evaluate next pop
        next_results = [evaluate_genome(g, candles, objective, penalty_factor) for g in next_pop]
        
        # Extract fitness scores
        if objective == "dual":
            next_fitnesses = [float(r["score"]) if isinstance(r, dict) else float(r) for r in next_results]
            next_breakdowns = next_results
        else:
            next_fitnesses = [float(r) if not isinstance(r, dict) else float(r.get("score", -999.0)) for r in next_results]
            next_breakdowns = None
        
        # elitism: keep best from previous gen
        best_idx_old = max(range(len(pop)), key=lambda i: fitnesses[i])
        worst_idx_new = min(range(len(next_pop)), key=lambda i: next_fitnesses[i])
        next_pop[worst_idx_new] = pop[best_idx_old]
        next_fitnesses[worst_idx_new] = fitnesses[best_idx_old]
        if objective == "dual" and breakdowns is not None and next_breakdowns is not None:
            next_breakdowns[worst_idx_new] = breakdowns[best_idx_old]
        
        pop, fitnesses = next_pop, next_fitnesses
        if objective == "dual":
            breakdowns = next_breakdowns
        
        # deterministic logging (kept minimal)
        best = max(fitnesses)
        mean = statistics.mean(fitnesses)
        print(f"[GA] gen {gen+1}/{generations}  best={best:.2f} mean={mean:.2f}")
    
    # final best
    best_idx = max(range(len(pop)), key=lambda i: fitnesses[i])
    if objective == "dual" and breakdowns is not None:
        return pop[best_idx], breakdowns[best_idx]
    else:
        return pop[best_idx], fitnesses[best_idx]

# ——————————————————————————
# CLI
# ——————————————————————————
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", "-d", required=True, help="path to candle CSV (merged)")
    parser.add_argument("--pop", type=int, default=24)
    parser.add_argument("--gens", type=int, default=30)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--save", type=str, default="best_genome.json")
    parser.add_argument(
        "--objective",
        choices=["equity", "sharpe", "dual"],
        default="sharpe",
        help="Objective to maximize: 'equity', 'sharpe', or 'dual' (sharpe - drawdown penalty).",
    )
    parser.add_argument(
        "--penalty-factor",
        type=float,
        default=0.01,
        help="Penalty factor for dual objective (default=0.01). Higher values penalize drawdown more.",
    )
    args = parser.parse_args()
    
    # load candles (preserves original input format)
    candles = load_candles(args.data)
    
    best_genome, best_result = run_ga(candles, pop_size=args.pop, generations=args.gens, seed=args.seed, objective=args.objective, penalty_factor=args.penalty_factor)
    
    print("=== OPTIMIZATION COMPLETE ===")
    if args.objective == "sharpe":
        print("best score (Sharpe ratio):", best_result)
    elif args.objective == "dual":
        # best_result is a dict with breakdown
        if isinstance(best_result, dict):
            print(f"Dual score: {best_result['score']:.4f} | Sharpe: {best_result['sharpe']:.4f} | MaxDD: {best_result['max_drawdown']:.2%} | Penalty: {best_result['penalty_factor']}")
        else:
            print(f"best score (Dual: Sharpe - {args.penalty_factor}*Drawdown):", best_result)
    else:
        print("best score (final equity):", best_result)
    print("best genome:")
    print(json.dumps(asdict(best_genome), indent=2))
    
    # Generate timestamp for artifact filenames
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Create artifacts directory structure if it doesn't exist
    artifacts_root = Path("artifacts")
    genomes_dir = artifacts_root / "genomes"
    reports_dir = artifacts_root / "reports"
    genomes_dir.mkdir(parents=True, exist_ok=True)
    reports_dir.mkdir(parents=True, exist_ok=True)
    
    # Determine save path with timestamp
    if args.save and args.save != "best_genome.json":
        # User provided custom path - use it as-is for backward compatibility
        save_path = Path(args.save)
        # Ensure parent directory exists for custom paths
        save_path.parent.mkdir(parents=True, exist_ok=True)
        save_path = str(save_path)
    else:
        # Default: save to artifacts with timestamp
        genome_filename = f"best_genome_{args.objective}_{timestamp}.json"
        save_path = str(genomes_dir / genome_filename)
    
    genome_data = asdict(best_genome)
    # Include metrics in saved JSON for dual objective
    if args.objective == "dual" and isinstance(best_result, dict):
        genome_data["score"] = best_result["score"]
        genome_data["sharpe"] = best_result["sharpe"]
        genome_data["max_drawdown"] = best_result["max_drawdown"]
        genome_data["penalty_factor"] = args.penalty_factor
    
    # Add metadata
    genome_data["_metadata"] = {
        "timestamp": timestamp,
        "objective": args.objective,
        "population_size": args.pop,
        "generations": args.gens,
        "seed": args.seed,
        "data_file": args.data
    }
    
    with open(save_path, "w") as f:
        f.write(json.dumps(genome_data, indent=2))
    
    print(f"Saved best genome to: {save_path}")
    
    # optional: run one final report with best and print summary
    cfg = best_genome.to_config()
    strategy = AIFusionStrategy(cfg)
    account = VirtualAccount(starting_balance=10000.0)
    executor = BacktestExecutor(account, strategy)
    replay = ReplayEngine(candles, executor.process_candle)
    replay.run()
    
    report = generate_report(getattr(account, "trade_history", []), getattr(account, "equity_history", []))
    print("Final report with best genome:", report)
    
    # Save report to artifacts
    report_filename = f"backtest_report_{args.objective}_{timestamp}.txt"
    report_path = reports_dir / report_filename
    with open(report_path, "w") as f:
        f.write(f"Optimization Report - {timestamp}\n")
        f.write(f"{'=' * 60}\n\n")
        f.write(f"Objective: {args.objective}\n")
        f.write(f"Population: {args.pop} | Generations: {args.gens} | Seed: {args.seed}\n")
        f.write(f"Data: {args.data}\n\n")
        if args.objective == "dual" and isinstance(best_result, dict):
            f.write(f"Dual Score: {best_result['score']:.4f}\n")
            f.write(f"Sharpe Ratio: {best_result['sharpe']:.4f}\n")
            f.write(f"Max Drawdown: {best_result['max_drawdown']:.2%}\n")
            f.write(f"Penalty Factor: {best_result['penalty_factor']}\n\n")
        f.write(f"Backtest Report:\n")
        f.write(str(report))
    
    print(f"Saved report to: {report_path}")

if __name__ == "__main__":
    main()
