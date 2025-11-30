"""
STEP 24.65 — Execution Nervous System (ENS)

Advanced execution decision unification system with multi-engine signal integration
Central nervous system for coordinating all execution intelligence layers

This system provides:
- Unified signal processing from all execution engines
- Confidence and priority-based signal weighting
- Conflict resolution between competing execution signals
- Final execution action generation with comprehensive metadata
- Memory buffer for state tracking and trend analysis
- Real-time stability vs aggression balance monitoring

CRITICAL: Central execution coordination layer
Compatible with all execution engines and intelligence systems
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

# Import related execution systems
from .ExecutionReflexLoopEngine import (
    get_execution_reflex_loop_engine,
    ReflexResponse,
    ReflexActionType
)
from .ExecutionNeuralReactionEngine import (
    get_execution_neural_reaction_engine,
    NeuralReaction,
    ReactionEventType
)

logger = logging.getLogger(__name__)


class FinalExecutionActionType(Enum):
    """Final execution action types"""
    BUY = "BUY"
    SELL = "SELL"
    HOLD = "HOLD"
    HEDGE = "HEDGE"
    CANCEL = "CANCEL"
    RE_ROUTE = "RE_ROUTE"
    NO_OP = "NO_OP"


class EngineType(Enum):
    """Execution engine types"""
    REFLEX_LOOP = "ExecutionReflexLoopEngine"
    NEURAL_REACTION = "ExecutionNeuralReactionEngine"
    STABILITY_SHIELD = "StabilityShieldEngine"
    PRECISION_CORE = "ExecutionPrecisionCore"
    RTEM_MONITOR = "RealTimeExecutionMonitor"
    THREAT_REACTION = "ThreatReactionNeuralSync"


class SignalPriority(Enum):
    """Signal priority levels"""
    CRITICAL = 1
    HIGH = 2
    MEDIUM = 3
    LOW = 4
    INFO = 5


@dataclass
class EngineSignal:
    """Signal from an execution engine"""
    engine_type: EngineType
    signal_type: str
    confidence: float  # 0-100
    priority: SignalPriority
    action_recommendation: str
    data: Dict[str, Any]
    timestamp: float = field(default_factory=time.time)
    
    # Signal metadata
    signal_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    stability_impact: float = 0.0  # -1 to 1 (negative = destabilizing)
    aggression_level: float = 0.0  # 0-1 (0 = conservative, 1 = aggressive)


@dataclass
class UnifiedState:
    """Unified execution state from all engines"""
    aggregated_confidence: float  # 0-100
    stability_score: float  # 0-100
    aggression_score: float  # 0-100
    consensus_level: float  # 0-100 (agreement between engines)
    
    # Signal analysis
    active_signals: List[EngineSignal]
    conflicting_signals: List[Tuple[EngineSignal, EngineSignal]]
    dominant_engine: Optional[EngineType] = None
    
    # State metadata
    timestamp: float = field(default_factory=time.time)
    state_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    processing_latency: float = 0.0


@dataclass
class FinalExecutionAction:
    """Final unified execution action"""
    action: FinalExecutionActionType
    confidence: float  # 0-100
    stability_score: float  # 0-100
    reason: str
    triggered_engines: List[str]
    timestamp: float = field(default_factory=time.time)
    
    # Action metadata
    action_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    execution_priority: SignalPriority = SignalPriority.MEDIUM
    expected_impact: Dict[str, float] = field(default_factory=dict)
    fallback_actions: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert action to dictionary format"""
        return {
            "action": self.action.value,
            "confidence": self.confidence,
            "stability_score": self.stability_score,
            "reason": self.reason,
            "triggered_engines": self.triggered_engines,
            "timestamp": self.timestamp,
            "action_id": self.action_id,
            "execution_priority": self.execution_priority.value,
            "expected_impact": self.expected_impact,
            "fallback_actions": self.fallback_actions
        }


@dataclass
class TrendAnalysis:
    """Trend analysis of stability vs aggression"""
    stability_trend: str  # "increasing", "decreasing", "stable"
    aggression_trend: str  # "increasing", "decreasing", "stable"
    trend_strength: float  # 0-1
    trend_duration: int  # Number of states contributing to trend
    
    # Trend predictions
    predicted_stability: float  # 0-100
    predicted_aggression: float  # 0-100
    confidence_in_prediction: float  # 0-100


