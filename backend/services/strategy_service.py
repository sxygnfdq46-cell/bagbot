from typing import Optional, Dict, Any


def get_strategy(strategy_id: str) -> Optional[Dict[str, Any]]:
    """Stub: pretend strategy exists."""
    return {"id": strategy_id, "enabled": False}


def update_strategy(strategy_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Stub: merge data."""
    result = {"id": strategy_id}
    result.update(data)
    return result


def update_strategy(*args, **kwargs):
    if _update_strategy:
        return _update_strategy(*args, **kwargs)
    return True
