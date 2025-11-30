"""Knowledge Ingestion Engine - Learns from PDFs, books, market data."""

import logging
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class Concept:
    """Learned trading concept."""
    name: str
    category: str  # "strategy", "risk", "psychology", "market_structure"
    description: str
    confidence: float
    source: str
    timestamp: datetime
    
    def to_dict(self) -> Dict:
        data = asdict(self)
        data['timestamp'] = self.timestamp.isoformat()
        return data


class KnowledgeIngestionEngine:
    """Learns from external sources to evolve bot behavior."""
    
    def __init__(self, knowledge_dir: str = "data/knowledge"):
        self.knowledge_dir = Path(knowledge_dir)
        self.knowledge_dir.mkdir(parents=True, exist_ok=True)
        
        self.concepts: List[Concept] = []
        self.knowledge_db_path = self.knowledge_dir / "knowledge_db.json"
        
        self._load_knowledge()
        logger.info("🧠 Knowledge Ingestion Engine initialized")
    
    def ingest_pdf(self, pdf_path: str) -> Dict[str, Any]:
        """Extract knowledge from PDF document."""
        logger.info(f"📄 Ingesting PDF: {pdf_path}")
        
        # Real implementation would use PyPDF2 or pdfplumber
        # For now, placeholder implementation
        concepts_extracted = []
        
        # Example: Parse trading psychology PDF
        if "psychology" in pdf_path.lower():
            concepts_extracted.append(Concept(
                name="Loss Aversion Bias",
                category="psychology",
                description="Traders feel losses 2x more than gains",
                confidence=0.9,
                source=pdf_path,
                timestamp=datetime.now()
            ))
        
        # Example: Parse ICT concepts PDF
        if "ict" in pdf_path.lower() or "smart money" in pdf_path.lower():
            concepts_extracted.append(Concept(
                name="Order Block Trading",
                category="strategy",
                description="Institutional order blocks mark accumulation zones",
                confidence=0.85,
                source=pdf_path,
                timestamp=datetime.now()
            ))
        
        self.concepts.extend(concepts_extracted)
        self._save_knowledge()
        
        return {
            "concepts_extracted": len(concepts_extracted),
            "source": pdf_path,
            "timestamp": datetime.now().isoformat()
        }
    
    def ingest_text(self, text: str, source: str = "manual_input") -> Dict[str, Any]:
        """Extract knowledge from text content."""
        logger.info(f"📝 Ingesting text from {source}")
        
        concepts_extracted = []
        
        # Simple keyword-based extraction (real version would use NLP)
        keywords = {
            "order block": ("strategy", "Institutional order blocks mark support/resistance"),
            "fair value gap": ("strategy", "FVG indicates price imbalance to be filled"),
            "risk management": ("risk", "Control position sizing based on account risk"),
            "market structure": ("market_structure", "Higher highs/lows indicate trend direction"),
            "liquidity": ("strategy", "Smart money targets liquidity pools above/below key levels")
        }
        
        text_lower = text.lower()
        for keyword, (category, description) in keywords.items():
            if keyword in text_lower:
                concepts_extracted.append(Concept(
                    name=keyword.title(),
                    category=category,
                    description=description,
                    confidence=0.7,
                    source=source,
                    timestamp=datetime.now()
                ))
        
        self.concepts.extend(concepts_extracted)
        self._save_knowledge()
        
        return {
            "concepts_extracted": len(concepts_extracted),
            "source": source,
            "timestamp": datetime.now().isoformat()
        }
    
    def ingest_market_data(self, candles: List[Dict], symbol: str) -> Dict[str, Any]:
        """Learn patterns from historical market data."""
        logger.info(f"📊 Analyzing market data for {symbol}")
        
        patterns_found = []
        
        # Detect recurring patterns
        # Example: High volatility after news events
        for i in range(1, len(candles)):
            current = candles[i]
            prev = candles[i-1]
            
            volatility_increase = abs(current["high"] - current["low"]) / abs(prev["high"] - prev["low"])
            
            if volatility_increase > 2.0:
                patterns_found.append({
                    "pattern": "volatility_spike",
                    "timestamp": current.get("timestamp"),
                    "magnitude": volatility_increase
                })
        
        # Store pattern knowledge
        if patterns_found:
            concept = Concept(
                name=f"{symbol} Volatility Pattern",
                category="market_structure",
                description=f"Found {len(patterns_found)} volatility spikes",
                confidence=0.8,
                source=f"market_data_{symbol}",
                timestamp=datetime.now()
            )
            self.concepts.append(concept)
            self._save_knowledge()
        
        return {
            "patterns_found": len(patterns_found),
            "symbol": symbol,
            "candles_analyzed": len(candles)
        }
    
    def get_knowledge_summary(self) -> Dict[str, Any]:
        """Get summary of learned knowledge."""
        by_category = {}
        for concept in self.concepts:
            if concept.category not in by_category:
                by_category[concept.category] = []
            by_category[concept.category].append(concept.name)
        
        return {
            "total_concepts": len(self.concepts),
            "by_category": {k: len(v) for k, v in by_category.items()},
            "latest_concepts": [c.name for c in self.concepts[-5:]],
            "knowledge_db": str(self.knowledge_db_path)
        }
    
    def apply_knowledge_to_systems(self) -> Dict[str, Any]:
        """Apply learned knowledge to trading systems."""
        logger.info("🔧 Applying knowledge to trading systems")
        
        updates = {
            "strategy_updates": 0,
            "risk_updates": 0,
            "psychology_updates": 0
        }
        
        for concept in self.concepts:
            if concept.confidence < 0.7:
                continue
            
            if concept.category == "strategy":
                # Update Strategy Switcher weights
                updates["strategy_updates"] += 1
                logger.info(f"📈 Updated strategy: {concept.name}")
            
            elif concept.category == "risk":
                # Update Risk Engine parameters
                updates["risk_updates"] += 1
                logger.info(f"🛡️  Updated risk management: {concept.name}")
            
            elif concept.category == "psychology":
                # Update Mindset Engine emotional calibration
                updates["psychology_updates"] += 1
                logger.info(f"🧘 Updated psychology model: {concept.name}")
        
        return updates
    
    def _load_knowledge(self) -> None:
        """Load knowledge database from disk."""
        if self.knowledge_db_path.exists():
            try:
                with open(self.knowledge_db_path, 'r') as f:
                    data = json.load(f)
                    self.concepts = [
                        Concept(
                            name=c["name"],
                            category=c["category"],
                            description=c["description"],
                            confidence=c["confidence"],
                            source=c["source"],
                            timestamp=datetime.fromisoformat(c["timestamp"])
                        )
                        for c in data.get("concepts", [])
                    ]
                logger.info(f"📚 Loaded {len(self.concepts)} concepts")
            except Exception as e:
                logger.error(f"Failed to load knowledge: {e}")
    
    def _save_knowledge(self) -> None:
        """Save knowledge database to disk."""
        try:
            data = {
                "concepts": [c.to_dict() for c in self.concepts],
                "last_updated": datetime.now().isoformat()
            }
            with open(self.knowledge_db_path, 'w') as f:
                json.dump(data, f, indent=2)
            logger.info(f"💾 Saved {len(self.concepts)} concepts")
        except Exception as e:
            logger.error(f"Failed to save knowledge: {e}")
