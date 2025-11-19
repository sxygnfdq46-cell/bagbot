from fastapi import FastAPI
from api.routes import router as api_router

app = FastAPI(title="Bagbot Backend")

app.include_router(api_router)

@app.get("/", tags=["health"])
async def root():
    return {"status": "ok", "service": "bagbot backend"}