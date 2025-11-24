"""Strategy Explainer - Detailed strategy explanations."""

import logging
from typing import Dict, Any, Optional

from bagbot.trading.news_anchor import NewsAnchor

logger = logging.getLogger(__name__)


class StrategyExplainer:
    """
    Provides detailed explanations of trading strategies.
    
    For each strategy:
    - How it works
    - Strengths/weaknesses
    - When to use
    - Risk notes
    - HTF/news interaction
    - Live condition check
    """
    
    def __init__(self):
        self.news_anchor = NewsAnchor()
        self.strategy_database = self._load_strategy_info()
        logger.info("📚 Strategy Explainer initialized")
    
    def _load_strategy_info(self) -> Dict[str, Dict[str, Any]]:
        """Load detailed strategy information."""
        return {
            "Order Blocks": {
                "description": "Identifies institutional accumulation zones where smart money enters positions",
                "mechanics": """1. Detects momentum candles with >70% body ratio
2. Marks the candle as an order block
3. Waits for price to retest the block
4. Enters on confirmation with 2:1 R:R""",
                "strengths": [
                    "High probability setups",
                    "Clear entry/exit rules",
                    "Works across all timeframes",
                    "Aligns with market structure"
                ],
                "weaknesses": [
                    "Requires patience for retests",
                    "False breakouts can occur",
                    "Best on higher timeframes (H1+)"
                ],
                "best_conditions": "Trending markets with clear structure",
                "risk_notes": "Use with HTF direction bias. Avoid during high-impact news.",
                "htf_integration": "Requires HTF alignment for best results",
                "news_integration": "News Anchor checks risk before entry"
            },
            "FVG": {
                "description": "Trades price imbalances (gaps) that need to be filled",
                "mechanics": """1. Detects 3-candle gap (c1.high < c3.low for bullish)
2. Gap indicates inefficiency in price action
3. Enters when price fills gap
4. Targets 2x gap size""",
                "strengths": [
                    "Quick setups",
                    "Clear visual patterns",
                    "Works in volatile markets",
                    "Good risk/reward ratios"
                ],
                "weaknesses": [
                    "Gaps can expand before filling",
                    "Not all gaps fill immediately",
                    "Requires tight stops"
                ],
                "best_conditions": "Fast-moving, volatile markets",
                "risk_notes": "Use smaller position sizes due to volatility",
                "htf_integration": "Check HTF for gap significance",
                "news_integration": "Volatility spikes often create FVGs"
            },
            "Liquidity Sweeps": {
                "description": "Trades liquidity grabs where smart money hunts stop losses",
                "mechanics": """1. Identifies swing highs/lows (liquidity zones)
2. Watches for wicks beyond levels
3. Enters when price closes back inside range
4. Targets opposite swing""",
                "strengths": [
                    "Catches reversals early",
                    "Clear liquidity levels",
                    "Good risk/reward",
                    "Works in ranging markets"
                ],
                "weaknesses": [
                    "Fake sweeps can occur",
                    "Requires quick execution",
                    "Best on liquid pairs"
                ],
                "best_conditions": "Range-bound markets with clear S/R",
                "risk_notes": "Wait for close inside range, not just wick",
                "htf_integration": "HTF support/resistance adds confluence",
                "news_integration": "News events often trigger sweeps"
            },
            "Breaker Blocks": {
                "description": "Failed breakouts that become reversal zones",
                "mechanics": """1. Market breaks structure
2. Price fails to sustain breakout
3. Original support/resistance inverts
4. Enter on retest of broken level""",
                "strengths": [
                    "High probability reversals",
                    "Clear structure breaks",
                    "Multiple entry opportunities"
                ],
                "weaknesses": [
                    "Requires confirmation",
                    "False breaks common",
                    "Best on higher timeframes"
                ],
                "best_conditions": "After strong trends or range expansions",
                "risk_notes": "Wait for structure break confirmation",
                "htf_integration": "HTF trend determines break significance",
                "news_integration": "News can trigger false breaks"
            },
            "Mean Reversion": {
                "description": "Range trading based on oversold/overbought conditions",
                "mechanics": """1. Calculates moving average and standard deviation
2. Identifies price beyond 2 std dev
3. Enters expecting return to mean
4. Exits at mean""",
                "strengths": [
                    "Simple logic",
                    "Works in sideways markets",
                    "Clear mathematical rules",
                    "Good for beginners"
                ],
                "weaknesses": [
                    "Fails in trending markets",
                    "Can catch falling knives",
                    "Requires tight stops"
                ],
                "best_conditions": "Ranging, non-trending markets",
                "risk_notes": "Avoid during strong trends",
                "htf_integration": "HTF should show ranging structure",
                "news_integration": "News can break ranges violently"
            },
            "Trend Continuation": {
                "description": "Trades pullbacks in established trends",
                "mechanics": """1. Identifies strong trend (>5% move)
2. Waits for 38.2% Fibonacci pullback
3. Enters on continuation signal
4. Targets new highs/lows""",
                "strengths": [
                    "Trend is your friend",
                    "Clear entry points",
                    "Good risk/reward",
                    "Works across timeframes"
                ],
                "weaknesses": [
                    "Requires existing trend",
                    "Pullbacks can become reversals",
                    "Needs patience"
                ],
                "best_conditions": "Strong trending markets",
                "risk_notes": "Confirm trend strength before entry",
                "htf_integration": "HTF trend must align",
                "news_integration": "News can end trends abruptly"
            },
            "Volatility Breakouts": {
                "description": "Trades ATR expansion during high volatility",
                "mechanics": """1. Calculates Average True Range (ATR)
2. Waits for price beyond prev high/low + 2*ATR
3. Enters on confirmed breakout
4. Targets 3*ATR""",
                "strengths": [
                    "Captures big moves",
                    "Clear volatility signals",
                    "Works in explosive markets"
                ],
                "weaknesses": [
                    "Whipsaws in choppy markets",
                    "Requires volatility",
                    "Wider stops needed"
                ],
                "best_conditions": "High volatility, news events",
                "risk_notes": "Use smaller positions due to volatility",
                "htf_integration": "HTF volatility confirms sustainability",
                "news_integration": "News events create volatility"
            },
            "Supply/Demand": {
                "description": "Zone trading based on institutional accumulation/distribution",
                "mechanics": """1. Identifies consolidation zones
2. Marks supply (resistance) and demand (support) zones
3. Waits for price to enter zone
4. Enters on bounce with confirmation""",
                "strengths": [
                    "Clear visual zones",
                    "Multiple touches increase probability",
                    "Works across timeframes"
                ],
                "weaknesses": [
                    "Zones can break",
                    "Requires zone strength assessment",
                    "Best with experience"
                ],
                "best_conditions": "Markets with clear structure",
                "risk_notes": "Fresh zones work best, avoid overused zones",
                "htf_integration": "HTF zones have higher probability",
                "news_integration": "News can invalidate zones"
            },
            "Micro Trend Follower": {
                "description": "Ultra-fast tick-based trend following",
                "mechanics": """1. Monitors every tick in real-time
2. Goes long if candle ticks up
3. Instantly flips short if reverses
4. Constant alignment with momentum""",
                "strengths": [
                    "Fastest reaction time",
                    "No emotion",
                    "Catches micro moves",
                    "Always in position"
                ],
                "weaknesses": [
                    "High frequency (fees/slippage)",
                    "Requires fast execution",
                    "Best for experienced traders"
                ],
                "best_conditions": "Trending markets, low spread pairs",
                "risk_notes": "Monitor spread/slippage costs carefully",
                "htf_integration": "HTF determines overall bias",
                "news_integration": "News creates volatility spikes"
            }
        }
    
    def explain_strategy(self, strategy_name: str, include_live_conditions: bool = True) -> Dict[str, Any]:
        """
        Get detailed explanation of a strategy.
        
        Args:
            strategy_name: Name of strategy
            include_live_conditions: Whether to include current market check
            
        Returns:
            Full explanation with live conditions
        """
        info = self.strategy_database.get(strategy_name)
        
        if not info:
            return {
                "error": f"Strategy '{strategy_name}' not found",
                "available_strategies": list(self.strategy_database.keys())
            }
        
        response = {
            "strategy": strategy_name,
            "description": info["description"],
            "how_it_works": info["mechanics"],
            "strengths": info["strengths"],
            "weaknesses": info["weaknesses"],
            "best_conditions": info["best_conditions"],
            "risk_notes": info["risk_notes"],
            "integrations": {
                "htf": info["htf_integration"],
                "news": info["news_integration"]
            }
        }
        
        if include_live_conditions:
            market_context = self.news_anchor.get_market_context()
            response["live_conditions"] = {
                "market_bias": market_context["bias"],
                "risk_level": market_context["risk_level"],
                "suitable_now": self._assess_suitability(strategy_name, market_context)
            }
        
        return response
    
    def _assess_suitability(self, strategy_name: str, market_context: Dict) -> str:
        """Assess if strategy is suitable for current conditions."""
        risk_level = market_context["risk_level"]
        bias = market_context["bias"]
        
        # High risk conditions
        if risk_level > 0.7:
            return f"⚠️ Caution: High risk environment ({risk_level:.0%}). Consider reducing position sizes or sitting out."
        
        # Strategy-specific assessments
        if strategy_name in ["Order Blocks", "Trend Continuation", "Volatility Breakouts"]:
            if "neutral" in bias.lower():
                return "⚠️ Strategy works best in trending conditions. Current market is neutral."
            return "✅ Suitable - Market conditions align with strategy requirements."
        
        elif strategy_name in ["Mean Reversion", "Supply/Demand"]:
            if "neutral" in bias.lower() or "ranging" in bias.lower():
                return "✅ Suitable - Ranging market favors this strategy."
            return "⚠️ Strategy works best in ranging markets. Current market is trending."
        
        else:
            return "✅ Monitor conditions and adjust position sizing based on risk level."
    
    def compare_strategies(self, strategy1: str, strategy2: str) -> Dict[str, Any]:
        """Compare two strategies."""
        info1 = self.strategy_database.get(strategy1)
        info2 = self.strategy_database.get(strategy2)
        
        if not info1 or not info2:
            return {"error": "One or both strategies not found"}
        
        return {
            "comparison": {
                strategy1: {
                    "best_for": info1["best_conditions"],
                    "difficulty": self._assess_difficulty(info1)
                },
                strategy2: {
                    "best_for": info2["best_conditions"],
                    "difficulty": self._assess_difficulty(info2)
                }
            },
            "recommendation": self._recommend_between(strategy1, strategy2, info1, info2)
        }
    
    def _assess_difficulty(self, info: Dict) -> str:
        """Assess strategy difficulty level."""
        if "beginner" in str(info).lower() or "simple" in info["description"].lower():
            return "Beginner"
        elif "advanced" in str(info).lower() or "complex" in info["description"].lower():
            return "Advanced"
        return "Intermediate"
    
    def _recommend_between(self, name1: str, name2: str, info1: Dict, info2: Dict) -> str:
        """Recommend between two strategies."""
        return f"Choose **{name1}** for {info1['best_conditions'].lower()}, or **{name2}** for {info2['best_conditions'].lower()}."
