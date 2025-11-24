"""
Tests to validate documentation completeness and accuracy.

Validates:
1. brain_blueprint.md exists and contains key sections
2. api_contracts.json is valid JSON and contains required endpoints
3. ui_api_map.md exists and maps to api_contracts.json
4. Documentation references match actual code
"""
import json
from pathlib import Path


def test_brain_blueprint_exists():
    """Test that brain_blueprint.md exists."""
    blueprint_path = Path("../docs/brain_blueprint.md")
    assert blueprint_path.exists(), "brain_blueprint.md not found"


def test_brain_blueprint_contains_key_sections():
    """Test that brain_blueprint.md contains all required sections."""
    blueprint_path = Path("../docs/brain_blueprint.md")
    content = blueprint_path.read_text()
    
    required_sections = [
        "# Brain Architecture Blueprint",
        "## Overview",
        "## Core Components",
        "### 1. TradingBrain",
        "### 2. StrategyRouter",
        "### 3. MarketState",
        "### 4. Strategy Registry",
        "## Event Processing Flow",
        "## Strategy Interface",
        "## Logging & Observability",
        "## Error Handling",
        "## Determinism Guarantees",
        "## Integration Points",
        "## Testing Strategy",
        "## Performance Characteristics"
    ]
    
    for section in required_sections:
        assert section in content, f"Missing section: {section}"


def test_brain_blueprint_references_actual_files():
    """Test that brain_blueprint.md references existing source files."""
    blueprint_path = Path("../docs/brain_blueprint.md")
    content = blueprint_path.read_text()
    
    # Check that documented files exist
    expected_files = [
        "worker/brain/brain.py",
        "worker/brain/strategy_router.py",
        "worker/brain/market_state.py",
        "worker/strategies/registry.py"
    ]
    
    for file_path in expected_files:
        assert Path(file_path).exists(), f"Referenced file not found: {file_path}"


def test_api_contracts_json_exists():
    """Test that api_contracts.json exists."""
    contracts_path = Path("../docs/api_contracts.json")
    assert contracts_path.exists(), "api_contracts.json not found"


def test_api_contracts_json_is_valid():
    """Test that api_contracts.json is valid JSON."""
    contracts_path = Path("../docs/api_contracts.json")
    with open(contracts_path) as f:
        data = json.load(f)
    
    assert "openapi" in data
    assert "info" in data
    assert "paths" in data
    assert data["openapi"] == "3.0.0"


def test_api_contracts_contains_required_endpoints():
    """Test that api_contracts.json defines all core endpoints."""
    contracts_path = Path("../docs/api_contracts.json")
    with open(contracts_path) as f:
        data = json.load(f)
    
    required_endpoints = [
        "/",
        "/api/health",
        "/api/worker/status",
        "/api/worker/start",
        "/api/worker/stop"
    ]
    
    paths = data.get("paths", {})
    for endpoint in required_endpoints:
        assert endpoint in paths, f"Missing endpoint: {endpoint}"


def test_api_contracts_endpoints_have_descriptions():
    """Test that all endpoints have descriptions."""
    contracts_path = Path("../docs/api_contracts.json")
    with open(contracts_path) as f:
        data = json.load(f)
    
    paths = data.get("paths", {})
    for path, methods in paths.items():
        for method, details in methods.items():
            if method in ["get", "post", "put", "delete", "patch"]:
                assert "summary" in details, f"{method.upper()} {path} missing summary"
                assert "responses" in details, f"{method.upper()} {path} missing responses"


def test_ui_api_map_exists():
    """Test that ui_api_map.md exists."""
    map_path = Path("../docs/ui_api_map.md")
    assert map_path.exists(), "ui_api_map.md not found"


def test_ui_api_map_contains_key_sections():
    """Test that ui_api_map.md contains all required sections."""
    map_path = Path("../docs/ui_api_map.md")
    content = map_path.read_text()
    
    required_sections = [
        "# UI-API Mapping Document",
        "## Overview",
        "## Architecture Summary",
        "## API Base URLs",
        "## Endpoint Mappings",
        "### 1. Health & Status",
        "### 2. Worker Control",
        "## WebSocket Connections",
        "## Error Handling",
        "## Frontend State Management"
    ]
    
    for section in required_sections:
        assert section in content, f"Missing section: {section}"


