"""Chat Engine - Natural language interface for BAGBOT2."""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

from bagbot.trading.knowledge_ingestion_engine import KnowledgeIngestionEngine
from bagbot.trading.news_anchor import NewsAnchor
from bagbot.trading.strategy_arsenal import StrategyArsenal

logger = logging.getLogger(__name__)


class ChatEngine:
    """
    Natural language chat interface.
    
    Handles user queries and routes to appropriate modules.
    Integrates with:
    - Knowledge Engine (for uploaded knowledge)
    - News Anchor (for market context)
    - Strategy Arsenal (for strategy details)
    """
    
    def __init__(self):
        self.knowledge_engine = KnowledgeIngestionEngine()
        self.news_anchor = NewsAnchor()
        self.strategy_arsenal = StrategyArsenal()
        self.conversation_history: List[Dict] = []
        
        logger.info("💬 Chat Engine initialized")
    
    def process_query(self, query: str, user_context: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Process natural language query.
        
        Args:
            query: User's question
            user_context: User profile/preferences
            
        Returns:
            Response with answer and metadata
        """
        query_lower = query.lower()
        
        # Add to conversation history
        self.conversation_history.append({
            "role": "user",
            "content": query,
            "timestamp": datetime.now().isoformat()
        })
        
        # Detect intent and route
        response = None
        
        if self._is_strategy_query(query_lower):
            response = self._handle_strategy_query(query, query_lower)
        
        elif self._is_market_query(query_lower):
            response = self._handle_market_query(query, query_lower)
        
        elif self._is_knowledge_query(query_lower):
            response = self._handle_knowledge_query(query, query_lower)
        
        elif self._is_setup_query(query_lower):
            response = self._handle_setup_query(query, query_lower)
        
        elif self._is_troubleshooting_query(query_lower):
            response = self._handle_troubleshooting_query(query, query_lower)
        
        else:
            response = self._handle_general_query(query)
        
        # Add to conversation history
        self.conversation_history.append({
            "role": "assistant",
            "content": response["answer"],
            "timestamp": datetime.now().isoformat(),
            "metadata": response.get("metadata", {})
        })
        
        return response
    
    def _is_strategy_query(self, query: str) -> bool:
        """Check if query is about strategies."""
        keywords = ["strategy", "strategies", "order block", "fvg", "liquidity", 
                   "breaker", "mean reversion", "trend", "how does", "explain"]
        return any(kw in query for kw in keywords)
    
    def _is_market_query(self, query: str) -> bool:
        """Check if query is about market conditions."""
        keywords = ["market", "bias", "news", "risk", "volatility", "what's happening",
                   "should i trade", "conditions"]
        return any(kw in query for kw in keywords)
    
    def _is_knowledge_query(self, query: str) -> bool:
        """Check if query relates to uploaded knowledge."""
        keywords = ["pdf", "book", "learn", "uploaded", "knowledge", "what did i upload"]
        return any(kw in query for kw in keywords)
    
    def _is_setup_query(self, query: str) -> bool:
        """Check if query is about setup/configuration."""
        keywords = ["setup", "configure", "connect", "api key", "how to start",
                   "getting started", "install"]
        return any(kw in query for kw in keywords)
    
    def _is_troubleshooting_query(self, query: str) -> bool:
        """Check if query is about errors/problems."""
        keywords = ["error", "problem", "not working", "failed", "broken", "fix",
                   "troubleshoot", "debug"]
        return any(kw in query for kw in keywords)
    
    def _handle_strategy_query(self, query: str, query_lower: str) -> Dict[str, Any]:
        """Handle strategy-related queries."""
        # Detect specific strategy
        strategy_name = None
        if "order block" in query_lower:
            strategy_name = "Order Blocks"
        elif "fvg" in query_lower or "fair value gap" in query_lower:
            strategy_name = "FVG"
        elif "liquidity" in query_lower and "sweep" in query_lower:
            strategy_name = "Liquidity Sweeps"
        elif "breaker" in query_lower:
            strategy_name = "Breaker Blocks"
        elif "mean reversion" in query_lower:
            strategy_name = "Mean Reversion"
        elif "trend continuation" in query_lower:
            strategy_name = "Trend Continuation"
        elif "volatility" in query_lower and "breakout" in query_lower:
            strategy_name = "Volatility Breakouts"
        elif "supply" in query_lower or "demand" in query_lower:
            strategy_name = "Supply/Demand"
        
        if strategy_name:
            return {
                "answer": self._get_strategy_explanation(strategy_name),
                "type": "strategy_explanation",
                "metadata": {
                    "strategy": strategy_name,
                    "source": "strategy_explainer"
                }
            }
        else:
            # General strategy question
            return {
                "answer": self._get_strategy_overview(),
                "type": "strategy_overview",
                "metadata": {"source": "strategy_explainer"}
            }
    
    def _handle_market_query(self, query: str, query_lower: str) -> Dict[str, Any]:
        """Handle market condition queries."""
        context = self.news_anchor.get_market_context()
        
        answer = f"""**Current Market Conditions:**

**Market Bias:** {context['bias']}
**Risk Level:** {context['risk_level']:.0%}

Based on the News Anchor analysis, here's what you need to know:
- The market is currently showing {context['bias']} sentiment
- Risk level is at {context['risk_level']:.0%} - {'Be cautious' if context['risk_level'] > 0.7 else 'Conditions are favorable'}

{self._get_trading_recommendation(context)}
"""
        
        return {
            "answer": answer,
            "type": "market_context",
            "metadata": {
                "source": "news_anchor",
                "bias": context['bias'],
                "risk_level": context['risk_level']
            }
        }
    
    def _handle_knowledge_query(self, query: str, query_lower: str) -> Dict[str, Any]:
        """Handle knowledge-related queries."""
        summary = self.knowledge_engine.get_knowledge_summary()
        
        answer = f"""**Knowledge Base Summary:**

You have **{summary['total_concepts']} concepts** stored in the knowledge base.

**By Category:**
"""
        for category, count in summary['by_category'].items():
            answer += f"- {category}: {count} concepts\n"
        
        answer += f"\n**Latest Concepts:**\n"
        for concept in summary['latest_concepts']:
            answer += f"- {concept}\n"
        
        answer += f"\nYou can upload more PDFs or text using the Knowledge Feeder tools."
        
        return {
            "answer": answer,
            "type": "knowledge_summary",
            "metadata": {
                "source": "knowledge_engine",
                "total_concepts": summary['total_concepts']
            }
        }
    
    def _handle_setup_query(self, query: str, query_lower: str) -> Dict[str, Any]:
        """Handle setup/configuration queries."""
        answer = """**Getting Started with BAGBOT2:**

1. **API Keys Setup:**
   - Add exchange API keys in Settings
   - Configure News Anchor sources
   - Set up market adapters

2. **Strategy Selection:**
   - Choose from 10+ strategies in Strategy Arsenal
   - Configure risk parameters
   - Set position sizing

3. **Start Trading:**
   - Enable strategies in the dashboard
   - Monitor via real-time stats
   - Check logs for execution details

Need specific help? Ask about:
- "How to connect to Binance?"
- "How to set up order blocks strategy?"
- "How to configure risk management?"
"""
        
        return {
            "answer": answer,
            "type": "setup_guide",
            "metadata": {"source": "faq_engine"}
        }
    
    def _handle_troubleshooting_query(self, query: str, query_lower: str) -> Dict[str, Any]:
        """Handle troubleshooting queries."""
        # Detect common issues
        if "api" in query_lower and ("error" in query_lower or "failed" in query_lower):
            answer = """**API Connection Issues:**

Common fixes:
1. **Check API Keys:** Verify keys are correct in Settings
2. **Check Permissions:** Ensure API keys have trading permissions
3. **Check Network:** Verify internet connectivity
4. **Check Logs:** Look at `/api/logs` for detailed error messages

If issue persists, check the exchange's API status page.
"""
        
        elif "strategy" in query_lower and "not working" in query_lower:
            answer = """**Strategy Not Working:**

Troubleshooting steps:
1. **Check Strategy Status:** Ensure strategy is enabled
2. **Check Market Conditions:** Some strategies only work in specific conditions
3. **Check Risk Settings:** Verify position sizing isn't too small
4. **Check Logs:** Review execution logs for clues

Try: Lower the strategy's threshold or check HTF direction bias.
"""
        
        elif "balance" in query_lower or "fund" in query_lower:
            answer = """**Balance/Funding Issues:**

Check:
1. **Account Balance:** Verify sufficient funds on exchange
2. **Minimum Capital:** Each strategy has min_capital requirement
3. **Position Size:** Check max_position_size settings
4. **Available Margin:** For leverage trading, check margin availability

Review the Risk Manager settings to adjust position sizing.
"""
        
        else:
            answer = """**General Troubleshooting:**

1. **Check Logs:** Visit `/api/logs` for detailed error messages
2. **Check Status:** Review system health in dashboard
3. **Check Settings:** Verify all configurations are correct
4. **Restart Services:** Try restarting the backend/worker

For specific errors, describe the exact error message and I can help more.
"""
        
        return {
            "answer": answer,
            "type": "troubleshooting",
            "metadata": {"source": "troubleshooting_engine"}
        }
    
    def _handle_general_query(self, query: str) -> Dict[str, Any]:
        """Handle general queries."""
        answer = """I'm the BAGBOT2 AI Assistant. I can help you with:

📊 **Strategies** - Explain any of the 10+ trading strategies
📰 **Market Conditions** - Current bias, risk level, and recommendations  
📚 **Knowledge** - Summary of your uploaded PDFs/books
⚙️ **Setup** - Getting started and configuration help
🔧 **Troubleshooting** - Diagnose and fix issues

What would you like to know?
"""
        
        return {
            "answer": answer,
            "type": "general",
            "metadata": {"source": "chat_engine"}
        }
    
    def _get_strategy_explanation(self, strategy_name: str) -> str:
        """Get detailed strategy explanation."""
        explanations = {
            "Order Blocks": """**Order Blocks Strategy**

**What it does:**
Identifies institutional accumulation zones where smart money enters positions.

**How it works:**
1. Detects momentum candles (>70% body)
2. Marks the candle as an order block
3. Waits for price to retest the block
4. Enters when confirmed

**Best used when:**
- Market is trending
- HTF direction aligns
- Clear structure visible

**Risk notes:**
- False breakouts can occur
- Works best on higher timeframes (H1+)
- Requires patience for retests

**Integration:** Uses HTM adapter for direction bias, News Anchor for risk context.
""",
            "FVG": """**Fair Value Gap (FVG) Strategy**

**What it does:**
Trades price imbalances - gaps that need to be filled.

**How it works:**
1. Detects 3-candle gap (c1.high < c3.low)
2. Gap indicates inefficiency
3. Enters when price fills the gap
4. 2:1 reward-risk ratio

**Best used when:**
- Fast-moving markets
- High volatility
- Clear gaps visible

**Risk notes:**
- Gaps can expand before filling
- Not all gaps fill immediately
- Use tight stops

**Integration:** Combines with volatility filters and News Anchor risk levels.
""",
            "Liquidity Sweeps": """**Liquidity Sweeps Strategy**

**What it does:**
Trades liquidity grabs where smart money hunts stop losses.

**How it works:**
1. Identifies swing highs/lows
2. Watches for wicks beyond levels
3. Enters when price closes back inside
4. Targets opposite swing

**Best used when:**
- Range-bound markets
- Clear support/resistance
- High liquidity zones

**Risk notes:**
- Fake sweeps can occur
- Requires quick execution
- Works best on liquid pairs

**Integration:** Uses Streak Manager for confidence scoring.
"""
        }
        
        return explanations.get(strategy_name, f"**{strategy_name} Strategy**\n\nDetailed explanation coming soon. Check the Strategy Arsenal for basic info.")
    
    def _get_strategy_overview(self) -> str:
        """Get overview of all strategies."""
        return """**BAGBOT2 Strategy Arsenal Overview:**

**Smart Money Strategies:**
- **Order Blocks** - Institutional accumulation zones
- **FVG** - Fair Value Gap inefficiencies  
- **Breaker Blocks** - Failed breakout reversals
- **Liquidity Sweeps** - Stop hunt trades

**Technical Strategies:**
- **Mean Reversion** - Range trading (oversold/overbought)
- **Supply/Demand** - Zone trading
- **Volatility Breakouts** - ATR expansion trades
- **Trend Continuation** - Pullback entries

**Advanced:**
- **Micro Trend Follower** - Ultra-fast tick-based
- **Multi Trend Follower** - Multi-timeframe

All strategies integrate with HTM for direction bias and News Anchor for risk context.

Ask about any specific strategy for detailed explanation!
"""
    
    def _get_trading_recommendation(self, context: Dict) -> str:
        """Get trading recommendation based on market context."""
        risk_level = context['risk_level']
        
        if risk_level < 0.3:
            return "**Recommendation:** Favorable conditions for trading. Consider full position sizes."
        elif risk_level < 0.6:
            return "**Recommendation:** Moderate risk. Use standard position sizing with tight stops."
        elif risk_level < 0.8:
            return "**Recommendation:** Elevated risk. Reduce position sizes by 50% and use wider stops."
        else:
            return "**Recommendation:** High risk environment. Consider sitting out or using minimal position sizes."
    
    def get_conversation_history(self, limit: int = 10) -> List[Dict]:
        """Get recent conversation history."""
        return self.conversation_history[-limit:]
    
    def clear_conversation(self) -> None:
        """Clear conversation history."""
        self.conversation_history = []
        logger.info("Conversation history cleared")
