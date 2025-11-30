# BAGBOT Brain Core - Quick Reference

**Branch:** `feature/brain-decision-upgrade`  
**Status:** ✅ ALL 10 TASKS COMPLETE  
**Tests:** 119/119 passing  
**Last Update:** 2025-01-XX  

---

## 🚀 Quick Start

### Setup
```bash
cd /path/to/bagbot
make setup          # Install dependencies + pre-commit hooks
```

### Run Tests
```bash
make test           # All tests (119 tests, ~2s)
make test-fast      # Skip integration (92 tests, ~2s)
make test-cov       # Generate HTML coverage report
```

### Code Quality
```bash
make lint           # Check code quality
make format         # Auto-format code
make clean          # Remove artifacts
```

---

## 📁 Key Files

### Documentation
- `bagbot/BRAIN_CORE_COMPLETE.md` - Full phase summary
- `bagbot/TASK_3.10_COMPLETE.md` - CI/CD documentation
- `docs/brain_blueprint.md` - Architecture overview
- `docs/ui_api_map.md` - Frontend-backend mapping
- `docs/api_contracts.json` - OpenAPI 3.0 spec

### Core Code
- `bagbot/worker/brain/brain.py` - Main brain router
- `bagbot/worker/brain/utils.py` - Helper functions
- `bagbot/optimizer/genetic_optimizer.py` - Dual-objective optimizer
- `bagbot/backtest/replay.py` - Deterministic replay engine

### Infrastructure
- `.github/workflows/ci.yml` - CI/CD pipeline
- `.pre-commit-config.yaml` - Pre-commit hooks
- `Makefile` - Developer commands
- `bagbot/pytest.ini` - Test configuration

---

## 🧪 Test Organization

### Test Markers
```bash
pytest -m integration      # Integration tests only
pytest -m "not integration" # Unit tests only
pytest -m determinism      # Determinism tests only
pytest -m artifacts        # Artifact tests only
```

### Test Files
- `test_brain_integration.py` - Brain routing (6 tests)
- `test_replay_brain_integration.py` - Replay determinism (6 tests)
- `test_optimizer_dual.py` - Optimizer validation (7 tests)
- `test_artifacts_persistence.py` - Artifact persistence (6 tests)
- `test_documentation.py` - Documentation validation (17 tests)
- `test_ci_setup.py` - CI infrastructure (20 tests)

---

## 🎯 Common Tasks

### Before Committing
```bash
make format         # Auto-format code
make test           # Run all tests
git commit          # Pre-commit hooks run automatically
```

### Running Optimizer
```bash
cd bagbot
python -m optimizer.genetic_optimizer \
  --data ../tests/data/sample_ohlc.csv \
  --gens 50 \
  --pop 30 \
  --objective dual \
  --seed 42
  
# Output: artifacts/genomes/best_genome_*.json
#         artifacts/reports/backtest_report_*.txt
```

### Running Backtest
```bash
cd bagbot
python run_backtest.py \
  --data tests/data/sample_ohlc.csv \
  --genome best_genome.json
  
# Output: Backtest report with trades, equity, metrics
```

---

## 🔍 Debugging

### Check Brain Routing
```bash
# Look for structured logs
grep "📍 ROUTE" logs/bagbot.log
grep "✅ DECISION" logs/bagbot.log
grep "❌ ERROR" logs/bagbot.log
```

### Verify Determinism
```bash
# Run same test multiple times
for i in {1..3}; do
  pytest bagbot/tests/test_replay_brain_integration.py::test_replay_deterministic_multiple_runs -v
done
# All runs should produce identical output
```

### Check Coverage
```bash
make test-cov
open htmlcov/index.html  # macOS
# Or: xdg-open htmlcov/index.html  # Linux
```

---

## 📊 CI/CD Pipeline

### GitHub Actions Jobs
1. **Test** - Matrix (Python 3.9, 3.10, 3.11)
2. **Lint** - flake8, black, isort
3. **Docs** - Documentation validation
4. **Integration** - Integration tests
5. **Artifacts** - Persistence validation

### Triggers
- Push to `main`, `develop`, `feature/*`
- Pull requests to `main`, `develop`

### Viewing Results
```bash
# On GitHub
# Actions tab → Latest workflow run → Job details
```

---

## 🏗️ Architecture Overview

