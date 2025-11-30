"""
STEP 24.66 — Execution Consciousness Layer (ECL)

Advanced meta-cognitive monitoring system with real-time anomaly detection
Meta-awareness layer for execution intelligence with adaptive recommendations

This layer provides:
- Real-time ENS state observation and analysis
- Advanced anomaly detection for execution risks
- Meta-cognitive insight generation and trend analysis
- Adaptive action recommendations for system optimization
- Consciousness scoring with system health assessment
- Comprehensive fatigue and risk pressure monitoring

CRITICAL: Meta-cognitive execution intelligence layer
Compatible with all execution engines and nervous system integrations
"""

import logging
import time
import json
import hashlib
from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from collections import defaultdict, deque
import statistics
import math
import uuid

# Import execution nervous system
from .ExecutionNervousSystem import (
    ExecutionNervousSystem,
    UnifiedState,
    FinalExecutionAction,
    EngineSignal,
    get_execution_nervous_system
)

logger = logging.getLogger(__name__)


class AnomalyType(Enum):
    """Anomaly types detected by consciousness layer"""
    HIGH_VOLATILITY_RISK = "high_volatility_risk"
    REFLEX_OVERACTIVATION = "reflex_overactivation"
    SHIELD_FATIGUE = "shield_fatigue"
    CONTRADICTORY_SIGNALS = "contradictory_signals"
    LOW_PRECISION = "low_precision"
    RISING_LATENCY_DRIFT = "rising_latency_drift"
    CONSENSUS_DEGRADATION = "consensus_degradation"
    CONFIDENCE_INSTABILITY = "confidence_instability"
    SYSTEM_OVERLOAD = "system_overload"


class AdaptiveAction(Enum):
    """Adaptive action recommendations"""
    SWITCH_DEFENSIVE_MODE = "switch_to_defensive_mode"
    ACTIVATE_SHIELD = "activate_shield"
    DELAY_EXECUTION = "delay_execution"
    REDUCE_POSITION_SIZING = "reduce_position_sizing"
    INCREASE_HEDGE_LEVEL = "increase_hedge_level"
    HALT_TRADING_TEMPORARILY = "halt_trading_temporarily"
    RECALIBRATE_ENGINES = "recalibrate_engines"
    REDUCE_SIGNAL_SENSITIVITY = "reduce_signal_sensitivity"
    EMERGENCY_SHUTDOWN = "emergency_shutdown"


@dataclass
class AnomalyDetection:
    """Anomaly detection result"""
    anomaly_type: AnomalyType
    severity: float  # 0-1 scale
    confidence: float  # 0-1 scale
    description: str
    detected_at: float = field(default_factory=time.time)
    
    # Anomaly metadata
    contributing_factors: List[str] = field(default_factory=list)
    trend_duration: int = 0  # Number of states showing this anomaly
    impact_assessment: str = "unknown"


@dataclass
class MetaCognitionInsight:
    """Meta-cognitive insight about system state"""
    insight_type: str
    insight_text: str
    confidence: float  # 0-1 scale
    relevance: float  # 0-1 scale
    
    # Insight metadata
    based_on_states: int = 0
    pattern_strength: float = 0.0
    predictive_value: float = 0.0
    timestamp: float = field(default_factory=time.time)


