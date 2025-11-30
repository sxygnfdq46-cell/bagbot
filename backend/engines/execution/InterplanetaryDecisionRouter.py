"""
STEP 24.69 — Interplanetary Decision Router (IDR)

Routes decisions through the safest, most intelligent path before final execution.
Prevents conflicts, execution loops, and high-risk cascades.

This system provides:
- Multi-stage decision validation and sanitization
- Orbital Intelligence Ring integration for high-level supervision
- Intelligent execution path routing based on decision type
- Conflict prevention and loop detection
- Safe mode routing for overridden decisions
- Execution path optimization based on market conditions

CRITICAL: Central routing authority for all trading decisions
Ensures all decisions pass through proper validation and safety checks
Compatible with Orbital Intelligence Ring and Master Execution Governor
"""

import logging
import time
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from collections import deque

from .OrbitalIntelligenceRing import (
    OrbitalIntelligenceRing,
    FusionDecision,
    MarketStateFrame,
    GlobalRiskFeed,
    get_orbital_intelligence_ring
)

logger = logging.getLogger(__name__)


class ExecutionPath(Enum):
    """Execution path types"""
    SAFE_MODE = "safe_mode"
    AGGRESSIVE_LONG_ROUTE = "aggressive_long_route"
    DEFENSIVE_SHORT_ROUTE = "defensive_short_route"
    NEUTRAL_ROUTE = "neutral_route"
    EMERGENCY_HALT = "emergency_halt"
    CONSERVATIVE_ROUTE = "conservative_route"
    BALANCED_ROUTE = "balanced_route"


class ValidationStatus(Enum):
    """Decision validation status"""
    VALID = "valid"
    INVALID = "invalid"
    CORRECTED = "corrected"
    REJECTED = "rejected"


@dataclass
class RoutedDecision(FusionDecision):
    """Extended fusion decision with routing information"""
    execution_path: str = "NEUTRAL_ROUTE"
    validation_status: str = "VALID"
    routing_timestamp: float = field(default_factory=time.time)
    routing_reason: str = ""
    path_confidence: float = 1.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        base_dict = super().to_dict()
        base_dict.update({
            "execution_path": self.execution_path,
            "validation_status": self.validation_status,
            "routing_timestamp": self.routing_timestamp,
            "routing_reason": self.routing_reason,
            "path_confidence": self.path_confidence
        })
        return base_dict


@dataclass
class RoutingStatistics:
    """Statistics for routing operations"""
    total_routes: int = 0
    safe_mode_routes: int = 0
    aggressive_routes: int = 0
    defensive_routes: int = 0
    neutral_routes: int = 0
    invalid_decisions: int = 0
    corrected_decisions: int = 0
    loop_preventions: int = 0
    conflict_preventions: int = 0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "total_routes": self.total_routes,
            "safe_mode_routes": self.safe_mode_routes,
            "aggressive_routes": self.aggressive_routes,
            "defensive_routes": self.defensive_routes,
            "neutral_routes": self.neutral_routes,
            "invalid_decisions": self.invalid_decisions,
            "corrected_decisions": self.corrected_decisions,
            "loop_preventions": self.loop_preventions,
            "conflict_preventions": self.conflict_preventions,
            "safe_mode_rate": (
                self.safe_mode_routes / self.total_routes
                if self.total_routes > 0 else 0.0
            )
        }


