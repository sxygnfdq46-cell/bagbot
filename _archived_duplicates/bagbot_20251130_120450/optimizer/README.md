# Genetic Optimizer for AI Fusion Strategy

## Usage

Run the genetic optimizer to find optimal strategy parameters:

```bash
# In project root, activate venv
source ../.venv/bin/activate

# Run optimizer (default objective: Sharpe ratio)
PYTHONPATH=$(pwd) python -m optimizer.genetic_optimizer \
  --data tests/data/BTCSTUSDT-1h-merged.csv \
  --pop 24 \
  --gens 30 \
  --seed 42 \
  --objective sharpe

# Or optimize for final equity instead
PYTHONPATH=$(pwd) python -m optimizer.genetic_optimizer \
  --data tests/data/BTCSTUSDT-1h-merged.csv \
  --pop 24 \
  --gens 30 \
  --seed 42 \
  --objective equity

# Or use dual objective: balances Sharpe with drawdown penalty
PYTHONPATH=$(pwd) python -m optimizer.genetic_optimizer \
  --data tests/data/BTCSTUSDT-1h-merged.csv \
  --pop 24 \
  --gens 30 \
  --seed 42 \
  --objective dual \
  --penalty-factor 0.01
```

## Parameters

- `--data` or `-d`: Path to merged candle CSV file (required)
- `--pop`: Population size (default: 24)
- `--gens`: Number of generations (default: 30)
- `--seed`: Random seed for reproducibility (default: 42)
- `--save`: Output file for best genome (default: best_genome.json)
- `--objective`: Optimization objective - `sharpe`, `equity`, or `dual` (default: sharpe)
  - `sharpe`: Optimize for Sharpe ratio (risk-adjusted returns)
  - `equity`: Optimize for final equity (absolute returns)
  - `dual`: Optimize for `sharpe - (max_drawdown × penalty_factor)` - balances returns with drawdown stability
- `--penalty-factor`: Drawdown penalty factor for dual objective (default: 0.01, range: 0.0-1.0)

## Output

The optimizer will:
1. Run genetic algorithm to find optimal parameters
2. Print progress for each generation (best and mean fitness)
3. Save the best genome to `best_genome.json` (or `best_genome_dual.json` for dual objective)
4. Run a final backtest and print the report

For dual objective, the output includes breakdown of:
- **Dual score**: Combined score (sharpe - max_drawdown × penalty_factor)
- **Sharpe**: Sharpe ratio component
- **MaxDD**: Maximum drawdown as fraction (0-1)
- **Penalty**: The penalty factor applied

## Example Output

**Sharpe objective:**
```
[GA] gen 1/30  best=1.85 mean=1.42
[GA] gen 2/30  best=2.12 mean=1.78
...
[GA] gen 30/30  best=2.58 mean=2.54
=== OPTIMIZATION COMPLETE ===
best score (Sharpe ratio): 2.58
best genome:
{
  "sma_short": 10,
  "sma_long": 49,
  ...
}
Final report with best genome: {'num_trades': 244, 'sharpe': 2.58, 'total_return': 129.78}
```

**Dual objective:**
```
[GA] gen 1/5  best=1.54 mean=1.29
[GA] gen 2/5  best=1.56 mean=1.37
...
[GA] gen 5/5  best=1.87 mean=1.40
=== OPTIMIZATION COMPLETE ===
Dual score: 1.8654 | Sharpe: 1.87 | MaxDD: 0.0000 | Penalty: 0.01
Saved to best_genome_dual.json
best genome:
{
  "sma_short": 18,
  "sma_long": 34,
  ...
}
Final report with best genome: {'num_trades': 23, 'sharpe': 1.87, 'max_drawdown': 0.0, 'total_return': 20.93}
```

## Notes

- Deterministic (uses fixed RNG seed)
- No threads or network calls
- Runs backtests in-process using project's backtest API
- Uses simple GA: tournament selection, one-point crossover, gaussian mutation
- **Objectives**:
  - **sharpe** (default): Risk-adjusted returns (Sharpe ratio)
  - **equity**: Absolute returns (final equity)
  - **dual**: Balanced approach - `score = sharpe - (max_drawdown × penalty_factor)`
    - Combines Sharpe ratio with drawdown penalty
    - Max drawdown calculated as peak-to-trough fraction (0-1)
    - Penalty factor typically 0.01-0.1 (higher = stricter drawdown control)
    - Saves results to `best_genome_dual.json` with full breakdown
- Equity history is tracked per candle for accurate Sharpe calculation