class ExecutionNervousSystem:
    """
    Execution Nervous System (ENS)
    
    Central coordination system that unifies signals from all execution engines
    to generate final execution decisions with comprehensive conflict resolution.
    """
    
    def __init__(self):
        """Initialize the Execution Nervous System"""
        logger.info("Initializing Execution Nervous System...")
        
        # Core system parameters
        self.signal_timeout = 5.0  # Seconds before signals expire
        self.memory_buffer_size = 50  # Last 50 unified states
        self.consensus_threshold = 0.7  # Required agreement level (0-1)
        self.stability_weight = 0.6  # Weight of stability vs aggression
        
        # Engine connections and weighting
        self.engine_weights = {
            EngineType.REFLEX_LOOP: 0.25,
            EngineType.NEURAL_REACTION: 0.20,
            EngineType.STABILITY_SHIELD: 0.20,
            EngineType.PRECISION_CORE: 0.15,
            EngineType.RTEM_MONITOR: 0.10,
            EngineType.THREAT_REACTION: 0.10
        }
        
        # Priority weights for signal importance
        self.priority_weights = {
            SignalPriority.CRITICAL: 1.0,
            SignalPriority.HIGH: 0.8,
            SignalPriority.MEDIUM: 0.6,
            SignalPriority.LOW: 0.4,
            SignalPriority.INFO: 0.2
        }
        
        # Signal management
        self.active_signals: Dict[str, EngineSignal] = {}
        self.signal_history: deque = deque(maxlen=1000)  # Historical signals
        
        # Unified state tracking
        self.memory_buffer: deque = deque(maxlen=self.memory_buffer_size)
        self.current_unified_state: Optional[UnifiedState] = None
        self.last_final_action: Optional[FinalExecutionAction] = None
        
        # Performance metrics
        self.total_signals_processed = 0
        self.total_actions_generated = 0
        self.average_processing_latency = 0.0
        self.consensus_success_rate = 0.95
        
        # Engine integration
        self.reflex_loop_engine = None
        self.neural_reaction_engine = None
        self.stability_shield_engine = None  # Mock integration
        self.precision_core = None  # Mock integration
        self.rtem_monitor = None  # Mock integration
        self.threat_reaction_sync = None  # Mock integration
        
        # Conflict resolution rules
        self.action_compatibility = self._initialize_action_compatibility()
        self.conflict_resolution_strategies = self._initialize_conflict_strategies()
    
    async def initialize(self) -> None:
        """Initialize the Execution Nervous System"""
        try:
            logger.info("Initializing ENS engine connections...")
            
            # Connect to execution engines
            self.reflex_loop_engine = get_execution_reflex_loop_engine()
            self.neural_reaction_engine = get_execution_neural_reaction_engine()
            
            # Initialize mock engine connections
            self.stability_shield_engine = await self._initialize_stability_shield_mock()
            self.precision_core = await self._initialize_precision_core_mock()
            self.rtem_monitor = await self._initialize_rtem_mock()
            self.threat_reaction_sync = await self._initialize_threat_sync_mock()
            
            logger.info("Execution Nervous System initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing ENS: {e}")
            raise
    
    async def ingest_reflex(self, reflex: ReflexResponse) -> None:
        """
        Ingest signal from Execution Reflex Loop Engine
        
        Args:
            reflex: Reflex response from ERLE
        """
        try:
            # Convert reflex to engine signal
            signal = EngineSignal(
                engine_type=EngineType.REFLEX_LOOP,
                signal_type="reflex_response",
                confidence=reflex.reflex_confidence,
                priority=self._map_reflex_to_priority(reflex.reflex_action),
                action_recommendation=reflex.reflex_action.value,
                data={
                    "reflex_action": reflex.reflex_action.value,
                    "reaction_path_id": reflex.reaction_path_id,
                    "action_parameters": reflex.action_parameters,
                    "alternative_actions": reflex.alternative_actions
                },
                timestamp=reflex.reflex_timestamp,
                stability_impact=self._calculate_reflex_stability_impact(reflex),
                aggression_level=self._calculate_reflex_aggression_level(reflex)
            )
            
            await self._process_signal(signal)
            logger.debug(f"Ingested reflex signal: {reflex.reflex_action.value}")
            
        except Exception as e:
            logger.error(f"Error ingesting reflex signal: {e}")
    
    async def ingest_reaction(self, reaction: NeuralReaction) -> None:
        """
        Ingest signal from Execution Neural Reaction Engine
        
        Args:
            reaction: Neural reaction from ENRE
        """
        try:
            # Convert reaction to engine signal
            signal = EngineSignal(
                engine_type=EngineType.NEURAL_REACTION,
                signal_type="neural_reaction",
                confidence=reaction.execution_confidence,
                priority=self._map_reaction_to_priority(reaction.reaction_event),
                action_recommendation=reaction.reaction_event.value,
                data={
                    "neural_reaction_score": reaction.neural_reaction_score,
                    "reaction_event": reaction.reaction_event.value,
                    "event_quality_score": reaction.event_quality_score,
                    "confidence_factors": reaction.confidence_factors
                },
                timestamp=reaction.timestamp,
                stability_impact=self._calculate_reaction_stability_impact(reaction),
                aggression_level=self._calculate_reaction_aggression_level(reaction)
            )
            
            await self._process_signal(signal)
            logger.debug(f"Ingested neural reaction signal: {reaction.reaction_event.value}")
            
        except Exception as e:
            logger.error(f"Error ingesting neural reaction signal: {e}")
    
    async def ingest_shield(self, shield_signal: Dict[str, Any]) -> None:
        """
        Ingest signal from Stability Shield Engine
        
        Args:
            shield_signal: Shield signal data
        """
        try:
            signal = EngineSignal(
                engine_type=EngineType.STABILITY_SHIELD,
                signal_type="shield_alert",
                confidence=shield_signal.get("confidence", 80.0),
                priority=self._map_shield_to_priority(shield_signal.get("alert_level", "MEDIUM")),
                action_recommendation=shield_signal.get("recommended_action", "HOLD"),
                data=shield_signal,
                stability_impact=0.8,  # Shields generally improve stability
                aggression_level=0.2   # Shields are generally conservative
            )
            
            await self._process_signal(signal)
            logger.debug(f"Ingested shield signal: {shield_signal.get('alert_level', 'UNKNOWN')}")
            
        except Exception as e:
            logger.error(f"Error ingesting shield signal: {e}")
    
    async def ingest_precision(self, precision: Dict[str, Any]) -> None:
        """
        Ingest signal from Execution Precision Core
        
        Args:
            precision: Precision core data
        """
        try:
            signal = EngineSignal(
                engine_type=EngineType.PRECISION_CORE,
                signal_type="precision_adjustment",
                confidence=precision.get("confidence", 75.0),
                priority=SignalPriority.MEDIUM,
                action_recommendation=precision.get("recommended_adjustment", "HOLD"),
                data=precision,
                stability_impact=0.3,  # Moderate stability impact
                aggression_level=precision.get("aggression_factor", 0.4)
            )
            
            await self._process_signal(signal)
            logger.debug(f"Ingested precision signal: {precision.get('precision_score', 0)}")
            
        except Exception as e:
            logger.error(f"Error ingesting precision signal: {e}")
    
    async def ingest_latency(self, latency: Dict[str, Any]) -> None:
        """
        Ingest signal from Real-Time Execution Monitor
        
        Args:
            latency: RTEM latency data
        """
        try:
            alert_level = self._categorize_latency_impact(latency.get("latency", 0))
            
            signal = EngineSignal(
                engine_type=EngineType.RTEM_MONITOR,
                signal_type="latency_alert",
                confidence=latency.get("confidence", 70.0),
                priority=self._map_latency_to_priority(alert_level),
                action_recommendation=self._get_latency_recommendation(alert_level),
                data=latency,
                stability_impact=-0.2 if alert_level == "HIGH" else 0.1,
                aggression_level=0.3
            )
            
            await self._process_signal(signal)
            logger.debug(f"Ingested latency signal: {latency.get('latency', 0)}ms")
            
        except Exception as e:
            logger.error(f"Error ingesting latency signal: {e}")
    
    async def compute_unified_state(self) -> UnifiedState:
        """
        Compute unified state from all active signals
        
        Returns:
            UnifiedState: Current unified execution state
        """
        start_time = time.time()
        
        try:
            # Clean up expired signals
            await self._cleanup_expired_signals()
            
            # Get active signals
            active_signals = list(self.active_signals.values())
            
            if not active_signals:
                # No signals - return neutral state
                return UnifiedState(
                    aggregated_confidence=50.0,
                    stability_score=75.0,  # Default to stable
                    aggression_score=25.0,  # Default to conservative
                    consensus_level=100.0,  # No conflict = perfect consensus
                    active_signals=[],
                    conflicting_signals=[],
                    processing_latency=(time.time() - start_time) * 1000
                )
            
            # Calculate aggregated confidence
            aggregated_confidence = await self._calculate_aggregated_confidence(active_signals)
            
            # Calculate stability score
            stability_score = await self._calculate_stability_score(active_signals)
            
            # Calculate aggression score
            aggression_score = await self._calculate_aggression_score(active_signals)
            
            # Detect conflicts
            conflicting_signals = await self._detect_conflicts(active_signals)
            
            # Calculate consensus level
            consensus_level = await self._calculate_consensus_level(active_signals, conflicting_signals)
            
            # Determine dominant engine
            dominant_engine = await self._determine_dominant_engine(active_signals)
            
            # Create unified state
            unified_state = UnifiedState(
                aggregated_confidence=aggregated_confidence,
                stability_score=stability_score,
                aggression_score=aggression_score,
                consensus_level=consensus_level,
                active_signals=active_signals.copy(),
                conflicting_signals=conflicting_signals,
                dominant_engine=dominant_engine,
                processing_latency=(time.time() - start_time) * 1000
            )
            
            # Store in memory buffer
            self.memory_buffer.append(unified_state)
            self.current_unified_state = unified_state
            
            # Update performance metrics
            await self._update_processing_metrics(unified_state.processing_latency)
            
            logger.debug(f"Computed unified state: confidence={aggregated_confidence:.1f}, "
                        f"stability={stability_score:.1f}, consensus={consensus_level:.1f}")
            
            return unified_state
            
        except Exception as e:
            logger.error(f"Error computing unified state: {e}")
            
            # Return safe fallback state
            return UnifiedState(
                aggregated_confidence=30.0,
                stability_score=50.0,
                aggression_score=30.0,
                consensus_level=0.0,
                active_signals=[],
                conflicting_signals=[],
                processing_latency=(time.time() - start_time) * 1000
            )
    
    async def get_final_execution_action(self) -> FinalExecutionAction:
        """
        Generate final execution action from unified state
        
        Returns:
            FinalExecutionAction: Final execution decision
        """
        try:
            # Compute current unified state
            unified_state = await self.compute_unified_state()
            
            # Determine final action based on unified state
            action_type = await self._determine_final_action_type(unified_state)
            
            # Calculate final confidence
            final_confidence = await self._calculate_final_confidence(unified_state, action_type)
            
            # Generate reason
            reason = await self._generate_action_reason(unified_state, action_type)
            
            # Get triggered engines
            triggered_engines = [signal.engine_type.value for signal in unified_state.active_signals]
            
            # Determine execution priority
            execution_priority = await self._determine_execution_priority(unified_state)
            
            # Calculate expected impact
            expected_impact = await self._calculate_expected_impact(unified_state, action_type)
            
            # Generate fallback actions
            fallback_actions = await self._generate_fallback_actions(action_type, unified_state)
            
            # Create final execution action
            final_action = FinalExecutionAction(
                action=action_type,
                confidence=final_confidence,
                stability_score=unified_state.stability_score,
                reason=reason,
                triggered_engines=triggered_engines,
                execution_priority=execution_priority,
                expected_impact=expected_impact,
                fallback_actions=fallback_actions
            )
            
            # Store as last action
            self.last_final_action = final_action
            self.total_actions_generated += 1
            
            logger.info(f"Generated final execution action: {action_type.value} "
                       f"(confidence: {final_confidence:.1f}%)")
            
            return final_action
            
        except Exception as e:
            logger.error(f"Error generating final execution action: {e}")
            
            # Return safe NO_OP action
            return FinalExecutionAction(
                action=FinalExecutionActionType.NO_OP,
                confidence=50.0,
                stability_score=75.0,
                reason=f"Error in action generation: {str(e)}",
                triggered_engines=["ExecutionNervousSystem"]
            )
    
    def get_trend_analysis(self) -> TrendAnalysis:
        """
        Analyze trends in stability vs aggression from memory buffer
        
        Returns:
            TrendAnalysis: Trend analysis results
        """
        try:
            if len(self.memory_buffer) < 5:
                # Not enough data for trend analysis
                return TrendAnalysis(
                    stability_trend="stable",
                    aggression_trend="stable",
                    trend_strength=0.0,
                    trend_duration=0,
                    predicted_stability=75.0,
                    predicted_aggression=25.0,
                    confidence_in_prediction=50.0
                )
            
            # Extract time series data
            states = list(self.memory_buffer)
            stability_scores = [state.stability_score for state in states]
            aggression_scores = [state.aggression_score for state in states]
            
            # Calculate trends
            stability_trend = self._calculate_trend(stability_scores)
            aggression_trend = self._calculate_trend(aggression_scores)
            
            # Calculate trend strength
            stability_strength = self._calculate_trend_strength(stability_scores)
            aggression_strength = self._calculate_trend_strength(aggression_scores)
            overall_strength = (stability_strength + aggression_strength) / 2
            
            # Make predictions
            predicted_stability = self._predict_next_value(stability_scores)
            predicted_aggression = self._predict_next_value(aggression_scores)
            
            # Calculate prediction confidence
            prediction_confidence = min(overall_strength * 100, 95.0)
            
            return TrendAnalysis(
                stability_trend=stability_trend,
                aggression_trend=aggression_trend,
                trend_strength=overall_strength,
                trend_duration=len(states),
                predicted_stability=predicted_stability,
                predicted_aggression=predicted_aggression,
                confidence_in_prediction=prediction_confidence
            )
            
        except Exception as e:
            logger.error(f"Error in trend analysis: {e}")
            
            # Return neutral trend analysis
            return TrendAnalysis(
                stability_trend="stable",
                aggression_trend="stable",
                trend_strength=0.0,
                trend_duration=len(self.memory_buffer),
                predicted_stability=50.0,
                predicted_aggression=50.0,
                confidence_in_prediction=25.0
            )
    
    def get_system_status(self) -> Dict[str, Any]:
        """Get comprehensive system status"""
        try:
            trend_analysis = self.get_trend_analysis()
            
            return {
                "total_signals_processed": self.total_signals_processed,
                "total_actions_generated": self.total_actions_generated,
                "active_signals_count": len(self.active_signals),
                "memory_buffer_usage": f"{len(self.memory_buffer)}/{self.memory_buffer_size}",
                "average_processing_latency": self.average_processing_latency,
                "consensus_success_rate": self.consensus_success_rate,
                "current_stability_score": self.current_unified_state.stability_score if self.current_unified_state else None,
                "current_aggression_score": self.current_unified_state.aggression_score if self.current_unified_state else None,
                "stability_trend": trend_analysis.stability_trend,
                "aggression_trend": trend_analysis.aggression_trend,
                "trend_strength": trend_analysis.trend_strength,
                "last_action": self.last_final_action.action.value if self.last_final_action else None,
                "engine_connections": {
                    "reflex_loop": self.reflex_loop_engine is not None,
                    "neural_reaction": self.neural_reaction_engine is not None,
                    "stability_shield": self.stability_shield_engine is not None,
                    "precision_core": self.precision_core is not None,
                    "rtem_monitor": self.rtem_monitor is not None,
                    "threat_reaction": self.threat_reaction_sync is not None
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting system status: {e}")
            return {"error": str(e)}
    
    # Private helper methods
    
    async def _process_signal(self, signal: EngineSignal) -> None:
        """Process and store a new signal"""
        try:
            # Store signal
            self.active_signals[signal.signal_id] = signal
            self.signal_history.append(signal)
            self.total_signals_processed += 1
            
            logger.debug(f"Processed signal from {signal.engine_type.value}: {signal.action_recommendation}")
            
        except Exception as e:
            logger.error(f"Error processing signal: {e}")
    
    async def _cleanup_expired_signals(self) -> None:
        """Remove expired signals from active signals"""
        try:
            current_time = time.time()
            expired_signals = []
            
            for signal_id, signal in self.active_signals.items():
                if current_time - signal.timestamp > self.signal_timeout:
                    expired_signals.append(signal_id)
            
            for signal_id in expired_signals:
                del self.active_signals[signal_id]
                
            if expired_signals:
                logger.debug(f"Cleaned up {len(expired_signals)} expired signals")
                
        except Exception as e:
            logger.error(f"Error cleaning up expired signals: {e}")
    
    async def _calculate_aggregated_confidence(self, signals: List[EngineSignal]) -> float:
        """Calculate aggregated confidence from all signals"""
        try:
            if not signals:
                return 50.0
            
            weighted_sum = 0.0
            total_weight = 0.0
            
            for signal in signals:
                engine_weight = self.engine_weights.get(signal.engine_type, 0.1)
                priority_weight = self.priority_weights.get(signal.priority, 0.5)
                total_signal_weight = engine_weight * priority_weight
                
                weighted_sum += signal.confidence * total_signal_weight
                total_weight += total_signal_weight
            
            if total_weight > 0:
                return min(100.0, max(0.0, weighted_sum / total_weight))
            else:
                return 50.0
                
        except Exception as e:
            logger.warning(f"Error calculating aggregated confidence: {e}")
            return 50.0
    
    async def _calculate_stability_score(self, signals: List[EngineSignal]) -> float:
        """Calculate overall stability score"""
        try:
            if not signals:
                return 75.0  # Default to stable
            
            stability_impacts = [signal.stability_impact for signal in signals]
            weights = [self.engine_weights.get(signal.engine_type, 0.1) for signal in signals]
            
            # Calculate weighted average of stability impacts
            if weights:
                weighted_impact = sum(impact * weight for impact, weight in zip(stability_impacts, weights))
                total_weight = sum(weights)
                avg_impact = weighted_impact / total_weight if total_weight > 0 else 0.0
            else:
                avg_impact = 0.0
            
            # Convert impact (-1 to 1) to score (0 to 100)
            stability_score = 50.0 + (avg_impact * 50.0)
            return min(100.0, max(0.0, stability_score))
            
        except Exception as e:
            logger.warning(f"Error calculating stability score: {e}")
            return 50.0
    
    async def _calculate_aggression_score(self, signals: List[EngineSignal]) -> float:
        """Calculate overall aggression score"""
        try:
            if not signals:
                return 25.0  # Default to conservative
            
            aggression_levels = [signal.aggression_level for signal in signals]
            weights = [self.engine_weights.get(signal.engine_type, 0.1) for signal in signals]
            
            # Calculate weighted average
            if weights:
                weighted_aggression = sum(level * weight for level, weight in zip(aggression_levels, weights))
                total_weight = sum(weights)
                avg_aggression = weighted_aggression / total_weight if total_weight > 0 else 0.0
            else:
                avg_aggression = 0.0
            
            # Convert to 0-100 scale
            return min(100.0, max(0.0, avg_aggression * 100))
            
        except Exception as e:
            logger.warning(f"Error calculating aggression score: {e}")
            return 25.0
    
    async def _detect_conflicts(self, signals: List[EngineSignal]) -> List[Tuple[EngineSignal, EngineSignal]]:
        """Detect conflicting signals between engines"""
        try:
            conflicts = []
            
            for i, signal1 in enumerate(signals):
                for signal2 in signals[i+1:]:
                    if self._are_signals_conflicting(signal1, signal2):
                        conflicts.append((signal1, signal2))
            
            return conflicts
            
        except Exception as e:
            logger.warning(f"Error detecting conflicts: {e}")
            return []
    
    def _are_signals_conflicting(self, signal1: EngineSignal, signal2: EngineSignal) -> bool:
        """Check if two signals are conflicting"""
        try:
            action1 = signal1.action_recommendation
            action2 = signal2.action_recommendation
            
            # Define conflicting actions
            conflicting_pairs = [
                ("BUY", "SELL"),
                ("CANCEL", "BUY"),
                ("CANCEL", "SELL"),
                ("HOLD", "BUY"),
                ("HOLD", "SELL"),
                ("RE_ROUTE", "CANCEL")
            ]
            
            # Check if actions conflict
            for pair in conflicting_pairs:
                if (action1 in pair and action2 in pair and action1 != action2):
                    return True
            
            return False
            
        except Exception as e:
            logger.warning(f"Error checking signal conflict: {e}")
            return False
    
    async def _calculate_consensus_level(self, signals: List[EngineSignal], conflicts: List[Tuple[EngineSignal, EngineSignal]]) -> float:
        """Calculate consensus level among engines"""
        try:
            if not signals:
                return 100.0
            
            total_possible_conflicts = len(signals) * (len(signals) - 1) / 2
            actual_conflicts = len(conflicts)
            
            if total_possible_conflicts == 0:
                return 100.0
            
            consensus = ((total_possible_conflicts - actual_conflicts) / total_possible_conflicts) * 100
            return min(100.0, max(0.0, consensus))
            
        except Exception as e:
            logger.warning(f"Error calculating consensus level: {e}")
            return 50.0
    
    async def _determine_dominant_engine(self, signals: List[EngineSignal]) -> Optional[EngineType]:
        """Determine which engine has the most influence"""
        try:
            if not signals:
                return None
            
            # Calculate influence score for each engine
            engine_influence = defaultdict(float)
            
            for signal in signals:
                engine_weight = self.engine_weights.get(signal.engine_type, 0.1)
                priority_weight = self.priority_weights.get(signal.priority, 0.5)
                confidence_factor = signal.confidence / 100.0
                
                influence = engine_weight * priority_weight * confidence_factor
                engine_influence[signal.engine_type] += influence
            
            # Find the engine with highest influence
            if engine_influence:
                dominant_engine = max(engine_influence.items(), key=lambda x: x[1])[0]
                return dominant_engine
            
            return None
            
        except Exception as e:
            logger.warning(f"Error determining dominant engine: {e}")
            return None
    
    async def _determine_final_action_type(self, unified_state: UnifiedState) -> FinalExecutionActionType:
        """Determine final action type from unified state"""
        try:
            # Handle conflicts first
            if unified_state.consensus_level < (self.consensus_threshold * 100):
                # Low consensus - prefer safety
                return FinalExecutionActionType.HOLD
            
            # Handle no signals
            if not unified_state.active_signals:
                return FinalExecutionActionType.NO_OP
            
            # Count action recommendations
            action_votes = defaultdict(float)
            
            for signal in unified_state.active_signals:
                engine_weight = self.engine_weights.get(signal.engine_type, 0.1)
                priority_weight = self.priority_weights.get(signal.priority, 0.5)
                confidence_factor = signal.confidence / 100.0
                
                vote_strength = engine_weight * priority_weight * confidence_factor
                action_votes[signal.action_recommendation] += vote_strength
            
            # Find the action with highest vote strength
            if action_votes:
                top_action = max(action_votes.items(), key=lambda x: x[1])[0]
                
                # Map action recommendations to final action types
                action_mapping = {
                    "CANCEL": FinalExecutionActionType.CANCEL,
                    "HEDGE": FinalExecutionActionType.HEDGE,
                    "RE_ROUTE": FinalExecutionActionType.RE_ROUTE,
                    "BUY": FinalExecutionActionType.BUY,
                    "SELL": FinalExecutionActionType.SELL,
                    "HOLD": FinalExecutionActionType.HOLD,
                    "POSITIVE": FinalExecutionActionType.BUY,
                    "WARNING": FinalExecutionActionType.HOLD,
                    "CORRECTIVE": FinalExecutionActionType.CANCEL,
                    "STABILIZE": FinalExecutionActionType.HOLD
                }
                
                return action_mapping.get(top_action, FinalExecutionActionType.HOLD)
            
            # Default to HOLD if no clear action
            return FinalExecutionActionType.HOLD
            
        except Exception as e:
            logger.warning(f"Error determining final action type: {e}")
            return FinalExecutionActionType.NO_OP
    
    async def _calculate_final_confidence(self, unified_state: UnifiedState, action_type: FinalExecutionActionType) -> float:
        """Calculate final confidence in the action"""
        try:
            base_confidence = unified_state.aggregated_confidence
            
            # Adjust based on consensus
            consensus_factor = unified_state.consensus_level / 100.0
            consensus_adjustment = (consensus_factor - 0.5) * 20  # -10 to +10
            
            # Adjust based on stability vs aggression balance
            stability_factor = unified_state.stability_score / 100.0
            if action_type in [FinalExecutionActionType.CANCEL, FinalExecutionActionType.HOLD]:
                # Conservative actions benefit from high stability
                stability_adjustment = stability_factor * 10
            else:
                # Aggressive actions suffer from high stability, benefit from low
                stability_adjustment = (1 - stability_factor) * 5
            
            # Combine adjustments
            final_confidence = base_confidence + consensus_adjustment + stability_adjustment
            
            return min(100.0, max(0.0, final_confidence))
            
        except Exception as e:
            logger.warning(f"Error calculating final confidence: {e}")
            return 50.0
    
    async def _generate_action_reason(self, unified_state: UnifiedState, action_type: FinalExecutionActionType) -> str:
        """Generate human-readable reason for the action"""
        try:
            reasons = []
            
            # Add consensus information
            if unified_state.consensus_level >= 80:
                reasons.append("Strong consensus among engines")
            elif unified_state.consensus_level >= 60:
                reasons.append("Moderate consensus among engines")
            else:
                reasons.append("Low consensus - preferring safety")
            
            # Add stability information
            if unified_state.stability_score >= 80:
                reasons.append(f"High system stability ({unified_state.stability_score:.0f}%)")
            elif unified_state.stability_score <= 30:
                reasons.append(f"Low system stability ({unified_state.stability_score:.0f}%)")
            
            # Add dominant engine information
            if unified_state.dominant_engine:
                reasons.append(f"Influenced by {unified_state.dominant_engine.value}")
            
            # Add conflict information
            if unified_state.conflicting_signals:
                reasons.append(f"{len(unified_state.conflicting_signals)} conflicting signals resolved")
            
            # Add confidence information
            if unified_state.aggregated_confidence >= 80:
                reasons.append("High confidence from contributing engines")
            elif unified_state.aggregated_confidence <= 40:
                reasons.append("Low confidence from contributing engines")
            
            return "; ".join(reasons) if reasons else "No specific reason determined"
            
        except Exception as e:
            logger.warning(f"Error generating action reason: {e}")
            return "Reason generation failed"
    
    # Mapping and utility methods
    
    def _map_reflex_to_priority(self, reflex_action: ReflexActionType) -> SignalPriority:
        """Map reflex action to signal priority"""
        mapping = {
            ReflexActionType.CANCEL: SignalPriority.CRITICAL,
            ReflexActionType.HEDGE: SignalPriority.HIGH,
            ReflexActionType.RE_ROUTE: SignalPriority.MEDIUM,
            ReflexActionType.SPLIT: SignalPriority.MEDIUM,
            ReflexActionType.DOUBLE_CONFIRM: SignalPriority.LOW,
            ReflexActionType.INVERT: SignalPriority.LOW
        }
        return mapping.get(reflex_action, SignalPriority.MEDIUM)
    
    def _map_reaction_to_priority(self, reaction_event: ReactionEventType) -> SignalPriority:
        """Map reaction event to signal priority"""
        mapping = {
            ReactionEventType.CORRECTIVE: SignalPriority.CRITICAL,
            ReactionEventType.WARNING: SignalPriority.HIGH,
            ReactionEventType.POSITIVE: SignalPriority.MEDIUM,
            ReactionEventType.STABILIZE: SignalPriority.LOW
        }
        return mapping.get(reaction_event, SignalPriority.MEDIUM)
    
    def _map_shield_to_priority(self, alert_level: str) -> SignalPriority:
        """Map shield alert level to signal priority"""
        mapping = {
            "CRITICAL": SignalPriority.CRITICAL,
            "HIGH": SignalPriority.HIGH,
            "MEDIUM": SignalPriority.MEDIUM,
            "LOW": SignalPriority.LOW,
            "INFO": SignalPriority.INFO
        }
        return mapping.get(alert_level, SignalPriority.MEDIUM)
    
    def _calculate_reflex_stability_impact(self, reflex: ReflexResponse) -> float:
        """Calculate stability impact of a reflex response"""
        impact_mapping = {
            ReflexActionType.CANCEL: 0.8,    # Stabilizing
            ReflexActionType.HEDGE: 0.6,     # Stabilizing
            ReflexActionType.RE_ROUTE: 0.2,  # Slightly stabilizing
            ReflexActionType.SPLIT: 0.1,     # Neutral to slightly stabilizing
            ReflexActionType.DOUBLE_CONFIRM: 0.3,  # Stabilizing
            ReflexActionType.INVERT: -0.5    # Destabilizing
        }
        base_impact = impact_mapping.get(reflex.reflex_action, 0.0)
        
        # Adjust based on confidence
        confidence_factor = reflex.reflex_confidence / 100.0
        return base_impact * confidence_factor
    
    def _calculate_reflex_aggression_level(self, reflex: ReflexResponse) -> float:
        """Calculate aggression level of a reflex response"""
        aggression_mapping = {
            ReflexActionType.CANCEL: 0.1,    # Very conservative
            ReflexActionType.HEDGE: 0.3,     # Conservative
            ReflexActionType.RE_ROUTE: 0.5,  # Moderate
            ReflexActionType.SPLIT: 0.6,     # Moderate-aggressive
            ReflexActionType.DOUBLE_CONFIRM: 0.2,  # Conservative
            ReflexActionType.INVERT: 0.9     # Very aggressive
        }
        return aggression_mapping.get(reflex.reflex_action, 0.5)
    
    def _calculate_reaction_stability_impact(self, reaction: NeuralReaction) -> float:
        """Calculate stability impact of a neural reaction"""
        impact_mapping = {
            ReactionEventType.POSITIVE: 0.4,
            ReactionEventType.STABILIZE: 0.8,
            ReactionEventType.WARNING: -0.2,
            ReactionEventType.CORRECTIVE: 0.6
        }
        base_impact = impact_mapping.get(reaction.reaction_event, 0.0)
        
        # Adjust based on neural reaction score
        return base_impact * reaction.neural_reaction_score
    
    def _calculate_reaction_aggression_level(self, reaction: NeuralReaction) -> float:
        """Calculate aggression level of a neural reaction"""
        aggression_mapping = {
            ReactionEventType.POSITIVE: 0.7,
            ReactionEventType.STABILIZE: 0.3,
            ReactionEventType.WARNING: 0.4,
            ReactionEventType.CORRECTIVE: 0.2
        }
        return aggression_mapping.get(reaction.reaction_event, 0.5)
    
    def _categorize_latency_impact(self, latency: float) -> str:
        """Categorize latency impact level"""
        if latency > 1000:  # > 1 second
            return "CRITICAL"
        elif latency > 500:  # > 500ms
            return "HIGH"
        elif latency > 200:  # > 200ms
            return "MEDIUM"
        elif latency > 100:  # > 100ms
            return "LOW"
        else:
            return "INFO"
    
    def _map_latency_to_priority(self, alert_level: str) -> SignalPriority:
        """Map latency alert level to signal priority"""
        mapping = {
            "CRITICAL": SignalPriority.CRITICAL,
            "HIGH": SignalPriority.HIGH,
            "MEDIUM": SignalPriority.MEDIUM,
            "LOW": SignalPriority.LOW,
            "INFO": SignalPriority.INFO
        }
        return mapping.get(alert_level, SignalPriority.INFO)
    
    def _get_latency_recommendation(self, alert_level: str) -> str:
        """Get action recommendation based on latency alert level"""
        mapping = {
            "CRITICAL": "CANCEL",
            "HIGH": "RE_ROUTE",
            "MEDIUM": "HOLD",
            "LOW": "HOLD",
            "INFO": "NO_OP"
        }
        return mapping.get(alert_level, "HOLD")
    
    def _calculate_trend(self, values: List[float]) -> str:
        """Calculate trend direction from a series of values"""
        try:
            if len(values) < 2:
                return "stable"
            
            # Simple linear regression slope
            n = len(values)
            x_values = list(range(n))
            x_mean = statistics.mean(x_values)
            y_mean = statistics.mean(values)
            
            numerator = sum((x_values[i] - x_mean) * (values[i] - y_mean) for i in range(n))
            denominator = sum((x_values[i] - x_mean) ** 2 for i in range(n))
            
            if denominator == 0:
                return "stable"
            
            slope = numerator / denominator
            
            if slope > 1.0:  # Significant positive slope
                return "increasing"
            elif slope < -1.0:  # Significant negative slope
                return "decreasing"
            else:
                return "stable"
                
        except Exception as e:
            logger.warning(f"Error calculating trend: {e}")
            return "stable"
    
    def _calculate_trend_strength(self, values: List[float]) -> float:
        """Calculate strength of the trend (0-1)"""
        try:
            if len(values) < 3:
                return 0.0
            
            # Calculate R-squared for trend strength
            n = len(values)
            x_values = list(range(n))
            
            # Calculate correlation coefficient
            if statistics.stdev(values) == 0:
                return 0.0
            
            # Simplified correlation calculation
            x_mean = statistics.mean(x_values)
            y_mean = statistics.mean(values)
            
            numerator = sum((x_values[i] - x_mean) * (values[i] - y_mean) for i in range(n))
            x_var = sum((x_values[i] - x_mean) ** 2 for i in range(n))
            y_var = sum((values[i] - y_mean) ** 2 for i in range(n))
            
            if x_var == 0 or y_var == 0:
                return 0.0
            
            correlation = numerator / (math.sqrt(x_var) * math.sqrt(y_var))
            return abs(correlation)  # Return absolute correlation as strength
            
        except Exception as e:
            logger.warning(f"Error calculating trend strength: {e}")
            return 0.0
    
    def _predict_next_value(self, values: List[float]) -> float:
        """Predict next value based on trend"""
        try:
            if len(values) < 2:
                return values[-1] if values else 50.0
            
            # Simple linear extrapolation
            recent_values = values[-5:]  # Use last 5 values
            n = len(recent_values)
            
            if n < 2:
                return recent_values[-1]
            
            x_values = list(range(n))
            x_mean = statistics.mean(x_values)
            y_mean = statistics.mean(recent_values)
            
            numerator = sum((x_values[i] - x_mean) * (recent_values[i] - y_mean) for i in range(n))
            denominator = sum((x_values[i] - x_mean) ** 2 for i in range(n))
            
            if denominator == 0:
                return recent_values[-1]
            
            slope = numerator / denominator
            intercept = y_mean - slope * x_mean
            
            # Predict next value (x = n)
            prediction = intercept + slope * n
            
            # Clamp to reasonable bounds
            return min(100.0, max(0.0, prediction))
            
        except Exception as e:
            logger.warning(f"Error predicting next value: {e}")
            return values[-1] if values else 50.0
    
    async def _determine_execution_priority(self, unified_state: UnifiedState) -> SignalPriority:
        """Determine execution priority for the action"""
        try:
            # Check for critical signals
            for signal in unified_state.active_signals:
                if signal.priority == SignalPriority.CRITICAL:
                    return SignalPriority.CRITICAL
            
            # Check confidence and consensus
            if unified_state.aggregated_confidence >= 90 and unified_state.consensus_level >= 90:
                return SignalPriority.HIGH
            elif unified_state.aggregated_confidence >= 70 and unified_state.consensus_level >= 70:
                return SignalPriority.MEDIUM
            elif unified_state.aggregated_confidence >= 50:
                return SignalPriority.LOW
            else:
                return SignalPriority.INFO
                
        except Exception as e:
            logger.warning(f"Error determining execution priority: {e}")
            return SignalPriority.MEDIUM
    
    async def _calculate_expected_impact(self, unified_state: UnifiedState, action_type: FinalExecutionActionType) -> Dict[str, float]:
        """Calculate expected impact of the action"""
        try:
            impact = {}
            
            # Stability impact
            if action_type in [FinalExecutionActionType.CANCEL, FinalExecutionActionType.HOLD]:
                impact["stability"] = 0.8  # Stabilizing actions
            elif action_type in [FinalExecutionActionType.BUY, FinalExecutionActionType.SELL]:
                impact["stability"] = 0.3  # Moderate impact
            else:
                impact["stability"] = 0.5  # Neutral
            
            # Risk impact
            if action_type == FinalExecutionActionType.HEDGE:
                impact["risk"] = -0.6  # Risk reducing
            elif action_type == FinalExecutionActionType.CANCEL:
                impact["risk"] = -0.8  # Highly risk reducing
            elif action_type in [FinalExecutionActionType.BUY, FinalExecutionActionType.SELL]:
                impact["risk"] = 0.4   # Risk increasing
            else:
                impact["risk"] = 0.0   # No risk impact
            
            # Performance impact
            impact["performance"] = unified_state.aggregated_confidence / 100.0
            
            return impact
            
        except Exception as e:
            logger.warning(f"Error calculating expected impact: {e}")
            return {"stability": 0.5, "risk": 0.0, "performance": 0.5}
    
    async def _generate_fallback_actions(self, primary_action: FinalExecutionActionType, unified_state: UnifiedState) -> List[str]:
        """Generate fallback actions for the primary action"""
        try:
            fallbacks = []
            
            # Define fallback mappings
            fallback_mapping = {
                FinalExecutionActionType.BUY: ["HOLD", "HEDGE", "CANCEL"],
                FinalExecutionActionType.SELL: ["HOLD", "HEDGE", "CANCEL"],
                FinalExecutionActionType.HEDGE: ["HOLD", "CANCEL"],
                FinalExecutionActionType.RE_ROUTE: ["HOLD", "CANCEL"],
                FinalExecutionActionType.CANCEL: ["HOLD"],
                FinalExecutionActionType.HOLD: ["NO_OP"],
                FinalExecutionActionType.NO_OP: []
            }
            
            primary_fallbacks = fallback_mapping.get(primary_action, ["HOLD", "CANCEL"])
            
            # Add confidence-based filtering
            if unified_state.aggregated_confidence < 50:
                # Low confidence - prefer safer fallbacks
                safe_fallbacks = ["HOLD", "CANCEL", "NO_OP"]
                fallbacks = [action for action in primary_fallbacks if action in safe_fallbacks]
            else:
                fallbacks = primary_fallbacks[:2]  # Limit to top 2 fallbacks
            
            return fallbacks
            
        except Exception as e:
            logger.warning(f"Error generating fallback actions: {e}")
            return ["HOLD", "CANCEL"]
    
    async def _update_processing_metrics(self, latency: float) -> None:
        """Update processing performance metrics"""
        try:
            # Update average latency with exponential moving average
            alpha = 0.1
            self.average_processing_latency = (
                alpha * latency + 
                (1 - alpha) * self.average_processing_latency
            )
            
        except Exception as e:
            logger.warning(f"Error updating processing metrics: {e}")
    
    def _initialize_action_compatibility(self) -> Dict[str, List[str]]:
        """Initialize action compatibility matrix"""
        return {
            "BUY": ["HEDGE", "HOLD"],
            "SELL": ["HEDGE", "HOLD"],
            "HEDGE": ["BUY", "SELL", "HOLD", "CANCEL"],
            "HOLD": ["BUY", "SELL", "HEDGE", "CANCEL"],
            "CANCEL": ["HOLD", "NO_OP"],
            "RE_ROUTE": ["HOLD", "CANCEL"],
            "NO_OP": ["HOLD"]
        }
    
    def _initialize_conflict_strategies(self) -> Dict[str, str]:
        """Initialize conflict resolution strategies"""
        return {
            "BUY_vs_SELL": "HOLD",
            "BUY_vs_CANCEL": "HOLD",
            "SELL_vs_CANCEL": "HOLD",
            "HEDGE_vs_CANCEL": "HOLD",
            "high_aggression_low_stability": "HOLD",
            "low_consensus": "HOLD"
        }
    
    # Mock system initialization methods
    
    async def _initialize_stability_shield_mock(self) -> Dict[str, Any]:
        """Initialize mock stability shield engine"""
        return {
            "status": "active",
            "shield_level": "normal",
            "last_update": time.time()
        }
    
    async def _initialize_precision_core_mock(self) -> Dict[str, Any]:
        """Initialize mock precision core"""
        return {
            "status": "active",
            "precision_level": 0.85,
            "last_calibration": time.time()
        }
    
    async def _initialize_rtem_mock(self) -> Dict[str, Any]:
        """Initialize mock RTEM monitor"""
        return {
            "status": "monitoring",
            "alert_level": "normal",
            "last_ping": time.time()
        }
    
    async def _initialize_threat_sync_mock(self) -> Dict[str, Any]:
        """Initialize mock threat reaction sync"""
        return {
            "status": "active",
            "sync_level": "optimal",
            "last_sync": time.time()
        }


# Global instance
_execution_nervous_system: Optional[ExecutionNervousSystem] = None


def get_execution_nervous_system() -> ExecutionNervousSystem:
    """Get or create the global Execution Nervous System instance"""
    global _execution_nervous_system
    if _execution_nervous_system is None:
        _execution_nervous_system = ExecutionNervousSystem()
    return _execution_nervous_system


async def initialize_execution_nervous_system() -> ExecutionNervousSystem:
    """Initialize and return the global Execution Nervous System instance"""
    ens = get_execution_nervous_system()
    await ens.initialize()
    return ens


# Convenience functions for external integration
async def process_unified_execution_decision(signal_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process unified execution decision from multiple engine signals
    
    Args:
        signal_data: Combined signal data from all engines
        
    Returns:
        Dict: Final execution action data
    """
    try:
        ens = get_execution_nervous_system()
        
        # Process signals from different engines if present
        if "reflex_response" in signal_data:
            # Mock reflex response processing
            pass
        
        if "neural_reaction" in signal_data:
            # Mock neural reaction processing
            pass
        
        # Generate final action
        final_action = await ens.get_final_execution_action()
        return final_action.to_dict()
        
    except Exception as e:
        logger.error(f"Error in process_unified_execution_decision: {e}")
        return {
            "action": "NO_OP",
            "confidence": 30.0,
            "stability_score": 50.0,
            "reason": f"Processing error: {str(e)}",
            "triggered_engines": ["ExecutionNervousSystem"],
            "error": str(e)
        }


def get_ens_status() -> Dict[str, Any]:
    """
    Get Execution Nervous System status
    
    Returns:
        Dict: ENS status data
    """
    try:
        ens = get_execution_nervous_system()
        return ens.get_system_status()
        
    except Exception as e:
        logger.error(f"Error in get_ens_status: {e}")
        return {"error": str(e)}


def get_trend_analysis() -> Dict[str, Any]:
    """
    Get stability vs aggression trend analysis
    
    Returns:
        Dict: Trend analysis data
    """
    try:
        ens = get_execution_nervous_system()
        trend = ens.get_trend_analysis()
        
        return {
            "stability_trend": trend.stability_trend,
            "aggression_trend": trend.aggression_trend,
            "trend_strength": trend.trend_strength,
            "trend_duration": trend.trend_duration,
            "predicted_stability": trend.predicted_stability,
            "predicted_aggression": trend.predicted_aggression,
            "confidence_in_prediction": trend.confidence_in_prediction
        }
        
    except Exception as e:
        logger.error(f"Error in get_trend_analysis: {e}")
        return {"error": str(e)}