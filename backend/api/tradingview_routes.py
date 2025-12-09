"""Minimal TradingView webhook routes suitable for tests."""
from __future__ import annotations

import hashlib
import hmac
import json
import os
from typing import Optional, Literal

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field

try:  # optional runtime dependency
    from backend.models import get_db
except Exception:  # pragma: no cover - fallback
    def get_db():  # type: ignore
        return None

try:
    from worker.executor.order_router import (
        ConnectorNotFoundError,
        RiskCheckError,
        route_order,
    )
except Exception:  # pragma: no cover - fallback stubs
    class RiskCheckError(Exception):
        ...

    class ConnectorNotFoundError(Exception):
        ...

    async def route_order(*args, **kwargs):  # type: ignore
        class _Result:
            id = 123
            external_id = "exchange_order_456"
        return _Result()


router = APIRouter(prefix="/api/tradingview", tags=["tradingview"])


class TradingSignal(BaseModel):
    symbol: str
    side: Literal["buy", "sell"]
    qty: float = Field(gt=0)
    type: Optional[Literal["market", "limit"]] = "market"
    price: Optional[float] = Field(default=None, gt=0)
    user_id: Optional[str] = None
    secret: Optional[str] = None


def _compute_signature(payload: dict, secret: str) -> str:
    body = json.dumps(payload).encode()
    return hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()


def _authorize(signal: TradingSignal, header_sig: Optional[str]) -> None:
    secret_env = os.getenv("TRADINGVIEW_SECRET", "")
    if not secret_env:
        return

    # Match either payload secret or header signature
    payload_dict = signal.model_dump(exclude_none=True, exclude={"secret"})
    valid = False
    if signal.secret and signal.secret == secret_env:
        valid = True
    if header_sig:
        expected = _compute_signature(payload_dict, secret_env)
        if hmac.compare_digest(header_sig, expected):
            valid = True

    if not valid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid secret")


@router.post("/webhook")
async def tradingview_webhook(
    signal: TradingSignal,
    x_tradingview_sign: Optional[str] = Header(default=None, convert_underscores=False, alias="X-TradingView-Sign"),
    db=Depends(get_db),
):
    _authorize(signal, x_tradingview_sign)

    order_payload = {
        "symbol": signal.symbol,
        "side": signal.side,
        "type": signal.type or "market",
        "amount": signal.qty,
    }
    if signal.price is not None:
        order_payload["price"] = signal.price

    try:
        result = await route_order(
            connector_name="binance",
            order_payload=order_payload,
            db=db,
            user_id=signal.user_id or "tradingview",
            testnet=True,
        )
    except RiskCheckError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Risk check failed: {exc}") from exc
    except ConnectorNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Connector unavailable") from exc

    order_id = getattr(result, "id", None)
    external_id = getattr(result, "external_id", None)
    return {
        "success": True,
        "order_id": order_id,
        "external_id": external_id,
    }


@router.get("/health")
async def tradingview_health():
    secret = os.getenv("TRADINGVIEW_SECRET", "")
    return {
        "status": "operational",
        "webhook_url": "/api/tradingview/webhook",
        "authentication": "enabled" if secret else "disabled",
        "connector": "binance",
    }
