"""Router - Intelligent query routing system."""

import logging
from typing import Dict, Any, Optional
from enum import Enum

logger = logging.getLogger(__name__)


class QueryIntent(Enum):
    """User query intent types."""
    STRATEGY_EXPLANATION = "strategy_explanation"
    MARKET_EXPLANATION = "market_explanation"
    PLATFORM_FAQ = "platform_faq"
    TROUBLESHOOTING = "troubleshooting"
    PERSONALIZATION = "personalization"
    GENERAL = "general"


class Router:
    """
    Routes user queries to appropriate sub-modules.
    
    Analyzes intent and directs to:
    - Strategy Explainer
    - Market Explainer
    - Platform FAQ
    - Troubleshooting Engine
    - Personalization Engine
    """
    
    def __init__(self):
        self.intent_keywords = {
            QueryIntent.STRATEGY_EXPLANATION: [
                "strategy", "how does", "explain", "order block", "fvg",
                "liquidity", "breaker", "mean reversion", "trend", "works"
            ],
            QueryIntent.MARKET_EXPLANATION: [
                "market", "bias", "risk", "news", "volatility", "conditions",
                "sentiment", "should i trade", "what's happening"
            ],
            QueryIntent.PLATFORM_FAQ: [
                "setup", "configure", "connect", "api", "start", "install",
                "subscription", "settings", "dashboard", "how to"
            ],
            QueryIntent.TROUBLESHOOTING: [
                "error", "problem", "not working", "failed", "broken", "fix",
                "issue", "debug", "diagnose", "troubleshoot"
            ],
            QueryIntent.PERSONALIZATION: [
                "recommend", "suggest", "best for me", "my profile", "preferences",
                "suitable", "profile", "personalize", "advice for"
            ]
        }
        
        logger.info("🧭 Router initialized")
    
    def detect_intent(self, query: str) -> QueryIntent:
        """
        Detect user intent from query.
        
        Args:
            query: User's question
            
        Returns:
            Detected intent enum
        """
        query_lower = query.lower()
        
        # Score each intent
        scores = {}
        for intent, keywords in self.intent_keywords.items():
            score = sum(1 for kw in keywords if kw in query_lower)
            scores[intent] = score
        
        # Get highest scoring intent
        max_score = max(scores.values())
        
        if max_score == 0:
            return QueryIntent.GENERAL
        
        # Return intent with highest score
        for intent, score in scores.items():
            if score == max_score:
                return intent
        
        return QueryIntent.GENERAL
    
    def route(self, query: str, intent: Optional[QueryIntent] = None) -> Dict[str, Any]:
        """
        Route query to appropriate handler.
        
        Args:
            query: User's question
            intent: Pre-detected intent (optional)
            
        Returns:
            Routing decision with module and metadata
        """
        if intent is None:
            intent = self.detect_intent(query)
        
        routing_map = {
            QueryIntent.STRATEGY_EXPLANATION: {
                "module": "strategy_explainer",
                "priority": "high",
                "requires_context": True
            },
            QueryIntent.MARKET_EXPLANATION: {
                "module": "market_explainer",
                "priority": "high",
                "requires_context": True
            },
            QueryIntent.PLATFORM_FAQ: {
                "module": "faq_engine",
                "priority": "medium",
                "requires_context": False
            },
            QueryIntent.TROUBLESHOOTING: {
                "module": "troubleshooting_engine",
                "priority": "critical",
                "requires_context": True
            },
            QueryIntent.PERSONALIZATION: {
                "module": "personalization_engine",
                "priority": "medium",
                "requires_context": True
            },
            QueryIntent.GENERAL: {
                "module": "chat_engine",
                "priority": "low",
                "requires_context": False
            }
        }
        
        route_info = routing_map[intent]
        
        logger.info(f"📍 Routed query to {route_info['module']} (intent: {intent.value})")
        
        return {
            "intent": intent.value,
            "module": route_info["module"],
            "priority": route_info["priority"],
            "requires_context": route_info["requires_context"],
            "query": query
        }
    
    def get_sub_module_capabilities(self) -> Dict[str, Any]:
        """Get capabilities of each sub-module."""
        return {
            "strategy_explainer": {
                "description": "Explains trading strategies in detail",
                "capabilities": [
                    "Strategy mechanics",
                    "When to use",
                    "Risk notes",
                    "HTF/news integration",
                    "Live conditions check"
                ]
            },
            "market_explainer": {
                "description": "Provides market context and analysis",
                "capabilities": [
                    "Market bias (risk-on/off)",
                    "News summaries",
                    "Daily conditions",
                    "HTF directional bias",
                    "Volatility assessment",
                    "Strategy recommendations"
                ]
            },
            "faq_engine": {
                "description": "Answers platform questions",
                "capabilities": [
                    "Setup instructions",
                    "Trading settings",
                    "Strategy configuration",
                    "Subscription info",
                    "Error explanations"
                ]
            },
            "troubleshooting_engine": {
                "description": "Diagnoses and fixes issues",
                "capabilities": [
                    "Common problems",
                    "Log reading",
                    "Fix suggestions",
                    "API errors",
                    "Network errors",
                    "Exchange errors"
                ]
            },
            "personalization_engine": {
                "description": "Personalized recommendations",
                "capabilities": [
                    "Profile-aware suggestions",
                    "Market preference matching",
                    "Strategy selection help",
                    "Risk tolerance alignment",
                    "Experience level adaptation"
                ]
            }
        }