@dataclass
class ConsciousnessReport:
    """Comprehensive consciousness layer report"""
    action_recommendation: str
    consciousness_score: float  # 0-100 scale
    anomaly_list: List[str]
    meta_cognition_insight: str
    timestamp: float = field(default_factory=time.time)
    
    # Extended report data
    system_fatigue_index: float = 0.0
    risk_pressure_index: float = 0.0
    adaptation_confidence: float = 0.0
    recommended_parameters: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert report to dictionary format"""
        return {
            "action_recommendation": self.action_recommendation,
            "consciousness_score": self.consciousness_score,
            "anomaly_list": self.anomaly_list,
            "meta_cognition_insight": self.meta_cognition_insight,
            "timestamp": self.timestamp,
            "system_fatigue_index": self.system_fatigue_index,
            "risk_pressure_index": self.risk_pressure_index,
            "adaptation_confidence": self.adaptation_confidence,
            "recommended_parameters": self.recommended_parameters
        }


@dataclass
class SystemMetrics:
    """System performance metrics for consciousness analysis"""
    stability_variance: float = 0.0
    confidence_volatility: float = 0.0
    consensus_degradation_rate: float = 0.0
    signal_frequency: float = 0.0
    processing_latency_trend: float = 0.0
    anomaly_frequency: float = 0.0
    
    # Calculated metrics
    overall_health_score: float = 75.0
    performance_trend: float = 0.0  # -1 to 1
    stability_trend: float = 0.0    # -1 to 1


class ExecutionConsciousnessLayer:
    """
    Execution Consciousness Layer (ECL)
    
    Meta-cognitive monitoring system that observes ENS states in real-time,
    detects anomalies, and provides adaptive recommendations for optimization.
    """
    
    def __init__(self, ens: Optional[ExecutionNervousSystem] = None):
        """
        Initialize the Execution Consciousness Layer
        
        Args:
            ens: Execution Nervous System instance to observe
        """
        logger.info("Initializing Execution Consciousness Layer...")
        
        # ENS integration
        self.ens = ens or get_execution_nervous_system()
        
        # Core parameters
        self.memory_buffer_size = 500  # Last 500 ENS states
        self.anomaly_threshold = 0.6   # Threshold for anomaly detection (0-1)
        self.consciousness_decay_rate = 0.95  # Consciousness score decay
        self.fatigue_threshold = 0.7   # System fatigue threshold
        self.risk_pressure_threshold = 0.8  # Risk pressure threshold
        
        # Memory and state tracking
        self.ens_state_memory: deque = deque(maxlen=self.memory_buffer_size)
        self.anomaly_history: deque = deque(maxlen=200)  # Last 200 anomalies
        self.insight_history: deque = deque(maxlen=100)  # Last 100 insights
        
        # Current state indicators
        self.consciousness_score = 85.0  # Initial consciousness level
        self.system_fatigue_index = 0.2  # Initial fatigue level
        self.risk_pressure_index = 0.3   # Initial risk pressure
        self.last_meta_cognition: Optional[MetaCognitionInsight] = None
        
        # Performance tracking
        self.total_states_observed = 0
        self.total_anomalies_detected = 0
        self.total_recommendations_generated = 0
        self.system_metrics = SystemMetrics()
        
        # Anomaly detection thresholds
        self.anomaly_thresholds = {
            AnomalyType.HIGH_VOLATILITY_RISK: 0.8,
            AnomalyType.REFLEX_OVERACTIVATION: 0.7,
            AnomalyType.SHIELD_FATIGUE: 0.6,
            AnomalyType.CONTRADICTORY_SIGNALS: 0.5,
            AnomalyType.LOW_PRECISION: 0.4,
            AnomalyType.RISING_LATENCY_DRIFT: 0.6,
            AnomalyType.CONSENSUS_DEGRADATION: 0.5,
            AnomalyType.CONFIDENCE_INSTABILITY: 0.6,
            AnomalyType.SYSTEM_OVERLOAD: 0.8
        }
        
        # Adaptive action mapping
        self.action_priority_map = {
            AdaptiveAction.EMERGENCY_SHUTDOWN: 1,
            AdaptiveAction.HALT_TRADING_TEMPORARILY: 2,
            AdaptiveAction.SWITCH_DEFENSIVE_MODE: 3,
            AdaptiveAction.ACTIVATE_SHIELD: 4,
            AdaptiveAction.INCREASE_HEDGE_LEVEL: 5,
            AdaptiveAction.DELAY_EXECUTION: 6,
            AdaptiveAction.REDUCE_POSITION_SIZING: 7,
            AdaptiveAction.RECALIBRATE_ENGINES: 8,
            AdaptiveAction.REDUCE_SIGNAL_SENSITIVITY: 9
        }
    
    def observe_ens_state(self, state: UnifiedState) -> None:
        """
        Observe and process ENS unified state
        
        Args:
            state: Unified state from ENS
        """
        try:
            logger.debug(f"Observing ENS state: confidence={state.aggregated_confidence:.1f}, "
                        f"stability={state.stability_score:.1f}")
            
            # Store state in memory
            self.ens_state_memory.append(state)
            self.total_states_observed += 1
            
            # Update system metrics
            self._update_system_metrics(state)
            
            # Update consciousness score based on state quality
            self._update_consciousness_score(state)
            
            # Update fatigue and risk pressure indices
            self._update_fatigue_index(state)
            self._update_risk_pressure_index(state)
            
            logger.debug(f"ENS state observed: consciousness={self.consciousness_score:.1f}%, "
                        f"fatigue={self.system_fatigue_index:.2f}, risk={self.risk_pressure_index:.2f}")
            
        except Exception as e:
            logger.error(f"Error observing ENS state: {e}")
    
    def compute_meta_cognition(self) -> MetaCognitionInsight:
        """
        Compute meta-cognitive insight about system patterns
        
        Returns:
            MetaCognitionInsight: Meta-cognitive analysis result
        """
        try:
            if len(self.ens_state_memory) < 5:
                # Not enough data for meta-cognition
                insight = MetaCognitionInsight(
                    insight_type="insufficient_data",
                    insight_text="Insufficient historical data for meta-cognitive analysis",
                    confidence=0.3,
                    relevance=0.5,
                    based_on_states=len(self.ens_state_memory)
                )
                self.last_meta_cognition = insight
                return insight
            
            # Analyze patterns in recent states
            recent_states = list(self.ens_state_memory)[-20:]  # Last 20 states
            
            # Pattern analysis
            stability_pattern = self._analyze_stability_pattern(recent_states)
            confidence_pattern = self._analyze_confidence_pattern(recent_states)
            consensus_pattern = self._analyze_consensus_pattern(recent_states)
            
            # Generate insight based on strongest pattern
            insight = self._generate_meta_cognitive_insight(
                stability_pattern, confidence_pattern, consensus_pattern, recent_states
            )
            
            # Store insight
            self.insight_history.append(insight)
            self.last_meta_cognition = insight
            
            logger.debug(f"Meta-cognition computed: {insight.insight_type} "
                        f"(confidence: {insight.confidence:.2f})")
            
            return insight
            
        except Exception as e:
            logger.error(f"Error computing meta-cognition: {e}")
            
            # Return fallback insight
            fallback_insight = MetaCognitionInsight(
                insight_type="error",
                insight_text=f"Meta-cognitive analysis failed: {str(e)}",
                confidence=0.1,
                relevance=0.1
            )
            self.last_meta_cognition = fallback_insight
            return fallback_insight
    
    def detect_anomalies(self) -> List[AnomalyDetection]:
        """
        Detect anomalies in system behavior
        
        Returns:
            List[AnomalyDetection]: List of detected anomalies
        """
        try:
            anomalies = []
            
            if len(self.ens_state_memory) < 3:
                return anomalies
            
            recent_states = list(self.ens_state_memory)[-10:]  # Last 10 states
            
            # Check each anomaly type
            for anomaly_type in AnomalyType:
                anomaly = self._detect_specific_anomaly(anomaly_type, recent_states)
                if anomaly and anomaly.severity >= self.anomaly_thresholds[anomaly_type]:
                    anomalies.append(anomaly)
            
            # Store detected anomalies
            for anomaly in anomalies:
                self.anomaly_history.append(anomaly)
                self.total_anomalies_detected += 1
            
            if anomalies:
                logger.warning(f"Detected {len(anomalies)} anomalies: "
                              f"{[a.anomaly_type.value for a in anomalies]}")
            
            return anomalies
            
        except Exception as e:
            logger.error(f"Error detecting anomalies: {e}")
            return []
    
    def recommend_adaptive_action(self, anomalies: List[AnomalyDetection], 
                                 insight: MetaCognitionInsight) -> AdaptiveAction:
        """
        Recommend adaptive action based on anomalies and insights
        
        Args:
            anomalies: List of detected anomalies
            insight: Meta-cognitive insight
            
        Returns:
            AdaptiveAction: Recommended adaptive action
        """
        try:
            # Handle critical anomalies first
            critical_anomalies = [a for a in anomalies if a.severity >= 0.9]
            
            if critical_anomalies:
                # Emergency response for critical anomalies
                for anomaly in critical_anomalies:
                    if anomaly.anomaly_type in [AnomalyType.SYSTEM_OVERLOAD, AnomalyType.HIGH_VOLATILITY_RISK]:
                        return AdaptiveAction.EMERGENCY_SHUTDOWN
                
                return AdaptiveAction.HALT_TRADING_TEMPORARILY
            
            # Handle high severity anomalies
            high_severity_anomalies = [a for a in anomalies if a.severity >= 0.7]
            
            if high_severity_anomalies:
                # Prioritize by anomaly type
                for anomaly in high_severity_anomalies:
                    if anomaly.anomaly_type == AnomalyType.REFLEX_OVERACTIVATION:
                        return AdaptiveAction.SWITCH_DEFENSIVE_MODE
                    elif anomaly.anomaly_type == AnomalyType.SHIELD_FATIGUE:
                        return AdaptiveAction.ACTIVATE_SHIELD
                    elif anomaly.anomaly_type == AnomalyType.CONTRADICTORY_SIGNALS:
                        return AdaptiveAction.DELAY_EXECUTION
                    elif anomaly.anomaly_type == AnomalyType.RISING_LATENCY_DRIFT:
                        return AdaptiveAction.REDUCE_SIGNAL_SENSITIVITY
            
            # Handle moderate anomalies
            moderate_anomalies = [a for a in anomalies if a.severity >= 0.5]
            
            if moderate_anomalies:
                # Check system state
                if self.system_fatigue_index > self.fatigue_threshold:
                    return AdaptiveAction.REDUCE_POSITION_SIZING
                elif self.risk_pressure_index > self.risk_pressure_threshold:
                    return AdaptiveAction.INCREASE_HEDGE_LEVEL
                else:
                    return AdaptiveAction.RECALIBRATE_ENGINES
            
            # Handle insight-based recommendations
            if insight.confidence > 0.7:
                if "instability" in insight.insight_text.lower():
                    return AdaptiveAction.SWITCH_DEFENSIVE_MODE
                elif "fatigue" in insight.insight_text.lower():
                    return AdaptiveAction.REDUCE_SIGNAL_SENSITIVITY
                elif "pressure" in insight.insight_text.lower():
                    return AdaptiveAction.INCREASE_HEDGE_LEVEL
            
            # Default recommendation for normal operation
            if self.consciousness_score < 60:
                return AdaptiveAction.RECALIBRATE_ENGINES
            elif len(anomalies) > 0:
                return AdaptiveAction.REDUCE_SIGNAL_SENSITIVITY
            else:
                return AdaptiveAction.SWITCH_DEFENSIVE_MODE  # Conservative default
            
        except Exception as e:
            logger.error(f"Error recommending adaptive action: {e}")
            return AdaptiveAction.HALT_TRADING_TEMPORARILY  # Safe fallback
    
    def get_consciousness_report(self) -> ConsciousnessReport:
        """
        Generate comprehensive consciousness report
        
        Returns:
            ConsciousnessReport: Complete consciousness analysis
        """
        try:
            # Detect current anomalies
            anomalies = self.detect_anomalies()
            
            # Compute meta-cognition
            meta_cognition = self.compute_meta_cognition()
            
            # Recommend adaptive action
            adaptive_action = self.recommend_adaptive_action(anomalies, meta_cognition)
            
            # Generate recommended parameters
            recommended_params = self._generate_recommended_parameters(adaptive_action, anomalies)
            
            # Calculate adaptation confidence
            adaptation_confidence = self._calculate_adaptation_confidence(anomalies, meta_cognition)
            
            # Create report
            report = ConsciousnessReport(
                action_recommendation=adaptive_action.value,
                consciousness_score=self.consciousness_score,
                anomaly_list=[a.anomaly_type.value for a in anomalies],
                meta_cognition_insight=meta_cognition.insight_text,
                system_fatigue_index=self.system_fatigue_index,
                risk_pressure_index=self.risk_pressure_index,
                adaptation_confidence=adaptation_confidence,
                recommended_parameters=recommended_params
            )
            
            self.total_recommendations_generated += 1
            
            logger.info(f"Consciousness report generated: {adaptive_action.value} "
                       f"(score: {self.consciousness_score:.1f}%)")
            
            return report
            
        except Exception as e:
            logger.error(f"Error generating consciousness report: {e}")
            
            # Return safe fallback report
            return ConsciousnessReport(
                action_recommendation=AdaptiveAction.HALT_TRADING_TEMPORARILY.value,
                consciousness_score=30.0,
                anomaly_list=["system_error"],
                meta_cognition_insight=f"Consciousness analysis failed: {str(e)}",
                system_fatigue_index=0.8,
                risk_pressure_index=0.8,
                adaptation_confidence=0.2
            )
    
    def get_system_status(self) -> Dict[str, Any]:
        """Get comprehensive system status"""
        try:
            return {
                "total_states_observed": self.total_states_observed,
                "total_anomalies_detected": self.total_anomalies_detected,
                "total_recommendations_generated": self.total_recommendations_generated,
                "consciousness_score": self.consciousness_score,
                "system_fatigue_index": self.system_fatigue_index,
                "risk_pressure_index": self.risk_pressure_index,
                "memory_utilization": f"{len(self.ens_state_memory)}/{self.memory_buffer_size}",
                "anomaly_history_size": len(self.anomaly_history),
                "insight_history_size": len(self.insight_history),
                "last_meta_cognition": self.last_meta_cognition.insight_text if self.last_meta_cognition else None,
                "system_metrics": {
                    "stability_variance": self.system_metrics.stability_variance,
                    "confidence_volatility": self.system_metrics.confidence_volatility,
                    "consensus_degradation_rate": self.system_metrics.consensus_degradation_rate,
                    "overall_health_score": self.system_metrics.overall_health_score,
                    "performance_trend": self.system_metrics.performance_trend,
                    "stability_trend": self.system_metrics.stability_trend
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting system status: {e}")
            return {"error": str(e)}
    
    # Private helper methods
    
    def _update_system_metrics(self, state: UnifiedState) -> None:
        """Update system performance metrics"""
        try:
            # Calculate stability variance
            if len(self.ens_state_memory) >= 5:
                recent_stability = [s.stability_score for s in list(self.ens_state_memory)[-5:]]
                self.system_metrics.stability_variance = statistics.variance(recent_stability)
            
            # Calculate confidence volatility
            if len(self.ens_state_memory) >= 5:
                recent_confidence = [s.aggregated_confidence for s in list(self.ens_state_memory)[-5:]]
                self.system_metrics.confidence_volatility = statistics.stdev(recent_confidence)
            
            # Calculate consensus degradation rate
            if len(self.ens_state_memory) >= 10:
                recent_consensus = [s.consensus_level for s in list(self.ens_state_memory)[-10:]]
                if len(recent_consensus) >= 2:
                    # Simple slope calculation
                    x_values = list(range(len(recent_consensus)))
                    x_mean = statistics.mean(x_values)
                    y_mean = statistics.mean(recent_consensus)
                    
                    numerator = sum((x_values[i] - x_mean) * (recent_consensus[i] - y_mean) 
                                  for i in range(len(recent_consensus)))
                    denominator = sum((x_values[i] - x_mean) ** 2 for i in range(len(recent_consensus)))
                    
                    if denominator > 0:
                        slope = numerator / denominator
                        self.system_metrics.consensus_degradation_rate = max(0, -slope)  # Positive = degrading
            
            # Update overall health score
            self._calculate_overall_health_score()
            
        except Exception as e:
            logger.warning(f"Error updating system metrics: {e}")
    
    def _update_consciousness_score(self, state: UnifiedState) -> None:
        """Update consciousness score based on state quality"""
        try:
            # Base consciousness adjustment factors
            confidence_factor = (state.aggregated_confidence - 50) / 100  # -0.5 to 0.5
            stability_factor = (state.stability_score - 50) / 100        # -0.5 to 0.5
            consensus_factor = (state.consensus_level - 50) / 100        # -0.5 to 0.5
            
            # Calculate adjustment
            adjustment = (confidence_factor + stability_factor + consensus_factor) * 2  # Max ±3 points
            
            # Apply adjustment with decay
            self.consciousness_score = self.consciousness_score * self.consciousness_decay_rate + adjustment
            
            # Clamp to valid range
            self.consciousness_score = max(0.0, min(100.0, self.consciousness_score))
            
        except Exception as e:
            logger.warning(f"Error updating consciousness score: {e}")
    
    def _update_fatigue_index(self, state: UnifiedState) -> None:
        """Update system fatigue index"""
        try:
            # Factors that contribute to fatigue
            processing_latency_factor = min(1.0, state.processing_latency / 1000)  # Normalize to 0-1
            signal_overload_factor = min(1.0, len(state.active_signals) / 10)      # Max 10 signals
            conflict_factor = min(1.0, len(state.conflicting_signals) / 5)        # Max 5 conflicts
            
            # Calculate fatigue increase
            fatigue_increase = (processing_latency_factor + signal_overload_factor + conflict_factor) / 3
            
            # Update fatigue with decay
            decay_rate = 0.98
            self.system_fatigue_index = self.system_fatigue_index * decay_rate + fatigue_increase * 0.1
            
            # Clamp to valid range
            self.system_fatigue_index = max(0.0, min(1.0, self.system_fatigue_index))
            
        except Exception as e:
            logger.warning(f"Error updating fatigue index: {e}")
    
    def _update_risk_pressure_index(self, state: UnifiedState) -> None:
        """Update risk pressure index"""
        try:
            # Risk pressure factors
            low_stability_factor = max(0, (50 - state.stability_score) / 50)      # Higher when stability low
            high_aggression_factor = max(0, (state.aggression_score - 50) / 50)   # Higher when aggression high
            low_consensus_factor = max(0, (70 - state.consensus_level) / 70)      # Higher when consensus low
            
            # Calculate risk pressure
            risk_pressure = (low_stability_factor + high_aggression_factor + low_consensus_factor) / 3
            
            # Update with exponential smoothing
            alpha = 0.2
            self.risk_pressure_index = alpha * risk_pressure + (1 - alpha) * self.risk_pressure_index
            
            # Clamp to valid range
            self.risk_pressure_index = max(0.0, min(1.0, self.risk_pressure_index))
            
        except Exception as e:
            logger.warning(f"Error updating risk pressure index: {e}")
    
    def _analyze_stability_pattern(self, states: List[UnifiedState]) -> Dict[str, Any]:
        """Analyze stability pattern in recent states"""
        try:
            if len(states) < 3:
                return {"trend": "unknown", "strength": 0.0, "volatility": 0.0}
            
            stability_scores = [state.stability_score for state in states]
            
            # Calculate trend
            if len(stability_scores) >= 2:
                trend_slope = (stability_scores[-1] - stability_scores[0]) / len(stability_scores)
                if trend_slope > 1.0:
                    trend = "improving"
                elif trend_slope < -1.0:
                    trend = "degrading"
                else:
                    trend = "stable"
            else:
                trend = "unknown"
            
            # Calculate volatility
            volatility = statistics.stdev(stability_scores) if len(stability_scores) > 1 else 0.0
            
            # Calculate strength
            strength = abs(trend_slope) / 10 if 'trend_slope' in locals() else 0.0
            
            return {
                "trend": trend,
                "strength": min(1.0, strength),
                "volatility": min(1.0, volatility / 20),  # Normalize
                "current_level": stability_scores[-1]
            }
            
        except Exception as e:
            logger.warning(f"Error analyzing stability pattern: {e}")
            return {"trend": "unknown", "strength": 0.0, "volatility": 0.0}
    
    def _analyze_confidence_pattern(self, states: List[UnifiedState]) -> Dict[str, Any]:
        """Analyze confidence pattern in recent states"""
        try:
            if len(states) < 3:
                return {"trend": "unknown", "strength": 0.0, "volatility": 0.0}
            
            confidence_scores = [state.aggregated_confidence for state in states]
            
            # Calculate trend
            if len(confidence_scores) >= 2:
                trend_slope = (confidence_scores[-1] - confidence_scores[0]) / len(confidence_scores)
                if trend_slope > 1.0:
                    trend = "increasing"
                elif trend_slope < -1.0:
                    trend = "decreasing"
                else:
                    trend = "stable"
            else:
                trend = "unknown"
            
            # Calculate volatility
            volatility = statistics.stdev(confidence_scores) if len(confidence_scores) > 1 else 0.0
            
            # Calculate strength
            strength = abs(trend_slope) / 10 if 'trend_slope' in locals() else 0.0
            
            return {
                "trend": trend,
                "strength": min(1.0, strength),
                "volatility": min(1.0, volatility / 20),  # Normalize
                "current_level": confidence_scores[-1]
            }
            
        except Exception as e:
            logger.warning(f"Error analyzing confidence pattern: {e}")
            return {"trend": "unknown", "strength": 0.0, "volatility": 0.0}
    
    def _analyze_consensus_pattern(self, states: List[UnifiedState]) -> Dict[str, Any]:
        """Analyze consensus pattern in recent states"""
        try:
            if len(states) < 3:
                return {"trend": "unknown", "strength": 0.0, "volatility": 0.0}
            
            consensus_scores = [state.consensus_level for state in states]
            
            # Calculate trend
            if len(consensus_scores) >= 2:
                trend_slope = (consensus_scores[-1] - consensus_scores[0]) / len(consensus_scores)
                if trend_slope > 1.0:
                    trend = "improving"
                elif trend_slope < -1.0:
                    trend = "deteriorating"
                else:
                    trend = "stable"
            else:
                trend = "unknown"
            
            # Calculate volatility
            volatility = statistics.stdev(consensus_scores) if len(consensus_scores) > 1 else 0.0
            
            # Calculate strength
            strength = abs(trend_slope) / 10 if 'trend_slope' in locals() else 0.0
            
            return {
                "trend": trend,
                "strength": min(1.0, strength),
                "volatility": min(1.0, volatility / 20),  # Normalize
                "current_level": consensus_scores[-1]
            }
            
        except Exception as e:
            logger.warning(f"Error analyzing consensus pattern: {e}")
            return {"trend": "unknown", "strength": 0.0, "volatility": 0.0}
    
    def _generate_meta_cognitive_insight(self, stability_pattern: Dict[str, Any], 
                                       confidence_pattern: Dict[str, Any],
                                       consensus_pattern: Dict[str, Any],
                                       states: List[UnifiedState]) -> MetaCognitionInsight:
        """Generate meta-cognitive insight from pattern analysis"""
        try:
            insights = []
            confidence_sum = 0.0
            relevance_sum = 0.0
            
            # Analyze stability insights
            if stability_pattern["strength"] > 0.5:
                if stability_pattern["trend"] == "degrading":
                    insights.append("System stability is deteriorating, suggesting increased market stress")
                    confidence_sum += 0.8
                    relevance_sum += 0.9
                elif stability_pattern["trend"] == "improving":
                    insights.append("System stability is improving, indicating favorable conditions")
                    confidence_sum += 0.7
                    relevance_sum += 0.7
            
            # Analyze confidence insights
            if confidence_pattern["strength"] > 0.5:
                if confidence_pattern["trend"] == "decreasing":
                    insights.append("Execution confidence is declining, engines showing uncertainty")
                    confidence_sum += 0.8
                    relevance_sum += 0.9
                elif confidence_pattern["volatility"] > 0.7:
                    insights.append("Confidence levels are highly volatile, indicating system instability")
                    confidence_sum += 0.7
                    relevance_sum += 0.8
            
            # Analyze consensus insights
            if consensus_pattern["strength"] > 0.5:
                if consensus_pattern["trend"] == "deteriorating":
                    insights.append("Engine consensus is breaking down, conflicting signals increasing")
                    confidence_sum += 0.9
                    relevance_sum += 0.9
            
            # System fatigue insights
            if self.system_fatigue_index > 0.6:
                insights.append("System fatigue detected, performance degradation likely")
                confidence_sum += 0.8
                relevance_sum += 0.8
            
            # Risk pressure insights
            if self.risk_pressure_index > 0.7:
                insights.append("High risk pressure detected, defensive measures recommended")
                confidence_sum += 0.9
                relevance_sum += 1.0
            
            # Generate combined insight
            if insights:
                combined_insight = "; ".join(insights[:3])  # Top 3 insights
                avg_confidence = confidence_sum / len(insights)
                avg_relevance = relevance_sum / len(insights)
                insight_type = "pattern_analysis"
            else:
                combined_insight = "System operating within normal parameters, no significant patterns detected"
                avg_confidence = 0.6
                avg_relevance = 0.5
                insight_type = "normal_operation"
            
            return MetaCognitionInsight(
                insight_type=insight_type,
                insight_text=combined_insight,
                confidence=min(1.0, avg_confidence),
                relevance=min(1.0, avg_relevance),
                based_on_states=len(states),
                pattern_strength=max(stability_pattern["strength"], 
                                   confidence_pattern["strength"], 
                                   consensus_pattern["strength"]),
                predictive_value=avg_confidence * avg_relevance
            )
            
        except Exception as e:
            logger.warning(f"Error generating meta-cognitive insight: {e}")
            return MetaCognitionInsight(
                insight_type="error",
                insight_text=f"Insight generation failed: {str(e)}",
                confidence=0.1,
                relevance=0.1
            )
    
    def _detect_specific_anomaly(self, anomaly_type: AnomalyType, 
                               states: List[UnifiedState]) -> Optional[AnomalyDetection]:
        """Detect specific anomaly type in recent states"""
        try:
            if len(states) < 2:
                return None
            
            if anomaly_type == AnomalyType.HIGH_VOLATILITY_RISK:
                return self._detect_high_volatility_risk(states)
            elif anomaly_type == AnomalyType.REFLEX_OVERACTIVATION:
                return self._detect_reflex_overactivation(states)
            elif anomaly_type == AnomalyType.SHIELD_FATIGUE:
                return self._detect_shield_fatigue(states)
            elif anomaly_type == AnomalyType.CONTRADICTORY_SIGNALS:
                return self._detect_contradictory_signals(states)
            elif anomaly_type == AnomalyType.LOW_PRECISION:
                return self._detect_low_precision(states)
            elif anomaly_type == AnomalyType.RISING_LATENCY_DRIFT:
                return self._detect_rising_latency_drift(states)
            elif anomaly_type == AnomalyType.CONSENSUS_DEGRADATION:
                return self._detect_consensus_degradation(states)
            elif anomaly_type == AnomalyType.CONFIDENCE_INSTABILITY:
                return self._detect_confidence_instability(states)
            elif anomaly_type == AnomalyType.SYSTEM_OVERLOAD:
                return self._detect_system_overload(states)
            
            return None
            
        except Exception as e:
            logger.warning(f"Error detecting {anomaly_type.value}: {e}")
            return None
    
    def _detect_high_volatility_risk(self, states: List[UnifiedState]) -> Optional[AnomalyDetection]:
        """Detect high volatility risk anomaly"""
        try:
            # Check stability score variance
            stability_scores = [state.stability_score for state in states]
            if len(stability_scores) < 3:
                return None
            
            volatility = statistics.stdev(stability_scores)
            severity = min(1.0, volatility / 30)  # Normalize to 0-1
            
            if severity > 0.6:
                return AnomalyDetection(
                    anomaly_type=AnomalyType.HIGH_VOLATILITY_RISK,
                    severity=severity,
                    confidence=0.8,
                    description=f"High volatility detected in stability scores (σ={volatility:.1f})",
                    contributing_factors=["stability_variance", "market_stress"],
                    trend_duration=len(states),
                    impact_assessment="high"
                )
            
            return None
            
        except Exception as e:
            logger.warning(f"Error detecting high volatility risk: {e}")
            return None
    
    def _detect_reflex_overactivation(self, states: List[UnifiedState]) -> Optional[AnomalyDetection]:
        """Detect reflex overactivation anomaly"""
        try:
            # Count reflex-related signals
            total_signals = 0
            reflex_signals = 0
            
            for state in states:
                for signal in state.active_signals:
                    total_signals += 1
                    if signal.engine_type.value == "ExecutionReflexLoopEngine":
                        reflex_signals += 1
            
            if total_signals > 0:
                reflex_ratio = reflex_signals / total_signals
                severity = min(1.0, reflex_ratio * 2)  # High ratio = high severity
                
                if severity > 0.5:
                    return AnomalyDetection(
                        anomaly_type=AnomalyType.REFLEX_OVERACTIVATION,
                        severity=severity,
                        confidence=0.7,
                        description=f"Reflex system overactivation detected ({reflex_ratio:.1%} of signals)",
                        contributing_factors=["signal_frequency", "reflex_dominance"],
                        trend_duration=len(states),
                        impact_assessment="medium"
                    )
            
            return None
            
        except Exception as e:
            logger.warning(f"Error detecting reflex overactivation: {e}")
            return None
    
    def _detect_shield_fatigue(self, states: List[UnifiedState]) -> Optional[AnomalyDetection]:
        """Detect shield fatigue anomaly"""
        try:
            # Check for shield-related signals and stability
            shield_activations = 0
            low_stability_count = 0
            
            for state in states:
                # Count shield activations
                for signal in state.active_signals:
                    if signal.engine_type.value == "StabilityShieldEngine":
                        shield_activations += 1
                
                # Count low stability states
                if state.stability_score < 40:
                    low_stability_count += 1
            
            # Calculate fatigue indicators
            activation_rate = shield_activations / len(states)
            low_stability_rate = low_stability_count / len(states)
            
            # Combine indicators
            fatigue_score = (activation_rate + low_stability_rate) / 2
            severity = min(1.0, fatigue_score * 2)
            
            if severity > 0.4:
                return AnomalyDetection(
                    anomaly_type=AnomalyType.SHIELD_FATIGUE,
                    severity=severity,
                    confidence=0.6,
                    description=f"Shield fatigue detected (activation rate: {activation_rate:.1%})",
                    contributing_factors=["shield_overuse", "stability_degradation"],
                    trend_duration=len(states),
                    impact_assessment="medium"
                )
            
            return None
            
        except Exception as e:
            logger.warning(f"Error detecting shield fatigue: {e}")
            return None
    
    def _detect_contradictory_signals(self, states: List[UnifiedState]) -> Optional[AnomalyDetection]:
        """Detect contradictory signals anomaly"""
        try:
            total_conflicts = sum(len(state.conflicting_signals) for state in states)
            total_states = len(states)
            
            conflict_rate = total_conflicts / total_states if total_states > 0 else 0
            severity = min(1.0, conflict_rate / 3)  # 3 conflicts per state = max severity
            
            if severity > 0.3:
                return AnomalyDetection(
                    anomaly_type=AnomalyType.CONTRADICTORY_SIGNALS,
                    severity=severity,
                    confidence=0.8,
                    description=f"High rate of contradictory signals ({conflict_rate:.1f} per state)",
                    contributing_factors=["engine_disagreement", "signal_confusion"],
                    trend_duration=len(states),
                    impact_assessment="high"
                )
            
            return None
            
        except Exception as e:
            logger.warning(f"Error detecting contradictory signals: {e}")
            return None
    
    def _detect_low_precision(self, states: List[UnifiedState]) -> Optional[AnomalyDetection]:
        """Detect low precision anomaly"""
        try:
            # Check for precision-related signals and confidence levels
            precision_signals = 0
            low_confidence_count = 0
            
            for state in states:
                # Count precision-related signals
                for signal in state.active_signals:
                    if signal.engine_type.value == "ExecutionPrecisionCore":
                        precision_signals += 1
                        if signal.confidence < 60:
                            low_confidence_count += 1
                
                # Count overall low confidence states
                if state.aggregated_confidence < 50:
                    low_confidence_count += 1
            
            if precision_signals > 0:
                low_precision_rate = low_confidence_count / precision_signals
                severity = min(1.0, low_precision_rate * 1.5)
                
                if severity > 0.3:
                    return AnomalyDetection(
                        anomaly_type=AnomalyType.LOW_PRECISION,
                        severity=severity,
                        confidence=0.7,
                        description=f"Low precision detected ({low_precision_rate:.1%} low confidence)",
                        contributing_factors=["precision_degradation", "calibration_drift"],
                        trend_duration=len(states),
                        impact_assessment="medium"
                    )
            
            return None
            
        except Exception as e:
            logger.warning(f"Error detecting low precision: {e}")
            return None
    
    def _detect_rising_latency_drift(self, states: List[UnifiedState]) -> Optional[AnomalyDetection]:
        """Detect rising latency drift anomaly"""
        try:
            if len(states) < 5:
                return None
            
            latencies = [state.processing_latency for state in states]
            
            # Calculate trend
            n = len(latencies)
            x_values = list(range(n))
            x_mean = statistics.mean(x_values)
            y_mean = statistics.mean(latencies)
            
            numerator = sum((x_values[i] - x_mean) * (latencies[i] - y_mean) for i in range(n))
            denominator = sum((x_values[i] - x_mean) ** 2 for i in range(n))
            
            if denominator > 0:
                slope = numerator / denominator
                # Positive slope indicates rising latency
                severity = min(1.0, max(0, slope / 10))  # Normalize
                
                if severity > 0.4:
                    return AnomalyDetection(
                        anomaly_type=AnomalyType.RISING_LATENCY_DRIFT,
                        severity=severity,
                        confidence=0.8,
                        description=f"Rising latency drift detected (slope: {slope:.2f})",
                        contributing_factors=["system_load", "processing_degradation"],
                        trend_duration=len(states),
                        impact_assessment="medium"
                    )
            
            return None
            
        except Exception as e:
            logger.warning(f"Error detecting rising latency drift: {e}")
            return None
    
    def _detect_consensus_degradation(self, states: List[UnifiedState]) -> Optional[AnomalyDetection]:
        """Detect consensus degradation anomaly"""
        try:
            if len(states) < 3:
                return None
            
            consensus_levels = [state.consensus_level for state in states]
            
            # Check for declining consensus
            recent_avg = statistics.mean(consensus_levels[-3:])  # Last 3
            earlier_avg = statistics.mean(consensus_levels[:-3]) if len(consensus_levels) > 3 else recent_avg
            
            degradation = earlier_avg - recent_avg
            severity = min(1.0, degradation / 50)  # 50 point drop = max severity
            
            if severity > 0.3:
                return AnomalyDetection(
                    anomaly_type=AnomalyType.CONSENSUS_DEGRADATION,
                    severity=severity,
                    confidence=0.8,
                    description=f"Consensus degradation detected ({degradation:.1f} point decline)",
                    contributing_factors=["engine_divergence", "signal_complexity"],
                    trend_duration=len(states),
                    impact_assessment="high"
                )
            
            return None
            
        except Exception as e:
            logger.warning(f"Error detecting consensus degradation: {e}")
            return None
    
    def _detect_confidence_instability(self, states: List[UnifiedState]) -> Optional[AnomalyDetection]:
        """Detect confidence instability anomaly"""
        try:
            if len(states) < 3:
                return None
            
            confidence_scores = [state.aggregated_confidence for state in states]
            volatility = statistics.stdev(confidence_scores)
            
            severity = min(1.0, volatility / 25)  # 25 point std dev = max severity
            
            if severity > 0.4:
                return AnomalyDetection(
                    anomaly_type=AnomalyType.CONFIDENCE_INSTABILITY,
                    severity=severity,
                    confidence=0.7,
                    description=f"Confidence instability detected (σ={volatility:.1f})",
                    contributing_factors=["confidence_volatility", "signal_uncertainty"],
                    trend_duration=len(states),
                    impact_assessment="medium"
                )
            
            return None
            
        except Exception as e:
            logger.warning(f"Error detecting confidence instability: {e}")
            return None
    
    def _detect_system_overload(self, states: List[UnifiedState]) -> Optional[AnomalyDetection]:
        """Detect system overload anomaly"""
        try:
            # Check multiple overload indicators
            high_latency_count = 0
            high_signal_count = 0
            high_conflict_count = 0
            
            for state in states:
                if state.processing_latency > 500:  # 500ms threshold
                    high_latency_count += 1
                if len(state.active_signals) > 8:  # 8+ signals
                    high_signal_count += 1
                if len(state.conflicting_signals) > 3:  # 3+ conflicts
                    high_conflict_count += 1
            
            # Calculate overload score
            total_states = len(states)
            overload_indicators = [
                high_latency_count / total_states,
                high_signal_count / total_states,
                high_conflict_count / total_states,
                self.system_fatigue_index  # Include current fatigue
            ]
            
            overload_score = statistics.mean(overload_indicators)
            severity = min(1.0, overload_score * 1.5)
            
            if severity > 0.6:
                return AnomalyDetection(
                    anomaly_type=AnomalyType.SYSTEM_OVERLOAD,
                    severity=severity,
                    confidence=0.9,
                    description=f"System overload detected (score: {overload_score:.2f})",
                    contributing_factors=["high_latency", "signal_overload", "conflict_overload", "system_fatigue"],
                    trend_duration=len(states),
                    impact_assessment="critical"
                )
            
            return None
            
        except Exception as e:
            logger.warning(f"Error detecting system overload: {e}")
            return None
    
    def _generate_recommended_parameters(self, action: AdaptiveAction, 
                                       anomalies: List[AnomalyDetection]) -> Dict[str, Any]:
        """Generate recommended parameters for adaptive action"""
        try:
            params = {}
            
            if action == AdaptiveAction.SWITCH_DEFENSIVE_MODE:
                params = {
                    "risk_multiplier": 0.5,
                    "position_size_limit": 0.02,  # 2% max
                    "stop_loss_tightening": 0.3
                }
            
            elif action == AdaptiveAction.ACTIVATE_SHIELD:
                params = {
                    "shield_sensitivity": 0.8,
                    "protection_level": "high",
                    "response_time": "immediate"
                }
            
            elif action == AdaptiveAction.DELAY_EXECUTION:
                delay_severity = max([a.severity for a in anomalies]) if anomalies else 0.5
                params = {
                    "delay_duration": int(delay_severity * 30),  # 0-30 seconds
                    "reassessment_interval": 5
                }
            
            elif action == AdaptiveAction.REDUCE_POSITION_SIZING:
                sizing_reduction = 1 - max([a.severity for a in anomalies]) if anomalies else 0.5
                params = {
                    "size_multiplier": max(0.1, sizing_reduction),
                    "gradual_reduction": True
                }
            
            elif action == AdaptiveAction.INCREASE_HEDGE_LEVEL:
                hedge_severity = max([a.severity for a in anomalies]) if anomalies else 0.5
                params = {
                    "hedge_ratio": min(0.8, 0.2 + hedge_severity * 0.6),
                    "hedge_type": "dynamic"
                }
            
            elif action == AdaptiveAction.HALT_TRADING_TEMPORARILY:
                halt_duration = max([a.severity for a in anomalies]) if anomalies else 0.5
                params = {
                    "halt_duration": int(halt_duration * 300),  # 0-300 seconds
                    "restart_conditions": ["anomalies_resolved", "manual_override"]
                }
            
            # Add general parameters
            params.update({
                "anomaly_count": len(anomalies),
                "system_fatigue": self.system_fatigue_index,
                "risk_pressure": self.risk_pressure_index,
                "consciousness_score": self.consciousness_score
            })
            
            return params
            
        except Exception as e:
            logger.warning(f"Error generating recommended parameters: {e}")
            return {"error": str(e)}
    
    def _calculate_adaptation_confidence(self, anomalies: List[AnomalyDetection], 
                                       insight: MetaCognitionInsight) -> float:
        """Calculate confidence in the adaptive recommendation"""
        try:
            # Base confidence factors
            anomaly_clarity = 1.0 if anomalies else 0.3  # Clear anomalies = high confidence
            insight_confidence = insight.confidence
            system_awareness = self.consciousness_score / 100
            
            # Penalty for system stress
            stress_penalty = max(0, (self.system_fatigue_index - 0.5) * 0.5)
            pressure_penalty = max(0, (self.risk_pressure_index - 0.5) * 0.3)
            
            # Calculate final confidence
            confidence = (anomaly_clarity + insight_confidence + system_awareness) / 3
            confidence -= (stress_penalty + pressure_penalty)
            
            return max(0.0, min(1.0, confidence)) * 100  # Convert to 0-100 scale
            
        except Exception as e:
            logger.warning(f"Error calculating adaptation confidence: {e}")
            return 50.0  # Neutral confidence
    
    def _calculate_overall_health_score(self) -> None:
        """Calculate overall system health score"""
        try:
            health_factors = []
            
            # Consciousness factor
            health_factors.append(self.consciousness_score / 100)
            
            # Fatigue factor (inverted)
            health_factors.append(1 - self.system_fatigue_index)
            
            # Risk pressure factor (inverted)
            health_factors.append(1 - self.risk_pressure_index)
            
            # Stability factor
            if len(self.ens_state_memory) > 0:
                recent_stability = statistics.mean(
                    [state.stability_score for state in list(self.ens_state_memory)[-5:]]
                )
                health_factors.append(recent_stability / 100)
            
            # Overall health score
            self.system_metrics.overall_health_score = statistics.mean(health_factors) * 100
            
        except Exception as e:
            logger.warning(f"Error calculating overall health score: {e}")


# Global instance
_execution_consciousness_layer: Optional[ExecutionConsciousnessLayer] = None


def get_execution_consciousness_layer() -> ExecutionConsciousnessLayer:
    """Get or create the global Execution Consciousness Layer instance"""
    global _execution_consciousness_layer
    if _execution_consciousness_layer is None:
        _execution_consciousness_layer = ExecutionConsciousnessLayer()
    return _execution_consciousness_layer


# Convenience functions for external integration
def observe_ens_state(state_data: Dict[str, Any]) -> None:
    """
    Observe ENS state through consciousness layer
    
    Args:
        state_data: ENS unified state data
    """
    try:
        ecl = get_execution_consciousness_layer()
        
        # Convert to UnifiedState (mock for now)
        # In real implementation, this would parse the actual state data
        # ecl.observe_ens_state(unified_state)
        
    except Exception as e:
        logger.error(f"Error in observe_ens_state: {e}")


def get_consciousness_report() -> Dict[str, Any]:
    """
    Get consciousness layer report
    
    Returns:
        Dict: Consciousness report data
    """
    try:
        ecl = get_execution_consciousness_layer()
        report = ecl.get_consciousness_report()
        return report.to_dict()
        
    except Exception as e:
        logger.error(f"Error in get_consciousness_report: {e}")
        return {
            "action_recommendation": "halt_trading_temporarily",
            "consciousness_score": 30.0,
            "anomaly_list": ["system_error"],
            "meta_cognition_insight": f"Report generation failed: {str(e)}",
            "timestamp": time.time(),
            "error": str(e)
        }


def get_ecl_status() -> Dict[str, Any]:
    """
    Get Execution Consciousness Layer status
    
    Returns:
        Dict: ECL status data
    """
    try:
        ecl = get_execution_consciousness_layer()
        return ecl.get_system_status()
        
    except Exception as e:
        logger.error(f"Error in get_ecl_status: {e}")
        return {"error": str(e)}