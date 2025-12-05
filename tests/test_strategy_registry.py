import pytest

from backend.services.strategy_registry import (
    StrategyMeta,
    load_default_registry,
    register_strategy,
    StrategyRegistry,
)


@pytest.fixture(autouse=True)
def reset_default_registry():
    """Reset the global default registry before each test."""
    import backend.services.strategy_registry as reg_module
    reg_module._default_registry = None
    yield
    reg_module._default_registry = None


def test_register_and_get_strategy():
    registry = StrategyRegistry()
    meta = StrategyMeta(
        strategy_id="s-1",
        job_path="backend.workers.tasks.strategy_toggle",
    )

    registry.register(meta)

    assert registry.get("s-1") is meta
    assert registry.list() == [meta]


def test_load_default_registry_has_entry():
    registry = load_default_registry()
    assert registry.get("default") is not None


def test_register_strategy_helper_updates_default_registry():
    meta = StrategyMeta(
        strategy_id="s-2",
        job_path="backend.workers.tasks.strategy_toggle",
    )
    registered = register_strategy(meta)
    registry = load_default_registry()

    assert registry.get("s-2") is registered