```
Event (price_update, execute_order, etc.)
    ↓
Brain Router (brain.py)
    ├─ Strategy Resolution (utils.resolve_strategy)
    ├─ Logging (📍 ROUTE)
    ↓
Strategy (strategies.py)
    ├─ Indicators (RSI, SMA, etc.)
    ├─ Decision Logic
    ↓
Decision (buy/sell/hold)
    ↓
Executor (executor.py)
    ├─ Position Management
    ├─ Order Execution
    ↓
Artifacts (timestamped save)
    ├─ artifacts/genomes/
    └─ artifacts/reports/
```

---

## 🔧 Configuration

### pytest.ini
```ini
[pytest]
markers =
    integration: Integration tests
    slow: Slow tests
    determinism: Deterministic behavior tests
    artifacts: Artifact persistence tests
```

### Pre-commit hooks
```yaml
repos:
  - repo: https://github.com/psf/black
    hooks:
      - id: black
        args: [--line-length=127]
  
  - repo: https://github.com/pycqa/isort
    hooks:
      - id: isort
        args: [--profile=black]
```

---

## 📈 Metrics

### Test Coverage
- **Total Tests:** 119
- **Unit Tests:** 92
- **Integration Tests:** 27
- **Pass Rate:** 100%

### Performance
- **Full Test Suite:** ~2 seconds
- **Fast Tests:** ~2 seconds (skips integration)
- **CI Pipeline:** ~3-5 minutes

### Code Quality
- **Import Errors:** 0 (was 10)
- **Linting:** All checks passing
- **Formatting:** Black + isort compliant
- **Type Hints:** All core functions

---

## 🆘 Troubleshooting

### Import Errors
```bash
# Check PYTHONPATH
echo $PYTHONPATH

# Should include /path/to/bagbot
# Fix: Use make test (sets PYTHONPATH automatically)
```

### Tests Failing
```bash
# Run single test with verbose output
pytest bagbot/tests/test_file.py::test_name -vv

# Check test output
pytest bagbot/tests/test_file.py -vv --tb=long
```

### CI Failing
```bash
# Run CI checks locally
make lint          # Check linting
make test          # Run tests
make docs          # Validate docs
```

### Pre-commit Issues
```bash
# Update hooks
pre-commit autoupdate

# Run manually
pre-commit run --all-files

# Skip hooks (emergency only)
git commit --no-verify
```

---

## 🎓 Learning Resources

### Key Concepts
1. **Determinism:** Same input → same output (critical for backtesting)
2. **Event-Driven:** Brain responds to events (price updates, orders)
3. **Strategy Pattern:** Pluggable strategies (sma_cross, rsi_mean_reversion)
4. **Genetic Optimization:** Evolve parameters for best performance

### Related Files
- `bagbot/optimizer/README.md` - Optimizer documentation
- `bagbot/backtest/report_summary.txt` - Backtest results
- `docs/brain_blueprint.md` - Complete architecture

---

## 🚦 Status Indicators

### Git Branch Status
```bash
git status          # Check uncommitted changes
git log --oneline -5  # Recent commits
git branch -v       # Branch status
```

### Test Status
```bash
make test | tail -5   # Quick test status
```

### CI Status
Check GitHub Actions badge (once added to README.md)

---

## 📞 Contact

**For Questions:**
- See `bagbot/BRAIN_CORE_COMPLETE.md` for detailed phase summary
- See `docs/brain_blueprint.md` for architecture details
- Check `docs/api_contracts.json` for API specifications

**For Issues:**
- Run `make lint` to check code quality
- Run `make test` to verify tests
- Check GitHub Actions for CI failures

---

## ✅ Checklist

### Before Starting Work
- [ ] `git pull origin feature/brain-decision-upgrade`
- [ ] `make setup` (if first time)
- [ ] `make test` (verify baseline)

### During Development
- [ ] Write tests alongside code
- [ ] Run `make test-fast` frequently
- [ ] Use structured logging (📍, ✅, ❌)
- [ ] Maintain determinism

### Before Committing
- [ ] `make format` (auto-format)
- [ ] `make lint` (check quality)
- [ ] `make test` (all tests pass)
- [ ] Pre-commit hooks pass
- [ ] Update documentation if needed

### Before PR
- [ ] All tests passing (119/119)
- [ ] Documentation updated
- [ ] Summary document created
- [ ] CI checks passing

---

**Brain Core Status: PRODUCTION READY ✅**

*Last Updated: 2025-01-XX*  
*Version: 1.0*  
*Branch: feature/brain-decision-upgrade*
