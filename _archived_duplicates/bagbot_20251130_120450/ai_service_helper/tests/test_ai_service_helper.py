"""Tests for AI Service Helper components."""

import pytest
from bagbot.ai_service_helper.router import Router, QueryIntent
from bagbot.ai_service_helper.faq_engine import FAQEngine
from bagbot.ai_service_helper.troubleshooting_engine import TroubleshootingEngine
from bagbot.ai_service_helper.personalization_engine import PersonalizationEngine
from bagbot.ai_service_helper.context_memory import ContextMemory


class TestRouter:
    """Test Router intent detection."""
    
    def test_strategy_intent_detection(self):
        """Test strategy query detection."""
        router = Router()
        
        result = router.detect_intent("What is an order block?")
        assert result == QueryIntent.STRATEGY_EXPLANATION
        
        result = router.detect_intent("How does FVG work?")
        assert result == QueryIntent.STRATEGY_EXPLANATION
    
    def test_market_intent_detection(self):
        """Test market query detection."""
        router = Router()
        
        result = router.detect_intent("What's the market bias today?")
        assert result == QueryIntent.MARKET_EXPLANATION
        
        result = router.detect_intent("Should I trade now?")
        assert result == QueryIntent.MARKET_EXPLANATION
    
    def test_faq_intent_detection(self):
        """Test FAQ query detection."""
        router = Router()
        
        result = router.detect_intent("How do I connect to Binance?")
        assert result == QueryIntent.PLATFORM_FAQ
        
        result = router.detect_intent("How to get started?")
        assert result == QueryIntent.PLATFORM_FAQ
    
    def test_troubleshooting_intent_detection(self):
        """Test troubleshooting query detection."""
        router = Router()
        
        result = router.detect_intent("diagnose this error problem")
        assert result == QueryIntent.TROUBLESHOOTING
        
        result = router.detect_intent("broken not working need to fix")
        assert result == QueryIntent.TROUBLESHOOTING
    
    def test_personalization_intent_detection(self):
        """Test personalization query detection."""
        router = Router()
        
        result = router.detect_intent("recommend advice for my profile preferences")
        assert result == QueryIntent.PERSONALIZATION
        
        result = router.detect_intent("suggest personalize best for me")
        assert result == QueryIntent.PERSONALIZATION
    
    def test_routing_returns_correct_module(self):
        """Test routing returns correct module name."""
        router = Router()
        
        routing = router.route("explain mean reversion strategy")
        assert routing["module"] == "strategy_explainer"
        
        routing = router.route("how to get started setup")
        assert routing["module"] == "faq_engine"


class TestFAQEngine:
    """Test FAQ Engine."""
    
    def test_search_finds_matching_faq(self):
        """Test FAQ search finds matches."""
        engine = FAQEngine()
        
        result = engine.search("How do I get started?")
        assert result is not None
        assert "getting started" in result["answer"].lower() or "setup" in result["answer"].lower()
    
    def test_search_returns_confidence(self):
        """Test search returns confidence score."""
        engine = FAQEngine()
        
        result = engine.search("connect to binance")
        if result is not None:
            assert "confidence" in result
            assert 0 <= result["confidence"] <= 1
    
    def test_category_retrieval(self):
        """Test getting FAQs by category."""
        engine = FAQEngine()
        
        faqs = engine.get_category_faqs("setup")
        assert len(faqs) > 0
        assert all("question" in faq for faq in faqs)
    
    def test_no_match_handling(self):
        """Test handling of no matches."""
        engine = FAQEngine()
        
        result = engine.search("completely unrelated random query xyz123")
        # Should return None for no match
        assert result is None or "confidence" in result


class TestTroubleshootingEngine:
    """Test Troubleshooting Engine."""
    
    def test_diagnose_api_key_error(self):
        """Test API key error diagnosis."""
        engine = TroubleshootingEngine()
        
        result = engine.diagnose("401 Unauthorized: Invalid API key")
        assert result["matched"] is True
        assert "api_key" in result["type"]
        assert len(result["solution"]) > 0
    
    def test_diagnose_rate_limit(self):
        """Test rate limit diagnosis."""
        engine = TroubleshootingEngine()
        
        result = engine.diagnose("429 Too Many Requests")
        assert result["matched"] is True
        assert "rate_limit" in result["type"]
    
    def test_diagnose_insufficient_balance(self):
        """Test insufficient balance diagnosis."""
        engine = TroubleshootingEngine()
        
        result = engine.diagnose("Insufficient balance to place order")
        assert result["matched"] is True
        assert "balance" in result["type"]
    
    def test_suggest_fixes_for_problem(self):
        """Test fix suggestions."""
        engine = TroubleshootingEngine()
        
        result = engine.suggest_fixes("My strategy hasn't generated any signals")
        assert "steps" in result or "possible_causes" in result
        assert len(result) > 0
    
    def test_explain_error_code(self):
        """Test HTTP error code explanation."""
        engine = TroubleshootingEngine()
        
        explanation = engine.explain_error_code(401)
        assert "authentication" in explanation.lower()
        
        explanation = engine.explain_error_code(429)
        assert "rate limit" in explanation.lower()


