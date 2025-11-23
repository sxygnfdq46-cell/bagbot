# Artifacts Directory

This directory stores timestamped optimization artifacts:

- `genomes/` - Best genome configurations from GA runs
- `reports/` - Backtest reports and performance metrics

All files are timestamped for reproducibility and audit trails.

## Naming Convention

- Genomes: `best_genome_{objective}_{timestamp}.json`
- Reports: `backtest_report_{objective}_{timestamp}.txt`

Example: `best_genome_dual_20251123_152045.json`
