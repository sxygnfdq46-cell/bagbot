"""FAQ Engine - Frequently asked questions handler."""

import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


class FAQEngine:
    """
    Handles frequently asked questions about the platform.
    
    Categories:
    - Setup
    - Trading settings
    - Strategies
    - Subscription
    - Errors
    """
    
    def __init__(self):
        self.faqs = self._load_faqs()
        logger.info("❓ FAQ Engine initialized with {} FAQs".format(len(self.faqs)))
    
    def _load_faqs(self) -> Dict[str, List[Dict[str, str]]]:
        """Load FAQ database."""
        return {
            "setup": [
                {
                    "question": "How do I get started with BAGBOT2?",
                    "answer": """**Getting Started:**
1. Create an account and subscribe
2. Add exchange API keys in Settings → API Keys
3. Select strategies in Strategy Arsenal
4. Configure risk settings in Risk Manager
5. Enable trading and monitor dashboard

First time? Start with demo mode to test without real funds."""
                },
                {
                    "question": "How do I connect to an exchange?",
                    "answer": """**Exchange Connection:**
1. Go to Settings → API Keys
2. Select your exchange (Binance, Bybit, OKX, etc.)
3. Enter API Key and Secret from exchange
4. Enable required permissions (trading, reading)
5. Test connection

**Note:** Never share API keys. Use IP whitelist for security."""
                },
                {
                    "question": "What markets does BAGBOT2 support?",
                    "answer": """**Supported Markets:**
- **Crypto:** Binance, Bybit, OKX
- **Forex:** Oanda, MT5
- **Stocks:** Alpaca
- **Signals:** TradingView webhooks

Generic REST adapter supports any exchange with REST API."""
                }
            ],
            "trading_settings": [
                {
                    "question": "How do I configure position sizing?",
                    "answer": """**Position Sizing:**
1. Go to Risk Manager settings
2. Set `max_risk_per_trade` (e.g., 1% = 0.01)
3. Set `max_position_size` (e.g., 0.02 = 2% of capital)
4. Set `max_daily_loss` limit

Bot calculates position size based on stop distance and risk."""
                },
                {
                    "question": "How does the bot handle losses?",
                    "answer": """**Loss Management:**
- Each trade has automatic stop-loss
- Daily loss limit pauses trading
- Streak Manager reduces size after losses
- Mindset Engine adjusts after streaks

Configure in Risk Manager → Loss Protection."""
                }
            ],
            "strategies": [
                {
                    "question": "Which strategy should I use?",
                    "answer": """**Strategy Selection:**

**Trending Markets:** Order Blocks, Breaker Blocks, Trend Continuation
**Ranging Markets:** Mean Reversion, Supply/Demand
**High Volatility:** FVG, Liquidity Sweeps, Volatility Breakouts

Use Strategy Switcher for automatic selection based on conditions."""
                },
                {
                    "question": "Can I run multiple strategies?",
                    "answer": """**Multiple Strategies:**
Yes! Enable multiple strategies in Strategy Arsenal.

**Tips:**
- Use different timeframes per strategy
- Set max_concurrent_trades limit
- Monitor total exposure
- Use Strategy Switcher for coordination

Bot manages conflicts automatically."""
                }
            ],
            "subscription": [
                {
                    "question": "What subscription plans are available?",
                    "answer": """**Subscription Plans:**

**Free Tier:**
- 1 strategy
- Demo mode only
- Basic features

**Pro Tier ($49/mo):**
- All strategies
- Live trading
- All markets
- Priority support

**Enterprise ($199/mo):**
- Multiple accounts
- Custom strategies
- API access
- Dedicated support"""
                },
                {
                    "question": "How do I cancel my subscription?",
                    "answer": """**Cancel Subscription:**
1. Go to Settings → Subscription
2. Click "Manage Subscription"
3. Click "Cancel Subscription"
4. Confirm cancellation

You keep access until period ends. Data is preserved for 30 days."""
                }
            ],
            "errors": [
                {
                    "question": "Why am I getting API errors?",
                    "answer": """**API Errors:**

**Common causes:**
1. Invalid API keys → Check in exchange
2. Insufficient permissions → Enable trading permission
3. IP not whitelisted → Add your IP
4. Exchange downtime → Check exchange status
5. Rate limits → Reduce request frequency

Check logs at `/api/logs` for details."""
                },
                {
                    "question": "Why isn't my strategy trading?",
                    "answer": """**Strategy Not Trading:**

**Check:**
1. Strategy is enabled in dashboard
2. Market conditions match strategy requirements
3. Sufficient balance available
4. Risk limits not exceeded
5. News Filter not blocking (high-impact events)

Review Strategy Switcher recommendations."""
                }
            ]
        }
    
    def search(self, query: str) -> Optional[Dict[str, Any]]:
        """
        Search FAQs for answer.
        
        Args:
            query: User's question
            
        Returns:
            Best matching FAQ or None
        """
        query_lower = query.lower()
        
        # Search all FAQs
        matches = []
        for category, faqs in self.faqs.items():
            for faq in faqs:
                # Calculate relevance score
                score = 0
                question_lower = faq["question"].lower()
                
                # Exact match bonus
                if query_lower == question_lower:
                    score += 100
                
                # Word overlap
                query_words = set(query_lower.split())
                question_words = set(question_lower.split())
                overlap = len(query_words & question_words)
                score += overlap * 10
                
                # Substring match
                if query_lower in question_lower or question_lower in query_lower:
                    score += 20
                
                if score > 0:
                    matches.append({
                        "faq": faq,
                        "category": category,
                        "score": score
                    })
        
        if not matches:
            return None
        
        # Return best match
        best_match = max(matches, key=lambda x: x["score"])
        
        return {
            "question": best_match["faq"]["question"],
            "answer": best_match["faq"]["answer"],
            "category": best_match["category"],
            "confidence": min(1.0, best_match["score"] / 50)
        }
    
    def get_category_faqs(self, category: str) -> List[Dict[str, str]]:
        """Get all FAQs in a category."""
        return self.faqs.get(category, [])
    
    def get_all_categories(self) -> List[str]:
        """Get all FAQ categories."""
        return list(self.faqs.keys())
