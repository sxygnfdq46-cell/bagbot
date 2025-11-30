"""
News Anchor - Market context intelligence system.

This is DIFFERENT from the News Filter.
- News Filter: Protects bot during dangerous events
- News Anchor: Gives bot market context

Responsibilities:
- Summaries of macro events
- Morning briefings
- Daily bias (risk-on / risk-off)
- Fundamental grading (bullish-neutral-bearish)
- Feeds into Mindset Engine
- Feeds into Strategy Switcher
- Feeds into Risk Engine for position scaling

Sources:
- MarketWatch, Reuters, Investing.com
- Central bank updates
- FX outlooks
- Crypto ecosystem scans
"""

import logging
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime, time
from enum import Enum
from dataclasses import dataclass
import aiohttp

logger = logging.getLogger(__name__)


class MarketBias(Enum):
    """Overall market bias."""
    RISK_ON = "risk_on"          # Risk appetite high
    RISK_OFF = "risk_off"        # Flight to safety
    NEUTRAL = "neutral"          # Mixed signals
    UNCERTAIN = "uncertain"      # Unclear direction


class FundamentalGrade(Enum):
    """Fundamental outlook grade."""
    VERY_BEARISH = "very_bearish"  # -2
    BEARISH = "bearish"            # -1
    NEUTRAL = "neutral"            # 0
    BULLISH = "bullish"            # +1
    VERY_BULLISH = "very_bullish"  # +2


@dataclass
class MacroEvent:
    """Macro market event."""
    title: str
    summary: str
    source: str
    timestamp: datetime
    market_impact: MarketBias
    affected_assets: List[str]
    sentiment_score: float  # -1.0 to 1.0


@dataclass
class DailyBriefing:
    """Morning market briefing."""
    date: datetime
    overall_bias: MarketBias
    fundamental_grade: FundamentalGrade
    key_events: List[MacroEvent]
    risk_factors: List[str]
    opportunities: List[str]
    central_bank_summary: str
    crypto_sentiment: str
    forex_outlook: str
    summary: str


