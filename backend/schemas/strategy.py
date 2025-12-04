"""Strategy schema placeholders."""
from pydantic import BaseModel


class StrategyConfig(BaseModel):
    """TODO: represent strategy configuration."""
    strategy_id: str | None = None
    params: dict[str, str] | None = None
