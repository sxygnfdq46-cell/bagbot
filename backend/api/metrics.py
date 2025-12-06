"""Metrics endpoint exposing Prometheus format."""
from fastapi import APIRouter, Response
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

router = APIRouter(prefix="/api")


@router.get("/metrics")
async def metrics() -> Response:
    """Serve Prometheus metrics scraped from the process."""
    payload = generate_latest()
    return Response(content=payload, media_type=CONTENT_TYPE_LATEST)
