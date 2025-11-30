"""
Regime Transition Intelligence Orb - Advanced Market Regime Detection
Advanced Trading Intelligence System - Step 24.53+

This orb detects market regime transitions using multi-timeframe analysis,
volatility patterns, liquidity dynamics, and advanced correlation metrics.
Provides advisory-only outputs with no trade execution modifications.
"""

import asyncio
import logging
import time
import numpy as np
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from collections import deque, defaultdict
import json
import math

# Import for vault integration
from ..core.EvolutionMemoryVault import get_evolution_memory_vault, EvolutionRecord, EvolutionEventType

logger = logging.getLogger(__name__)


class RegimeState(Enum):
    """Market regime states for transition detection"""
    STABLE = "stable"
    TRENDING = "trending"
    REVERSAL = "reversal"
    VOLATILITY_EXPLOSION = "volatility_explosion"
    VOLATILITY_DECAY = "volatility_decay"
    CHAOTIC = "chaotic"
    TRANSITION = "transition"
    UNKNOWN = "unknown"


@dataclass
class RegimeOrbOutput:
    """Output model for regime transition intelligence"""
    state: RegimeState
    confidence: float  # 0-1
    transition_risk: float  # 0-1
    notes: List[str] = field(default_factory=list)
    timestamp: float = field(default_factory=time.time)
    analytics: Dict[str, Any] = field(default_factory=dict)
    previous_state: Optional[RegimeState] = None
    transition_probability: float = 0.0


@dataclass
class RegimeAnalytics:
    """Analytics data for regime detection"""
    volatility_slope: float = 0.0
    atr_signals: Dict[str, float] = field(default_factory=dict)  # multi-timeframe ATR
    liquidity_delta_patterns: List[float] = field(default_factory=list)
    trend_acceleration: float = 0.0
    trend_deceleration: float = 0.0
    volume_anomalies: List[float] = field(default_factory=list)
    correlation_breaks: Dict[str, float] = field(default_factory=dict)
    shield_threat_index: float = 0.0
    prediction_horizon_curvature: float = 0.0
    timestamp: float = field(default_factory=time.time)


@dataclass
class RegimeTransition:
    """Record of regime transitions"""
    from_state: RegimeState
    to_state: RegimeState
    confidence: float
    trigger_factors: List[str]
    timestamp: float
    duration_in_previous: float  # seconds
    analytics_snapshot: RegimeAnalytics