class InterplanetaryDecisionRouter:
    """
    Routes decisions through the safest, most intelligent path
    
    Integrates with Orbital Intelligence Ring for high-level supervision
    and determines optimal execution paths based on decision characteristics.
    """
    
    def __init__(
        self,
        orbital: Optional[OrbitalIntelligenceRing] = None,
        enable_loop_detection: bool = True,
        enable_conflict_prevention: bool = True,
        max_history_size: int = 100
    ):
        """
        Initialize Interplanetary Decision Router
        
        Args:
            orbital: Orbital Intelligence Ring instance (creates default if None)
            enable_loop_detection: Enable detection of decision loops
            enable_conflict_prevention: Enable conflict prevention
            max_history_size: Maximum number of decisions to keep in history
        """
        self.orbital = orbital if orbital else get_orbital_intelligence_ring()
        self.enable_loop_detection = enable_loop_detection
        self.enable_conflict_prevention = enable_conflict_prevention
        self.max_history_size = max_history_size
        
        # Decision history for loop detection
        self.decision_history: deque = deque(maxlen=max_history_size)
        
        # Statistics tracking
        self.stats = RoutingStatistics()
        
        # Conflict tracking
        self.recent_conflicts: List[Dict[str, Any]] = []
        
        logger.info("Interplanetary Decision Router initialized")
    
    # ====== MAIN ROUTING FLOW ======
    
    def route_decision(
        self,
        decision: FusionDecision,
        market: MarketStateFrame,
        risk_feed: GlobalRiskFeed
    ) -> RoutedDecision:
        """
        Route decision through validation and supervision pipeline
        
        Args:
            decision: Decision to route
            market: Current market state
            risk_feed: Global risk metrics
            
        Returns:
            RoutedDecision: Routed decision with execution path
        """
        self.stats.total_routes += 1
        
        # Step 1: Validate incoming decision
        validated, validation_status = self._validate_decision(decision)
        
        # Step 2: Check for loops if enabled
        if self.enable_loop_detection:
            validated = self._check_for_loops(validated)
        
        # Step 3: Check for conflicts if enabled
        if self.enable_conflict_prevention:
            validated = self._check_for_conflicts(validated, market)
        
        # Step 4: Send through Orbital Ring for high-level supervision
        orbital_checked = self.orbital.scan_orbit(market, validated, risk_feed)
        
        # Step 5: Resolve execution path
        routed = self._resolve_execution_path(orbital_checked, market, risk_feed)
        
        # Step 6: Add to history
        self.decision_history.append({
            "decision": routed.to_dict(),
            "timestamp": time.time(),
            "action": routed.action,
            "path": routed.execution_path
        })
        
        logger.info(
            f"Decision routed: action={routed.action}, "
            f"path={routed.execution_path}, "
            f"validation={validation_status.value}"
        )
        
        return routed
    
    # ====== VALIDATION ======
    
    def _validate_decision(
        self,
        decision: FusionDecision
    ) -> Tuple[FusionDecision, ValidationStatus]:
        """
        Validate incoming decision
        
        Args:
            decision: Decision to validate
            
        Returns:
            Tuple[FusionDecision, ValidationStatus]: Validated decision and status
        """
        # Check if action is present
        if not decision.action or decision.action.strip() == "":
            self.stats.invalid_decisions += 1
            self.stats.corrected_decisions += 1
            
            corrected = FusionDecision(
                buy_score=0.0,
                sell_score=0.0,
                hold_score=1.0,
                action="HOLD",
                confidence=0.5,
                reasoning=[
                    "Invalid decision — no action specified",
                    "Defaulted to HOLD for safety"
                ],
                timestamp=time.time(),
                override=False
            )
            
            logger.warning("Invalid decision detected — corrected to HOLD")
            return corrected, ValidationStatus.CORRECTED
        
        # Validate action is recognized
        valid_actions = ["BUY", "SELL", "HOLD", "CLOSE", "CANCEL"]
        if decision.action.upper() not in valid_actions:
            self.stats.invalid_decisions += 1
            self.stats.corrected_decisions += 1
            
            corrected = FusionDecision(
                buy_score=decision.buy_score,
                sell_score=decision.sell_score,
                hold_score=decision.hold_score,
                action="HOLD",
                confidence=decision.confidence * 0.5,
                reasoning=[
                    f"Invalid action '{decision.action}' — corrected to HOLD",
                    *decision.reasoning
                ],
                timestamp=time.time(),
                override=False
            )
            
            logger.warning(f"Invalid action '{decision.action}' — corrected to HOLD")
            return corrected, ValidationStatus.CORRECTED
        
        # Validate confidence is reasonable
        if decision.confidence < 0 or decision.confidence > 1:
            decision.confidence = max(0.0, min(1.0, decision.confidence))
            logger.warning(f"Confidence out of range — clipped to {decision.confidence}")
        
        # Validate scores are reasonable
        if decision.buy_score < 0 or decision.buy_score > 1:
            decision.buy_score = max(0.0, min(1.0, decision.buy_score))
        if decision.sell_score < 0 or decision.sell_score > 1:
            decision.sell_score = max(0.0, min(1.0, decision.sell_score))
        if decision.hold_score < 0 or decision.hold_score > 1:
            decision.hold_score = max(0.0, min(1.0, decision.hold_score))
        
        return decision, ValidationStatus.VALID
    
    # ====== LOOP DETECTION ======
    
    def _check_for_loops(self, decision: FusionDecision) -> FusionDecision:
        """
        Check for decision loops and prevent them
        
        Args:
            decision: Decision to check
            
        Returns:
            FusionDecision: Original or modified decision
        """
        if len(self.decision_history) < 3:
            return decision  # Not enough history to detect loops
        
        # Check last 5 decisions for repetitive pattern
        recent = list(self.decision_history)[-5:]
        actions = [d["action"] for d in recent]
        
        # Detect flip-flop pattern (BUY-SELL-BUY-SELL)
        if len(actions) >= 4:
            if (actions[-1] != actions[-2] and 
                actions[-2] != actions[-3] and
                actions[-3] != actions[-4] and
                actions[-1] == actions[-3]):
                
                self.stats.loop_preventions += 1
                
                logger.warning(
                    f"Decision loop detected: {actions[-4:]} — forcing HOLD"
                )
                
                return FusionDecision(
                    buy_score=0.0,
                    sell_score=0.0,
                    hold_score=1.0,
                    action="HOLD",
                    confidence=0.8,
                    reasoning=[
                        "Decision loop detected — flip-flop pattern prevented",
                        f"Recent actions: {actions[-4:]}",
                        "Forcing HOLD to break loop"
                    ],
                    timestamp=time.time(),
                    override=True,
                    override_reason="Loop prevention"
                )
        
        # Detect rapid-fire same action (5 identical actions in a row)
        if len(actions) >= 5 and all(a == actions[0] for a in actions):
            if decision.action == actions[0] and actions[0] in ["BUY", "SELL"]:
                self.stats.loop_preventions += 1
                
                logger.warning(
                    f"Rapid-fire pattern detected: 5x {actions[0]} — forcing HOLD"
                )
                
                return FusionDecision(
                    buy_score=0.0,
                    sell_score=0.0,
                    hold_score=1.0,
                    action="HOLD",
                    confidence=0.8,
                    reasoning=[
                        f"Rapid-fire {actions[0]} pattern detected",
                        "Cooling off period enforced",
                        "Forcing HOLD to prevent overtrading"
                    ],
                    timestamp=time.time(),
                    override=True,
                    override_reason="Rapid-fire prevention"
                )
        
        return decision
    
    # ====== CONFLICT PREVENTION ======
    
    def _check_for_conflicts(
        self,
        decision: FusionDecision,
        market: MarketStateFrame
    ) -> FusionDecision:
        """
        Check for conflicts with market conditions
        
        Args:
            decision: Decision to check
            market: Current market state
            
        Returns:
            FusionDecision: Original or modified decision
        """
        # Check for low liquidity conflicts
        if market.liquidity < 100000 and decision.action in ["BUY", "SELL"]:
            self.stats.conflict_preventions += 1
            
            conflict = {
                "type": "low_liquidity",
                "decision": decision.action,
                "liquidity": market.liquidity,
                "timestamp": time.time()
            }
            self.recent_conflicts.append(conflict)
            
            logger.warning(
                f"Low liquidity conflict: liquidity={market.liquidity:.2f}, "
                f"action={decision.action} — forcing HOLD"
            )
            
            return FusionDecision(
                buy_score=decision.buy_score,
                sell_score=decision.sell_score,
                hold_score=1.0,
                action="HOLD",
                confidence=decision.confidence * 0.7,
                reasoning=[
                    f"Low liquidity conflict detected: {market.liquidity:.2f}",
                    f"Original action {decision.action} prevented",
                    "Forcing HOLD until liquidity improves"
                ],
                timestamp=time.time(),
                override=True,
                override_reason="Low liquidity conflict"
            )
        
        # Check for extreme volatility conflicts
        if market.volatility > 0.8 and decision.action in ["BUY", "SELL"]:
            if decision.confidence < 0.9:  # Only allow high-confidence trades in high vol
                self.stats.conflict_preventions += 1
                
                conflict = {
                    "type": "high_volatility",
                    "decision": decision.action,
                    "volatility": market.volatility,
                    "confidence": decision.confidence,
                    "timestamp": time.time()
                }
                self.recent_conflicts.append(conflict)
                
                logger.warning(
                    f"High volatility conflict: vol={market.volatility:.2f}, "
                    f"confidence={decision.confidence:.2f} — forcing HOLD"
                )
                
                return FusionDecision(
                    buy_score=decision.buy_score,
                    sell_score=decision.sell_score,
                    hold_score=1.0,
                    action="HOLD",
                    confidence=decision.confidence,
                    reasoning=[
                        f"High volatility conflict: {market.volatility:.2f}",
                        f"Confidence {decision.confidence:.2f} too low for volatile conditions",
                        "Requires confidence > 0.9 in high volatility"
                    ],
                    timestamp=time.time(),
                    override=True,
                    override_reason="High volatility - insufficient confidence"
                )
        
        return decision
    
    # ====== PATH RESOLUTION ======
    
    def _resolve_execution_path(
        self,
        decision: FusionDecision,
        market: MarketStateFrame,
        risk_feed: GlobalRiskFeed
    ) -> RoutedDecision:
        """
        Resolve optimal execution path for decision
        
        Args:
            decision: Decision to route
            market: Market state
            risk_feed: Global risk metrics
            
        Returns:
            RoutedDecision: Decision with execution path assigned
        """
        # Check for override first
        if decision.override:
            self.stats.safe_mode_routes += 1
            return RoutedDecision(
                **decision.__dict__,
                execution_path=ExecutionPath.SAFE_MODE.value.upper(),
                validation_status=ValidationStatus.VALID.value,
                routing_timestamp=time.time(),
                routing_reason="Override detected — routing to safe mode",
                path_confidence=0.95
            )
        
        # Route based on action
        if decision.action == "BUY":
            # Determine aggression level
            if decision.confidence > 0.8 and market.volatility < 0.3:
                self.stats.aggressive_routes += 1
                path = ExecutionPath.AGGRESSIVE_LONG_ROUTE.value.upper()
                reason = "High confidence BUY in stable market"
                confidence = decision.confidence
            elif decision.confidence > 0.6:
                path = ExecutionPath.BALANCED_ROUTE.value.upper()
                reason = "Moderate confidence BUY"
                confidence = decision.confidence * 0.9
            else:
                path = ExecutionPath.CONSERVATIVE_ROUTE.value.upper()
                reason = "Low confidence BUY — conservative approach"
                confidence = decision.confidence * 0.8
            
            return RoutedDecision(
                **decision.__dict__,
                execution_path=path,
                validation_status=ValidationStatus.VALID.value,
                routing_timestamp=time.time(),
                routing_reason=reason,
                path_confidence=confidence
            )
        
        elif decision.action == "SELL":
            # Determine defensive level
            if decision.confidence > 0.8 and market.volatility < 0.3:
                self.stats.defensive_routes += 1
                path = ExecutionPath.DEFENSIVE_SHORT_ROUTE.value.upper()
                reason = "High confidence SELL in stable market"
                confidence = decision.confidence
            elif decision.confidence > 0.6:
                path = ExecutionPath.BALANCED_ROUTE.value.upper()
                reason = "Moderate confidence SELL"
                confidence = decision.confidence * 0.9
            else:
                path = ExecutionPath.CONSERVATIVE_ROUTE.value.upper()
                reason = "Low confidence SELL — conservative approach"
                confidence = decision.confidence * 0.8
            
            return RoutedDecision(
                **decision.__dict__,
                execution_path=path,
                validation_status=ValidationStatus.VALID.value,
                routing_timestamp=time.time(),
                routing_reason=reason,
                path_confidence=confidence
            )
        
        else:  # HOLD, CLOSE, CANCEL, or other
            self.stats.neutral_routes += 1
            return RoutedDecision(
                **decision.__dict__,
                execution_path=ExecutionPath.NEUTRAL_ROUTE.value.upper(),
                validation_status=ValidationStatus.VALID.value,
                routing_timestamp=time.time(),
                routing_reason=f"Neutral action: {decision.action}",
                path_confidence=decision.confidence
            )
    
    # ====== UTILITY METHODS ======
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get routing statistics"""
        return self.stats.to_dict()
    
    def get_decision_history(self, count: int = 10) -> List[Dict[str, Any]]:
        """Get recent decision history"""
        return list(self.decision_history)[-count:]
    
    def get_recent_conflicts(self, count: int = 5) -> List[Dict[str, Any]]:
        """Get recent conflicts"""
        return self.recent_conflicts[-count:]
    
    def clear_history(self):
        """Clear decision history"""
        self.decision_history.clear()
        logger.info("Decision history cleared")
    
    def reset_statistics(self):
        """Reset statistics"""
        self.stats = RoutingStatistics()
        self.recent_conflicts.clear()
        logger.info("Routing statistics reset")


# Singleton instance
_interplanetary_decision_router: Optional[InterplanetaryDecisionRouter] = None


def get_interplanetary_decision_router() -> InterplanetaryDecisionRouter:
    """Get singleton instance of Interplanetary Decision Router"""
    global _interplanetary_decision_router
    if _interplanetary_decision_router is None:
        _interplanetary_decision_router = InterplanetaryDecisionRouter()
    return _interplanetary_decision_router


def create_interplanetary_decision_router(**kwargs) -> InterplanetaryDecisionRouter:
    """Create new instance with custom configuration"""
    return InterplanetaryDecisionRouter(**kwargs)
