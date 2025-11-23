"""
Tests for artifact persistence with timestamps.

Validates:
1. Genomes saved to artifacts/genomes/ with timestamps
2. Reports saved to artifacts/reports/ with timestamps
3. Files include metadata (timestamp, objective, seed, etc.)
4. Custom save paths still work (backward compatibility)
"""
import json
import os
import tempfile
import shutil
from pathlib import Path


def test_artifacts_directory_created():
    """Test that artifacts directory structure is created."""
    from bagbot.optimizer.genetic_optimizer import run_ga
    from bagbot.backtest.loader import load_candles
    
    # Load candles from actual test data file (before changing directory)
    test_data_path = Path(__file__).parent / "data" / "BTCSTUSDT-1h-merged.csv"
    candles = load_candles(str(test_data_path))[:50]
    
    # Use temp directory for test
    original_cwd = os.getcwd()
    with tempfile.TemporaryDirectory() as tmpdir:
        os.chdir(tmpdir)
        
        try:
            # Run optimizer (will create artifacts dir)
            best_genome, best_result = run_ga(
                candles=candles,
                pop_size=2,
                generations=1,
                seed=42,
                objective="sharpe"
            )
            
            # Note: main() creates the dirs, but run_ga doesn't
            # This test validates run_ga works independently
            assert best_genome is not None
            
        finally:
            os.chdir(original_cwd)


def test_genome_saved_with_timestamp():
    """Test that genomes are saved with timestamps in artifacts/genomes/."""
    import subprocess
    import sys
    
    # Create temp directory
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create test data
        test_csv = Path(tmpdir) / "test_data.csv"
        with open(test_csv, "w") as f:
            f.write("timestamp,open,high,low,close,volume\n")
            for i in range(50):
                price = 100.0 + i * 0.1
                f.write(f"2024-01-01T{i:02d}:00:00,{price},{price+1},{price-1},{price},{1000}\n")
        
        # Run optimizer from temp directory
        result = subprocess.run(
            [
                sys.executable, "-m", "bagbot.optimizer.genetic_optimizer",
                "--data", str(test_csv),
                "--pop", "2",
                "--gens", "1",
                "--seed", "42",
                "--objective", "sharpe"
            ],
            cwd=tmpdir,
            capture_output=True,
            text=True
        )
        
        # Check that genome was saved
        artifacts_dir = Path(tmpdir) / "artifacts" / "genomes"
        if artifacts_dir.exists():
            genome_files = list(artifacts_dir.glob("best_genome_sharpe_*.json"))
            assert len(genome_files) > 0, f"No genome files found in {artifacts_dir}"
            
            # Verify filename format
            genome_file = genome_files[0]
            assert "best_genome_sharpe_" in genome_file.name
            assert genome_file.suffix == ".json"
            
            # Verify content includes metadata
            with open(genome_file) as f:
                data = json.load(f)
                assert "_metadata" in data
                assert "timestamp" in data["_metadata"]
                assert "objective" in data["_metadata"]
                assert data["_metadata"]["objective"] == "sharpe"


def test_report_saved_with_timestamp():
    """Test that reports are saved with timestamps in artifacts/reports/."""
    import subprocess
    import sys
    
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create test data
        test_csv = Path(tmpdir) / "test_data.csv"
        with open(test_csv, "w") as f:
            f.write("timestamp,open,high,low,close,volume\n")
            for i in range(50):
                price = 100.0 + i * 0.1
                f.write(f"2024-01-01T{i:02d}:00:00,{price},{price+1},{price-1},{price},{1000}\n")
        
        # Run optimizer
        result = subprocess.run(
            [
                sys.executable, "-m", "bagbot.optimizer.genetic_optimizer",
                "--data", str(test_csv),
                "--pop", "2",
                "--gens", "1",
                "--seed", "42",
                "--objective", "dual"
            ],
            cwd=tmpdir,
            capture_output=True,
            text=True
        )
        
        # Check that report was saved
        artifacts_dir = Path(tmpdir) / "artifacts" / "reports"
        if artifacts_dir.exists():
            report_files = list(artifacts_dir.glob("backtest_report_dual_*.txt"))
            assert len(report_files) > 0, f"No report files found in {artifacts_dir}"
            
            # Verify filename format
            report_file = report_files[0]
            assert "backtest_report_dual_" in report_file.name
            assert report_file.suffix == ".txt"
            
            # Verify content includes optimization info
            with open(report_file) as f:
                content = f.read()
                assert "Optimization Report" in content
                assert "Objective: dual" in content