class RegimeTransitionIntelligenceOrb:
    """
    Regime Transition Intelligence Orb - Advanced market regime detection system
    
    Features:
    - Multi-timeframe volatility analysis
    - Liquidity delta pattern recognition
    - Trend acceleration/deceleration detection
    - Volume anomaly identification
    - Correlation break monitoring
    - Shield threat index integration
    - Prediction horizon curvature analysis
    - Advisory-only outputs with safety measures
    - Evolution Memory Vault integration
    """
    
    def __init__(self, 
                 analysis_window: int = 100,
                 transition_threshold: float = 0.7,
                 confidence_threshold: float = 0.6):
        
        # Configuration
        self.analysis_window = analysis_window
        self.transition_threshold = transition_threshold
        self.confidence_threshold = confidence_threshold
        
        # State tracking
        self.current_regime: RegimeState = RegimeState.UNKNOWN
        self.previous_regime: Optional[RegimeState] = None
        self.regime_start_time: float = time.time()
        self.last_analysis_time: float = 0.0
        
        # Data storage
        self.analytics_history: deque = deque(maxlen=analysis_window)
        self.regime_history: deque = deque(maxlen=50)  # Last 50 regime states
        self.transition_history: List[RegimeTransition] = []
        
        # Pattern recognition
        self.volatility_patterns: Dict[str, deque] = defaultdict(lambda: deque(maxlen=20))
        self.liquidity_patterns: deque = deque(maxlen=30)
        self.correlation_matrix: Dict[str, float] = {}
        self.anomaly_scores: deque = deque(maxlen=50)
        
        # Thresholds and parameters
        self.volatility_explosion_threshold = 2.5  # Standard deviations
        self.volatility_decay_threshold = 0.3
        self.trend_strength_threshold = 0.6
        self.correlation_break_threshold = 0.4
        self.chaos_threshold = 0.8
        
        # External system references
        self.evolution_memory_vault = None
        
        # Statistics
        self.total_analyses = 0
        self.regime_changes = 0
        self.alert_count = 0
        
        # Safety flags
        self.is_read_only = True  # Enforce advisory-only mode
        self.non_blocking = True
    
    async def initialize(self) -> None:
        """Initialize the Regime Transition Intelligence Orb"""
        logger.info("Initializing Regime Transition Intelligence Orb...")
        
        # Record startup time
        self.startup_time = time.time()
        
        try:
            # Connect to Evolution Memory Vault
            self.evolution_memory_vault = get_evolution_memory_vault()
            
            # Load historical regime data if available
            await self._load_historical_patterns()
            
            logger.info("Regime Transition Intelligence Orb initialized successfully")
            
        except Exception as error:
            logger.error(f"Failed to initialize Regime Transition Intelligence Orb: {error}")
            raise error
    
    async def detect_regime_shift(self, data: Dict[str, Any]) -> RegimeOrbOutput:
        """
        Detect regime shifts from input data
        """
        try:
            self.total_analyses += 1
            current_time = time.time()
            
            # Parse input data into analytics
            analytics = await self._parse_input_data(data)
            self.analytics_history.append(analytics)
            
            # Classify current regime
            new_regime = await self.classify_regime(analytics)
            
            # Compute transition probability
            transition_prob = await self.compute_transition_probability(new_regime, self.current_regime)
            
            # Check for regime transition
            transition_detected = False
            if new_regime != self.current_regime and transition_prob > self.transition_threshold:
                await self._handle_regime_transition(new_regime, analytics, transition_prob)
                transition_detected = True
            
            # Calculate confidence
            confidence = await self._calculate_confidence(analytics, new_regime)
            
            # Calculate transition risk
            transition_risk = await self._calculate_transition_risk(analytics)
            
            # Generate notes
            notes = await self._generate_analysis_notes(analytics, new_regime, transition_detected)
            
            # Create output
            output = RegimeOrbOutput(
                state=new_regime,
                confidence=confidence,
                transition_risk=transition_risk,
                notes=notes,
                timestamp=current_time,
                analytics={
                    "volatility_slope": analytics.volatility_slope,
                    "trend_acceleration": analytics.trend_acceleration,
                    "shield_threat_index": analytics.shield_threat_index,
                    "liquidity_patterns_count": len(analytics.liquidity_delta_patterns),
                    "volume_anomalies_count": len(analytics.volume_anomalies),
                    "correlation_breaks_count": len(analytics.correlation_breaks)
                },
                previous_state=self.previous_regime,
                transition_probability=transition_prob
            )
            
            # Update current regime if transition occurred
            if transition_detected:
                self.previous_regime = self.current_regime
                self.current_regime = new_regime
                self.regime_start_time = current_time
                self.regime_changes += 1
            
            self.last_analysis_time = current_time
            
            # Sync with Evolution Memory Vault (non-blocking)
            if transition_detected:
                asyncio.create_task(self.sync_with_evolution_memory_vault(output))
            
            return output
            
        except Exception as error:
            logger.error(f"Error detecting regime shift: {error}")
            return RegimeOrbOutput(
                state=RegimeState.UNKNOWN,
                confidence=0.0,
                transition_risk=1.0,
                notes=[f"Analysis error: {str(error)}"],
                timestamp=time.time()
            )
    
    async def classify_regime(self, analytics: RegimeAnalytics) -> RegimeState:
        """
        Classify market regime based on analytics
        """
        try:
            # Calculate regime scores
            scores = {
                RegimeState.STABLE: await self._score_stable_regime(analytics),
                RegimeState.TRENDING: await self._score_trending_regime(analytics),
                RegimeState.REVERSAL: await self._score_reversal_regime(analytics),
                RegimeState.VOLATILITY_EXPLOSION: await self._score_volatility_explosion(analytics),
                RegimeState.VOLATILITY_DECAY: await self._score_volatility_decay(analytics),
                RegimeState.CHAOTIC: await self._score_chaotic_regime(analytics),
                RegimeState.TRANSITION: await self._score_transition_regime(analytics)
            }
            
            # Find regime with highest score
            max_regime = max(scores, key=scores.get)
            max_score = scores[max_regime]
            
            # Require minimum confidence threshold
            if max_score < self.confidence_threshold:
                return RegimeState.UNKNOWN
            
            return max_regime
            
        except Exception as error:
            logger.error(f"Error classifying regime: {error}")
            return RegimeState.UNKNOWN
    
    async def compute_transition_probability(self, current: RegimeState, previous: RegimeState) -> float:
        """
        Compute probability of transition between regime states
        """
        try:
            # If same regime, low transition probability
            if current == previous:
                return 0.1
            
            # Historical transition matrix (simplified)
            transition_matrix = {
                (RegimeState.STABLE, RegimeState.TRENDING): 0.6,
                (RegimeState.STABLE, RegimeState.VOLATILITY_EXPLOSION): 0.8,
                (RegimeState.TRENDING, RegimeState.REVERSAL): 0.7,
                (RegimeState.TRENDING, RegimeState.STABLE): 0.5,
                (RegimeState.REVERSAL, RegimeState.TRENDING): 0.6,
                (RegimeState.REVERSAL, RegimeState.CHAOTIC): 0.7,
                (RegimeState.VOLATILITY_EXPLOSION, RegimeState.CHAOTIC): 0.8,
                (RegimeState.VOLATILITY_EXPLOSION, RegimeState.VOLATILITY_DECAY): 0.6,
                (RegimeState.VOLATILITY_DECAY, RegimeState.STABLE): 0.7,
                (RegimeState.CHAOTIC, RegimeState.TRANSITION): 0.8,
                (RegimeState.TRANSITION, RegimeState.STABLE): 0.6,
                (RegimeState.UNKNOWN, current): 0.5  # Any transition from unknown
            }
            
            # Get base probability
            base_prob = transition_matrix.get((previous, current), 0.3)
            
            # Adjust based on recent analytics
            if len(self.analytics_history) > 0:
                latest = self.analytics_history[-1]
                
                # Increase probability if strong signals present
                if abs(latest.volatility_slope) > 1.5:
                    base_prob += 0.2
                
                if latest.shield_threat_index > 0.7:
                    base_prob += 0.15
                
                if len(latest.correlation_breaks) > 2:
                    base_prob += 0.1
                
                if abs(latest.trend_acceleration) > 1.0:
                    base_prob += 0.1
            
            return min(1.0, max(0.0, base_prob))
            
        except Exception as error:
            logger.error(f"Error computing transition probability: {error}")
            return 0.5  # Default moderate probability
    
    async def generate_regime_alert(self, output: RegimeOrbOutput) -> Dict[str, Any]:
        """
        Generate regime transition alert
        """
        try:
            self.alert_count += 1
            
            alert = {
                "alert_id": f"regime_alert_{int(time.time())}",
                "timestamp": output.timestamp,
                "regime_state": output.state.value,
                "previous_state": output.previous_state.value if output.previous_state else None,
                "confidence": output.confidence,
                "transition_risk": output.transition_risk,
                "transition_probability": output.transition_probability,
                "severity": await self._calculate_alert_severity(output),
                "notes": output.notes,
                "analytics_summary": output.analytics,
                "recommendations": await self._generate_recommendations(output)
            }
            
            logger.info(f"Generated regime alert: {output.state.value} (confidence: {output.confidence:.2f})")
            return alert
            
        except Exception as error:
            logger.error(f"Error generating regime alert: {error}")
            return {"error": str(error)}
    
    async def sync_with_evolution_memory_vault(self, output: RegimeOrbOutput) -> bool:
        """
        Sync regime transition data with Evolution Memory Vault (non-blocking)
        """
        try:
            if not self.evolution_memory_vault or not output.previous_state:
                return False
            
            # Create evolution record
            record = EvolutionRecord(
                timestamp=output.timestamp,
                module="regime_transition_orb",
                event_type=EvolutionEventType.MARKET_REGIME_TRANSITION,
                previous_state={
                    "regime": output.previous_state.value,
                    "start_time": self.regime_start_time
                },
                new_state={
                    "regime": output.state.value,
                    "confidence": output.confidence,
                    "transition_risk": output.transition_risk
                },
                reason=f"Regime transition from {output.previous_state.value} to {output.state.value}",
                metrics={
                    "transition_probability": output.transition_probability,
                    "analytics": output.analytics,
                    "duration_in_previous": output.timestamp - self.regime_start_time
                },
                success=True,
                correlation_id=f"regime_transition_{int(output.timestamp)}"
            )
            
            # Save to vault (non-blocking)
            success = await self.evolution_memory_vault.save_evolution_record(record)
            
            if success:
                logger.debug(f"Synced regime transition to vault: {output.state.value}")
            
            return success
            
        except Exception as error:
            logger.error(f"Error syncing with evolution memory vault: {error}")
            return False
    
    def get_orb_statistics(self) -> Dict[str, Any]:
        """Get regime orb statistics"""
        current_time = time.time()
        uptime = current_time - (self.regime_start_time if hasattr(self, 'regime_start_time') else current_time)
        
        return {
            "total_analyses": self.total_analyses,
            "regime_changes": self.regime_changes,
            "alert_count": self.alert_count,
            "current_regime": self.current_regime.value,
            "time_in_current_regime": current_time - self.regime_start_time,
            "regime_history_size": len(self.regime_history),
            "analytics_history_size": len(self.analytics_history),
            "last_analysis": self.last_analysis_time,
            "is_read_only": self.is_read_only,
            "uptime": uptime
        }
    
    async def _parse_input_data(self, data: Dict[str, Any]) -> RegimeAnalytics:
        """Parse input data into RegimeAnalytics structure"""
        analytics = RegimeAnalytics()
        
        # Extract core inputs
        analytics.volatility_slope = data.get("volatility_slope", 0.0)
        analytics.atr_signals = data.get("atr_signals", {})
        analytics.liquidity_delta_patterns = data.get("liquidity_delta_patterns", [])
        analytics.trend_acceleration = data.get("trend_acceleration", 0.0)
        analytics.trend_deceleration = data.get("trend_deceleration", 0.0)
        analytics.volume_anomalies = data.get("volume_anomalies", [])
        analytics.correlation_breaks = data.get("correlation_breaks", {})
        analytics.shield_threat_index = data.get("shield_threat_index", 0.0)
        analytics.prediction_horizon_curvature = data.get("prediction_horizon_curvature", 0.0)
        analytics.timestamp = time.time()
        
        return analytics
    
    async def _handle_regime_transition(self, new_regime: RegimeState, analytics: RegimeAnalytics, transition_prob: float) -> None:
        """Handle regime transition event"""
        try:
            duration_in_previous = time.time() - self.regime_start_time
            
            # Identify trigger factors
            trigger_factors = []
            if abs(analytics.volatility_slope) > 1.0:
                trigger_factors.append("volatility_slope")
            if analytics.shield_threat_index > 0.6:
                trigger_factors.append("shield_threat")
            if len(analytics.correlation_breaks) > 1:
                trigger_factors.append("correlation_breaks")
            if abs(analytics.trend_acceleration) > 0.8:
                trigger_factors.append("trend_acceleration")
            if len(analytics.volume_anomalies) > 2:
                trigger_factors.append("volume_anomalies")
            
            # Create transition record
            transition = RegimeTransition(
                from_state=self.current_regime,
                to_state=new_regime,
                confidence=transition_prob,
                trigger_factors=trigger_factors,
                timestamp=analytics.timestamp,
                duration_in_previous=duration_in_previous,
                analytics_snapshot=analytics
            )
            
            self.transition_history.append(transition)
            
            # Keep only last 100 transitions
            if len(self.transition_history) > 100:
                self.transition_history = self.transition_history[-100:]
            
            logger.info(f"Regime transition: {self.current_regime.value} -> {new_regime.value} "
                       f"(confidence: {transition_prob:.2f}, triggers: {trigger_factors})")
            
        except Exception as error:
            logger.error(f"Error handling regime transition: {error}")
    
    async def _calculate_confidence(self, analytics: RegimeAnalytics, regime: RegimeState) -> float:
        """Calculate confidence score for regime classification"""
        try:
            confidence = 0.5  # Base confidence
            
            # Adjust based on data quality and consistency
            if len(self.analytics_history) >= 5:
                # Check consistency with recent history
                recent_regimes = [self.current_regime] * 5  # Simplified
                consistency = sum(1 for r in recent_regimes if r == regime) / len(recent_regimes)
                confidence += consistency * 0.3
            
            # Adjust based on signal strength
            signal_strength = (
                min(1.0, abs(analytics.volatility_slope) / 2.0) * 0.2 +
                min(1.0, abs(analytics.trend_acceleration) / 1.5) * 0.15 +
                min(1.0, analytics.shield_threat_index) * 0.15
            )
            confidence += signal_strength
            
            return min(1.0, max(0.0, confidence))
            
        except Exception as error:
            logger.error(f"Error calculating confidence: {error}")
            return 0.5
    
    async def _calculate_transition_risk(self, analytics: RegimeAnalytics) -> float:
        """Calculate risk of regime transition"""
        risk = 0.0
        
        # Risk factors
        if abs(analytics.volatility_slope) > 1.5:
            risk += 0.3
        if analytics.shield_threat_index > 0.7:
            risk += 0.25
        if len(analytics.correlation_breaks) > 2:
            risk += 0.2
        if len(analytics.volume_anomalies) > 3:
            risk += 0.15
        if abs(analytics.prediction_horizon_curvature) > 1.0:
            risk += 0.1
        
        return min(1.0, risk)
    
    async def _generate_analysis_notes(self, analytics: RegimeAnalytics, regime: RegimeState, transition_detected: bool) -> List[str]:
        """Generate analysis notes"""
        notes = []
        
        if transition_detected:
            notes.append(f"Regime transition detected to {regime.value}")
        
        if abs(analytics.volatility_slope) > 1.0:
            notes.append(f"High volatility slope: {analytics.volatility_slope:.2f}")
        
        if analytics.shield_threat_index > 0.6:
            notes.append(f"Elevated threat index: {analytics.shield_threat_index:.2f}")
        
        if len(analytics.correlation_breaks) > 1:
            notes.append(f"Multiple correlation breaks detected: {len(analytics.correlation_breaks)}")
        
        if abs(analytics.trend_acceleration) > 0.8:
            notes.append(f"Strong trend acceleration: {analytics.trend_acceleration:.2f}")
        
        if len(analytics.volume_anomalies) > 2:
            notes.append(f"Volume anomalies present: {len(analytics.volume_anomalies)}")
        
        return notes
    
    async def _score_stable_regime(self, analytics: RegimeAnalytics) -> float:
        """Score stable regime probability"""
        score = 0.5
        
        # Low volatility slope indicates stability
        score += max(0, (1.0 - abs(analytics.volatility_slope))) * 0.3
        
        # Low threat index
        score += max(0, (1.0 - analytics.shield_threat_index)) * 0.2
        
        # Few correlation breaks
        score += max(0, (1.0 - len(analytics.correlation_breaks) / 5.0)) * 0.2
        
        # Low trend acceleration
        score += max(0, (1.0 - abs(analytics.trend_acceleration))) * 0.3
        
        return min(1.0, score)
    
    async def _score_trending_regime(self, analytics: RegimeAnalytics) -> float:
        """Score trending regime probability"""
        score = 0.2
        
        # Strong trend acceleration
        score += min(1.0, abs(analytics.trend_acceleration)) * 0.4
        
        # Moderate volatility
        score += min(1.0, abs(analytics.volatility_slope) / 2.0) * 0.3
        
        # Low correlation breaks (trending markets often have consistent correlations)
        score += max(0, (1.0 - len(analytics.correlation_breaks) / 3.0)) * 0.3
        
        return min(1.0, score)
    
    async def _score_reversal_regime(self, analytics: RegimeAnalytics) -> float:
        """Score reversal regime probability"""
        score = 0.1
        
        # High trend deceleration
        score += min(1.0, analytics.trend_deceleration) * 0.4
        
        # Negative trend acceleration (deceleration)
        if analytics.trend_acceleration < 0:
            score += min(1.0, abs(analytics.trend_acceleration)) * 0.3
        
        # Correlation breaks (regime change indicator)
        score += min(1.0, len(analytics.correlation_breaks) / 3.0) * 0.3
        
        return min(1.0, score)
    
    async def _score_volatility_explosion(self, analytics: RegimeAnalytics) -> float:
        """Score volatility explosion probability"""
        score = 0.1
        
        # High positive volatility slope
        if analytics.volatility_slope > self.volatility_explosion_threshold:
            score += 0.5
        
        # High threat index
        score += min(1.0, analytics.shield_threat_index) * 0.3
        
        # Volume anomalies
        score += min(1.0, len(analytics.volume_anomalies) / 5.0) * 0.2
        
        return min(1.0, score)
    
    async def _score_volatility_decay(self, analytics: RegimeAnalytics) -> float:
        """Score volatility decay probability"""
        score = 0.1
        
        # Negative volatility slope
        if analytics.volatility_slope < -self.volatility_decay_threshold:
            score += 0.5
        
        # Low threat index
        score += max(0, (1.0 - analytics.shield_threat_index)) * 0.3
        
        # Low trend acceleration
        score += max(0, (1.0 - abs(analytics.trend_acceleration))) * 0.2
        
        return min(1.0, score)
    
    async def _score_chaotic_regime(self, analytics: RegimeAnalytics) -> float:
        """Score chaotic regime probability"""
        score = 0.1
        
        # Multiple correlation breaks
        score += min(1.0, len(analytics.correlation_breaks) / 3.0) * 0.3
        
        # High volume anomalies
        score += min(1.0, len(analytics.volume_anomalies) / 4.0) * 0.3
        
        # High prediction horizon curvature
        score += min(1.0, abs(analytics.prediction_horizon_curvature)) * 0.2
        
        # High threat index
        score += min(1.0, analytics.shield_threat_index) * 0.2
        
        return min(1.0, score)
    
    async def _score_transition_regime(self, analytics: RegimeAnalytics) -> float:
        """Score transition regime probability"""
        score = 0.1
        
        # Moderate volatility slope (in transition)
        if 0.5 < abs(analytics.volatility_slope) < 1.5:
            score += 0.3
        
        # Some correlation breaks
        if 1 <= len(analytics.correlation_breaks) <= 2:
            score += 0.3
        
        # Moderate trend changes
        if 0.3 < abs(analytics.trend_acceleration) < 0.8:
            score += 0.4
        
        return min(1.0, score)
    
    async def _calculate_alert_severity(self, output: RegimeOrbOutput) -> str:
        """Calculate alert severity"""
        if output.transition_risk > 0.8:
            return "critical"
        elif output.transition_risk > 0.6:
            return "high"
        elif output.transition_risk > 0.4:
            return "medium"
        else:
            return "low"
    
    async def _generate_recommendations(self, output: RegimeOrbOutput) -> List[str]:
        """Generate recommendations based on regime"""
        recommendations = []
        
        if output.state == RegimeState.VOLATILITY_EXPLOSION:
            recommendations.append("Consider reducing position sizes")
            recommendations.append("Increase monitoring frequency")
            recommendations.append("Review stop-loss levels")
        
        elif output.state == RegimeState.TRENDING:
            recommendations.append("Trend-following strategies may be effective")
            recommendations.append("Monitor for trend exhaustion signals")
        
        elif output.state == RegimeState.REVERSAL:
            recommendations.append("Consider contrarian strategies")
            recommendations.append("Watch for reversal confirmation")
        
        elif output.state == RegimeState.CHAOTIC:
            recommendations.append("Reduce exposure during chaotic periods")
            recommendations.append("Focus on defensive strategies")
        
        elif output.state == RegimeState.STABLE:
            recommendations.append("Range-bound strategies may be effective")
            recommendations.append("Monitor for breakout signals")
        
        return recommendations
    
    async def _load_historical_patterns(self) -> None:
        """Load historical patterns from vault"""
        try:
            # This would load historical regime data in a real implementation
            logger.debug("Loading historical regime patterns...")
            
        except Exception as error:
            logger.warning(f"Could not load historical patterns: {error}")
    
    async def analyze_regime(self, data: Optional[Dict[str, Any]] = None) -> RegimeOrbOutput:
        """
        High-level API: Analyze current market regime with mock data if none provided
        """
        if data is None:
            # Generate mock market data for analysis when none provided
            import random
            data = {
                "prices": [100 + random.gauss(0, 2) for _ in range(100)],
                "volumes": [1000 + random.gauss(0, 200) for _ in range(100)],
                "timestamp": time.time(),
                "symbol": "MOCK"
            }
        
        return await self.detect_regime_shift(data)
    
    async def get_current_regime(self) -> Dict[str, Any]:
        """
        High-level API: Get current regime state information
        """
        if not self.regime_history:
            # Return default state if no history
            return {
                "regime": RegimeState.UNKNOWN.value,
                "confidence": 0.0,
                "last_updated": time.time(),
                "duration": 0,
                "transition_count": 0
            }
        
        latest = self.regime_history[-1]
        return {
            "regime": latest.state.value,
            "confidence": latest.confidence,
            "last_updated": latest.timestamp,
            "duration": time.time() - latest.timestamp,
            "transition_count": len(self.transition_history)
        }
    
    async def get_regime_history(self, days: int = 30) -> List[Dict[str, Any]]:
        """
        High-level API: Get regime transition history for specified days
        """
        cutoff_time = time.time() - (days * 24 * 60 * 60)
        
        recent_history = [
            {
                "regime": output.state.value,
                "confidence": output.confidence,
                "timestamp": output.timestamp,
                "transition_risk": output.transition_risk,
                "previous_regime": output.previous_state.value if output.previous_state else None,
                "transition_probability": output.transition_probability,
                "notes": output.notes
            }
            for output in self.regime_history
            if output.timestamp >= cutoff_time
        ]
        
        return recent_history
    
    async def generate_regime_alerts(self) -> List[Dict[str, Any]]:
        """
        High-level API: Generate current regime alerts and warnings
        """
        alerts = []
        
        # Check for recent regime changes
        if len(self.regime_history) >= 2:
            latest = self.regime_history[-1]
            previous = self.regime_history[-2]
            
            if latest.state != previous.state:
                alert = await self.generate_regime_alert(latest)
                alerts.append(alert)
        
        # Check for high transition risk
        if self.regime_history:
            latest = self.regime_history[-1]
            if latest.transition_risk > 0.7:
                alerts.append({
                    "type": "HIGH_TRANSITION_RISK",
                    "severity": "WARNING",
                    "message": f"High transition risk detected: {latest.transition_risk:.1%}",
                    "timestamp": time.time(),
                    "current_regime": latest.state.value,
                    "confidence": latest.confidence
                })
        
        # Check for volatility extremes
        if self.regime_history:
            latest = self.regime_history[-1]
            if latest.state in [RegimeState.VOLATILITY_EXPLOSION, RegimeState.CHAOTIC]:
                alerts.append({
                    "type": "VOLATILITY_EXTREME",
                    "severity": "CRITICAL",
                    "message": f"Extreme volatility regime detected: {latest.state.value}",
                    "timestamp": time.time(),
                    "confidence": latest.confidence,
                    "recommendations": await self._generate_recommendations(latest)
                })
        
        return alerts
    
    async def get_statistics(self) -> Dict[str, Any]:
        """
        High-level API: Get comprehensive regime analysis statistics
        """
        if not self.regime_history:
            return {
                "total_analyses": 0,
                "regime_distribution": {},
                "average_confidence": 0.0,
                "transition_frequency": 0.0,
                "uptime": time.time() - self.startup_time,
                "last_analysis": None
            }
        
        # Calculate regime distribution
        regime_counts = {}
        total_confidence = 0
        
        for output in self.regime_history:
            regime = output.state.value
            regime_counts[regime] = regime_counts.get(regime, 0) + 1
            total_confidence += output.confidence
        
        # Calculate transition frequency (transitions per hour)
        total_time = time.time() - self.startup_time
        transition_frequency = len(self.transition_history) / max(total_time / 3600, 1)
        
        return {
            "total_analyses": len(self.regime_history),
            "regime_distribution": regime_counts,
            "average_confidence": total_confidence / len(self.regime_history),
            "transition_frequency": transition_frequency,
            "total_transitions": len(self.transition_history),
            "uptime": total_time,
            "last_analysis": self.regime_history[-1].timestamp if self.regime_history else None,
            "memory_usage": {
                "regime_history_count": len(self.regime_history),
                "transition_history_count": len(self.transition_history),
                "analytics_history_count": len(self.analytics_history)
            }
        }

    async def shutdown(self) -> None:
        """Shutdown the regime orb"""
        logger.info("Shutting down Regime Transition Intelligence Orb...")
        
        # Clear data structures
        self.analytics_history.clear()
        self.regime_history.clear()
        self.transition_history.clear()
        
        logger.info("Regime Transition Intelligence Orb shutdown complete")


# Global instance
_regime_transition_orb: Optional[RegimeTransitionIntelligenceOrb] = None


def get_regime_transition_orb() -> RegimeTransitionIntelligenceOrb:
    """Get or create the global Regime Transition Intelligence Orb instance"""
    global _regime_transition_orb
    if _regime_transition_orb is None:
        _regime_transition_orb = RegimeTransitionIntelligenceOrb()
    return _regime_transition_orb


async def initialize_regime_orb() -> RegimeTransitionIntelligenceOrb:
    """Initialize and return the global Regime Transition Intelligence Orb instance"""
    orb = get_regime_transition_orb()
    await orb.initialize()
    return orb