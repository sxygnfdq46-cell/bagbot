"""
Multi-Layer Decision Spine (MLDS) - Advanced Trading Intelligence System
Unified decision-making framework that integrates multiple AI layers for optimal trading decisions

This system aggregates signals from multiple intelligence layers:
- Shield Intelligence API (threat detection)
- Regime Transition Intelligence Orb (market regime analysis)
- Temporal Threat Memory Engine (historical threat patterns)
- Adaptive Strategy Selector (strategy optimization)
- Emotionless Execution Core (rational decision making)
- Correlation Matrix Engine (cross-asset analysis)
- Threat Cluster Engine (threat pattern clustering)
- Prediction Horizon (future market projection)
- Evolution Memory Vault (long-term learning)

CRITICAL: This system provides ADVISORY-ONLY outputs and does NOT execute trades
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
from .RegimeTransitionIntelligenceOrb import get_regime_transition_orb, RegimeState
from ..core.EvolutionMemoryVault import get_evolution_memory_vault, EvolutionRecord, EvolutionEventType

logger = logging.getLogger(__name__)


class RecommendedAction(Enum):
    """Possible trading actions recommended by the spine"""
    LONG = "LONG"
    SHORT = "SHORT"
    HEDGE = "HEDGE"
    WAIT = "WAIT"


@dataclass
class SpineLayers:
    """Container for all intelligence layer data"""
    shield: Optional[Dict[str, Any]] = None
    regime: Optional[Dict[str, Any]] = None
    threat: Optional[Dict[str, Any]] = None
    horizon: Optional[Dict[str, Any]] = None
    strategy: Optional[Dict[str, Any]] = None
    correlation: Optional[Dict[str, Any]] = None
    memory: Optional[Dict[str, Any]] = None
    timestamp: float = field(default_factory=time.time)


@dataclass
class DecisionSpineOutput:
    """Output model for unified decision recommendations"""
    score: float  # 0-100 decision strength
    recommended_action: RecommendedAction
    confidence: float  # 0-1 confidence level
    contributing_layers: List[str] = field(default_factory=list)
    notes: List[str] = field(default_factory=list)
    timestamp: float = field(default_factory=time.time)
    layer_weights: Dict[str, float] = field(default_factory=dict)
    conflicts_detected: List[str] = field(default_factory=list)
    resolution_method: str = "weighted_average"


class MultiLayerDecisionSpine:
    """
    Multi-Layer Decision Spine (MLDS) - Unified trading intelligence decision system
    
    Integrates multiple AI layers to provide coherent trading recommendations
    with conflict detection and resolution capabilities.
    """
    
    def __init__(self):
        """Initialize the Multi-Layer Decision Spine"""
        logger.info("Initializing Multi-Layer Decision Spine...")
        
        # Layer weights (configurable based on market conditions)
        self.layer_weights = {
            "shield": 0.20,      # Threat/risk assessment
            "regime": 0.18,      # Market regime analysis
            "threat": 0.15,      # Historical threat patterns
            "horizon": 0.15,     # Future projections
            "strategy": 0.12,    # Strategy optimization
            "correlation": 0.10, # Cross-asset correlation
            "memory": 0.10       # Long-term learning
        }
        
        # Decision thresholds
        self.strong_signal_threshold = 75.0
        self.moderate_signal_threshold = 55.0
        self.weak_signal_threshold = 35.0
        self.conflict_threshold = 0.3  # Maximum allowed disagreement
        
        # Layer signal history (for trend analysis)
        self.signal_history = defaultdict(lambda: deque(maxlen=50))
        self.decision_history = deque(maxlen=100)
        
        # Intelligence layer connections
        self.regime_orb = None
        self.evolution_vault = None
        
        # Statistics
        self.total_decisions = 0
        self.conflict_count = 0
        self.layer_contribution_stats = defaultdict(float)
        
        # Safety flags
        self.is_advisory_only = True
        self.deterministic_mode = True
        self.non_blocking = True
    
    async def initialize(self) -> None:
        """Initialize the Multi-Layer Decision Spine"""
        logger.info("Initializing Multi-Layer Decision Spine connections...")
        
        try:
            # Connect to available intelligence layers
            self.regime_orb = get_regime_transition_orb()
            self.evolution_vault = get_evolution_memory_vault()
            
            logger.info("Multi-Layer Decision Spine initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing Multi-Layer Decision Spine: {e}")
            raise
    
    async def gather_layer_signals(self, market_data: Optional[Dict[str, Any]] = None) -> SpineLayers:
        """
        Gather signals from all available intelligence layers
        
        Args:
            market_data: Optional market data for analysis
            
        Returns:
            SpineLayers: Container with all layer signals
        """
        layers = SpineLayers()
        
        try:
            # Gather Shield Intelligence signals (mock implementation)
            layers.shield = await self._gather_shield_signals(market_data)
            
            # Gather Regime Transition Intelligence signals
            layers.regime = await self._gather_regime_signals(market_data)
            
            # Gather Temporal Threat Memory signals (mock implementation)
            layers.threat = await self._gather_threat_signals(market_data)
            
            # Gather Prediction Horizon signals (mock implementation)
            layers.horizon = await self._gather_horizon_signals(market_data)
            
            # Gather Adaptive Strategy signals (mock implementation)
            layers.strategy = await self._gather_strategy_signals(market_data)
            
            # Gather Correlation Matrix signals (mock implementation)
            layers.correlation = await self._gather_correlation_signals(market_data)
            
            # Gather Evolution Memory signals
            layers.memory = await self._gather_memory_signals(market_data)
            
            logger.debug(f"Gathered signals from {len([l for l in [layers.shield, layers.regime, layers.threat, layers.horizon, layers.strategy, layers.correlation, layers.memory] if l is not None])} layers")
            
        except Exception as e:
            logger.error(f"Error gathering layer signals: {e}")
            # Continue with partial data
        
        return layers
    
    async def normalize_signals(self, layers: SpineLayers) -> Dict[str, float]:
        """
        Normalize signals from all layers to 0-100 scale
        
        Args:
            layers: Raw layer signals
            
        Returns:
            Dict[str, float]: Normalized signals by layer
        """
        normalized = {}
        
        # Normalize shield signals
        if layers.shield:
            shield_score = layers.shield.get("threat_level", 0.5)
            normalized["shield"] = (1.0 - shield_score) * 100  # Invert threat to opportunity
        
        # Normalize regime signals
        if layers.regime:
            regime_confidence = layers.regime.get("confidence", 0.5)
            regime_state = layers.regime.get("regime", "unknown")
            
            # Convert regime state to numerical score
            regime_scores = {
                "stable": 60,
                "trending": 80,
                "reversal": 40,
                "volatility_explosion": 20,
                "volatility_decay": 70,
                "chaotic": 10,
                "transition": 30,
                "unknown": 50
            }
            
            base_score = regime_scores.get(regime_state, 50)
            normalized["regime"] = base_score * regime_confidence
        
        # Normalize threat signals
        if layers.threat:
            threat_risk = layers.threat.get("risk_level", 0.5)
            normalized["threat"] = (1.0 - threat_risk) * 100
        
        # Normalize horizon signals
        if layers.horizon:
            horizon_bullish = layers.horizon.get("bullish_probability", 0.5)
            normalized["horizon"] = horizon_bullish * 100
        
        # Normalize strategy signals
        if layers.strategy:
            strategy_score = layers.strategy.get("optimization_score", 0.5)
            normalized["strategy"] = strategy_score * 100
        
        # Normalize correlation signals
        if layers.correlation:
            correlation_strength = layers.correlation.get("favorable_correlation", 0.5)
            normalized["correlation"] = correlation_strength * 100
        
        # Normalize memory signals
        if layers.memory:
            memory_confidence = layers.memory.get("pattern_confidence", 0.5)
            normalized["memory"] = memory_confidence * 100
        
        # Store signal history for trend analysis
        for layer, score in normalized.items():
            self.signal_history[layer].append(score)
        
        return normalized
    
    async def compute_unified_decision_score(self, layers: SpineLayers) -> float:
        """
        Compute unified decision score from all layer signals
        
        Args:
            layers: Normalized layer signals
            
        Returns:
            float: Unified decision score (0-100)
        """
        normalized_signals = await self.normalize_signals(layers)
        
        # Weighted average of all signals
        total_weight = 0
        weighted_sum = 0
        
        for layer_name, signal_score in normalized_signals.items():
            weight = self.layer_weights.get(layer_name, 0)
            weighted_sum += signal_score * weight
            total_weight += weight
            
            # Update contribution statistics
            self.layer_contribution_stats[layer_name] += weight
        
        if total_weight == 0:
            return 50.0  # Neutral score if no signals
        
        unified_score = weighted_sum / total_weight
        
        # Apply trend momentum (if available)
        trend_adjustment = await self._calculate_trend_momentum(normalized_signals)
        unified_score += trend_adjustment
        
        # Clamp to valid range
        return max(0.0, min(100.0, unified_score))
    
    async def detect_conflicts(self, layers: SpineLayers) -> List[str]:
        """
        Detect conflicts between layer signals
        
        Args:
            layers: Layer signals to analyze
            
        Returns:
            List[str]: List of detected conflicts
        """
        conflicts = []
        normalized_signals = await self.normalize_signals(layers)
        
        if len(normalized_signals) < 2:
            return conflicts
        
        # Calculate signal variance
        signal_values = list(normalized_signals.values())
        signal_variance = np.var(signal_values)
        
        # High variance indicates conflicts
        if signal_variance > (self.conflict_threshold * 100) ** 2:
            conflicts.append("High signal variance detected across layers")
        
        # Check for opposing signals
        max_signal = max(signal_values)
        min_signal = min(signal_values)
        
        if max_signal > 70 and min_signal < 30:
            conflicts.append("Opposing signals: some layers strongly bullish, others bearish")
        
        # Check for regime vs threat conflicts
        if "regime" in normalized_signals and "threat" in normalized_signals:
            regime_signal = normalized_signals["regime"]
            threat_signal = normalized_signals["threat"]
            
            if abs(regime_signal - threat_signal) > 40:
                conflicts.append("Regime analysis conflicts with threat assessment")
        
        # Check for horizon vs current strategy conflicts
        if "horizon" in normalized_signals and "strategy" in normalized_signals:
            horizon_signal = normalized_signals["horizon"]
            strategy_signal = normalized_signals["strategy"]
            
            if abs(horizon_signal - strategy_signal) > 35:
                conflicts.append("Prediction horizon conflicts with current strategy")
        
        return conflicts
    
    async def resolve_conflicts(self, layers: SpineLayers, conflicts: List[str]) -> Dict[str, Any]:
        """
        Resolve conflicts using adaptive strategy selector logic
        
        Args:
            layers: Layer signals
            conflicts: Detected conflicts
            
        Returns:
            Dict[str, Any]: Conflict resolution information
        """
        if not conflicts:
            return {"method": "no_conflicts", "adjustments": {}}
        
        resolution_info = {
            "method": "weighted_consensus",
            "adjustments": {},
            "confidence_reduction": 0.0
        }
        
        # Reduce confidence based on conflict severity
        conflict_severity = len(conflicts) / 7.0  # Max 7 possible conflicts
        resolution_info["confidence_reduction"] = min(0.4, conflict_severity * 0.2)
        
        # Adjust layer weights based on conflict types
        normalized_signals = await self.normalize_signals(layers)
        
        if "High signal variance detected" in str(conflicts):
            # Reduce weight of outlier signals
            signal_values = list(normalized_signals.values())
            signal_mean = np.mean(signal_values)
            
            for layer, signal in normalized_signals.items():
                if abs(signal - signal_mean) > 25:
                    resolution_info["adjustments"][layer] = -0.3
        
        if "Opposing signals" in str(conflicts):
            # Increase weight of memory and regime layers (more stable)
            resolution_info["adjustments"]["memory"] = 0.2
            resolution_info["adjustments"]["regime"] = 0.2
        
        if "regime analysis conflicts" in str(conflicts):
            # Favor threat assessment in high-risk scenarios
            resolution_info["adjustments"]["threat"] = 0.25
            resolution_info["adjustments"]["shield"] = 0.15
        
        self.conflict_count += 1
        return resolution_info
    
    async def finalize_decision_output(self, layers: SpineLayers) -> DecisionSpineOutput:
        """
        Finalize the unified decision output
        
        Args:
            layers: All layer signals
            
        Returns:
            DecisionSpineOutput: Final decision recommendation
        """
        # Compute unified score
        unified_score = await self.compute_unified_decision_score(layers)
        
        # Detect and resolve conflicts
        conflicts = await self.detect_conflicts(layers)
        conflict_resolution = await self.resolve_conflicts(layers, conflicts)
        
        # Determine recommended action
        recommended_action = await self._score_to_action(unified_score)
        
        # Calculate confidence
        base_confidence = await self._calculate_confidence(unified_score, layers)
        confidence_reduction = conflict_resolution.get("confidence_reduction", 0.0)
        final_confidence = max(0.1, base_confidence - confidence_reduction)
        
        # Identify contributing layers
        normalized_signals = await self.normalize_signals(layers)
        contributing_layers = [
            layer for layer, score in normalized_signals.items()
            if abs(score - 50) > 10  # Layers with meaningful signals
        ]
        
        # Generate analysis notes
        notes = await self._generate_decision_notes(unified_score, layers, conflicts)
        
        # Create output
        output = DecisionSpineOutput(
            score=unified_score,
            recommended_action=recommended_action,
            confidence=final_confidence,
            contributing_layers=contributing_layers,
            notes=notes,
            timestamp=time.time(),
            layer_weights=self.layer_weights.copy(),
            conflicts_detected=conflicts,
            resolution_method=conflict_resolution.get("method", "weighted_average")
        )
        
        # Store in decision history
        self.decision_history.append(output)
        self.total_decisions += 1
        
        # Sync with evolution vault
        await self._sync_decision_with_vault(output)
        
        return output
    
    async def compute_decision_spine(self, market_data: Optional[Dict[str, Any]] = None) -> DecisionSpineOutput:
        """
        Public wrapper for computing unified decision spine recommendation
        
        Args:
            market_data: Optional market data for analysis
            
        Returns:
            DecisionSpineOutput: Unified decision recommendation
        """
        try:
            # Gather signals from all layers
            layers = await self.gather_layer_signals(market_data)
            
            # Finalize decision output
            decision = await self.finalize_decision_output(layers)
            
            logger.info(f"Decision Spine: {decision.recommended_action.value} (score: {decision.score:.1f}, confidence: {decision.confidence:.2f})")
            
            return decision
            
        except Exception as e:
            logger.error(f"Error computing decision spine: {e}")
            
            # Return safe fallback decision
            return DecisionSpineOutput(
                score=50.0,
                recommended_action=RecommendedAction.WAIT,
                confidence=0.1,
                contributing_layers=[],
                notes=[f"Error in decision computation: {str(e)}"],
                timestamp=time.time(),
                conflicts_detected=["computation_error"]
            )
    
    async def get_spine_statistics(self) -> Dict[str, Any]:
        """Get comprehensive decision spine statistics"""
        return {
            "total_decisions": self.total_decisions,
            "conflict_rate": self.conflict_count / max(1, self.total_decisions),
            "layer_weights": self.layer_weights,
            "layer_contributions": dict(self.layer_contribution_stats),
            "recent_decisions": len(self.decision_history),
            "is_advisory_only": self.is_advisory_only,
            "deterministic_mode": self.deterministic_mode,
            "uptime": time.time() - (self.decision_history[0].timestamp if self.decision_history else time.time())
        }
    
    # Private helper methods
    
    async def _gather_shield_signals(self, market_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Gather Shield Intelligence API signals (mock implementation)"""
        return {
            "threat_level": 0.3,
            "shield_strength": 0.8,
            "active_threats": ["volatility_spike"],
            "protection_score": 0.75
        }
    
    async def _gather_regime_signals(self, market_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Gather Regime Transition Intelligence signals"""
        if self.regime_orb:
            try:
                current_regime = await self.regime_orb.get_current_regime()
                return current_regime
            except Exception as e:
                logger.warning(f"Error gathering regime signals: {e}")
        
        return {
            "regime": "unknown",
            "confidence": 0.5,
            "transition_probability": 0.3
        }
    
    async def _gather_threat_signals(self, market_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Gather Temporal Threat Memory signals (mock implementation)"""
        return {
            "risk_level": 0.4,
            "threat_patterns": ["correlation_breakdown"],
            "threat_persistence": 0.6
        }
    
    async def _gather_horizon_signals(self, market_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Gather Prediction Horizon signals (mock implementation)"""
        return {
            "bullish_probability": 0.65,
            "forecast_confidence": 0.7,
            "time_horizon": "1d"
        }
    
    async def _gather_strategy_signals(self, market_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Gather Adaptive Strategy Selector signals (mock implementation)"""
        return {
            "optimization_score": 0.72,
            "current_strategy": "momentum",
            "strategy_confidence": 0.8
        }
    
    async def _gather_correlation_signals(self, market_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Gather Correlation Matrix Engine signals (mock implementation)"""
        return {
            "favorable_correlation": 0.6,
            "correlation_strength": 0.75,
            "cross_asset_signals": ["positive_equity_correlation"]
        }
    
    async def _gather_memory_signals(self, market_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Gather Evolution Memory Vault signals"""
        if self.evolution_vault:
            try:
                stats = await self.evolution_vault.get_vault_statistics()
                return {
                    "pattern_confidence": min(1.0, stats.get("total_records", 0) / 100),
                    "learning_progress": stats.get("success_rate", 0.5)
                }
            except Exception as e:
                logger.warning(f"Error gathering memory signals: {e}")
        
        return {
            "pattern_confidence": 0.5,
            "learning_progress": 0.5
        }
    
    async def _calculate_trend_momentum(self, normalized_signals: Dict[str, float]) -> float:
        """Calculate trend momentum adjustment"""
        if not self.signal_history:
            return 0.0
        
        momentum_adjustment = 0.0
        
        for layer, score in normalized_signals.items():
            if layer in self.signal_history and len(self.signal_history[layer]) > 5:
                recent_scores = list(self.signal_history[layer])[-5:]
                trend = (recent_scores[-1] - recent_scores[0]) / 4
                momentum_adjustment += trend * 0.1  # Small momentum boost
        
        return max(-5.0, min(5.0, momentum_adjustment))  # Cap adjustment
    
    async def _score_to_action(self, score: float) -> RecommendedAction:
        """Convert unified score to recommended action"""
        if score >= self.strong_signal_threshold:
            return RecommendedAction.LONG
        elif score <= (100 - self.strong_signal_threshold):
            return RecommendedAction.SHORT
        elif score >= self.moderate_signal_threshold:
            return RecommendedAction.HEDGE if score < 65 else RecommendedAction.LONG
        elif score <= (100 - self.moderate_signal_threshold):
            return RecommendedAction.HEDGE if score > 35 else RecommendedAction.SHORT
        else:
            return RecommendedAction.WAIT
    
    async def _calculate_confidence(self, score: float, layers: SpineLayers) -> float:
        """Calculate confidence based on score strength and layer agreement"""
        # Base confidence from score strength
        score_distance = abs(score - 50)
        base_confidence = min(1.0, score_distance / 50)
        
        # Adjust for layer agreement
        normalized_signals = await self.normalize_signals(layers)
        if len(normalized_signals) > 1:
            signal_values = list(normalized_signals.values())
            signal_std = np.std(signal_values)
            agreement_factor = max(0.3, 1.0 - (signal_std / 50))  # Lower std = higher agreement
            base_confidence *= agreement_factor
        
        return max(0.1, min(1.0, base_confidence))
    
    async def _generate_decision_notes(self, score: float, layers: SpineLayers, conflicts: List[str]) -> List[str]:
        """Generate explanatory notes for the decision"""
        notes = []
        
        # Score interpretation
        if score >= self.strong_signal_threshold:
            notes.append(f"Strong bullish signal (score: {score:.1f})")
        elif score <= (100 - self.strong_signal_threshold):
            notes.append(f"Strong bearish signal (score: {score:.1f})")
        else:
            notes.append(f"Moderate/neutral signal (score: {score:.1f})")
        
        # Layer contributions
        normalized_signals = await self.normalize_signals(layers)
        for layer, signal in normalized_signals.items():
            if signal > 70:
                notes.append(f"{layer.capitalize()} layer strongly bullish ({signal:.0f})")
            elif signal < 30:
                notes.append(f"{layer.capitalize()} layer strongly bearish ({signal:.0f})")
        
        # Conflict information
        if conflicts:
            notes.append(f"Conflicts detected: {len(conflicts)} issues requiring resolution")
        
        return notes
    
    async def _sync_decision_with_vault(self, decision: DecisionSpineOutput) -> None:
        """Sync decision with evolution memory vault"""
        if not self.evolution_vault:
            return
        
        try:
            record = EvolutionRecord(
                timestamp=decision.timestamp,
                module="MultiLayerDecisionSpine",
                event_type=EvolutionEventType.SYSTEM_OPTIMIZATION,
                previous_state={"action": "unknown"},
                new_state={"action": decision.recommended_action.value},
                reason=f"Unified decision with score {decision.score:.1f}",
                metrics={
                    "score": decision.score,
                    "confidence": decision.confidence,
                    "conflicts": len(decision.conflicts_detected)
                }
            )
            
            await self.evolution_vault.save_evolution_record(record)
            
        except Exception as e:
            logger.warning(f"Failed to sync decision with vault: {e}")
    
    async def shutdown(self) -> None:
        """Shutdown the Multi-Layer Decision Spine"""
        logger.info("Shutting down Multi-Layer Decision Spine...")
        
        # Clear data structures
        self.signal_history.clear()
        self.decision_history.clear()
        self.layer_contribution_stats.clear()
        
        logger.info("Multi-Layer Decision Spine shutdown complete")


# Global instance
_multi_layer_decision_spine: Optional[MultiLayerDecisionSpine] = None


def get_multi_layer_decision_spine() -> MultiLayerDecisionSpine:
    """Get or create the global Multi-Layer Decision Spine instance"""
    global _multi_layer_decision_spine
    if _multi_layer_decision_spine is None:
        _multi_layer_decision_spine = MultiLayerDecisionSpine()
    return _multi_layer_decision_spine


async def initialize_decision_spine() -> MultiLayerDecisionSpine:
    """Initialize and return the global Multi-Layer Decision Spine instance"""
    spine = get_multi_layer_decision_spine()
    await spine.initialize()
    return spine


# Public wrapper function
async def compute_decision_spine(market_data: Optional[Dict[str, Any]] = None) -> DecisionSpineOutput:
    """
    Public wrapper for computing unified decision spine recommendation
    
    Args:
        market_data: Optional market data for analysis
        
    Returns:
        DecisionSpineOutput: Unified trading decision recommendation
    """
    spine = get_multi_layer_decision_spine()
    return await spine.compute_decision_spine(market_data)