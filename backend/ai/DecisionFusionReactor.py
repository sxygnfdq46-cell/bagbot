"""
Decision Fusion Reactor - Ultimate Trading Decision Integration System
Advanced fusion engine that combines all intelligence layers into final trading decisions

This reactor integrates signals from:
- Quantum Confidence Engine (advanced confidence calculations)
- Multi-Layer Decision Spine (unified decision analysis)
- Threat Cluster Engine (threat pattern analysis)
- Regime Transition Intelligence Orb (market regime detection)
- Temporal Threat Memory Engine (historical threat patterns)
- Execution Survival Matrix (execution environment assessment)
- Prediction Horizon (future market forecasting)

CRITICAL: Final decision layer with comprehensive safety overrides
Compatible with TradingPipelineCore integration
"""

import asyncio
import logging
import time
import numpy as np
from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import json
import math
from collections import defaultdict, deque

# Import intelligence layers
from .QuantumConfidenceEngine import get_quantum_confidence_engine, QuantumConfidenceOutput
from .MultiLayerDecisionSpine import get_multi_layer_decision_spine, DecisionSpineOutput, RecommendedAction
from .RegimeTransitionIntelligenceOrb import get_regime_transition_orb, RegimeState
from ..core.EvolutionMemoryVault import get_evolution_memory_vault, EvolutionRecord, EvolutionEventType

logger = logging.getLogger(__name__)


class FinalDecision(Enum):
    """Final trading decisions from the reactor"""
    LONG = "LONG"
    SHORT = "SHORT"
    WAIT = "WAIT"


@dataclass
class ReactorMeta:
    """Metadata for reactor decision"""
    confidence: float = 0.0
    volatility_resistance: float = 0.0
    stability_score: float = 0.0
    threat_level: float = 0.0


@dataclass
class ReactorDecision:
    """Output model for Decision Fusion Reactor"""
    final_decision: FinalDecision
    decision_strength: float  # 0-100
    safety_override: bool
    reasons: List[str] = field(default_factory=list)
    meta: ReactorMeta = field(default_factory=ReactorMeta)
    timestamp: float = field(default_factory=time.time)
    
    # Additional reactor metrics
    fusion_components: Dict[str, float] = field(default_factory=dict)
    override_triggers: List[str] = field(default_factory=list)
    regime_support: float = 0.0
    threat_inversion_modifier: float = 0.0


