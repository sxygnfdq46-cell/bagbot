"""Knowledge Bridge - Connects uploaded knowledge to AI helper."""

import logging
from typing import Dict, Any, List, Optional

from bagbot.trading.knowledge_ingestion_engine import KnowledgeIngestionEngine

logger = logging.getLogger(__name__)


class KnowledgeBridge:
    """
    Bridges uploaded knowledge (PDFs/books) to the AI helper.
    
    Allows users to ask questions about their uploaded content.
    """
    
    def __init__(self):
        self.knowledge_engine = KnowledgeIngestionEngine()
        logger.info("🌉 Knowledge Bridge initialized")
    
    def answer_from_knowledge(self, query: str) -> Dict[str, Any]:
        """
        Answer user question based on uploaded knowledge.
        
        Args:
            query: User's question about uploaded content
            
        Returns:
            Answer derived from knowledge base
        """
        # Get knowledge summary
        summary = self.knowledge_engine.get_knowledge_summary()
        
        if summary['total_concepts'] == 0:
            return {
                "answer": "You haven't uploaded any knowledge yet. Upload PDFs or books using the Knowledge Feeder tools!",
                "source": "none",
                "confidence": 0.0
            }
        
        # Search concepts for relevant information
        query_lower = query.lower()
        relevant_concepts = []
        
        for concept in self.knowledge_engine.concepts:
            # Simple relevance check (real implementation would use NLP/embeddings)
            if (concept.name.lower() in query_lower or 
                query_lower in concept.description.lower()):
                relevant_concepts.append(concept)
        
        if not relevant_concepts:
            return {
                "answer": f"I couldn't find information about that in your uploaded knowledge. You have {summary['total_concepts']} concepts stored. Try asking about: {', '.join(summary['latest_concepts'][:3])}",
                "source": "knowledge_base",
                "confidence": 0.0,
                "total_concepts": summary['total_concepts']
            }
        
        # Build answer from concepts
        answer = "**Based on your uploaded knowledge:**\n\n"
        
        for i, concept in enumerate(relevant_concepts[:3], 1):
            answer += f"{i}. **{concept.name}** ({concept.category})\n"
            answer += f"   {concept.description}\n"
            answer += f"   Source: {concept.source}\n"
            answer += f"   Confidence: {concept.confidence:.0%}\n\n"
        
        if len(relevant_concepts) > 3:
            answer += f"*...and {len(relevant_concepts) - 3} more related concepts*\n"
        
        return {
            "answer": answer,
            "source": "knowledge_base",
            "confidence": sum(c.confidence for c in relevant_concepts[:3]) / min(3, len(relevant_concepts)),
            "concepts_found": len(relevant_concepts),
            "concepts_used": relevant_concepts[:3]
        }
    
    def get_knowledge_summary(self) -> Dict[str, Any]:
        """Get summary of uploaded knowledge."""
        return self.knowledge_engine.get_knowledge_summary()
    
    def search_concepts(self, keyword: str) -> List[Any]:
        """
        Search concepts by keyword.
        
        Args:
            keyword: Search term
            
        Returns:
            List of matching concepts
        """
        keyword_lower = keyword.lower()
        matches = []
        
        for concept in self.knowledge_engine.concepts:
            if (keyword_lower in concept.name.lower() or 
                keyword_lower in concept.description.lower() or
                keyword_lower in concept.category.lower()):
                matches.append(concept)
        
        return matches
    
    def get_concepts_by_category(self, category: str) -> List[Any]:
        """Get all concepts in a category."""
        return [c for c in self.knowledge_engine.concepts if c.category == category]
