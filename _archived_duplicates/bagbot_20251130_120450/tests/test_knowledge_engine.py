"""Tests for Knowledge Ingestion Engine."""

import pytest
import tempfile
from pathlib import Path
from bagbot.trading.knowledge_ingestion_engine import KnowledgeIngestionEngine, Concept


def test_knowledge_engine_initialization():
    """Test Knowledge Engine initializes."""
    with tempfile.TemporaryDirectory() as tmpdir:
        engine = KnowledgeIngestionEngine(knowledge_dir=tmpdir)
        
        assert engine is not None
        assert len(engine.concepts) == 0


def test_ingest_text():
    """Test text ingestion."""
    with tempfile.TemporaryDirectory() as tmpdir:
        engine = KnowledgeIngestionEngine(knowledge_dir=tmpdir)
        
        text = """
        Order blocks are institutional accumulation zones.
        Fair value gaps indicate price imbalances.
        Risk management is crucial for long-term success.
        """
        
        result = engine.ingest_text(text, source="test")
        
        assert result["concepts_extracted"] > 0
        assert len(engine.concepts) > 0


def test_ingest_pdf():
    """Test PDF ingestion (placeholder)."""
    with tempfile.TemporaryDirectory() as tmpdir:
        engine = KnowledgeIngestionEngine(knowledge_dir=tmpdir)
        
        # Create fake PDF path
        result = engine.ingest_pdf("trading_psychology.pdf")
        
        assert "concepts_extracted" in result
        assert result["concepts_extracted"] >= 0


def test_ingest_market_data():
    """Test market data pattern learning."""
    with tempfile.TemporaryDirectory() as tmpdir:
        engine = KnowledgeIngestionEngine(knowledge_dir=tmpdir)
        
        candles = [
            {"high": 1.01, "low": 1.00, "close": 1.005, "timestamp": "2024-01-01T00:00:00"},
            {"high": 1.03, "low": 1.00, "close": 1.025, "timestamp": "2024-01-01T01:00:00"},  # Volatility spike
            {"high": 1.02, "low": 1.01, "close": 1.015, "timestamp": "2024-01-01T02:00:00"},
        ]
        
        result = engine.ingest_market_data(candles, symbol="EURUSD")
        
        assert result["candles_analyzed"] == 3
        assert result["symbol"] == "EURUSD"


def test_knowledge_summary():
    """Test knowledge summary generation."""
    with tempfile.TemporaryDirectory() as tmpdir:
        engine = KnowledgeIngestionEngine(knowledge_dir=tmpdir)
        
        # Add some concepts
        engine.ingest_text("Order blocks are key. Risk management matters.", source="test")
        
        summary = engine.get_knowledge_summary()
        
        assert "total_concepts" in summary
        assert "by_category" in summary
        assert summary["total_concepts"] > 0


def test_apply_knowledge_to_systems():
    """Test applying knowledge to trading systems."""
    with tempfile.TemporaryDirectory() as tmpdir:
        engine = KnowledgeIngestionEngine(knowledge_dir=tmpdir)
        
        # Add high-confidence concepts
        from datetime import datetime
        engine.concepts.append(Concept(
            name="Test Strategy",
            category="strategy",
            description="Test",
            confidence=0.9,
            source="test",
            timestamp=datetime.now()
        ))
        
        result = engine.apply_knowledge_to_systems()
        
        assert "strategy_updates" in result
        assert "risk_updates" in result
        assert "psychology_updates" in result


def test_knowledge_persistence():
    """Test knowledge saves and loads."""
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create engine and add concepts
        engine1 = KnowledgeIngestionEngine(knowledge_dir=tmpdir)
        engine1.ingest_text("Order blocks are important", source="test")
        
        initial_count = len(engine1.concepts)
        
        # Create new engine with same directory
        engine2 = KnowledgeIngestionEngine(knowledge_dir=tmpdir)
        
        assert len(engine2.concepts) == initial_count


@pytest.mark.skip(reason="Requires python-multipart for file upload support")
def test_knowledge_feeder_api():
    """Test Knowledge Feeder API endpoints."""
    from fastapi.testclient import TestClient
    from bagbot.api.knowledge_feeder_api import router
    from fastapi import FastAPI
    
    app = FastAPI()
    app.include_router(router)
    client = TestClient(app)
    
    # Test text ingestion
    response = client.post("/knowledge/text", json={
        "content": "Order blocks mark institutional zones",
        "source": "test"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    
    # Test summary
    response = client.get("/knowledge/summary")
    assert response.status_code == 200
    
    # Test health check
    response = client.get("/knowledge/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