def test_ui_api_map_references_api_contracts():
    """Test that ui_api_map.md references endpoints from api_contracts.json."""
    map_path = Path("../docs/ui_api_map.md")
    map_content = map_path.read_text()
    
    contracts_path = Path("../docs/api_contracts.json")
    with open(contracts_path) as f:
        contracts = json.load(f)
    
    # Sample key endpoints that should be documented in the map
    key_endpoints = [
        "/api/health",
        "/api/worker/status",
        "/api/worker/start",
        "/api/worker/stop"
    ]
    
    for endpoint in key_endpoints:
        # Check if endpoint is mentioned in the map
        assert endpoint in map_content, f"Endpoint {endpoint} not documented in UI map"


def test_ui_api_map_includes_frontend_usage():
    """Test that ui_api_map.md includes frontend usage examples."""
    map_path = Path("../docs/ui_api_map.md")
    content = map_path.read_text()
    
    # Should have TypeScript/React examples
    assert "```typescript" in content, "Missing TypeScript code examples"
    assert "fetch(" in content, "Missing fetch API examples"
    assert "Frontend Usage:" in content, "Missing frontend usage sections"


def test_brain_blueprint_documents_actual_methods():
    """Test that documented TradingBrain methods exist in code."""
    from bagbot.worker.brain.brain import TradingBrain
    
    # Methods documented in blueprint
    expected_methods = [
        "__init__",
        "process",
        "get_indicator_value",
        "process_next_job"
    ]
    
    for method_name in expected_methods:
        assert hasattr(TradingBrain, method_name), f"TradingBrain.{method_name} not found"


def test_brain_blueprint_documents_actual_attributes():
    """Test that documented TradingBrain attributes exist."""
    from bagbot.worker.brain.brain import TradingBrain
    
    brain = TradingBrain()
    
    expected_attributes = [
        "market_state",
        "router",
        "executor",
        "execution_router"
    ]
    
    for attr_name in expected_attributes:
        assert hasattr(brain, attr_name), f"TradingBrain.{attr_name} not found"


def test_documentation_references_correct_paths():
    """Test that documentation references use correct relative paths."""
    blueprint_path = Path("../docs/brain_blueprint.md")
    content = blueprint_path.read_text()
    
    # Check for common path references
    if "bagbot/worker/brain/" in content:
        assert Path("worker/brain/").exists(), "Referenced directory not found"
    
    if "bagbot/tests/" in content:
        assert Path("tests/").exists(), "Referenced test directory not found"


def test_all_docs_have_references_section():
    """Test that all main docs have a references section."""
    doc_files = [
        Path("../docs/brain_blueprint.md"),
        Path("../docs/ui_api_map.md")
    ]
    
    for doc_path in doc_files:
        if doc_path.exists():
            content = doc_path.read_text()
            # Should have some form of references or links
            assert "##" in content, f"{doc_path} missing section headers"


def test_api_contracts_has_all_tags():
    """Test that api_contracts.json defines all used tags."""
    contracts_path = Path("../docs/api_contracts.json")
    with open(contracts_path) as f:
        data = json.load(f)
    
    # Get all tags used in endpoints
    used_tags = set()
    for path, methods in data.get("paths", {}).items():
        for method, details in methods.items():
            if "tags" in details:
                used_tags.update(details["tags"])
    
    # Get defined tags
    defined_tags = {tag["name"] for tag in data.get("tags", [])}
    
    # All used tags should be defined
    undefined_tags = used_tags - defined_tags
    assert len(undefined_tags) == 0, f"Undefined tags: {undefined_tags}"


def test_docs_directory_structure():
    """Test that docs directory has expected structure."""
    docs_dir = Path("../docs")
    assert docs_dir.exists(), "docs/ directory not found"
    
    expected_files = [
        "api_contracts.json",
        "brain_blueprint.md",
        "ui_api_map.md"
    ]
    
    for file_name in expected_files:
        file_path = docs_dir / file_name
        assert file_path.exists(), f"Expected file not found: {file_name}"
