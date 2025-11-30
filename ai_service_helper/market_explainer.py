"""Market Explainer - Market context and analysis."""

import logging
from typing import Dict, Any

from bagbot.trading.news_anchor import NewsAnchor

logger = logging.getLogger(__name__)


class MarketExplainer:
    """
    Explains current market conditions.
    
    Provides:
    - Market bias (risk-on/risk-off)
    - News summaries
    - Daily conditions
    - HTF directional bias
    - Volatility conditions
    - Strategy recommendations
    """
    
    def __init__(self):
        self.news_anchor = NewsAnchor()
        logger.info("📊 Market Explainer initialized")
    
    async def get_market_summary(self) -> Dict[str, Any]:
        """Get comprehensive market summary."""
        context = self.news_anchor.get_market_context()
        briefing = await self.news_anchor.generate_morning_briefing()
        
        summary = f"""**Market Summary**

**Overall Bias:** {briefing.overall_bias.value.replace('_', '-').title()}
**Fundamental Grade:** {briefing.fundamental_grade.value.replace('_', ' ').title()}
**Risk Level:** {context['risk_level']:.0%}

**Key Events Today:**
"""
        
        for event in briefing.key_events[:3]:
            summary += f"- {event.title} ({event.market_impact.value})\n"
        
        summary += f"\n**Market Outlook:**\n{briefing.summary}\n"
        
        summary += f"\n**Risk Factors:**\n"
        for factor in briefing.risk_factors[:3]:
            summary += f"- {factor}\n"
        
        summary += f"\n**Opportunities:**\n"
        for opp in briefing.opportunities[:3]:
            summary += f"- {opp}\n"
        
        return {
            "summary": summary,
            "bias": briefing.overall_bias.value,
            "risk_level": context['risk_level'],
            "grade": briefing.fundamental_grade.value
        }
    
    def explain_bias(self, bias: str) -> str:
        """Explain what a market bias means."""
        explanations = {
            "risk_on": """**Risk-On Market**

Investors are optimistic and willing to take risks:
- Money flows into risky assets (stocks, crypto)
- Safe havens (gold, bonds) weaken
- Volatility typically lower
- Good for trend-following strategies

**Trading Implications:** Favor long positions in growth assets.""",
            
            "risk_off": """**Risk-Off Market**

Investors seeking safety, avoiding risk:
- Money flows to safe havens (USD, gold, bonds)
- Risky assets (stocks, crypto) sell off
- Volatility spikes
- Good for mean reversion

**Trading Implications:** Reduce position sizes, favor shorts or sit out.""",
            
            "neutral": """**Neutral Market**

Mixed signals, no clear direction:
- Rotation between sectors
- Choppy price action
- Range-bound trading
- Good for range strategies

**Trading Implications:** Use tight stops, favor range-bound strategies.""",
            
            "uncertain": """**Uncertain Market**

Conflicting signals, lack of clarity:
- News flow contradictory
- Institutional indecision
- High volatility potential
- Difficult trading environment

**Trading Implications:** Reduce exposure, wait for clarity."""
        }
        
        return explanations.get(bias.lower(), "Unknown bias type")
    
    def explain_volatility(self, symbol: str, volatility_level: str) -> str:
        """Explain volatility conditions."""
        explanations = {
            "low": f"""**Low Volatility on {symbol}**

- Price moving in tight range
- Low ATR relative to historical average
- Good for: Mean reversion, range trading
- Avoid: Breakout strategies

**Note:** Low volatility often precedes big moves.""",
            
            "normal": f"""**Normal Volatility on {symbol}**

- Price moving at average pace
- ATR at historical norms
- Good for: Most strategies
- Standard risk management applies""",
            
            "high": f"""**High Volatility on {symbol}**

- Large price swings
- Elevated ATR
- Good for: Volatility breakouts, FVG
- Caution: Wider stops needed, reduce position size

**Note:** High volatility increases risk and opportunity.""",
            
            "extreme": f"""**Extreme Volatility on {symbol}**

- Wild price action
- ATR at extreme levels
- Consider: Sitting out or minimal exposure
- Risk: Stop hunting, slippage common

**Warning:** Extreme volatility can wipe accounts quickly."""
        }
        
        return explanations.get(volatility_level.lower(), "Unknown volatility level")
    
    def get_strategy_recommendations_for_conditions(self, market_context: Dict) -> Dict[str, Any]:
        """Recommend strategies based on current market conditions."""
        bias = market_context.get("bias", "neutral")
        risk_level = market_context.get("risk_level", 0.5)
        
        recommendations = []
        
        # Based on bias
        if "risk_on" in bias.lower():
            recommendations.extend([
                {"strategy": "Order Blocks", "reason": "Trending markets favor institutional tracking"},
                {"strategy": "Trend Continuation", "reason": "Clear trends developing"}
            ])
        
        elif "risk_off" in bias.lower():
            recommendations.extend([
                {"strategy": "Mean Reversion", "reason": "Panic selling creates oversold bounces"},
                {"strategy": "Liquidity Sweeps", "reason": "Stop hunts common in fearful markets"}
            ])
        
        elif "neutral" in bias.lower():
            recommendations.extend([
                {"strategy": "Mean Reversion", "reason": "Range-bound conditions"},
                {"strategy": "Supply/Demand", "reason": "Zone trading works in ranges"}
            ])
        
        # Risk level adjustments
        if risk_level > 0.7:
            recommendations.insert(0, {
                "strategy": "NONE",
                "reason": "High risk environment - consider sitting out"
            })
        
        return {
            "recommendations": recommendations,
            "market_context": {
                "bias": bias,
                "risk_level": f"{risk_level:.0%}"
            },
            "note": "Always use proper risk management regardless of conditions."
        }
    
    def explain_spread_slippage(self) -> str:
        """Explain spread and slippage."""
        return """**Spread & Slippage**

**Spread:** Difference between bid and ask price
- **Tight spread (0.1-0.5 pips):** Good for scalping, high-frequency
- **Wide spread (>2 pips):** Avoid scalping, use wider targets

**Slippage:** Difference between expected and filled price
- **Low slippage:** Liquid markets, normal conditions
- **High slippage:** News events, low liquidity, large orders

**Mitigation:**
- Trade during high liquidity hours
- Avoid news events
- Use limit orders instead of market orders
- Trade liquid pairs (EURUSD, BTCUSDT)

**Cost Impact:**
- Spread + slippage = true trading cost
- Can turn winning strategy into loser if high
- Monitor execution quality in logs"""