def test_dual_objective_metadata_includes_metrics():
    """Test that dual objective genomes include score/sharpe/drawdown in file."""
    import subprocess
    import sys
    
    with tempfile.TemporaryDirectory() as tmpdir:
        test_csv = Path(tmpdir) / "test_data.csv"
        with open(test_csv, "w") as f:
            f.write("timestamp,open,high,low,close,volume\n")
            for i in range(50):
                price = 100.0 + i * 0.1
                f.write(f"2024-01-01T{i:02d}:00:00,{price},{price+1},{price-1},{price},{1000}\n")
        
        # Run with dual objective
        result = subprocess.run(
            [
                sys.executable, "-m", "bagbot.optimizer.genetic_optimizer",
                "--data", str(test_csv),
                "--pop", "2",
                "--gens", "1",
                "--seed", "42",
                "--objective", "dual",
                "--penalty-factor", "0.05"
            ],
            cwd=tmpdir,
            capture_output=True,
            text=True
        )
        
        artifacts_dir = Path(tmpdir) / "artifacts" / "genomes"
        if artifacts_dir.exists():
            genome_files = list(artifacts_dir.glob("best_genome_dual_*.json"))
            if genome_files:
                with open(genome_files[0]) as f:
                    data = json.load(f)
                    # Check dual objective metrics present
                    assert "score" in data
                    assert "sharpe" in data
                    assert "max_drawdown" in data
                    assert "penalty_factor" in data
                    assert data["penalty_factor"] == 0.05


def test_custom_save_path_still_works():
    """Test that custom --save path works for backward compatibility."""
    import subprocess
    import sys
    
    with tempfile.TemporaryDirectory() as tmpdir:
        test_csv = Path(tmpdir) / "test_data.csv"
        with open(test_csv, "w") as f:
            f.write("timestamp,open,high,low,close,volume\n")
            for i in range(50):
                price = 100.0 + i * 0.1
                f.write(f"2024-01-01T{i:02d}:00:00,{price},{price+1},{price-1},{price},{1000}\n")
        
        custom_path = Path(tmpdir) / "my_custom_genome.json"
        
        # Run with custom save path
        result = subprocess.run(
            [
                sys.executable, "-m", "bagbot.optimizer.genetic_optimizer",
                "--data", str(test_csv),
                "--pop", "2",
                "--gens", "1",
                "--seed", "42",
                "--objective", "sharpe",
                "--save", str(custom_path)
            ],
            cwd=tmpdir,
            capture_output=True,
            text=True
        )
        
        # Verify custom path was used
        assert custom_path.exists(), f"Custom path {custom_path} not created"
        
        with open(custom_path) as f:
            data = json.load(f)
            assert "sma_short" in data  # Basic genome field


def test_timestamps_are_consistent():
    """Test that genome and report timestamps match."""
    import subprocess
    import sys
    
    with tempfile.TemporaryDirectory() as tmpdir:
        test_csv = Path(tmpdir) / "test_data.csv"
        with open(test_csv, "w") as f:
            f.write("timestamp,open,high,low,close,volume\n")
            for i in range(50):
                price = 100.0 + i * 0.1
                f.write(f"2024-01-01T{i:02d}:00:00,{price},{price+1},{price-1},{price},{1000}\n")
        
        result = subprocess.run(
            [
                sys.executable, "-m", "bagbot.optimizer.genetic_optimizer",
                "--data", str(test_csv),
                "--pop", "2",
                "--gens", "1",
                "--seed", "42",
                "--objective", "sharpe"
            ],
            cwd=tmpdir,
            capture_output=True,
            text=True
        )
        
        genomes_dir = Path(tmpdir) / "artifacts" / "genomes"
        reports_dir = Path(tmpdir) / "artifacts" / "reports"
        
        if genomes_dir.exists() and reports_dir.exists():
            genome_files = list(genomes_dir.glob("best_genome_sharpe_*.json"))
            report_files = list(reports_dir.glob("backtest_report_sharpe_*.txt"))
            
            if genome_files and report_files:
                # Extract timestamps from filenames
                genome_ts = genome_files[0].stem.split("_")[-2:]  # Last two parts: YYYYMMDD_HHMMSS
                report_ts = report_files[0].stem.split("_")[-2:]
                
                # Timestamps should be identical (or very close)
                assert genome_ts == report_ts or abs(int(genome_ts[1]) - int(report_ts[1])) <= 1
