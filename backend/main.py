"""FastAPI application entrypoint for the reconstructed backend."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api import (
    bot,
    brain,
    charts,
    dashboard,
    health,
    settings,
    signals,
    strategies,
)
from backend.api import admin_routes, auth_routes
from backend.api.ws.dashboard_ws import router as dashboard_ws_router
from backend.api.websocket_router import router as websocket_router
from backend.ws.brain_ws import router as brain_ws_router

app = FastAPI(title="Bagbot Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(dashboard.router)
app.include_router(strategies.router)
app.include_router(signals.router)
app.include_router(charts.router)
app.include_router(bot.router)
app.include_router(brain.router)
app.include_router(admin_routes.router)
app.include_router(settings.router)
app.include_router(health.router)
app.include_router(websocket_router)
app.include_router(dashboard_ws_router, prefix="/ws")
app.include_router(brain_ws_router, prefix="/ws")


@app.get("/", tags=["root"])
async def root() -> dict[str, str]:
    """Simple landing response verifying the service is up."""
    return {"detail": "Bagbot backend skeleton"}
