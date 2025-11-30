"""
News Filter - Smart Fundamental Shield

Prevents the bot from trading during dangerous news/market conditions.

Sources:
- ForexFactory API (economic calendar)
- Binance system status
- MT5 Economic Calendar
- TradingView webhook events
- Custom HTTP endpoints

Modes:
- Soft Filter: Reduce position size
- Hard Filter: Block new trades
- Kill Switch: Hard shutdown before extreme events (NFP, FOMC, etc.)
"""

import logging
import asyncio
from typing import Dict, Any, List, Optional, Set
from datetime import datetime, timedelta
from enum import Enum
from dataclasses import dataclass
import aiohttp

logger = logging.getLogger(__name__)


class NewsImpact(Enum):
    """News impact levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class FilterMode(Enum):
    """Filter response modes."""
    ALLOW = "allow"  # Normal trading
    SOFT_FILTER = "soft_filter"  # Reduce position size
    HARD_FILTER = "hard_filter"  # Block new trades
    KILL_SWITCH = "kill_switch"  # Emergency shutdown


@dataclass
class NewsEvent:
    """News event data."""
    source: str
    title: str
    impact: NewsImpact
    currency: str
    time: datetime
    actual: Optional[str] = None
    forecast: Optional[str] = None
    previous: Optional[str] = None
    metadata: Dict[str, Any] = None


@dataclass
class FilterDecision:
    """Filter decision result."""
    mode: FilterMode
    reason: str
    events: List[NewsEvent]
    safe_to_trade: bool
    position_size_multiplier: float = 1.0


class NewsFilter:
    """
    Smart fundamental shield for protecting against news volatility.
    
    Integrates with:
    - Risk Engine (position size reduction)
    - Mindset Engine (pause trading)
    - Strategy Router (override signals)
    - Admin panel (manual overrides)
    """
    
    # High-impact event keywords
    CRITICAL_EVENTS = {
        "NFP", "Non-Farm", "FOMC", "Federal Reserve", "Interest Rate",
        "CPI", "Inflation", "GDP", "Central Bank", "ECB", "BOE", "BOJ"
    }
    
    def __init__(self):
        """Initialize news filter."""
        self.active_events: List[NewsEvent] = []
        self.event_cache: Dict[str, NewsEvent] = {}
        self.manual_override = False
        self.override_until: Optional[datetime] = None
        
        # Source configurations
        self.sources: Dict[str, Dict[str, Any]] = {}
        
        # Crypto-specific volatility sources
        self.binance_status_url = "https://api.binance.com/api/v3/systemStatus"
        
        logger.info("🛡️  NewsFilter initialized")
    
    def register_source(
        self,
        name: str,
        url: str,
        parser: callable,
        check_interval: int = 60
    ) -> None:
        """
        Register a news source.
        
        Args:
            name: Source name
            url: API endpoint URL
            parser: Function to parse response
            check_interval: Check interval in seconds
        """
        self.sources[name] = {
            "url": url,
            "parser": parser,
            "check_interval": check_interval,
            "last_check": None
        }
        
        logger.info(f"✅ Registered news source: {name}")
    
    async def check_trading_conditions(
        self,
        symbols: List[str],
        current_time: Optional[datetime] = None
    ) -> FilterDecision:
        """
        Check if trading is safe based on news events.
        
        Args:
            symbols: Trading symbols to check
            current_time: Current time (for testing)
            
        Returns:
            FilterDecision with trading recommendation
        """
        if current_time is None:
            current_time = datetime.now()
        
        # Check manual override
        if self.manual_override:
            if self.override_until and current_time > self.override_until:
                self.manual_override = False
                logger.info("⏰ Manual override expired")
            else:
                return FilterDecision(
                    mode=FilterMode.KILL_SWITCH,
                    reason="Manual override active",
                    events=[],
                    safe_to_trade=False,
                    position_size_multiplier=0.0
                )
        
        # Fetch latest events
        await self._update_events()
        
        # Check for critical events in the next hour
        upcoming_critical = self._get_upcoming_events(
            current_time,
            timedelta(hours=1),
            NewsImpact.CRITICAL
        )
        
        if upcoming_critical:
            logger.warning(
                f"🚨 {len(upcoming_critical)} critical events in next hour"
            )
            return FilterDecision(
                mode=FilterMode.KILL_SWITCH,
                reason=f"Critical events approaching: {[e.title for e in upcoming_critical]}",
                events=upcoming_critical,
                safe_to_trade=False,
                position_size_multiplier=0.0
            )
        
        # Check for high-impact events in next 30 minutes
        upcoming_high = self._get_upcoming_events(
            current_time,
            timedelta(minutes=30),
            NewsImpact.HIGH
        )
        
        if upcoming_high:
            logger.warning(
                f"⚠️  {len(upcoming_high)} high-impact events in next 30 min"
            )
            return FilterDecision(
                mode=FilterMode.HARD_FILTER,
                reason=f"High-impact events approaching: {[e.title for e in upcoming_high]}",
                events=upcoming_high,
                safe_to_trade=False,
                position_size_multiplier=0.0
            )
        
        # Check for medium-impact events in next 15 minutes
        upcoming_medium = self._get_upcoming_events(
            current_time,
            timedelta(minutes=15),
            NewsImpact.MEDIUM
        )
        
        if upcoming_medium:
            logger.info(
                f"📰 {len(upcoming_medium)} medium-impact events in next 15 min"
            )
            return FilterDecision(
                mode=FilterMode.SOFT_FILTER,
                reason=f"Medium-impact events approaching: {[e.title for e in upcoming_medium]}",
                events=upcoming_medium,
                safe_to_trade=True,
                position_size_multiplier=0.5
            )
        
        # Check crypto-specific volatility warnings
        if any("crypto" in s.lower() or "usdt" in s.lower() for s in symbols):
            crypto_risk = await self._check_crypto_volatility()
            if crypto_risk > 0.7:
                return FilterDecision(
                    mode=FilterMode.SOFT_FILTER,
                    reason="High crypto market volatility detected",
                    events=[],
                    safe_to_trade=True,
                    position_size_multiplier=0.7
                )
        
        # All clear
        return FilterDecision(
            mode=FilterMode.ALLOW,
            reason="No significant events detected",
            events=[],
            safe_to_trade=True,
            position_size_multiplier=1.0
        )
    
    def detect_event_type(self, title: str) -> NewsImpact:
        """
        Detect event impact level from title.
        
        Args:
            title: Event title
            
        Returns:
            NewsImpact level
        """
        title_upper = title.upper()
        
        # Check for critical keywords
        for keyword in self.CRITICAL_EVENTS:
            if keyword in title_upper:
                return NewsImpact.CRITICAL
        
        # High impact indicators
        high_indicators = ["SPEECH", "DECISION", "ANNOUNCEMENT", "REPORT"]
        if any(ind in title_upper for ind in high_indicators):
            return NewsImpact.HIGH
        
        # Medium impact indicators
        medium_indicators = ["DATA", "INDEX", "SURVEY", "SALES"]
        if any(ind in title_upper for ind in medium_indicators):
            return NewsImpact.MEDIUM
        
        return NewsImpact.LOW
    
    def enable_manual_override(
        self,
        reason: str,
        duration_minutes: int = 60
    ) -> None:
        """
        Enable manual trading pause.
        
        Args:
            reason: Reason for override
            duration_minutes: Duration in minutes
        """
        self.manual_override = True
        self.override_until = datetime.now() + timedelta(minutes=duration_minutes)
        
        logger.warning(
            f"⏸️  Manual override enabled: {reason} "
            f"(until {self.override_until.strftime('%H:%M')})"
        )
    
    def disable_manual_override(self) -> None:
        """Disable manual override."""
        self.manual_override = False
        self.override_until = None
        
        logger.info("▶️  Manual override disabled")
    
    async def _update_events(self) -> None:
        """Fetch latest events from all sources."""
        for source_name, config in self.sources.items():
            try:
                # Check if we need to update
                if config["last_check"]:
                    elapsed = (datetime.now() - config["last_check"]).total_seconds()
                    if elapsed < config["check_interval"]:
                        continue
                
                # Fetch data
                async with aiohttp.ClientSession() as session:
                    async with session.get(config["url"], timeout=10) as response:
                        if response.status == 200:
                            data = await response.json()
                            
                            # Parse events
                            events = config["parser"](data)
                            
                            # Update cache
                            for event in events:
                                cache_key = f"{source_name}_{event.time.isoformat()}_{event.title}"
                                self.event_cache[cache_key] = event
                            
                            config["last_check"] = datetime.now()
                            
                            logger.debug(
                                f"✅ Updated {source_name}: {len(events)} events"
                            )
            
            except Exception as e:
                logger.error(f"Failed to update {source_name}: {e}")
        
        # Update active events list
        self.active_events = list(self.event_cache.values())
    
    def _get_upcoming_events(
        self,
        current_time: datetime,
        time_window: timedelta,
        min_impact: NewsImpact
    ) -> List[NewsEvent]:
        """
        Get upcoming events within time window.
        
        Args:
            current_time: Current time
            time_window: Time window to check
            min_impact: Minimum impact level
            
        Returns:
            List of upcoming events
        """
        upcoming = []
        end_time = current_time + time_window
        
        impact_levels = {
            NewsImpact.LOW: 0,
            NewsImpact.MEDIUM: 1,
            NewsImpact.HIGH: 2,
            NewsImpact.CRITICAL: 3
        }
        
        min_level = impact_levels[min_impact]
        
        for event in self.active_events:
            # Check if event is upcoming
            if current_time <= event.time <= end_time:
                # Check impact level
                event_level = impact_levels[event.impact]
                if event_level >= min_level:
                    upcoming.append(event)
        
        return upcoming
    
    async def _check_crypto_volatility(self) -> float:
        """
        Check crypto-specific volatility warnings.
        
        Returns:
            Risk score (0.0 to 1.0)
        """
        try:
            async with aiohttp.ClientSession() as session:
                # Check Binance system status
                async with session.get(self.binance_status_url, timeout=5) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        # Status: 0=normal, 1=maintenance
                        if data.get("status", 0) != 0:
                            logger.warning("⚠️  Binance maintenance detected")
                            return 0.8
                
                # Additional checks could go here:
                # - Check volatility index
                # - Check liquidation levels
                # - Check funding rates
            
            return 0.0
        
        except Exception as e:
            logger.error(f"Failed to check crypto volatility: {e}")
            return 0.5  # Assume moderate risk on error
    
    def get_status(self) -> Dict[str, Any]:
        """Get filter status."""
        return {
            "manual_override": self.manual_override,
            "override_until": self.override_until.isoformat() if self.override_until else None,
            "active_events_count": len(self.active_events),
            "sources_count": len(self.sources),
            "recent_events": [
                {
                    "title": e.title,
                    "impact": e.impact.value,
                    "time": e.time.isoformat(),
                    "currency": e.currency
                }
                for e in sorted(self.active_events, key=lambda x: x.time)[:5]
            ]
        }


# Example parsers for different sources

def parse_forexfactory_response(data: Dict[str, Any]) -> List[NewsEvent]:
    """Parse ForexFactory API response."""
    events = []
    
    # This would parse the actual ForexFactory format
    # Placeholder implementation
    for item in data.get("events", []):
        event = NewsEvent(
            source="ForexFactory",
            title=item.get("title", ""),
            impact=NewsImpact.HIGH,  # Would parse from data
            currency=item.get("currency", "USD"),
            time=datetime.fromisoformat(item.get("time")),
            actual=item.get("actual"),
            forecast=item.get("forecast"),
            previous=item.get("previous")
        )
        events.append(event)
    
    return events


def parse_tradingview_webhook(data: Dict[str, Any]) -> List[NewsEvent]:
    """Parse TradingView webhook data."""
    # TradingView custom webhook format
    event = NewsEvent(
        source="TradingView",
        title=data.get("alert_message", ""),
        impact=NewsImpact.MEDIUM,
        currency="CRYPTO",
        time=datetime.now(),
        metadata=data
    )
    
    return [event]


def parse_binance_announcements(data: Dict[str, Any]) -> List[NewsEvent]:
    """Parse Binance system announcements."""
    events = []
    
    for item in data.get("announcements", []):
        event = NewsEvent(
            source="Binance",
            title=item.get("title", ""),
            impact=NewsImpact.LOW,  # Would determine from content
            currency="CRYPTO",
            time=datetime.fromtimestamp(item.get("timestamp", 0) / 1000)
        )
        events.append(event)
    
    return events
