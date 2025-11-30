"""
STEP 24.68 — Orbital Intelligence Ring (OIR)

High-altitude supervisory intelligence layer that watches all engines,
detects cross-system threats, resolves conflicts, and prevents catastrophic actions.

This system provides:
- Cross-system anomaly detection across all execution engines
- Subsystem contradiction identification and resolution
- Orbital threat level calculation with multi-factor analysis
- Emergency override protocols for systemic instability
- High-altitude decision supervision and validation
- Global health monitoring across all engine components

CRITICAL: Supreme oversight layer above all execution systems
Final safety net that can override any decision to prevent catastrophic failures
Compatible with Master Execution Governor and all intelligence systems
"""

import logging
import time
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from collections import defaultdict
import statistics
import math

logger = logging.getLogger(__name__)


class ThreatLevel(Enum):
    """Orbital threat level classifications"""
    MINIMAL = "minimal"          # < 0.25
    LOW = "low"                  # 0.25 - 0.50
    MODERATE = "moderate"        # 0.50 - 0.70
    HIGH = "high"                # 0.70 - 0.85
    CRITICAL = "critical"        # >= 0.85


class OverrideReason(Enum):
    """Reasons for orbital override"""
    VOLATILITY_SHOCK = "volatility_shock"
    LIQUIDITY_COLLAPSE = "liquidity_collapse"
    SYSTEM_CONTRADICTION = "system_contradiction"
    SUBSYSTEM_CONFLICT = "subsystem_conflict"
    HESITATION_DETECTED = "hesitation_detected"
    GLOBAL_STRESS = "global_stress"
    SYSTEMIC_INSTABILITY = "systemic_instability"


@dataclass
class EngineHealthMap:
    """Health status tracking for all engines"""
    engine_status: Dict[str, float] = field(default_factory=dict)
    last_update: float = field(default_factory=time.time)
    health_threshold: float = 0.7
    
    def update_engine(self, engine_name: str, health_score: float):
        """Update health score for specific engine"""
        self.engine_status[engine_name] = health_score
        self.last_update = time.time()
    
    def get_overall_health(self) -> float:
        """Calculate overall system health"""
        if not self.engine_status:
            return 1.0
        return statistics.mean(self.engine_status.values())
    
    def get_unhealthy_engines(self) -> List[str]:
        """Get list of engines below health threshold"""
        return [
            name for name, health in self.engine_status.items()
            if health < self.health_threshold
        ]


@dataclass
class FusionDecision:
    """Decision output from fusion engine"""
    buy_score: float = 0.0
    sell_score: float = 0.0
    hold_score: float = 0.0
    action: str = "HOLD"
    confidence: float = 0.0
    reasoning: List[str] = field(default_factory=list)
    timestamp: float = field(default_factory=time.time)
    override: bool = False
    override_reason: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "buy_score": self.buy_score,
            "sell_score": self.sell_score,
            "hold_score": self.hold_score,
            "action": self.action,
            "confidence": self.confidence,
            "reasoning": self.reasoning,
            "timestamp": self.timestamp,
            "override": self.override,
            "override_reason": self.override_reason
        }


@dataclass
class GlobalRiskFeed:
    """Global risk metrics from all systems"""
    max_expected_volatility: float = 0.5
    min_liquidity_threshold: float = 1000000.0
    global_stress_index: float = 0.0
    market_regime: str = "NORMAL"
    system_load: float = 0.0
    active_threats: int = 0
    
    def calculate_stress_index(self) -> float:
        """Calculate overall stress index"""
        stress = 0.0
        stress += min(self.active_threats * 0.1, 0.3)
        stress += self.system_load * 0.4
        if self.market_regime == "VOLATILE":
            stress += 0.2
        elif self.market_regime == "CRISIS":
            stress += 0.5
        return min(1.0, stress)