class DecisionFusionReactor:
    """
    Decision Fusion Reactor - Ultimate trading decision integration system
    
    Fuses all intelligence layers into final trading decisions with comprehensive
    safety overrides and advanced decision strength calculations.
    """
    
    def __init__(self):
        """Initialize the Decision Fusion Reactor"""
        logger.info("Initializing Decision Fusion Reactor...")
        
        # Fusion formula weights
        self.fusion_weights = {
            "quantum_confidence": 0.40,
            "spine_signal_strength": 0.25,
            "regime_support": 0.20,
            "threat_inversion_modifier": 0.15
        }
        
        # Safety override thresholds
        self.safety_thresholds = {
            "max_threat_level": 80.0,
            "min_volatility_resistance": 25.0,
            "min_confidence": 0.3,
            "min_stability": 30.0
        }
        
        # Decision strength thresholds
        self.decision_thresholds = {
            "strong_signal": 65.0,
            "moderate_signal": 45.0,
            "min_confidence_for_action": 0.6
        }
        
        # Intelligence layer connections
        self.quantum_engine = None
        self.decision_spine = None
        self.regime_orb = None
        self.evolution_vault = None
        
        # Reactor state tracking
        self.decision_history = deque(maxlen=100)
        self.override_history = deque(maxlen=50)
        self.fusion_history = deque(maxlen=75)
        
        # Performance metrics
        self.total_decisions = 0
        self.override_count = 0
        self.fusion_accuracy = 0.0
        self.last_calibration = 0
        
        # Reactor safety state
        self.is_emergency_mode = False
        self.emergency_trigger_time = 0
        self.emergency_cooldown = 300  # 5 minutes
    
    async def initialize(self) -> None:
        """Initialize the Decision Fusion Reactor"""
        logger.info("Initializing Decision Fusion Reactor connections...")
        
        try:
            # Connect to intelligence layers
            self.quantum_engine = get_quantum_confidence_engine()
            self.decision_spine = get_multi_layer_decision_spine()
            self.regime_orb = get_regime_transition_orb()
            self.evolution_vault = get_evolution_memory_vault()
            
            # Initialize all connected systems
            if not hasattr(self.quantum_engine, 'is_calibrated'):
                await self.quantum_engine.initialize()
            
            if not hasattr(self.decision_spine, 'total_decisions'):
                await self.decision_spine.initialize()
                
            if not hasattr(self.regime_orb, 'startup_time'):
                await self.regime_orb.initialize()
            
            # Perform reactor calibration
            await self._calibrate_reactor()
            
            logger.info("Decision Fusion Reactor initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing Decision Fusion Reactor: {e}")
            raise
    
    async def fuse_spine_signals(self, market_data: Optional[Dict[str, Any]] = None) -> Dict[str, float]:
        """
        Fuse Multi-Layer Decision Spine signals
        
        Args:
            market_data: Optional market data for analysis
            
        Returns:
            Dict[str, float]: Fused spine signal metrics
        """
        spine_metrics = {
            "signal_strength": 50.0,
            "confidence": 0.5,
            "conflicts": 0,
            "contributing_layers": 0
        }
        
        try:
            if self.decision_spine:
                spine_output = await self.decision_spine.compute_decision_spine(market_data)
                
                # Extract signal strength
                spine_metrics["signal_strength"] = spine_output.score
                spine_metrics["confidence"] = spine_output.confidence
                spine_metrics["conflicts"] = len(spine_output.conflicts_detected)
                spine_metrics["contributing_layers"] = len(spine_output.contributing_layers)
                
                logger.debug(f"Spine fusion: strength={spine_output.score:.1f}, confidence={spine_output.confidence:.2f}")
            
        except Exception as e:
            logger.warning(f"Error fusing spine signals: {e}")
        
        return spine_metrics
    
    async def fuse_quantum_confidence(self, market_data: Optional[Dict[str, Any]] = None) -> Dict[str, float]:
        """
        Fuse Quantum Confidence Engine outputs
        
        Args:
            market_data: Optional market data for analysis
            
        Returns:
            Dict[str, float]: Fused quantum confidence metrics
        """
        quantum_metrics = {
            "confidence": 0.5,
            "stability_score": 50.0,
            "volatility_resistance": 50.0,
            "coherence": 0.5,
            "uncertainty": 0.5
        }
        
        try:
            if self.quantum_engine:
                quantum_output = await self.quantum_engine.compute_quantum_confidence(market_data)
                
                quantum_metrics["confidence"] = quantum_output.confidence
                quantum_metrics["stability_score"] = quantum_output.stability_score
                quantum_metrics["volatility_resistance"] = quantum_output.volatility_resistance
                quantum_metrics["coherence"] = quantum_output.quantum_coherence
                quantum_metrics["uncertainty"] = quantum_output.uncertainty_principle
                
                logger.debug(f"Quantum fusion: confidence={quantum_output.confidence:.3f}, stability={quantum_output.stability_score:.1f}")
            
        except Exception as e:
            logger.warning(f"Error fusing quantum confidence: {e}")
        
        return quantum_metrics
    
    async def apply_threat_adjustments(self, market_data: Optional[Dict[str, Any]] = None) -> Dict[str, float]:
        """
        Apply threat-based adjustments to decision metrics
        
        Args:
            market_data: Optional market data for analysis
            
        Returns:
            Dict[str, float]: Threat adjustment metrics
        """
        threat_metrics = {
            "threat_level": 40.0,
            "cluster_intensity": 0.4,
            "temporal_persistence": 0.5,
            "inversion_modifier": 1.0
        }
        
        try:
            # Mock Threat Cluster Engine integration (ready for real implementation)
            threat_metrics["threat_level"] = await self._assess_threat_cluster_level(market_data)
            
            # Mock Temporal Threat Memory integration
            threat_metrics["temporal_persistence"] = await self._assess_temporal_threats(market_data)
            
            # Calculate threat inversion modifier
            base_threat = threat_metrics["threat_level"] / 100.0
            temporal_factor = threat_metrics["temporal_persistence"]
            
            # Invert high threats to reduce decision strength
            if base_threat > 0.6:
                threat_metrics["inversion_modifier"] = 1.0 - (base_threat * 0.5)
            elif base_threat < 0.3:
                threat_metrics["inversion_modifier"] = 1.0 + (0.3 - base_threat) * 0.3
            else:
                threat_metrics["inversion_modifier"] = 1.0
            
            # Apply temporal persistence adjustment
            threat_metrics["inversion_modifier"] *= (1.0 - temporal_factor * 0.2)
            
            logger.debug(f"Threat adjustment: level={threat_metrics['threat_level']:.1f}, modifier={threat_metrics['inversion_modifier']:.2f}")
            
        except Exception as e:
            logger.warning(f"Error applying threat adjustments: {e}")
        
        return threat_metrics
    
    async def apply_regime_transitions(self, market_data: Optional[Dict[str, Any]] = None) -> Dict[str, float]:
        """
        Apply regime transition analysis to decision
        
        Args:
            market_data: Optional market data for analysis
            
        Returns:
            Dict[str, float]: Regime transition metrics
        """
        regime_metrics = {
            "regime_support": 50.0,
            "transition_risk": 0.3,
            "regime_confidence": 0.5,
            "regime_conflict": False
        }
        
        try:
            if self.regime_orb:
                # Analyze current regime
                regime_analysis = await self.regime_orb.analyze_regime(market_data)
                current_regime = await self.regime_orb.get_current_regime()
                
                # Calculate regime support score
                regime_state = regime_analysis.state
                regime_confidence = regime_analysis.confidence
                transition_risk = regime_analysis.transition_risk
                
                # Convert regime state to support score
                regime_support_scores = {
                    RegimeState.STABLE: 85,
                    RegimeState.TRENDING: 90,
                    RegimeState.VOLATILITY_DECAY: 75,
                    RegimeState.REVERSAL: 40,
                    RegimeState.TRANSITION: 25,
                    RegimeState.VOLATILITY_EXPLOSION: 15,
                    RegimeState.CHAOTIC: 10,
                    RegimeState.UNKNOWN: 50
                }
                
                base_support = regime_support_scores.get(regime_state, 50)
                
                # Adjust support based on confidence and transition risk
                regime_metrics["regime_support"] = base_support * regime_confidence * (1.0 - transition_risk)
                regime_metrics["transition_risk"] = transition_risk
                regime_metrics["regime_confidence"] = regime_confidence
                
                # Detect regime conflicts
                if (regime_state in [RegimeState.TRANSITION, RegimeState.CHAOTIC] and 
                    transition_risk > 0.6):
                    regime_metrics["regime_conflict"] = True
                
                logger.debug(f"Regime fusion: support={regime_metrics['regime_support']:.1f}, conflict={regime_metrics['regime_conflict']}")
            
        except Exception as e:
            logger.warning(f"Error applying regime transitions: {e}")
        
        return regime_metrics
    
    async def compute_safety_override(self, quantum_metrics: Dict[str, float], 
                                    threat_metrics: Dict[str, float],
                                    regime_metrics: Dict[str, float]) -> Tuple[bool, List[str]]:
        """
        Compute safety override decision
        
        Args:
            quantum_metrics: Quantum confidence metrics
            threat_metrics: Threat analysis metrics
            regime_metrics: Regime analysis metrics
            
        Returns:
            Tuple[bool, List[str]]: Override decision and trigger reasons
        """
        override = False
        triggers = []
        
        try:
            # Check threat level override
            if threat_metrics["threat_level"] > self.safety_thresholds["max_threat_level"]:
                override = True
                triggers.append(f"Threat level too high: {threat_metrics['threat_level']:.1f} > {self.safety_thresholds['max_threat_level']}")
            
            # Check volatility resistance override
            if quantum_metrics["volatility_resistance"] < self.safety_thresholds["min_volatility_resistance"]:
                override = True
                triggers.append(f"Volatility resistance too low: {quantum_metrics['volatility_resistance']:.1f} < {self.safety_thresholds['min_volatility_resistance']}")
            
            # Check confidence override
            if quantum_metrics["confidence"] < self.safety_thresholds["min_confidence"]:
                override = True
                triggers.append(f"Confidence too low: {quantum_metrics['confidence']:.2f} < {self.safety_thresholds['min_confidence']}")
            
            # Check stability override
            if quantum_metrics["stability_score"] < self.safety_thresholds["min_stability"]:
                override = True
                triggers.append(f"Stability too low: {quantum_metrics['stability_score']:.1f} < {self.safety_thresholds['min_stability']}")
            
            # Check regime conflict override
            if regime_metrics["regime_conflict"]:
                override = True
                triggers.append("Regime conflict detected")
            
            # Emergency mode check
            if self.is_emergency_mode:
                override = True
                triggers.append("Emergency mode active")
            
            # High uncertainty override
            if quantum_metrics.get("uncertainty", 0) > 0.7:
                override = True
                triggers.append(f"High uncertainty: {quantum_metrics['uncertainty']:.2f} > 0.7")
            
            if override:
                self.override_count += 1
                self.override_history.append(time.time())
                logger.info(f"Safety override triggered: {len(triggers)} conditions")
            
        except Exception as e:
            logger.error(f"Error computing safety override: {e}")
            override = True
            triggers.append("Safety override computation error")
        
        return override, triggers
    
    async def calculate_decision_strength(self, quantum_metrics: Dict[str, float],
                                        spine_metrics: Dict[str, float],
                                        regime_metrics: Dict[str, float],
                                        threat_metrics: Dict[str, float]) -> Dict[str, float]:
        """
        Calculate final decision strength using fusion formula
        
        Args:
            quantum_metrics: Quantum confidence metrics
            spine_metrics: Spine signal metrics
            regime_metrics: Regime analysis metrics
            threat_metrics: Threat adjustment metrics
            
        Returns:
            Dict[str, float]: Decision strength calculation results
        """
        try:
            # Extract components for fusion formula
            quantum_confidence = quantum_metrics["confidence"] * 100  # Convert to 0-100 scale
            spine_signal_strength = spine_metrics["signal_strength"]
            regime_support = regime_metrics["regime_support"]
            threat_inversion_modifier = threat_metrics["inversion_modifier"] * 100  # Convert to 0-100 scale
            
            # Apply Fusion Formula:
            # DecisionStrength = (0.40 * QuantumConfidence) + (0.25 * SpineSignalStrength) + 
            #                   (0.20 * RegimeSupport) + (0.15 * ThreatInversionModifier)
            
            decision_strength = (
                self.fusion_weights["quantum_confidence"] * quantum_confidence +
                self.fusion_weights["spine_signal_strength"] * spine_signal_strength +
                self.fusion_weights["regime_support"] * regime_support +
                self.fusion_weights["threat_inversion_modifier"] * threat_inversion_modifier
            )
            
            # Apply additional adjustments
            
            # Conflict penalty
            if spine_metrics["conflicts"] > 0:
                conflict_penalty = min(15, spine_metrics["conflicts"] * 5)
                decision_strength -= conflict_penalty
            
            # Coherence boost
            if quantum_metrics.get("coherence", 0) > 0.7:
                coherence_boost = quantum_metrics["coherence"] * 10
                decision_strength += coherence_boost
            
            # Clamp to valid range
            decision_strength = max(0.0, min(100.0, decision_strength))
            
            calculation_results = {
                "decision_strength": decision_strength,
                "quantum_contribution": self.fusion_weights["quantum_confidence"] * quantum_confidence,
                "spine_contribution": self.fusion_weights["spine_signal_strength"] * spine_signal_strength,
                "regime_contribution": self.fusion_weights["regime_support"] * regime_support,
                "threat_contribution": self.fusion_weights["threat_inversion_modifier"] * threat_inversion_modifier
            }
            
            logger.debug(f"Decision strength: {decision_strength:.1f} (Q:{quantum_confidence:.0f}, S:{spine_signal_strength:.0f}, R:{regime_support:.0f}, T:{threat_inversion_modifier:.0f})")
            
            return calculation_results
            
        except Exception as e:
            logger.error(f"Error calculating decision strength: {e}")
            return {
                "decision_strength": 50.0,
                "quantum_contribution": 0.0,
                "spine_contribution": 0.0,
                "regime_contribution": 0.0,
                "threat_contribution": 0.0
            }
    
    async def finalize_decision(self, decision_strength: float, quantum_confidence: float,
                              spine_output: Optional[Any], safety_override: bool,
                              override_triggers: List[str]) -> FinalDecision:
        """
        Finalize the trading decision based on all factors
        
        Args:
            decision_strength: Calculated decision strength
            quantum_confidence: Quantum confidence value
            spine_output: Multi-layer decision spine output
            safety_override: Whether safety override is active
            override_triggers: List of override triggers
            
        Returns:
            FinalDecision: Final trading decision
        """
        try:
            # Apply Final Decision Rules:
            
            # Rule 1: If safetyOverride: finalDecision = "WAIT"
            if safety_override:
                return FinalDecision.WAIT
            
            # Rule 2: If strength > 65 and confidence > 0.6 → LONG/SHORT based on spine
            if (decision_strength > self.decision_thresholds["strong_signal"] and 
                quantum_confidence > self.decision_thresholds["min_confidence_for_action"]):
                
                if spine_output:
                    spine_action = getattr(spine_output, 'recommended_action', RecommendedAction.WAIT)
                    
                    if spine_action == RecommendedAction.LONG:
                        return FinalDecision.LONG
                    elif spine_action == RecommendedAction.SHORT:
                        return FinalDecision.SHORT
                    else:
                        return FinalDecision.WAIT
                else:
                    return FinalDecision.WAIT
            
            # Rule 3: If strength between 45–65 → WAIT
            elif decision_strength >= self.decision_thresholds["moderate_signal"]:
                return FinalDecision.WAIT
            
            # Rule 4: Else → WAIT
            else:
                return FinalDecision.WAIT
            
        except Exception as e:
            logger.error(f"Error finalizing decision: {e}")
            return FinalDecision.WAIT
    
    async def run_decision_fusion_reactor(self, market_data: Optional[Dict[str, Any]] = None) -> ReactorDecision:
        """
        Main function to run the Decision Fusion Reactor
        
        Args:
            market_data: Optional market data for analysis
            
        Returns:
            ReactorDecision: Comprehensive fusion reactor decision
        """
        try:
            logger.debug("Running Decision Fusion Reactor...")
            
            # Step 1: Fuse spine signals
            spine_metrics = await self.fuse_spine_signals(market_data)
            
            # Step 2: Fuse quantum confidence
            quantum_metrics = await self.fuse_quantum_confidence(market_data)
            
            # Step 3: Apply threat adjustments
            threat_metrics = await self.apply_threat_adjustments(market_data)
            
            # Step 4: Apply regime transitions
            regime_metrics = await self.apply_regime_transitions(market_data)
            
            # Step 5: Compute safety override
            safety_override, override_triggers = await self.compute_safety_override(
                quantum_metrics, threat_metrics, regime_metrics
            )
            
            # Step 6: Calculate decision strength
            strength_results = await self.calculate_decision_strength(
                quantum_metrics, spine_metrics, regime_metrics, threat_metrics
            )
            
            # Get spine output for final decision
            spine_output = None
            if self.decision_spine:
                try:
                    spine_output = await self.decision_spine.compute_decision_spine(market_data)
                except Exception as e:
                    logger.warning(f"Failed to get spine output for final decision: {e}")
            
            # Step 7: Finalize decision
            final_decision = await self.finalize_decision(
                strength_results["decision_strength"],
                quantum_metrics["confidence"],
                spine_output,
                safety_override,
                override_triggers
            )
            
            # Generate decision reasons
            reasons = await self._generate_decision_reasons(
                final_decision, strength_results, quantum_metrics, 
                safety_override, override_triggers
            )
            
            # Create reactor decision output
            reactor_decision = ReactorDecision(
                final_decision=final_decision,
                decision_strength=strength_results["decision_strength"],
                safety_override=safety_override,
                reasons=reasons,
                meta=ReactorMeta(
                    confidence=quantum_metrics["confidence"],
                    volatility_resistance=quantum_metrics["volatility_resistance"],
                    stability_score=quantum_metrics["stability_score"],
                    threat_level=threat_metrics["threat_level"]
                ),
                timestamp=time.time(),
                fusion_components=strength_results,
                override_triggers=override_triggers,
                regime_support=regime_metrics["regime_support"],
                threat_inversion_modifier=threat_metrics["inversion_modifier"]
            )
            
            # Update tracking
            self.total_decisions += 1
            self.decision_history.append(reactor_decision)
            self.fusion_history.append(strength_results["decision_strength"])
            
            # Sync with evolution vault
            await self._sync_reactor_with_vault(reactor_decision)
            
            logger.info(f"Reactor Decision: {final_decision.value} (strength: {strength_results['decision_strength']:.1f}, override: {safety_override})")
            
            return reactor_decision
            
        except Exception as e:
            logger.error(f"Error running Decision Fusion Reactor: {e}")
            
            # Return safe fallback decision
            return ReactorDecision(
                final_decision=FinalDecision.WAIT,
                decision_strength=0.0,
                safety_override=True,
                reasons=[f"Reactor computation error: {str(e)}"],
                meta=ReactorMeta(),
                timestamp=time.time(),
                override_triggers=["computation_error"]
            )
    
    async def get_reactor_statistics(self) -> Dict[str, Any]:
        """Get comprehensive reactor statistics"""
        return {
            "total_decisions": self.total_decisions,
            "override_rate": self.override_count / max(1, self.total_decisions),
            "fusion_accuracy": self.fusion_accuracy,
            "emergency_mode": self.is_emergency_mode,
            "recent_decisions": len(self.decision_history),
            "fusion_weights": self.fusion_weights,
            "safety_thresholds": self.safety_thresholds,
            "decision_thresholds": self.decision_thresholds,
            "last_calibration": self.last_calibration
        }
    
    # Private helper methods
    
    async def _assess_threat_cluster_level(self, market_data: Optional[Dict[str, Any]]) -> float:
        """Assess threat cluster level (mock implementation)"""
        # Mock threat assessment - ready for real Threat Cluster Engine integration
        base_threat = 40.0
        
        # Add some realistic threat factors
        if market_data:
            volatility = market_data.get("volatility", 0.2)
            base_threat += min(30, volatility * 100)
        
        return min(100.0, base_threat)
    
    async def _assess_temporal_threats(self, market_data: Optional[Dict[str, Any]]) -> float:
        """Assess temporal threat persistence (mock implementation)"""
        # Mock temporal threat assessment - ready for real Temporal Threat Memory integration
        return 0.5  # Neutral persistence
    
    async def _generate_decision_reasons(self, final_decision: FinalDecision,
                                       strength_results: Dict[str, float],
                                       quantum_metrics: Dict[str, float],
                                       safety_override: bool,
                                       override_triggers: List[str]) -> List[str]:
        """Generate explanatory reasons for the decision"""
        reasons = []
        
        # Decision outcome reason
        if safety_override:
            reasons.append(f"Safety override active: {final_decision.value}")
            reasons.extend([f"Override: {trigger}" for trigger in override_triggers])
        elif final_decision == FinalDecision.WAIT:
            reasons.append("Insufficient signal strength for directional trade")
        else:
            reasons.append(f"Strong signal detected: {final_decision.value}")
        
        # Strength analysis
        decision_strength = strength_results["decision_strength"]
        if decision_strength > 70:
            reasons.append(f"High decision strength: {decision_strength:.1f}")
        elif decision_strength > 50:
            reasons.append(f"Moderate decision strength: {decision_strength:.1f}")
        else:
            reasons.append(f"Low decision strength: {decision_strength:.1f}")
        
        # Confidence analysis
        confidence = quantum_metrics["confidence"]
        if confidence > 0.7:
            reasons.append(f"High confidence: {confidence:.2f}")
        elif confidence < 0.4:
            reasons.append(f"Low confidence: {confidence:.2f}")
        
        # Component contributions
        reasons.append(f"Quantum: {strength_results.get('quantum_contribution', 0):.1f}, "
                      f"Spine: {strength_results.get('spine_contribution', 0):.1f}, "
                      f"Regime: {strength_results.get('regime_contribution', 0):.1f}, "
                      f"Threat: {strength_results.get('threat_contribution', 0):.1f}")
        
        return reasons
    
    async def _calibrate_reactor(self) -> None:
        """Calibrate the reactor based on recent performance"""
        try:
            # Perform reactor calibration logic
            if len(self.decision_history) > 20:
                recent_decisions = list(self.decision_history)[-20:]
                override_rate = sum(1 for d in recent_decisions if d.safety_override) / len(recent_decisions)
                
                # Adjust thresholds if override rate is too high/low
                if override_rate > 0.7:
                    # Too many overrides, relax some thresholds
                    self.safety_thresholds["min_confidence"] = max(0.2, self.safety_thresholds["min_confidence"] - 0.05)
                elif override_rate < 0.1:
                    # Too few overrides, tighten thresholds
                    self.safety_thresholds["min_confidence"] = min(0.5, self.safety_thresholds["min_confidence"] + 0.05)
            
            self.last_calibration = time.time()
            logger.debug("Reactor calibrated successfully")
            
        except Exception as e:
            logger.warning(f"Reactor calibration failed: {e}")
    
    async def _sync_reactor_with_vault(self, reactor_decision: ReactorDecision) -> None:
        """Sync reactor decision with evolution memory vault"""
        if not self.evolution_vault:
            return
        
        try:
            record = EvolutionRecord(
                timestamp=reactor_decision.timestamp,
                module="DecisionFusionReactor",
                event_type=EvolutionEventType.SYSTEM_OPTIMIZATION,
                previous_state={"decision": "unknown"},
                new_state={"decision": reactor_decision.final_decision.value},
                reason=f"Fusion reactor decision: {reactor_decision.final_decision.value}",
                metrics={
                    "decision_strength": reactor_decision.decision_strength,
                    "confidence": reactor_decision.meta.confidence,
                    "safety_override": reactor_decision.safety_override,
                    "threat_level": reactor_decision.meta.threat_level
                }
            )
            
            await self.evolution_vault.save_evolution_record(record)
            
        except Exception as e:
            logger.warning(f"Failed to sync reactor with vault: {e}")
    
    async def shutdown(self) -> None:
        """Shutdown the Decision Fusion Reactor"""
        logger.info("Shutting down Decision Fusion Reactor...")
        
        # Clear reactor state
        self.decision_history.clear()
        self.override_history.clear()
        self.fusion_history.clear()
        
        logger.info("Decision Fusion Reactor shutdown complete")


# Global instance
_decision_fusion_reactor: Optional[DecisionFusionReactor] = None


def get_decision_fusion_reactor() -> DecisionFusionReactor:
    """Get or create the global Decision Fusion Reactor instance"""
    global _decision_fusion_reactor
    if _decision_fusion_reactor is None:
        _decision_fusion_reactor = DecisionFusionReactor()
    return _decision_fusion_reactor


async def initialize_decision_fusion_reactor() -> DecisionFusionReactor:
    """Initialize and return the global Decision Fusion Reactor instance"""
    reactor = get_decision_fusion_reactor()
    await reactor.initialize()
    return reactor


# Public wrapper function
async def run_decision_fusion_reactor(market_data: Optional[Dict[str, Any]] = None) -> ReactorDecision:
    """
    Public wrapper for running the Decision Fusion Reactor
    
    Args:
        market_data: Optional market data for analysis
        
    Returns:
        ReactorDecision: Comprehensive fusion reactor decision
    """
    reactor = get_decision_fusion_reactor()
    return await reactor.run_decision_fusion_reactor(market_data)