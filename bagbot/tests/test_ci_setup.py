"""
Tests to validate CI/CD configuration and development tools.

Validates:
1. GitHub Actions workflow files are valid
2. Pre-commit configuration is valid
3. Makefile exists and has required targets
4. Test infrastructure is properly configured
"""

import json
import yaml
from pathlib import Path


def test_github_actions_workflow_exists():
    """Test that GitHub Actions CI workflow exists."""
    workflow_path = Path(".github/workflows/ci.yml")
    assert workflow_path.exists(), "GitHub Actions CI workflow not found"


def test_github_actions_workflow_is_valid_yaml():
    """Test that CI workflow is valid YAML."""
    workflow_path = Path(".github/workflows/ci.yml")

    with open(workflow_path) as f:
        workflow = yaml.safe_load(f)

    assert "name" in workflow
    # YAML 'on' keyword becomes True in Python
    assert True in workflow or "on" in workflow
    assert "jobs" in workflow


def test_github_actions_has_required_jobs():
    """Test that CI workflow has all required jobs."""
    workflow_path = Path(".github/workflows/ci.yml")

    with open(workflow_path) as f:
        workflow = yaml.safe_load(f)

    jobs = workflow.get("jobs", {})
    required_jobs = ["test", "lint", "docs", "integration", "artifacts"]

    for job in required_jobs:
        assert job in jobs, f"Missing job: {job}"


def test_github_actions_test_job_runs_pytest():
    """Test that test job runs pytest."""
    workflow_path = Path(".github/workflows/ci.yml")

    with open(workflow_path) as f:
        content = f.read()

    assert "pytest" in content, "Test job doesn't run pytest"
    assert "--cov" in content, "Test job doesn't collect coverage"


def test_pre_commit_config_exists():
    """Test that pre-commit configuration exists."""
    config_path = Path(".pre-commit-config.yaml")
    assert config_path.exists(), "Pre-commit config not found"


def test_pre_commit_config_is_valid_yaml():
    """Test that pre-commit config is valid YAML."""
    config_path = Path(".pre-commit-config.yaml")

    with open(config_path) as f:
        config = yaml.safe_load(f)

    assert "repos" in config
    assert isinstance(config["repos"], list)


def test_pre_commit_has_required_hooks():
    """Test that pre-commit has essential code quality hooks."""
    config_path = Path(".pre-commit-config.yaml")

    with open(config_path) as f:
        config = yaml.safe_load(f)

    # Extract all hook ids
    all_hooks = []
    for repo in config.get("repos", []):
        for hook in repo.get("hooks", []):
            all_hooks.append(hook.get("id"))

    # Check for essential hooks
    essential_hooks = ["black", "isort", "flake8"]
    for hook in essential_hooks:
        assert hook in all_hooks, f"Missing essential hook: {hook}"


def test_makefile_exists():
    """Test that Makefile exists."""
    makefile_path = Path("Makefile")
    assert makefile_path.exists(), "Makefile not found"


def test_makefile_has_required_targets():
    """Test that Makefile has all required targets."""
    makefile_path = Path("Makefile")
    content = makefile_path.read_text()

    required_targets = [
        "test",
        "test-cov",
        "lint",
        "format",
        "clean",
        "install",
        "setup",
    ]

    for target in required_targets:
        assert f"{target}:" in content, f"Missing Makefile target: {target}"


def test_pytest_ini_exists():
    """Test that pytest.ini exists."""
    pytest_ini_path = Path("bagbot/pytest.ini")
    assert pytest_ini_path.exists(), "pytest.ini not found"


def test_pytest_ini_has_coverage_config():
    """Test that pytest.ini has coverage configuration."""
    pytest_ini_path = Path("bagbot/pytest.ini")
    content = pytest_ini_path.read_text()

    assert "[coverage:" in content, "pytest.ini missing coverage config"
    assert "source" in content, "pytest.ini missing coverage source"


def test_pytest_ini_has_markers():
    """Test that pytest.ini defines test markers."""
    pytest_ini_path = Path("bagbot/pytest.ini")
    content = pytest_ini_path.read_text()

    assert "markers" in content, "pytest.ini missing markers section"
    assert "integration:" in content, "pytest.ini missing integration marker"


def test_gitignore_updated():
    """Test that .gitignore is comprehensive."""
    gitignore_path = Path(".gitignore")
    content = gitignore_path.read_text()

    required_patterns = [
        "__pycache__",
        ".pytest_cache",
        ".coverage",
        "htmlcov",
        "*.pyc",
    ]

    for pattern in required_patterns:
        assert pattern in content, f"Missing .gitignore pattern: {pattern}"


def test_ci_validates_documentation():
    """Test that CI workflow validates documentation."""
    workflow_path = Path(".github/workflows/ci.yml")
    content = workflow_path.read_text()

    assert "test_documentation.py" in content, "CI doesn't validate documentation"


def test_ci_runs_integration_tests():
    """Test that CI has separate integration test job."""
    workflow_path = Path(".github/workflows/ci.yml")

    with open(workflow_path) as f:
        workflow = yaml.safe_load(f)

    jobs = workflow.get("jobs", {})
    assert "integration" in jobs, "CI missing integration test job"


def test_ci_validates_artifacts():
    """Test that CI validates artifact structure."""
    workflow_path = Path(".github/workflows/ci.yml")

    with open(workflow_path) as f:
        workflow = yaml.safe_load(f)

    jobs = workflow.get("jobs", {})
    assert "artifacts" in jobs, "CI missing artifacts validation job"


def test_ci_runs_on_feature_branches():
    """Test that CI runs on feature branches."""
    workflow_path = Path(".github/workflows/ci.yml")

    with open(workflow_path) as f:
        workflow = yaml.safe_load(f)

    # YAML 'on' keyword becomes True in Python
    triggers = workflow.get(True, workflow.get("on", {}))
    push_branches = triggers.get("push", {}).get("branches", [])

    # Should trigger on feature branches
    has_feature_trigger = any("feature" in str(branch) for branch in push_branches)
    assert has_feature_trigger, "CI doesn't run on feature branches"


def test_ci_uses_matrix_for_python_versions():
    """Test that CI tests multiple Python versions."""
    workflow_path = Path(".github/workflows/ci.yml")

    with open(workflow_path) as f:
        workflow = yaml.safe_load(f)

    test_job = workflow.get("jobs", {}).get("test", {})
    strategy = test_job.get("strategy", {})
    matrix = strategy.get("matrix", {})

    python_versions = matrix.get("python-version", [])
    assert len(python_versions) >= 2, "CI should test multiple Python versions"


def test_makefile_test_target_works():
    """Test that Makefile test target is properly configured."""
    makefile_path = Path("Makefile")
    content = makefile_path.read_text()

    # Test target should set PYTHONPATH
    assert "PYTHONPATH" in content, "Makefile doesn't set PYTHONPATH"
    assert "pytest" in content, "Makefile test target doesn't run pytest"


def test_development_dependencies_documented():
    """Test that development dependencies are documented."""
    makefile_path = Path("Makefile")
    content = makefile_path.read_text()

    # Install target should include dev dependencies
    dev_deps = ["pytest", "black", "isort", "flake8", "pre-commit"]
    for dep in dev_deps:
        assert dep in content, f"Makefile doesn't document {dep} dependency"