@dataclass
class MarketStateFrame:
    """Current market state snapshot"""
    volatility: float = 0.0
    liquidity: float = 0.0
    price: float = 0.0
    volume: float = 0.0
    bid_ask_spread: float = 0.0
    market_depth: float = 0.0
    timestamp: float = field(default_factory=time.time)
    
    def is_healthy(self, risk_feed: GlobalRiskFeed) -> bool:
        """Check if market conditions are healthy"""
        return (
            self.volatility <= risk_feed.max_expected_volatility and
            self.liquidity >= risk_feed.min_liquidity_threshold
        )


@dataclass
class CrossSystemAnomalies:
    """Detected anomalies across systems"""
    volatility_shock: bool = False
    liquidity_collapse: bool = False
    contradiction_detected: bool = False
    anomaly_score: float = 0.0
    detected_at: float = field(default_factory=time.time)
    details: Dict[str, Any] = field(default_factory=dict)


@dataclass
class SubsystemContradictions:
    """Detected contradictions between subsystems"""
    buy_vs_sell_conflict: bool = False
    hesitation: bool = False
    confidence_mismatch: bool = False
    contradiction_score: float = 0.0
    detected_at: float = field(default_factory=time.time)
    details: Dict[str, Any] = field(default_factory=dict)


@dataclass
class OrbitalScanResult:
    """Result of orbital scan"""
    threat_level: float
    threat_classification: ThreatLevel
    anomalies: CrossSystemAnomalies
    contradictions: SubsystemContradictions
    override_triggered: bool
    final_decision: FusionDecision
    scan_timestamp: float = field(default_factory=time.time)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "threat_level": self.threat_level,
            "threat_classification": self.threat_classification.value,
            "anomalies": {
                "volatility_shock": self.anomalies.volatility_shock,
                "liquidity_collapse": self.anomalies.liquidity_collapse,
                "contradiction_detected": self.anomalies.contradiction_detected,
                "anomaly_score": self.anomalies.anomaly_score
            },
            "contradictions": {
                "buy_vs_sell_conflict": self.contradictions.buy_vs_sell_conflict,
                "hesitation": self.contradictions.hesitation,
                "confidence_mismatch": self.contradictions.confidence_mismatch,
                "contradiction_score": self.contradictions.contradiction_score
            },
            "override_triggered": self.override_triggered,
            "final_decision": self.final_decision.to_dict(),
            "scan_timestamp": self.scan_timestamp
        }


