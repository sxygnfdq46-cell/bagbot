"""Knowledge Feeder API - REST endpoints for knowledge ingestion."""

import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel

from bagbot.trading.knowledge_ingestion_engine import KnowledgeIngestionEngine

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/knowledge", tags=["knowledge"])

# Global engine instance
engine = KnowledgeIngestionEngine()


class TextIngestionRequest(BaseModel):
    """Request to ingest text."""
    content: str
    source: str = "api"


class ApplyKnowledgeResponse(BaseModel):
    """Response from applying knowledge."""
    strategy_updates: int
    risk_updates: int
    psychology_updates: int


@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)) -> Dict[str, Any]:
    """Upload PDF for knowledge extraction."""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files supported")
    
    # Save temporarily
    temp_path = f"/tmp/{file.filename}"
    with open(temp_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Ingest
    result = engine.ingest_pdf(temp_path)
    
    return {
        "status": "success",
        "filename": file.filename,
        **result
    }


@router.post("/text")
async def ingest_text(request: TextIngestionRequest) -> Dict[str, Any]:
    """Ingest text content."""
    result = engine.ingest_text(request.content, request.source)
    
    return {
        "status": "success",
        **result
    }


@router.get("/summary")
async def get_summary() -> Dict[str, Any]:
    """Get knowledge summary."""
    return engine.get_knowledge_summary()


@router.post("/apply")
async def apply_knowledge() -> ApplyKnowledgeResponse:
    """Apply learned knowledge to trading systems."""
    result = engine.apply_knowledge_to_systems()
    
    return ApplyKnowledgeResponse(**result)


@router.get("/health")
async def health_check() -> Dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy", "engine": "ready"}
