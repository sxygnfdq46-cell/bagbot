"""
Quantum Confidence Engine (QCE) - Advanced Confidence Calculation System
Multi-dimensional confidence assessment using quantum probability distributions

This engine computes ultra-sophisticated confidence scores by integrating:
- Multi-Layer Decision Spine outputs
- Temporal Threat Memory patterns
- Regime Transition Intelligence
- Prediction Horizon forecasts
- Correlation Matrix analysis
- Evolution Memory learning

CRITICAL: Pure intelligence layer - no execution logic or UI elements
Compatible with fusionEngine and TradingPipelineCore integration
"""

import asyncio
import logging
import time
import numpy as np
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import json
import math
from collections import defaultdict, deque

# Import required intelligence layers
from .MultiLayerDecisionSpine import get_multi_layer_decision_spine, DecisionSpineOutput
from .RegimeTransitionIntelligenceOrb import get_regime_transition_orb, RegimeState
from ..core.EvolutionMemoryVault import get_evolution_memory_vault, EvolutionRecord, EvolutionEventType

logger = logging.getLogger(__name__)


@dataclass
class QuantumConfidenceOutput:
    """Output model for quantum confidence calculations"""
    confidence: float  # 0-1 final quantum confidence
    stability_score: float  # 0-100 signal stability
    volatility_resistance: float  # 0-100 resistance to market volatility
    probability_spread: List[float]  # Multidimensional probability distribution
    meta_notes: List[str] = field(default_factory=list)
    timestamp: float = field(default_factory=time.time)
    
    # Additional quantum metrics
    quantum_coherence: float = 0.0  # 0-1 signal coherence
    uncertainty_principle: float = 0.0  # 0-1 uncertainty measure
    entanglement_strength: float = 0.0  # 0-1 signal correlation
    dimensional_variance: float = 0.0  # Spread across probability dimensions