class OrbitalIntelligenceRing:
    """
    High-altitude supervisory intelligence layer
    
    Watches all engines, detects cross-system threats,
    resolves conflicts, prevents catastrophic actions.
    """
    
    def __init__(
        self,
        override_threshold: float = 0.85,
        volatility_weight: float = 0.4,
        liquidity_weight: float = 0.3,
        conflict_weight: float = 0.2,
        hesitation_weight: float = 0.1,
        stress_weight: float = 0.25
    ):
        """
        Initialize Orbital Intelligence Ring
        
        Args:
            override_threshold: Threat level that triggers override (default 0.85)
            volatility_weight: Weight for volatility shock in threat calculation
            liquidity_weight: Weight for liquidity collapse in threat calculation
            conflict_weight: Weight for buy/sell conflict in threat calculation
            hesitation_weight: Weight for decision hesitation in threat calculation
            stress_weight: Weight for global stress index in threat calculation
        """
        self.orbit_health = EngineHealthMap()
        self.last_decision: Optional[FusionDecision] = None
        self.override_threshold = override_threshold
        
        # Threat calculation weights
        self.volatility_weight = volatility_weight
        self.liquidity_weight = liquidity_weight
        self.conflict_weight = conflict_weight
        self.hesitation_weight = hesitation_weight
        self.stress_weight = stress_weight
        
        # Historical tracking
        self.scan_history: List[OrbitalScanResult] = []
        self.override_count = 0
        self.total_scans = 0
        
        # Statistics
        self.stats = {
            "total_scans": 0,
            "overrides_triggered": 0,
            "volatility_shocks": 0,
            "liquidity_collapses": 0,
            "conflicts_detected": 0,
            "hesitations_detected": 0,
            "avg_threat_level": 0.0
        }
        
        logger.info("Orbital Intelligence Ring initialized")
    
    # ====== MAIN ORBITAL LOOP ======
    
    def scan_orbit(
        self,
        market: MarketStateFrame,
        fused_decision: FusionDecision,
        risk_feed: GlobalRiskFeed
    ) -> FusionDecision:
        """
        Main orbital scan loop
        
        Analyzes market state, decision, and risk feed to detect threats
        and determine if override is needed.
        
        Args:
            market: Current market state snapshot
            fused_decision: Decision from fusion engine
            risk_feed: Global risk metrics
            
        Returns:
            FusionDecision: Original or overridden decision
        """
        self.total_scans += 1
        self.stats["total_scans"] += 1
        self.last_decision = fused_decision
        
        # Detect anomalies and contradictions
        anomalies = self._detect_cross_system_anomalies(
            market, fused_decision, risk_feed
        )
        contradictions = self._detect_subsystem_contradictions(fused_decision)
        
        # Calculate overall threat level
        threat_level = self._calculate_orbital_threat_level(
            anomalies, contradictions, risk_feed
        )
        
        # Update statistics
        self.stats["avg_threat_level"] = (
            (self.stats["avg_threat_level"] * (self.total_scans - 1) + threat_level)
            / self.total_scans
        )
        
        # Classify threat level
        threat_classification = self._classify_threat_level(threat_level)
        
        # Determine if override needed
        override_triggered = threat_level >= self.override_threshold
        
        # Apply override if necessary
        if override_triggered:
            final_decision = self._initiate_orbital_override(
                fused_decision, threat_level, anomalies, contradictions
            )
            self.override_count += 1
            self.stats["overrides_triggered"] += 1
            logger.warning(
                f"Orbital override triggered: threat_level={threat_level:.3f}, "
                f"classification={threat_classification.value}"
            )
        else:
            final_decision = fused_decision
        
        # Create scan result
        scan_result = OrbitalScanResult(
            threat_level=threat_level,
            threat_classification=threat_classification,
            anomalies=anomalies,
            contradictions=contradictions,
            override_triggered=override_triggered,
            final_decision=final_decision
        )
        
        # Store in history (keep last 1000)
        self.scan_history.append(scan_result)
        if len(self.scan_history) > 1000:
            self.scan_history.pop(0)
        
        return final_decision
    
    # ====== HIGH-ALTITUDE DETECTIONS ======
    
    def _detect_cross_system_anomalies(
        self,
        market: MarketStateFrame,
        fused_decision: FusionDecision,
        risk_feed: GlobalRiskFeed
    ) -> CrossSystemAnomalies:
        """
        Detect anomalies across all systems
        
        Args:
            market: Market state
            fused_decision: Decision being evaluated
            risk_feed: Global risk metrics
            
        Returns:
            CrossSystemAnomalies: Detected anomalies
        """
        volatility_shock = market.volatility > risk_feed.max_expected_volatility
        liquidity_collapse = market.liquidity < risk_feed.min_liquidity_threshold
        
        # Calculate anomaly score
        anomaly_score = 0.0
        if volatility_shock:
            anomaly_score += 0.5
            self.stats["volatility_shocks"] += 1
        if liquidity_collapse:
            anomaly_score += 0.5
            self.stats["liquidity_collapses"] += 1
        
        # Additional anomaly checks
        contradiction_detected = False
        if market.bid_ask_spread > market.price * 0.01:  # 1% spread is anomalous
            contradiction_detected = True
            anomaly_score += 0.3
        
        details = {
            "market_volatility": market.volatility,
            "max_expected": risk_feed.max_expected_volatility,
            "market_liquidity": market.liquidity,
            "min_threshold": risk_feed.min_liquidity_threshold,
            "bid_ask_spread": market.bid_ask_spread
        }
        
        return CrossSystemAnomalies(
            volatility_shock=volatility_shock,
            liquidity_collapse=liquidity_collapse,
            contradiction_detected=contradiction_detected,
            anomaly_score=min(1.0, anomaly_score),
            details=details
        )
    
    def _detect_subsystem_contradictions(
        self,
        decision: FusionDecision
    ) -> SubsystemContradictions:
        """
        Detect contradictions between subsystems
        
        Args:
            decision: Decision to analyze
            
        Returns:
            SubsystemContradictions: Detected contradictions
        """
        # Check for buy vs sell conflict
        buy_vs_sell_conflict = (
            decision.buy_score > 0.8 and decision.sell_score > 0.8
        )
        
        # Check for hesitation (scores too close)
        hesitation = (
            abs(decision.buy_score - decision.sell_score) < 0.05
        )
        
        # Check for confidence mismatch
        confidence_mismatch = (
            decision.confidence < 0.3 and
            (decision.buy_score > 0.7 or decision.sell_score > 0.7)
        )
        
        # Calculate contradiction score
        contradiction_score = 0.0
        if buy_vs_sell_conflict:
            contradiction_score += 0.4
            self.stats["conflicts_detected"] += 1
        if hesitation:
            contradiction_score += 0.3
            self.stats["hesitations_detected"] += 1
        if confidence_mismatch:
            contradiction_score += 0.3
        
        details = {
            "buy_score": decision.buy_score,
            "sell_score": decision.sell_score,
            "hold_score": decision.hold_score,
            "confidence": decision.confidence,
            "score_difference": abs(decision.buy_score - decision.sell_score)
        }
        
        return SubsystemContradictions(
            buy_vs_sell_conflict=buy_vs_sell_conflict,
            hesitation=hesitation,
            confidence_mismatch=confidence_mismatch,
            contradiction_score=min(1.0, contradiction_score),
            details=details
        )
    
    # ====== THREAT CALCULATION ======
    
    def _calculate_orbital_threat_level(
        self,
        anomalies: CrossSystemAnomalies,
        contradictions: SubsystemContradictions,
        risk_feed: GlobalRiskFeed
    ) -> float:
        """
        Calculate overall orbital threat level
        
        Args:
            anomalies: Detected anomalies
            contradictions: Detected contradictions
            risk_feed: Global risk metrics
            
        Returns:
            float: Threat level between 0 and 1
        """
        score = 0.0
        
        # Add weighted anomaly factors
        if anomalies.volatility_shock:
            score += self.volatility_weight
        
        if anomalies.liquidity_collapse:
            score += self.liquidity_weight
        
        # Add weighted contradiction factors
        if contradictions.buy_vs_sell_conflict:
            score += self.conflict_weight
        
        if contradictions.hesitation:
            score += self.hesitation_weight
        
        # Add global stress component
        score += risk_feed.global_stress_index * self.stress_weight
        
        # Add engine health factor
        overall_health = self.orbit_health.get_overall_health()
        if overall_health < 0.7:
            score += (1.0 - overall_health) * 0.2
        
        return min(1.0, score)
    
    def _classify_threat_level(self, threat_level: float) -> ThreatLevel:
        """
        Classify threat level into categories
        
        Args:
            threat_level: Numeric threat level
            
        Returns:
            ThreatLevel: Classification
        """
        if threat_level >= 0.85:
            return ThreatLevel.CRITICAL
        elif threat_level >= 0.70:
            return ThreatLevel.HIGH
        elif threat_level >= 0.50:
            return ThreatLevel.MODERATE
        elif threat_level >= 0.25:
            return ThreatLevel.LOW
        else:
            return ThreatLevel.MINIMAL
    
    # ====== OVERRIDE PROTOCOL ======
    
    def _initiate_orbital_override(
        self,
        decision: FusionDecision,
        threat_level: float,
        anomalies: CrossSystemAnomalies,
        contradictions: SubsystemContradictions
    ) -> FusionDecision:
        """
        Initiate orbital override of decision
        
        Args:
            decision: Original decision
            threat_level: Calculated threat level
            anomalies: Detected anomalies
            contradictions: Detected contradictions
            
        Returns:
            FusionDecision: Overridden decision (forced to HOLD)
        """
        # Determine primary override reason
        reasons = []
        if anomalies.volatility_shock:
            reasons.append(OverrideReason.VOLATILITY_SHOCK.value)
        if anomalies.liquidity_collapse:
            reasons.append(OverrideReason.LIQUIDITY_COLLAPSE.value)
        if contradictions.buy_vs_sell_conflict:
            reasons.append(OverrideReason.SUBSYSTEM_CONFLICT.value)
        if contradictions.hesitation:
            reasons.append(OverrideReason.HESITATION_DETECTED.value)
        
        if not reasons:
            reasons.append(OverrideReason.SYSTEMIC_INSTABILITY.value)
        
        override_reason = (
            f"Orbital Intelligence Ring override (threat={threat_level:.3f}): "
            f"{', '.join(reasons)}"
        )
        
        # Create overridden decision
        overridden_decision = FusionDecision(
            buy_score=0.0,
            sell_score=0.0,
            hold_score=1.0,
            action="HOLD",
            confidence=0.95,  # High confidence in override
            reasoning=[
                override_reason,
                f"Anomaly score: {anomalies.anomaly_score:.3f}",
                f"Contradiction score: {contradictions.contradiction_score:.3f}",
                "Original decision overridden for system safety"
            ],
            timestamp=time.time(),
            override=True,
            override_reason=override_reason
        )
        
        logger.warning(
            f"Orbital override executed: {override_reason}"
        )
        
        return overridden_decision
    
    # ====== UTILITY METHODS ======
    
    def update_engine_health(self, engine_name: str, health_score: float):
        """Update health score for specific engine"""
        self.orbit_health.update_engine(engine_name, health_score)
    
    def get_system_health(self) -> Dict[str, Any]:
        """Get overall system health report"""
        return {
            "overall_health": self.orbit_health.get_overall_health(),
            "unhealthy_engines": self.orbit_health.get_unhealthy_engines(),
            "engine_status": self.orbit_health.engine_status,
            "last_update": self.orbit_health.last_update
        }
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get orbital statistics"""
        override_rate = (
            self.stats["overrides_triggered"] / self.stats["total_scans"]
            if self.stats["total_scans"] > 0 else 0.0
        )
        
        return {
            **self.stats,
            "override_rate": override_rate,
            "recent_threat_levels": [
                s.threat_level for s in self.scan_history[-10:]
            ] if self.scan_history else []
        }
    
    def get_recent_scans(self, count: int = 10) -> List[Dict[str, Any]]:
        """Get recent scan results"""
        return [
            scan.to_dict()
            for scan in self.scan_history[-count:]
        ]
    
    def reset_statistics(self):
        """Reset all statistics"""
        self.stats = {
            "total_scans": 0,
            "overrides_triggered": 0,
            "volatility_shocks": 0,
            "liquidity_collapses": 0,
            "conflicts_detected": 0,
            "hesitations_detected": 0,
            "avg_threat_level": 0.0
        }
        self.scan_history.clear()
        self.override_count = 0
        self.total_scans = 0
        logger.info("Orbital statistics reset")


# Singleton instance
_orbital_intelligence_ring: Optional[OrbitalIntelligenceRing] = None


def get_orbital_intelligence_ring() -> OrbitalIntelligenceRing:
    """Get singleton instance of Orbital Intelligence Ring"""
    global _orbital_intelligence_ring
    if _orbital_intelligence_ring is None:
        _orbital_intelligence_ring = OrbitalIntelligenceRing()
    return _orbital_intelligence_ring


def create_orbital_intelligence_ring(**kwargs) -> OrbitalIntelligenceRing:
    """Create new instance with custom configuration"""
    return OrbitalIntelligenceRing(**kwargs)