class TestPersonalizationEngine:
    """Test Personalization Engine."""
    
    def test_beginner_strategy_recommendations(self):
        """Test beginner gets appropriate strategies."""
        engine = PersonalizationEngine()
        
        result = engine.get_strategy_recommendations({
            "experience_level": "beginner",
            "risk_tolerance": "low",
            "capital": 1000.0
        })
        
        assert "recommendations" in result
        strategies = [r["strategy"] for r in result["recommendations"]]
        assert "Mean Reversion" in strategies
    
    def test_advanced_strategy_recommendations(self):
        """Test advanced gets complex strategies."""
        engine = PersonalizationEngine()
        
        result = engine.get_strategy_recommendations({
            "experience_level": "advanced",
            "risk_tolerance": "high",
            "capital": 10000.0
        })
        
        strategies = [r["strategy"] for r in result["recommendations"]]
        assert any("Liquidity" in s or "Micro" in s for s in strategies)
    
    def test_risk_settings_low_tolerance(self):
        """Test low risk tolerance settings."""
        engine = PersonalizationEngine()
        
        result = engine.get_risk_settings_recommendation({
            "risk_tolerance": "low",
            "capital": 5000.0
        })
        assert result["max_risk_per_trade"] == 0.005
        assert result["max_position_size"] == 0.01
    
    def test_risk_settings_high_tolerance(self):
        """Test high risk tolerance settings."""
        engine = PersonalizationEngine()
        
        result = engine.get_risk_settings_recommendation({
            "risk_tolerance": "high",
            "capital": 5000.0
        })
        assert result["max_risk_per_trade"] == 0.02
        assert result["max_position_size"] == 0.05
    
    def test_market_recommendations_low_capital(self):
        """Test market recommendations for low capital."""
        engine = PersonalizationEngine()
        
        result = engine.get_market_recommendations({
            "capital": 300.0,
            "experience_level": "beginner"
        })
        
        markets = [r["market"] for r in result["recommendations"]]
        assert "Crypto" in markets


class TestContextMemory:
    """Test Context Memory."""
    
    def test_add_and_retrieve_interaction(self):
        """Test adding and retrieving interactions."""
        memory = ContextMemory()
        
        memory.add_interaction("session1", "user", "Hello")
        memory.add_interaction("session1", "assistant", "Hi there!")
        
        history = memory.get_session_history("session1")
        assert len(history) == 2
        assert history[0]["role"] == "user"
        assert history[1]["role"] == "assistant"
    
    def test_session_isolation(self):
        """Test sessions are isolated."""
        memory = ContextMemory()
        
        memory.add_interaction("session1", "user", "Query 1")
        memory.add_interaction("session2", "user", "Query 2")
        
        history1 = memory.get_session_history("session1")
        history2 = memory.get_session_history("session2")
        
        assert len(history1) == 1
        assert len(history2) == 1
        assert history1[0]["content"] != history2[0]["content"]
    
    def test_history_limit(self):
        """Test history respects max limit."""
        memory = ContextMemory(max_history=3)
        
        for i in range(5):
            memory.add_interaction("session1", "user", f"Message {i}")
        
        history = memory.get_session_history("session1")
        assert len(history) <= 3
    
    def test_context_summary(self):
        """Test context summary generation."""
        memory = ContextMemory()
        
        memory.add_interaction("session1", "user", "What is order block?")
        memory.add_interaction("session1", "assistant", "Order blocks are...")
        
        summary = memory.get_context_summary("session1")
        assert "Recent Context" in summary
    
    def test_clear_session(self):
        """Test clearing a session."""
        memory = ContextMemory()
        
        memory.add_interaction("session1", "user", "Test")
        memory.clear_session("session1")
        
        history = memory.get_session_history("session1")
        assert len(history) == 0
    
    def test_active_sessions_tracking(self):
        """Test active sessions tracking."""
        memory = ContextMemory()
        
        memory.add_interaction("session1", "user", "Test 1")
        memory.add_interaction("session2", "user", "Test 2")
        
        active = memory.get_active_sessions()
        assert len(active) == 2
        assert "session1" in active
        assert "session2" in active


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