class NewsAnchor:
    """
    Market context intelligence system.
    
    Provides the bot with awareness of:
    - What's happening in markets
    - Why assets are moving
    - What to expect today
    - Where risk/opportunity lies
    
    Integrates with:
    - Mindset Engine (emotional calibration)
    - Strategy Switcher (strategy selection)
    - Risk Engine (position sizing adjustment)
    """
    
    def __init__(self):
        """Initialize news anchor."""
        self.current_briefing: Optional[DailyBriefing] = None
        self.macro_events: List[MacroEvent] = []
        self.last_briefing_time: Optional[datetime] = None
        
        # Sentiment tracking
        self.sentiment_history: List[float] = []
        self.bias_history: List[MarketBias] = []
        
        # News sources
        self.sources: Dict[str, Dict[str, Any]] = {}
        
        logger.info("📰 NewsAnchor initialized")
    
    async def generate_morning_briefing(self) -> DailyBriefing:
        """
        Generate morning market briefing.
        
        Returns:
            Daily briefing
        """
        logger.info("📋 Generating morning briefing...")
        
        # Fetch latest events
        await self._update_macro_events()
        
        # Analyze overall market bias
        overall_bias = self._calculate_market_bias()
        
        # Grade fundamental outlook
        fundamental_grade = self._grade_fundamentals()
        
        # Extract key events (top 5)
        key_events = sorted(
            self.macro_events,
            key=lambda e: abs(e.sentiment_score),
            reverse=True
        )[:5]
        
        # Identify risk factors
        risk_factors = self._identify_risk_factors()
        
        # Identify opportunities
        opportunities = self._identify_opportunities()
        
        # Generate summaries
        central_bank_summary = self._summarize_central_banks()
        crypto_sentiment = self._summarize_crypto()
        forex_outlook = self._summarize_forex()
        
        # Create overall summary
        summary = self._create_briefing_summary(
            overall_bias,
            fundamental_grade,
            key_events
        )
        
        briefing = DailyBriefing(
            date=datetime.now(),
            overall_bias=overall_bias,
            fundamental_grade=fundamental_grade,
            key_events=key_events,
            risk_factors=risk_factors,
            opportunities=opportunities,
            central_bank_summary=central_bank_summary,
            crypto_sentiment=crypto_sentiment,
            forex_outlook=forex_outlook,
            summary=summary
        )
        
        self.current_briefing = briefing
        self.last_briefing_time = datetime.now()
        
        # Update history
        self.bias_history.append(overall_bias)
        if len(self.bias_history) > 30:  # Keep last 30 days
            self.bias_history.pop(0)
        
        logger.info(
            f"✅ Briefing complete: {overall_bias.value}, "
            f"Grade: {fundamental_grade.value}"
        )
        
        return briefing
    
    def get_market_context(self) -> Dict[str, Any]:
        """
        Get current market context for strategy decisions.
        
        Returns:
            Market context dict
        """
        if not self.current_briefing:
            return {
                "bias": MarketBias.NEUTRAL.value,
                "grade": FundamentalGrade.NEUTRAL.value,
                "sentiment": 0.0,
                "risk_level": 0.5
            }
        
        # Calculate current sentiment
        recent_sentiment = self._calculate_current_sentiment()
        
        # Calculate risk level
        risk_level = self._calculate_risk_level()
        
        return {
            "bias": self.current_briefing.overall_bias.value,
            "grade": self.current_briefing.fundamental_grade.value,
            "sentiment": recent_sentiment,
            "risk_level": risk_level,
            "risk_factors_count": len(self.current_briefing.risk_factors),
            "opportunities_count": len(self.current_briefing.opportunities),
            "key_events": [e.title for e in self.current_briefing.key_events]
        }
    
    def register_source(
        self,
        name: str,
        url: str,
        parser: callable,
        update_interval: int = 3600
    ) -> None:
        """
        Register a news source.
        
        Args:
            name: Source name
            url: API endpoint
            parser: Function to parse response
            update_interval: Update interval in seconds
        """
        self.sources[name] = {
            "url": url,
            "parser": parser,
            "update_interval": update_interval,
            "last_update": None
        }
        
        logger.info(f"✅ Registered source: {name}")
    
    async def _update_macro_events(self) -> None:
        """Fetch and update macro events from all sources."""
        for source_name, config in self.sources.items():
            try:
                # Check if update needed
                if config["last_update"]:
                    elapsed = (datetime.now() - config["last_update"]).total_seconds()
                    if elapsed < config["update_interval"]:
                        continue
                
                # Fetch data
                async with aiohttp.ClientSession() as session:
                    async with session.get(config["url"], timeout=10) as response:
                        if response.status == 200:
                            data = await response.json()
                            
                            # Parse events
                            events = config["parser"](data)
                            
                            # Add to events list
                            self.macro_events.extend(events)
                            
                            # Keep only recent events (last 7 days)
                            cutoff = datetime.now() - timedelta(days=7)
                            self.macro_events = [
                                e for e in self.macro_events
                                if e.timestamp > cutoff
                            ]
                            
                            config["last_update"] = datetime.now()
                            
                            logger.debug(f"✅ Updated {source_name}: {len(events)} events")
            
            except Exception as e:
                logger.error(f"Failed to update {source_name}: {e}")
    
    def _calculate_market_bias(self) -> MarketBias:
        """
        Calculate overall market bias from recent events.
        
        Returns:
            Market bias
        """
        if not self.macro_events:
            return MarketBias.NEUTRAL
        
        # Calculate average sentiment from recent events
        recent_events = [
            e for e in self.macro_events
            if (datetime.now() - e.timestamp).days <= 1
        ]
        
        if not recent_events:
            return MarketBias.NEUTRAL
        
        avg_sentiment = sum(e.sentiment_score for e in recent_events) / len(recent_events)
        
        # Determine bias
        if avg_sentiment > 0.3:
            return MarketBias.RISK_ON
        elif avg_sentiment < -0.3:
            return MarketBias.RISK_OFF
        elif abs(avg_sentiment) < 0.1:
            return MarketBias.NEUTRAL
        else:
            return MarketBias.UNCERTAIN
    
    def _grade_fundamentals(self) -> FundamentalGrade:
        """
        Grade fundamental outlook.
        
        Returns:
            Fundamental grade
        """
        # Calculate weighted sentiment
        total_weight = 0
        weighted_sentiment = 0
        
        for event in self.macro_events:
            # Recent events have more weight
            days_ago = (datetime.now() - event.timestamp).days
            weight = max(0.1, 1.0 - (days_ago / 7.0))
            
            weighted_sentiment += event.sentiment_score * weight
            total_weight += weight
        
        if total_weight == 0:
            return FundamentalGrade.NEUTRAL
        
        avg_sentiment = weighted_sentiment / total_weight
        
        # Grade based on sentiment
        if avg_sentiment > 0.5:
            return FundamentalGrade.VERY_BULLISH
        elif avg_sentiment > 0.2:
            return FundamentalGrade.BULLISH
        elif avg_sentiment < -0.5:
            return FundamentalGrade.VERY_BEARISH
        elif avg_sentiment < -0.2:
            return FundamentalGrade.BEARISH
        else:
            return FundamentalGrade.NEUTRAL
    
    def _identify_risk_factors(self) -> List[str]:
        """Identify current risk factors."""
        risk_factors = []
        
        # Check for risk-off events
        risk_off_events = [
            e for e in self.macro_events
            if e.market_impact == MarketBias.RISK_OFF
            and (datetime.now() - e.timestamp).days <= 2
        ]
        
        for event in risk_off_events[:3]:
            risk_factors.append(f"{event.title} ({event.source})")
        
        # Check for high volatility warnings
        if len([e for e in self.macro_events if abs(e.sentiment_score) > 0.7]) > 3:
            risk_factors.append("High market volatility detected")
        
        return risk_factors
    
    def _identify_opportunities(self) -> List[str]:
        """Identify current opportunities."""
        opportunities = []
        
        # Check for risk-on events
        risk_on_events = [
            e for e in self.macro_events
            if e.market_impact == MarketBias.RISK_ON
            and (datetime.now() - e.timestamp).days <= 2
        ]
        
        for event in risk_on_events[:3]:
            opportunities.append(f"{event.title} ({', '.join(event.affected_assets)})")
        
        return opportunities
    
    def _summarize_central_banks(self) -> str:
        """Summarize central bank activity."""
        cb_events = [
            e for e in self.macro_events
            if any(cb in e.title.upper() for cb in ["FED", "ECB", "BOE", "BOJ", "FOMC"])
        ]
        
        if not cb_events:
            return "No major central bank updates"
        
        return f"{len(cb_events)} central bank updates in last 7 days"
    
    def _summarize_crypto(self) -> str:
        """Summarize crypto market sentiment."""
        crypto_events = [
            e for e in self.macro_events
            if "CRYPTO" in [a.upper() for a in e.affected_assets]
        ]
        
        if not crypto_events:
            return "Neutral crypto sentiment"
        
        avg_sentiment = sum(e.sentiment_score for e in crypto_events) / len(crypto_events)
        
        if avg_sentiment > 0.3:
            return "Bullish crypto sentiment"
        elif avg_sentiment < -0.3:
            return "Bearish crypto sentiment"
        else:
            return "Mixed crypto sentiment"
    
    def _summarize_forex(self) -> str:
        """Summarize forex market outlook."""
        forex_events = [
            e for e in self.macro_events
            if any(pair in [a.upper() for a in e.affected_assets] for pair in ["USD", "EUR", "GBP"])
        ]
        
        if not forex_events:
            return "Stable forex conditions"
        
        return f"{len(forex_events)} forex-relevant events"
    
    def _create_briefing_summary(
        self,
        bias: MarketBias,
        grade: FundamentalGrade,
        key_events: List[MacroEvent]
    ) -> str:
        """Create human-readable briefing summary."""
        summary_parts = []
        
        # Overall bias
        summary_parts.append(f"Market Bias: {bias.value.replace('_', ' ').title()}")
        
        # Fundamental grade
        summary_parts.append(f"Fundamental Outlook: {grade.value.replace('_', ' ').title()}")
        
        # Key events
        if key_events:
            summary_parts.append(f"Top Event: {key_events[0].title}")
        
        return " | ".join(summary_parts)
    
    def _calculate_current_sentiment(self) -> float:
        """Calculate current market sentiment."""
        recent = [
            e.sentiment_score for e in self.macro_events
            if (datetime.now() - e.timestamp).hours <= 24
        ]
        
        if not recent:
            return 0.0
        
        return sum(recent) / len(recent)
    
    def _calculate_risk_level(self) -> float:
        """
        Calculate current risk level (0.0 to 1.0).
        
        Returns:
            Risk level
        """
        if not self.current_briefing:
            return 0.5
        
        # Base risk on bias
        if self.current_briefing.overall_bias == MarketBias.RISK_OFF:
            base_risk = 0.8
        elif self.current_briefing.overall_bias == MarketBias.RISK_ON:
            base_risk = 0.2
        elif self.current_briefing.overall_bias == MarketBias.UNCERTAIN:
            base_risk = 0.6
        else:
            base_risk = 0.4
        
        # Adjust for risk factors
        risk_factor_penalty = len(self.current_briefing.risk_factors) * 0.1
        
        return min(1.0, base_risk + risk_factor_penalty)
    
    def get_status(self) -> Dict[str, Any]:
        """Get news anchor status."""
        return {
            "last_briefing": self.last_briefing_time.isoformat() if self.last_briefing_time else None,
            "current_bias": self.current_briefing.overall_bias.value if self.current_briefing else None,
            "macro_events_count": len(self.macro_events),
            "sources_count": len(self.sources),
            "current_sentiment": self._calculate_current_sentiment(),
            "risk_level": self._calculate_risk_level()
        }


# Example parser functions

def parse_marketwatch(data: Dict[str, Any]) -> List[MacroEvent]:
    """Parse MarketWatch API response."""
    events = []
    
    for item in data.get("articles", []):
        # Determine sentiment from headline
        sentiment = 0.0
        headline = item.get("headline", "").upper()
        
        if any(word in headline for word in ["RALLY", "SURGE", "GAINS", "UP"]):
            sentiment = 0.5
        elif any(word in headline for word in ["FALL", "DROP", "DECLINE", "DOWN"]):
            sentiment = -0.5
        
        event = MacroEvent(
            title=item.get("headline", ""),
            summary=item.get("summary", ""),
            source="MarketWatch",
            timestamp=datetime.fromisoformat(item.get("published_date", datetime.now().isoformat())),
            market_impact=MarketBias.RISK_ON if sentiment > 0 else MarketBias.RISK_OFF,
            affected_assets=["STOCKS", "CRYPTO"],
            sentiment_score=sentiment
        )
        events.append(event)
    
    return events


def parse_reuters(data: Dict[str, Any]) -> List[MacroEvent]:
    """Parse Reuters API response."""
    events = []
    
    # Similar parsing logic
    # Placeholder implementation
    
    return events