class QuantumConfidenceEngine:
    """
    Quantum Confidence Engine - Ultra-sophisticated confidence calculation system
    
    Computes multi-dimensional confidence scores using quantum probability
    distributions and advanced signal analysis across all intelligence layers.
    """
    
    def __init__(self):
        """Initialize the Quantum Confidence Engine"""
        logger.info("Initializing Quantum Confidence Engine...")
        
        # Quantum confidence formula weights
        self.formula_weights = {
            "stability_score": 0.35,
            "volatility_resistance": 0.25,
            "spine_decision_score": 0.25,
            "memory_influence": 0.15
        }
        
        # Probability distribution dimensions
        self.probability_dimensions = [
            "temporal_confidence",    # Time-based confidence
            "regime_confidence",      # Market regime certainty
            "correlation_confidence", # Cross-asset correlation
            "threat_confidence",      # Threat assessment certainty
            "memory_confidence",      # Historical learning confidence
            "volatility_confidence",  # Volatility prediction confidence
            "execution_confidence"    # Execution environment confidence
        ]
        
        # Signal processing parameters
        self.signal_smoothing_factor = 0.7
        self.noise_threshold = 0.1
        self.coherence_threshold = 0.6
        self.stability_window = 20  # Number of samples for stability calculation
        
        # Intelligence layer connections
        self.decision_spine = None
        self.regime_orb = None
        self.evolution_vault = None
        
        # Historical data for quantum calculations
        self.confidence_history = deque(maxlen=100)
        self.signal_variance_history = deque(maxlen=50)
        self.quantum_state_history = deque(maxlen=30)
        
        # Quantum metrics tracking
        self.total_calculations = 0
        self.stability_violations = 0
        self.coherence_events = 0
        
        # Engine state
        self.is_calibrated = False
        self.last_calibration = 0
        self.calibration_interval = 3600  # Recalibrate every hour
    
    async def initialize(self) -> None:
        """Initialize the Quantum Confidence Engine"""
        logger.info("Initializing Quantum Confidence Engine connections...")
        
        try:
            # Connect to intelligence layers
            self.decision_spine = get_multi_layer_decision_spine()
            self.regime_orb = get_regime_transition_orb()
            self.evolution_vault = get_evolution_memory_vault()
            
            # Initialize quantum state
            await self._initialize_quantum_state()
            
            # Perform initial calibration
            await self._calibrate_engine()
            
            logger.info("Quantum Confidence Engine initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing Quantum Confidence Engine: {e}")
            raise
    
    async def collect_input_signals(self, market_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Collect signals from all connected intelligence layers
        
        Args:
            market_data: Optional market data for analysis
            
        Returns:
            Dict[str, Any]: Collected signals from all layers
        """
        signals = {
            "spine_output": None,
            "regime_analysis": None,
            "threat_memory": None,
            "prediction_horizon": None,
            "correlation_matrix": None,
            "evolution_memory": None,
            "timestamp": time.time()
        }
        
        try:
            # Collect Multi-Layer Decision Spine output
            if self.decision_spine:
                try:
                    spine_output = await self.decision_spine.compute_decision_spine(market_data)
                    signals["spine_output"] = spine_output
                except Exception as e:
                    logger.warning(f"Failed to collect spine signals: {e}")
            
            # Collect Regime Transition Intelligence
            if self.regime_orb:
                try:
                    regime_analysis = await self.regime_orb.analyze_regime(market_data)
                    signals["regime_analysis"] = regime_analysis
                except Exception as e:
                    logger.warning(f"Failed to collect regime signals: {e}")
            
            # Collect mock signals for other layers (ready for real integration)
            signals["threat_memory"] = await self._collect_threat_memory_signals(market_data)
            signals["prediction_horizon"] = await self._collect_prediction_horizon_signals(market_data)
            signals["correlation_matrix"] = await self._collect_correlation_matrix_signals(market_data)
            
            # Collect Evolution Memory signals
            if self.evolution_vault:
                try:
                    vault_stats = await self.evolution_vault.get_vault_statistics()
                    signals["evolution_memory"] = vault_stats
                except Exception as e:
                    logger.warning(f"Failed to collect evolution memory signals: {e}")
            
            logger.debug(f"Collected signals from {len([s for s in signals.values() if s is not None])} layers")
            
        except Exception as e:
            logger.error(f"Error collecting input signals: {e}")
        
        return signals
    
    async def compute_probability_spread(self, signals: Dict[str, Any]) -> List[float]:
        """
        Compute multidimensional probability distribution
        
        Args:
            signals: Collected signals from all layers
            
        Returns:
            List[float]: Probability distribution across dimensions
        """
        probability_spread = []
        
        try:
            # Temporal confidence (time-based reliability)
            temporal_conf = await self._compute_temporal_confidence(signals)
            probability_spread.append(temporal_conf)
            
            # Regime confidence (market state certainty)
            regime_conf = await self._compute_regime_confidence(signals)
            probability_spread.append(regime_conf)
            
            # Correlation confidence (cross-asset reliability)
            correlation_conf = await self._compute_correlation_confidence(signals)
            probability_spread.append(correlation_conf)
            
            # Threat confidence (risk assessment certainty)
            threat_conf = await self._compute_threat_confidence(signals)
            probability_spread.append(threat_conf)
            
            # Memory confidence (historical learning reliability)
            memory_conf = await self._compute_memory_confidence(signals)
            probability_spread.append(memory_conf)
            
            # Volatility confidence (volatility prediction reliability)
            volatility_conf = await self._compute_volatility_confidence(signals)
            probability_spread.append(volatility_conf)
            
            # Execution confidence (execution environment reliability)
            execution_conf = await self._compute_execution_confidence(signals)
            probability_spread.append(execution_conf)
            
            # Normalize probability spread to sum to 1.0
            total = sum(probability_spread)
            if total > 0:
                probability_spread = [p / total for p in probability_spread]
            else:
                # Uniform distribution if no signals
                probability_spread = [1.0 / len(self.probability_dimensions)] * len(self.probability_dimensions)
            
        except Exception as e:
            logger.error(f"Error computing probability spread: {e}")
            # Return uniform distribution on error
            probability_spread = [1.0 / len(self.probability_dimensions)] * len(self.probability_dimensions)
        
        return probability_spread
    
    async def normalize_q_confidence(self, raw_confidence: float, signals: Dict[str, Any]) -> float:
        """
        Normalize quantum confidence using advanced signal processing
        
        Args:
            raw_confidence: Raw confidence value
            signals: Input signals for normalization context
            
        Returns:
            float: Normalized quantum confidence (0-1)
        """
        try:
            # Apply signal smoothing
            if self.confidence_history:
                smoothed_confidence = (
                    self.signal_smoothing_factor * raw_confidence +
                    (1 - self.signal_smoothing_factor) * self.confidence_history[-1]
                )
            else:
                smoothed_confidence = raw_confidence
            
            # Apply noise reduction
            if len(self.confidence_history) > 5:
                recent_variance = np.var(list(self.confidence_history)[-5:])
                if recent_variance < self.noise_threshold:
                    # Boost confidence during stable periods
                    smoothed_confidence *= 1.1
                else:
                    # Reduce confidence during noisy periods
                    smoothed_confidence *= 0.95
            
            # Apply quantum coherence adjustment
            coherence = await self._calculate_quantum_coherence(signals)
            coherence_multiplier = 0.8 + (0.4 * coherence)  # 0.8 to 1.2 range
            normalized_confidence = smoothed_confidence * coherence_multiplier
            
            # Clamp to valid range
            normalized_confidence = max(0.0, min(1.0, normalized_confidence))
            
            # Store in history
            self.confidence_history.append(normalized_confidence)
            
            return normalized_confidence
            
        except Exception as e:
            logger.error(f"Error normalizing quantum confidence: {e}")
            return max(0.0, min(1.0, raw_confidence))
    
    async def compute_volatility_resistance(self, signals: Dict[str, Any]) -> float:
        """
        Compute resistance to market volatility (0-100)
        
        Args:
            signals: Input signals for volatility analysis
            
        Returns:
            float: Volatility resistance score (0-100)
        """
        try:
            resistance_factors = []
            
            # Regime stability factor
            if signals.get("regime_analysis"):
                regime_output = signals["regime_analysis"]
                regime_state = getattr(regime_output, 'state', RegimeState.UNKNOWN)
                
                stability_scores = {
                    RegimeState.STABLE: 90,
                    RegimeState.TRENDING: 75,
                    RegimeState.VOLATILITY_DECAY: 85,
                    RegimeState.REVERSAL: 50,
                    RegimeState.TRANSITION: 40,
                    RegimeState.VOLATILITY_EXPLOSION: 20,
                    RegimeState.CHAOTIC: 10,
                    RegimeState.UNKNOWN: 45
                }
                
                regime_resistance = stability_scores.get(regime_state, 45)
                resistance_factors.append(regime_resistance)
            
            # Decision spine consistency factor
            if signals.get("spine_output"):
                spine_output = signals["spine_output"]
                spine_confidence = getattr(spine_output, 'confidence', 0.5)
                conflicts = getattr(spine_output, 'conflicts_detected', [])
                
                consistency_score = spine_confidence * 100
                if conflicts:
                    consistency_score *= (1.0 - min(0.3, len(conflicts) * 0.1))
                
                resistance_factors.append(consistency_score)
            
            # Historical volatility resistance
            if len(self.signal_variance_history) > 10:
                recent_variance = np.mean(list(self.signal_variance_history)[-10:])
                variance_resistance = max(10, 100 - (recent_variance * 200))
                resistance_factors.append(variance_resistance)
            
            # Correlation stability factor
            if signals.get("correlation_matrix"):
                correlation_data = signals["correlation_matrix"]
                correlation_stability = correlation_data.get("stability_score", 50)
                resistance_factors.append(correlation_stability)
            
            # Compute weighted average
            if resistance_factors:
                volatility_resistance = np.mean(resistance_factors)
            else:
                volatility_resistance = 50.0  # Neutral resistance
            
            # Apply quantum uncertainty principle
            uncertainty = await self._calculate_uncertainty_principle(signals)
            volatility_resistance *= (1.0 - uncertainty * 0.2)  # Reduce by up to 20%
            
            return max(0.0, min(100.0, volatility_resistance))
            
        except Exception as e:
            logger.error(f"Error computing volatility resistance: {e}")
            return 50.0
    
    async def compute_stability_score(self, signals: Dict[str, Any]) -> float:
        """
        Compute overall stability score (0-100)
        
        Args:
            signals: Input signals for stability analysis
            
        Returns:
            float: Stability score (0-100)
        """
        try:
            stability_components = []
            
            # Signal consistency over time
            if len(self.confidence_history) >= self.stability_window:
                recent_confidences = list(self.confidence_history)[-self.stability_window:]
                confidence_std = np.std(recent_confidences)
                consistency_score = max(0, 100 - (confidence_std * 200))
                stability_components.append(consistency_score)
            
            # Layer agreement stability
            if signals.get("spine_output"):
                spine_output = signals["spine_output"]
                contributing_layers = getattr(spine_output, 'contributing_layers', [])
                conflicts = getattr(spine_output, 'conflicts_detected', [])
                
                if contributing_layers:
                    agreement_ratio = max(0, len(contributing_layers) - len(conflicts)) / len(contributing_layers)
                    agreement_score = agreement_ratio * 100
                    stability_components.append(agreement_score)
            
            # Regime transition stability
            if signals.get("regime_analysis"):
                regime_output = signals["regime_analysis"]
                transition_risk = getattr(regime_output, 'transition_risk', 0.5)
                transition_stability = (1.0 - transition_risk) * 100
                stability_components.append(transition_stability)
            
            # Evolution memory stability
            if signals.get("evolution_memory"):
                evolution_data = signals["evolution_memory"]
                success_rate = evolution_data.get("success_rate", 0.5)
                memory_stability = success_rate * 100
                stability_components.append(memory_stability)
            
            # Quantum coherence stability
            coherence = await self._calculate_quantum_coherence(signals)
            coherence_stability = coherence * 100
            stability_components.append(coherence_stability)
            
            # Compute weighted average
            if stability_components:
                stability_score = np.mean(stability_components)
            else:
                stability_score = 50.0  # Neutral stability
            
            # Apply temporal weighting (recent stability matters more)
            if len(self.quantum_state_history) > 5:
                recent_states = list(self.quantum_state_history)[-5:]
                temporal_weight = 1.0 + (np.std(recent_states) * -0.2)  # Lower variance = higher weight
                stability_score *= temporal_weight
            
            return max(0.0, min(100.0, stability_score))
            
        except Exception as e:
            logger.error(f"Error computing stability score: {e}")
            return 50.0
    
    async def aggregate_final_qce(self, signals: Dict[str, Any]) -> QuantumConfidenceOutput:
        """
        Aggregate final Quantum Confidence Engine output
        
        Args:
            signals: All collected signals
            
        Returns:
            QuantumConfidenceOutput: Final quantum confidence assessment
        """
        try:
            # Compute core components
            stability_score = await self.compute_stability_score(signals)
            volatility_resistance = await self.compute_volatility_resistance(signals)
            probability_spread = await self.compute_probability_spread(signals)
            
            # Extract spine decision score
            spine_score = 50.0  # Default neutral
            if signals.get("spine_output"):
                spine_output = signals["spine_output"]
                spine_score = getattr(spine_output, 'score', 50.0)
            
            # Extract memory influence
            memory_influence = 50.0  # Default neutral
            if signals.get("evolution_memory"):
                evolution_data = signals["evolution_memory"]
                total_records = evolution_data.get("total_records", 0)
                success_rate = evolution_data.get("success_rate", 0.5)
                memory_influence = min(100, (total_records / 100) * success_rate * 100)
            
            # Normalize all components to 0-1 range for formula
            stability_normalized = stability_score / 100.0
            volatility_resistance_normalized = volatility_resistance / 100.0
            spine_score_normalized = spine_score / 100.0
            memory_influence_normalized = memory_influence / 100.0
            
            # Apply Quantum Confidence Formula
            final_confidence = (
                self.formula_weights["stability_score"] * stability_normalized +
                self.formula_weights["volatility_resistance"] * volatility_resistance_normalized +
                self.formula_weights["spine_decision_score"] * spine_score_normalized +
                self.formula_weights["memory_influence"] * memory_influence_normalized
            )
            
            # Normalize final confidence
            final_confidence = await self.normalize_q_confidence(final_confidence, signals)
            
            # Calculate additional quantum metrics
            quantum_coherence = await self._calculate_quantum_coherence(signals)
            uncertainty_principle = await self._calculate_uncertainty_principle(signals)
            entanglement_strength = await self._calculate_entanglement_strength(signals)
            dimensional_variance = np.var(probability_spread) if probability_spread else 0.0
            
            # Generate meta notes
            meta_notes = await self._generate_meta_notes(
                final_confidence, stability_score, volatility_resistance, 
                quantum_coherence, signals
            )
            
            # Create output
            qce_output = QuantumConfidenceOutput(
                confidence=final_confidence,
                stability_score=stability_score,
                volatility_resistance=volatility_resistance,
                probability_spread=probability_spread,
                meta_notes=meta_notes,
                timestamp=time.time(),
                quantum_coherence=quantum_coherence,
                uncertainty_principle=uncertainty_principle,
                entanglement_strength=entanglement_strength,
                dimensional_variance=dimensional_variance
            )
            
            # Update tracking
            self.total_calculations += 1
            self.quantum_state_history.append(final_confidence)
            
            # Store variance for volatility resistance calculations
            if len(probability_spread) > 0:
                self.signal_variance_history.append(dimensional_variance)
            
            # Sync with evolution vault
            await self._sync_qce_with_vault(qce_output)
            
            logger.debug(f"QCE: confidence={final_confidence:.3f}, stability={stability_score:.1f}, volatility_resistance={volatility_resistance:.1f}")
            
            return qce_output
            
        except Exception as e:
            logger.error(f"Error aggregating final QCE: {e}")
            
            # Return safe fallback
            return QuantumConfidenceOutput(
                confidence=0.5,
                stability_score=50.0,
                volatility_resistance=50.0,
                probability_spread=[1.0 / len(self.probability_dimensions)] * len(self.probability_dimensions),
                meta_notes=[f"QCE computation error: {str(e)}"],
                timestamp=time.time()
            )
    
    async def compute_quantum_confidence(self, market_data: Optional[Dict[str, Any]] = None) -> QuantumConfidenceOutput:
        """
        Main public function to compute quantum confidence
        
        Args:
            market_data: Optional market data for analysis
            
        Returns:
            QuantumConfidenceOutput: Comprehensive quantum confidence assessment
        """
        try:
            # Check if recalibration is needed
            if time.time() - self.last_calibration > self.calibration_interval:
                await self._calibrate_engine()
            
            # Collect input signals from all layers
            signals = await self.collect_input_signals(market_data)
            
            # Aggregate final quantum confidence output
            qce_output = await self.aggregate_final_qce(signals)
            
            return qce_output
            
        except Exception as e:
            logger.error(f"Error computing quantum confidence: {e}")
            
            # Return minimal safe output
            return QuantumConfidenceOutput(
                confidence=0.5,
                stability_score=50.0,
                volatility_resistance=50.0,
                probability_spread=[1.0 / len(self.probability_dimensions)] * len(self.probability_dimensions),
                meta_notes=["Quantum confidence computation failed"],
                timestamp=time.time()
            )
    
    # Private helper methods
    
    async def _initialize_quantum_state(self) -> None:
        """Initialize quantum state variables"""
        self.confidence_history.clear()
        self.signal_variance_history.clear()
        self.quantum_state_history.clear()
        self.total_calculations = 0
        self.stability_violations = 0
        self.coherence_events = 0
        logger.debug("Quantum state initialized")
    
    async def _calibrate_engine(self) -> None:
        """Calibrate the quantum confidence engine"""
        try:
            # Perform calibration based on recent performance
            if len(self.confidence_history) > 20:
                recent_performance = list(self.confidence_history)[-20:]
                performance_variance = np.var(recent_performance)
                
                # Adjust smoothing factor based on variance
                if performance_variance > 0.1:
                    self.signal_smoothing_factor = min(0.9, self.signal_smoothing_factor + 0.1)
                else:
                    self.signal_smoothing_factor = max(0.5, self.signal_smoothing_factor - 0.05)
            
            self.last_calibration = time.time()
            self.is_calibrated = True
            logger.debug("Quantum confidence engine calibrated")
            
        except Exception as e:
            logger.warning(f"Engine calibration failed: {e}")
    
    async def _collect_threat_memory_signals(self, market_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Collect Temporal Threat Memory Engine signals (mock implementation)"""
        return {
            "threat_patterns": ["volatility_spike", "correlation_break"],
            "threat_persistence": 0.4,
            "historical_accuracy": 0.78,
            "confidence_score": 0.72
        }
    
    async def _collect_prediction_horizon_signals(self, market_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Collect Prediction Horizon signals (mock implementation)"""
        return {
            "forecast_confidence": 0.68,
            "time_horizon": "4h",
            "prediction_accuracy": 0.74,
            "uncertainty_cone": 0.25
        }
    
    async def _collect_correlation_matrix_signals(self, market_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Collect Correlation Matrix Engine signals (mock implementation)"""
        return {
            "correlation_strength": 0.82,
            "stability_score": 75.0,
            "breakdown_risk": 0.18,
            "cross_asset_coherence": 0.85
        }
    
    async def _compute_temporal_confidence(self, signals: Dict[str, Any]) -> float:
        """Compute temporal dimension confidence"""
        base_confidence = 0.5
        
        # Factor in prediction horizon
        if signals.get("prediction_horizon"):
            horizon_data = signals["prediction_horizon"]
            forecast_conf = horizon_data.get("forecast_confidence", 0.5)
            base_confidence = (base_confidence + forecast_conf) / 2
        
        # Factor in historical consistency
        if len(self.confidence_history) > 10:
            recent_std = np.std(list(self.confidence_history)[-10:])
            consistency_factor = max(0.2, 1.0 - recent_std)
            base_confidence *= consistency_factor
        
        return max(0.1, min(1.0, base_confidence))
    
    async def _compute_regime_confidence(self, signals: Dict[str, Any]) -> float:
        """Compute regime dimension confidence"""
        if signals.get("regime_analysis"):
            regime_output = signals["regime_analysis"]
            regime_confidence = getattr(regime_output, 'confidence', 0.5)
            return max(0.1, min(1.0, regime_confidence))
        
        return 0.5
    
    async def _compute_correlation_confidence(self, signals: Dict[str, Any]) -> float:
        """Compute correlation dimension confidence"""
        if signals.get("correlation_matrix"):
            correlation_data = signals["correlation_matrix"]
            correlation_strength = correlation_data.get("correlation_strength", 0.5)
            stability_score = correlation_data.get("stability_score", 50) / 100
            return max(0.1, min(1.0, (correlation_strength + stability_score) / 2))
        
        return 0.5
    
    async def _compute_threat_confidence(self, signals: Dict[str, Any]) -> float:
        """Compute threat dimension confidence"""
        if signals.get("threat_memory"):
            threat_data = signals["threat_memory"]
            confidence_score = threat_data.get("confidence_score", 0.5)
            accuracy = threat_data.get("historical_accuracy", 0.5)
            return max(0.1, min(1.0, (confidence_score + accuracy) / 2))
        
        return 0.5
    
    async def _compute_memory_confidence(self, signals: Dict[str, Any]) -> float:
        """Compute memory dimension confidence"""
        if signals.get("evolution_memory"):
            memory_data = signals["evolution_memory"]
            success_rate = memory_data.get("success_rate", 0.5)
            total_records = memory_data.get("total_records", 0)
            
            # More records = higher confidence in memory
            record_confidence = min(1.0, total_records / 1000)
            return max(0.1, min(1.0, (success_rate + record_confidence) / 2))
        
        return 0.5
    
    async def _compute_volatility_confidence(self, signals: Dict[str, Any]) -> float:
        """Compute volatility dimension confidence"""
        base_confidence = 0.5
        
        # Factor in regime volatility state
        if signals.get("regime_analysis"):
            regime_output = signals["regime_analysis"]
            regime_state = getattr(regime_output, 'state', RegimeState.UNKNOWN)
            
            volatility_confidences = {
                RegimeState.STABLE: 0.9,
                RegimeState.VOLATILITY_DECAY: 0.85,
                RegimeState.TRENDING: 0.7,
                RegimeState.REVERSAL: 0.6,
                RegimeState.TRANSITION: 0.4,
                RegimeState.VOLATILITY_EXPLOSION: 0.2,
                RegimeState.CHAOTIC: 0.1,
                RegimeState.UNKNOWN: 0.5
            }
            
            base_confidence = volatility_confidences.get(regime_state, 0.5)
        
        return max(0.1, min(1.0, base_confidence))
    
    async def _compute_execution_confidence(self, signals: Dict[str, Any]) -> float:
        """Compute execution dimension confidence"""
        execution_confidence = 0.8  # Base assumption of good execution environment
        
        # Factor in spine conflicts (execution complexity)
        if signals.get("spine_output"):
            spine_output = signals["spine_output"]
            conflicts = getattr(spine_output, 'conflicts_detected', [])
            
            if conflicts:
                conflict_penalty = min(0.4, len(conflicts) * 0.1)
                execution_confidence -= conflict_penalty
        
        return max(0.1, min(1.0, execution_confidence))
    
    async def _calculate_quantum_coherence(self, signals: Dict[str, Any]) -> float:
        """Calculate quantum coherence of signals"""
        try:
            coherence_factors = []
            
            # Spine layer coherence
            if signals.get("spine_output"):
                spine_output = signals["spine_output"]
                spine_confidence = getattr(spine_output, 'confidence', 0.5)
                coherence_factors.append(spine_confidence)
            
            # Regime coherence
            if signals.get("regime_analysis"):
                regime_output = signals["regime_analysis"]
                regime_confidence = getattr(regime_output, 'confidence', 0.5)
                coherence_factors.append(regime_confidence)
            
            # Historical coherence
            if len(self.confidence_history) > 5:
                recent_confidences = list(self.confidence_history)[-5:]
                coherence_std = np.std(recent_confidences)
                historical_coherence = max(0, 1.0 - coherence_std * 2)
                coherence_factors.append(historical_coherence)
            
            if coherence_factors:
                coherence = np.mean(coherence_factors)
            else:
                coherence = 0.5
            
            if coherence > self.coherence_threshold:
                self.coherence_events += 1
            
            return max(0.0, min(1.0, coherence))
            
        except Exception:
            return 0.5
    
    async def _calculate_uncertainty_principle(self, signals: Dict[str, Any]) -> float:
        """Calculate quantum uncertainty principle"""
        try:
            # More information = more uncertainty (quantum principle)
            information_count = len([s for s in signals.values() if s is not None])
            base_uncertainty = min(0.3, information_count * 0.02)
            
            # Signal conflict increases uncertainty
            if signals.get("spine_output"):
                spine_output = signals["spine_output"]
                conflicts = getattr(spine_output, 'conflicts_detected', [])
                conflict_uncertainty = min(0.4, len(conflicts) * 0.08)
                base_uncertainty += conflict_uncertainty
            
            return max(0.0, min(1.0, base_uncertainty))
            
        except Exception:
            return 0.2
    
    async def _calculate_entanglement_strength(self, signals: Dict[str, Any]) -> float:
        """Calculate signal entanglement strength"""
        try:
            # Measure correlation between different signal sources
            entanglement = 0.5
            
            # Spine and regime entanglement
            if signals.get("spine_output") and signals.get("regime_analysis"):
                spine_output = signals["spine_output"]
                regime_output = signals["regime_analysis"]
                
                spine_score = getattr(spine_output, 'score', 50) / 100
                regime_conf = getattr(regime_output, 'confidence', 0.5)
                
                correlation = 1.0 - abs(spine_score - regime_conf)
                entanglement = max(entanglement, correlation)
            
            return max(0.0, min(1.0, entanglement))
            
        except Exception:
            return 0.5
    
    async def _generate_meta_notes(self, confidence: float, stability: float, 
                                 volatility_resistance: float, coherence: float,
                                 signals: Dict[str, Any]) -> List[str]:
        """Generate explanatory meta notes"""
        notes = []
        
        # Confidence interpretation
        if confidence > 0.8:
            notes.append("Extremely high quantum confidence - strong signal alignment")
        elif confidence > 0.6:
            notes.append("High quantum confidence - reliable signal convergence")
        elif confidence > 0.4:
            notes.append("Moderate quantum confidence - mixed signal environment")
        else:
            notes.append("Low quantum confidence - high uncertainty detected")
        
        # Stability notes
        if stability > 80:
            notes.append("Exceptional stability across all dimensions")
        elif stability < 40:
            notes.append("Stability concerns - volatile signal environment")
        
        # Volatility resistance notes
        if volatility_resistance > 80:
            notes.append("Strong volatility resistance - robust signal quality")
        elif volatility_resistance < 40:
            notes.append("Low volatility resistance - signals vulnerable to market noise")
        
        # Coherence notes
        if coherence > 0.8:
            notes.append("High quantum coherence - signals are well-synchronized")
        elif coherence < 0.4:
            notes.append("Low quantum coherence - signal desynchronization detected")
        
        # Calculation stats
        notes.append(f"QCE calculations performed: {self.total_calculations}")
        
        return notes
    
    async def _sync_qce_with_vault(self, qce_output: QuantumConfidenceOutput) -> None:
        """Sync QCE output with evolution memory vault"""
        if not self.evolution_vault:
            return
        
        try:
            record = EvolutionRecord(
                timestamp=qce_output.timestamp,
                module="QuantumConfidenceEngine",
                event_type=EvolutionEventType.SYSTEM_OPTIMIZATION,
                previous_state={"confidence": "unknown"},
                new_state={"confidence": qce_output.confidence},
                reason=f"Quantum confidence calculation: {qce_output.confidence:.3f}",
                metrics={
                    "stability_score": qce_output.stability_score,
                    "volatility_resistance": qce_output.volatility_resistance,
                    "quantum_coherence": qce_output.quantum_coherence,
                    "uncertainty_principle": qce_output.uncertainty_principle
                }
            )
            
            await self.evolution_vault.save_evolution_record(record)
            
        except Exception as e:
            logger.warning(f"Failed to sync QCE with vault: {e}")
    
    async def shutdown(self) -> None:
        """Shutdown the Quantum Confidence Engine"""
        logger.info("Shutting down Quantum Confidence Engine...")
        
        # Clear quantum state
        await self._initialize_quantum_state()
        
        logger.info("Quantum Confidence Engine shutdown complete")


# Global instance
_quantum_confidence_engine: Optional[QuantumConfidenceEngine] = None


def get_quantum_confidence_engine() -> QuantumConfidenceEngine:
    """Get or create the global Quantum Confidence Engine instance"""
    global _quantum_confidence_engine
    if _quantum_confidence_engine is None:
        _quantum_confidence_engine = QuantumConfidenceEngine()
    return _quantum_confidence_engine


async def initialize_quantum_confidence_engine() -> QuantumConfidenceEngine:
    """Initialize and return the global Quantum Confidence Engine instance"""
    engine = get_quantum_confidence_engine()
    await engine.initialize()
    return engine


# Public wrapper function
async def compute_quantum_confidence(market_data: Optional[Dict[str, Any]] = None) -> QuantumConfidenceOutput:
    """
    Public wrapper for computing quantum confidence
    
    Args:
        market_data: Optional market data for analysis
        
    Returns:
        QuantumConfidenceOutput: Comprehensive quantum confidence assessment
    """
    engine = get_quantum_confidence_engine()
    return await engine.compute_quantum_confidence(market_data)