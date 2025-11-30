"""
STEP 24.63 — Execution Neural Reaction Engine (ENRE)

Advanced execution event processing with neural reaction scoring and confidence analysis
Processes real-time execution events to generate intelligent reaction metrics

This engine handles:
- Real-time execution event processing and classification
- Neural reaction scoring (0-1) based on event quality and impact
- Execution confidence calculation (0-100) with dynamic adjustments
- Slippage and latency impact scoring for performance analysis
- Structured reaction objects with memory logging capabilities
- Future integration readiness with stability shield systems

CRITICAL: Execution intelligence layer with comprehensive event analysis
Compatible with all execution event types and reaction classification systems
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

logger = logging.getLogger(__name__)


class ExecutionEventType(Enum):
    """Execution event types for processing"""
    EXECUTION_PENDING = "EXECUTION_PENDING"
    EXECUTION_CONFIRMED = "EXECUTION_CONFIRMED"
    EXECUTION_FILLED = "EXECUTION_FILLED"
    EXECUTION_CANCELED = "EXECUTION_CANCELED"
    EXECUTION_FAILED = "EXECUTION_FAILED"
    LATENCY_UPDATE = "LATENCY_UPDATE"
    SLIPPAGE_REPORT = "SLIPPAGE_REPORT"
    RISK_STATE = "RISK_STATE"


class ReactionEventType(Enum):
    """Neural reaction event classifications"""
    POSITIVE = "POSITIVE"
    STABILIZE = "STABILIZE"
    WARNING = "WARNING"
    CORRECTIVE = "CORRECTIVE"


@dataclass
class ExecutionEvent:
    """Execution event data structure"""
    event_type: ExecutionEventType
    timestamp: float
    data: Dict[str, Any]
    
    # Optional metadata
    order_id: Optional[str] = None
    symbol: Optional[str] = None
    size: Optional[float] = None
    price: Optional[float] = None
    latency: Optional[float] = None
    slippage: Optional[float] = None
    risk_level: Optional[str] = None


@dataclass
class NeuralReaction:
    """Neural reaction analysis result"""
    neural_reaction_score: float  # 0-1 scale
    reaction_event: ReactionEventType
    execution_confidence: float  # 0-100 scale
    slippage_impact_score: float  # 0-1 scale (higher = worse impact)
    latency_impact_score: float  # 0-1 scale (higher = worse impact)
    
    # Additional analysis metrics
    event_quality_score: float
    system_stability_score: float
    performance_trend_score: float
    
    # Metadata
    timestamp: float = field(default_factory=time.time)
    processed_events_count: int = 0
    confidence_factors: Dict[str, float] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert reaction to dictionary format"""
        return {
            "neural_reaction_score": self.neural_reaction_score,
            "reaction_event": self.reaction_event.value,
            "execution_confidence": self.execution_confidence,
            "slippage_impact_score": self.slippage_impact_score,
            "latency_impact_score": self.latency_impact_score,
            "event_quality_score": self.event_quality_score,
            "system_stability_score": self.system_stability_score,
            "performance_trend_score": self.performance_trend_score,
            "timestamp": self.timestamp,
            "processed_events_count": self.processed_events_count,
            "confidence_factors": self.confidence_factors
        }


@dataclass
class ReactionSummary:
    """Summary of neural reaction engine state and performance"""
    total_events_processed: int
    recent_neural_score: float
    average_neural_score: float
    current_confidence: float
    average_confidence: float
    recent_slippage_impact: float
    recent_latency_impact: float
    reaction_distribution: Dict[str, int]
    performance_metrics: Dict[str, float]
    system_health_indicators: Dict[str, Any]
    last_updated: float = field(default_factory=time.time)


class ExecutionNeuralReactionEngine:
    """
    Execution Neural Reaction Engine (ENRE)
    
    Advanced execution event processing engine that analyzes execution events
    to generate neural reaction scores, confidence metrics, and performance analysis.
    """
    
    def __init__(self):
        """Initialize the Execution Neural Reaction Engine"""
        logger.info("Initializing Execution Neural Reaction Engine...")
        
        # Core processing parameters
        self.reaction_sensitivity = 0.8  # Neural reaction sensitivity (0-1)
        self.confidence_decay_rate = 0.95  # Confidence decay per poor event
        self.latency_threshold_ms = 100  # Latency threshold for impact scoring
        self.slippage_threshold_pct = 0.05  # Slippage threshold (5 basis points)
        
        # Memory and state tracking
        self.event_memory: deque = deque(maxlen=1000)  # Last 1000 events
        self.reaction_history: deque = deque(maxlen=500)  # Last 500 reactions
        self.performance_metrics = defaultdict(list)
        
        # Current state
        self.current_confidence = 85.0  # Initial confidence level
        self.current_neural_score = 0.5  # Initial neutral neural score
        self.system_stability_score = 0.8  # System stability indicator
        
        # Event processing statistics
        self.total_events_processed = 0
        self.event_type_counts = defaultdict(int)
        self.reaction_type_counts = defaultdict(int)
        
        # Performance tracking
        self.latency_history: deque = deque(maxlen=100)
        self.slippage_history: deque = deque(maxlen=100)
        self.execution_success_history: deque = deque(maxlen=100)
        
        # Neural processing weights
        self.event_weights = {
            ExecutionEventType.EXECUTION_FILLED: 1.0,
            ExecutionEventType.EXECUTION_CONFIRMED: 0.8,
            ExecutionEventType.EXECUTION_PENDING: 0.5,
            ExecutionEventType.EXECUTION_CANCELED: -0.3,
            ExecutionEventType.EXECUTION_FAILED: -0.8,
            ExecutionEventType.LATENCY_UPDATE: 0.2,
            ExecutionEventType.SLIPPAGE_REPORT: 0.3,
            ExecutionEventType.RISK_STATE: 0.4
        }
        
        # Confidence calculation factors
        self.confidence_factors = {
            "execution_success_rate": 0.3,
            "latency_performance": 0.2,
            "slippage_performance": 0.2,
            "system_stability": 0.15,
            "recent_performance": 0.15
        }
    
    def process_execution_event(self, event: ExecutionEvent) -> NeuralReaction:
        """
        Process an execution event and generate neural reaction
        
        Args:
            event: Execution event to process
            
        Returns:
            NeuralReaction: Comprehensive reaction analysis
        """
        try:
            logger.debug(f"Processing execution event: {event.event_type.value}")
            
            # Store event in memory
            self.event_memory.append(event)
            self.total_events_processed += 1
            self.event_type_counts[event.event_type] += 1
            
            # Compute neural reaction score
            neural_score = self._compute_neural_reaction_score(event)
            
            # Determine reaction event type
            reaction_type = self._classify_reaction_event(neural_score, event)
            
            # Calculate execution confidence
            execution_confidence = self._calculate_execution_confidence(event)
            
            # Compute impact scores
            slippage_impact = self._compute_slippage_impact_score(event)
            latency_impact = self._compute_latency_impact_score(event)
            
            # Calculate additional analysis metrics
            event_quality = self._calculate_event_quality_score(event)
            system_stability = self._calculate_system_stability_score()
            performance_trend = self._calculate_performance_trend_score()
            
            # Build confidence factors
            confidence_factors = self._build_confidence_factors(event)
            
            # Create neural reaction object
            reaction = NeuralReaction(
                neural_reaction_score=neural_score,
                reaction_event=reaction_type,
                execution_confidence=execution_confidence,
                slippage_impact_score=slippage_impact,
                latency_impact_score=latency_impact,
                event_quality_score=event_quality,
                system_stability_score=system_stability,
                performance_trend_score=performance_trend,
                processed_events_count=self.total_events_processed,
                confidence_factors=confidence_factors
            )
            
            # Update internal state
            self._update_internal_state(event, reaction)
            
            # Store reaction in history
            self.reaction_history.append(reaction)
            self.reaction_type_counts[reaction_type] += 1
            
            logger.debug(f"Neural reaction generated: {reaction_type.value} (score: {neural_score:.3f})")
            
            return reaction
            
        except Exception as e:
            logger.error(f"Error processing execution event: {e}")
            
            # Return neutral reaction on error
            return NeuralReaction(
                neural_reaction_score=0.5,
                reaction_event=ReactionEventType.STABILIZE,
                execution_confidence=self.current_confidence,
                slippage_impact_score=0.0,
                latency_impact_score=0.0,
                event_quality_score=0.0,
                system_stability_score=self.system_stability_score,
                performance_trend_score=0.5,
                processed_events_count=self.total_events_processed
            )
    
    def get_reaction_summary(self) -> ReactionSummary:
        """
        Get comprehensive reaction summary
        
        Returns:
            ReactionSummary: Current engine state and performance metrics
        """
        try:
            # Calculate averages from history
            recent_reactions = list(self.reaction_history)[-50:]  # Last 50 reactions
            
            if recent_reactions:
                recent_neural_score = recent_reactions[-1].neural_reaction_score
                average_neural_score = statistics.mean(r.neural_reaction_score for r in recent_reactions)
                average_confidence = statistics.mean(r.execution_confidence for r in recent_reactions)
                recent_slippage_impact = recent_reactions[-1].slippage_impact_score
                recent_latency_impact = recent_reactions[-1].latency_impact_score
            else:
                recent_neural_score = self.current_neural_score
                average_neural_score = 0.5
                average_confidence = self.current_confidence
                recent_slippage_impact = 0.0
                recent_latency_impact = 0.0
            
            # Build reaction distribution
            reaction_distribution = {
                reaction_type.value: self.reaction_type_counts[reaction_type]
                for reaction_type in ReactionEventType
            }
            
            # Calculate performance metrics
            performance_metrics = self._calculate_performance_metrics()
            
            # Build system health indicators
            system_health = self._build_system_health_indicators()
            
            return ReactionSummary(
                total_events_processed=self.total_events_processed,
                recent_neural_score=recent_neural_score,
                average_neural_score=average_neural_score,
                current_confidence=self.current_confidence,
                average_confidence=average_confidence,
                recent_slippage_impact=recent_slippage_impact,
                recent_latency_impact=recent_latency_impact,
                reaction_distribution=reaction_distribution,
                performance_metrics=performance_metrics,
                system_health_indicators=system_health
            )
            
        except Exception as e:
            logger.error(f"Error generating reaction summary: {e}")
            
            # Return minimal summary on error
            return ReactionSummary(
                total_events_processed=self.total_events_processed,
                recent_neural_score=0.5,
                average_neural_score=0.5,
                current_confidence=self.current_confidence,
                average_confidence=self.current_confidence,
                recent_slippage_impact=0.0,
                recent_latency_impact=0.0,
                reaction_distribution={},
                performance_metrics={},
                system_health_indicators={}
            )
    
    # Private helper methods
    
    def _compute_neural_reaction_score(self, event: ExecutionEvent) -> float:
        """Compute neural reaction score for the event"""
        try:
            base_score = 0.5  # Neutral starting point
            
            # Get event weight
            event_weight = self.event_weights.get(event.event_type, 0.0)
            
            # Apply event-specific scoring
            if event.event_type == ExecutionEventType.EXECUTION_FILLED:
                # Positive event - boost score based on execution quality
                quality_bonus = 0.0
                
                if event.slippage is not None:
                    if abs(event.slippage) < 0.0001:  # Very low slippage
                        quality_bonus += 0.2
                    elif abs(event.slippage) < 0.0005:  # Low slippage
                        quality_bonus += 0.1
                
                if event.latency is not None:
                    if event.latency < 50:  # Fast execution
                        quality_bonus += 0.2
                    elif event.latency < 100:  # Good execution
                        quality_bonus += 0.1
                
                score = min(1.0, base_score + event_weight + quality_bonus)
                
            elif event.event_type in [ExecutionEventType.EXECUTION_FAILED, ExecutionEventType.EXECUTION_CANCELED]:
                # Negative event - reduce score
                score = max(0.0, base_score + event_weight)
                
            elif event.event_type == ExecutionEventType.LATENCY_UPDATE:
                # Latency-based scoring
                if event.latency is not None:
                    if event.latency > 500:  # Very slow
                        score = 0.1
                    elif event.latency > 200:  # Slow
                        score = 0.3
                    elif event.latency < 50:  # Fast
                        score = 0.9
                    else:  # Normal
                        score = 0.6
                else:
                    score = base_score
                    
            elif event.event_type == ExecutionEventType.SLIPPAGE_REPORT:
                # Slippage-based scoring
                if event.slippage is not None:
                    slippage_abs = abs(event.slippage)
                    if slippage_abs < 0.0001:  # Excellent
                        score = 0.95
                    elif slippage_abs < 0.0005:  # Good
                        score = 0.8
                    elif slippage_abs < 0.001:  # Fair
                        score = 0.6
                    elif slippage_abs < 0.002:  # Poor
                        score = 0.4
                    else:  # Very poor
                        score = 0.2
                else:
                    score = base_score
                    
            else:
                # Standard event scoring
                score = max(0.0, min(1.0, base_score + event_weight))
            
            # Apply sensitivity adjustment
            score = base_score + (score - base_score) * self.reaction_sensitivity
            
            # Ensure score is in valid range
            return max(0.0, min(1.0, score))
            
        except Exception as e:
            logger.warning(f"Error computing neural reaction score: {e}")
            return 0.5  # Neutral score on error
    
    def _classify_reaction_event(self, neural_score: float, event: ExecutionEvent) -> ReactionEventType:
        """Classify the reaction event based on neural score and event type"""
        try:
            # High performance threshold
            if neural_score >= 0.8:
                return ReactionEventType.POSITIVE
            
            # Warning threshold
            elif neural_score <= 0.3:
                # Determine if corrective action needed
                if event.event_type in [ExecutionEventType.EXECUTION_FAILED, ExecutionEventType.EXECUTION_CANCELED]:
                    return ReactionEventType.CORRECTIVE
                else:
                    return ReactionEventType.WARNING
            
            # Moderate performance threshold
            elif neural_score >= 0.6:
                return ReactionEventType.STABILIZE
            
            # Default to warning for moderate-low scores
            else:
                return ReactionEventType.WARNING
                
        except Exception as e:
            logger.warning(f"Error classifying reaction event: {e}")
            return ReactionEventType.STABILIZE
    
    def _calculate_execution_confidence(self, event: ExecutionEvent) -> float:
        """Calculate execution confidence based on recent performance"""
        try:
            # Start with current confidence
            confidence = self.current_confidence
            
            # Adjust based on event type
            if event.event_type == ExecutionEventType.EXECUTION_FILLED:
                confidence += 2.0  # Boost for successful execution
                
                # Additional boost for good performance
                if event.slippage is not None and abs(event.slippage) < 0.0005:
                    confidence += 1.0
                    
                if event.latency is not None and event.latency < 100:
                    confidence += 1.0
                    
            elif event.event_type == ExecutionEventType.EXECUTION_FAILED:
                confidence -= 5.0  # Significant penalty for failure
                
            elif event.event_type == ExecutionEventType.EXECUTION_CANCELED:
                confidence -= 2.0  # Moderate penalty for cancellation
                
            elif event.event_type == ExecutionEventType.LATENCY_UPDATE:
                if event.latency is not None:
                    if event.latency > 500:  # Very slow
                        confidence -= 3.0
                    elif event.latency > 200:  # Slow
                        confidence -= 1.0
                    elif event.latency < 50:  # Fast
                        confidence += 1.0
                        
            elif event.event_type == ExecutionEventType.SLIPPAGE_REPORT:
                if event.slippage is not None:
                    slippage_abs = abs(event.slippage)
                    if slippage_abs > 0.002:  # High slippage
                        confidence -= 3.0
                    elif slippage_abs > 0.001:  # Moderate slippage
                        confidence -= 1.0
                    elif slippage_abs < 0.0001:  # Low slippage
                        confidence += 1.0
            
            # Apply bounds
            confidence = max(0.0, min(100.0, confidence))
            
            return confidence
            
        except Exception as e:
            logger.warning(f"Error calculating execution confidence: {e}")
            return self.current_confidence
    
    def _compute_slippage_impact_score(self, event: ExecutionEvent) -> float:
        """Compute slippage impact score"""
        try:
            if event.slippage is None:
                return 0.0
            
            slippage_abs = abs(event.slippage)
            
            # Score from 0 (no impact) to 1 (high impact)
            if slippage_abs < 0.0001:  # 0.01 basis points
                return 0.0
            elif slippage_abs < 0.0005:  # 0.5 basis points
                return 0.2
            elif slippage_abs < 0.001:  # 1 basis point
                return 0.4
            elif slippage_abs < 0.002:  # 2 basis points
                return 0.7
            else:  # > 2 basis points
                return 1.0
                
        except Exception as e:
            logger.warning(f"Error computing slippage impact score: {e}")
            return 0.0
    
    def _compute_latency_impact_score(self, event: ExecutionEvent) -> float:
        """Compute latency impact score"""
        try:
            if event.latency is None:
                return 0.0
            
            # Score from 0 (no impact) to 1 (high impact)
            if event.latency < 50:  # Very fast
                return 0.0
            elif event.latency < 100:  # Fast
                return 0.1
            elif event.latency < 200:  # Normal
                return 0.3
            elif event.latency < 500:  # Slow
                return 0.7
            else:  # Very slow
                return 1.0
                
        except Exception as e:
            logger.warning(f"Error computing latency impact score: {e}")
            return 0.0
    
    def _calculate_event_quality_score(self, event: ExecutionEvent) -> float:
        """Calculate overall event quality score"""
        try:
            quality_score = 0.5  # Base quality
            
            # Adjust for event type
            if event.event_type == ExecutionEventType.EXECUTION_FILLED:
                quality_score = 0.9
            elif event.event_type == ExecutionEventType.EXECUTION_CONFIRMED:
                quality_score = 0.7
            elif event.event_type == ExecutionEventType.EXECUTION_PENDING:
                quality_score = 0.5
            elif event.event_type == ExecutionEventType.EXECUTION_FAILED:
                quality_score = 0.1
            elif event.event_type == ExecutionEventType.EXECUTION_CANCELED:
                quality_score = 0.3
            
            # Adjust for performance metrics
            if event.slippage is not None:
                slippage_abs = abs(event.slippage)
                if slippage_abs < 0.0001:
                    quality_score += 0.1
                elif slippage_abs > 0.001:
                    quality_score -= 0.2
            
            if event.latency is not None:
                if event.latency < 50:
                    quality_score += 0.1
                elif event.latency > 200:
                    quality_score -= 0.2
            
            return max(0.0, min(1.0, quality_score))
            
        except Exception as e:
            logger.warning(f"Error calculating event quality score: {e}")
            return 0.5
    
    def _calculate_system_stability_score(self) -> float:
        """Calculate system stability score"""
        try:
            if not self.reaction_history:
                return self.system_stability_score
            
            recent_reactions = list(self.reaction_history)[-20:]  # Last 20 reactions
            
            # Calculate stability based on variance in neural scores
            neural_scores = [r.neural_reaction_score for r in recent_reactions]
            
            if len(neural_scores) > 1:
                variance = statistics.variance(neural_scores)
                stability = max(0.0, 1.0 - variance * 2)  # Lower variance = higher stability
            else:
                stability = self.system_stability_score
            
            # Smooth the stability score
            alpha = 0.1
            self.system_stability_score = (
                alpha * stability + 
                (1 - alpha) * self.system_stability_score
            )
            
            return self.system_stability_score
            
        except Exception as e:
            logger.warning(f"Error calculating system stability score: {e}")
            return self.system_stability_score
    
    def _calculate_performance_trend_score(self) -> float:
        """Calculate performance trend score"""
        try:
            if len(self.reaction_history) < 10:
                return 0.5  # Neutral trend
            
            recent_scores = [r.neural_reaction_score for r in list(self.reaction_history)[-20:]]
            
            # Calculate trend using linear regression approximation
            n = len(recent_scores)
            x_values = list(range(n))
            
            # Simple trend calculation
            x_mean = statistics.mean(x_values)
            y_mean = statistics.mean(recent_scores)
            
            numerator = sum((x_values[i] - x_mean) * (recent_scores[i] - y_mean) for i in range(n))
            denominator = sum((x_values[i] - x_mean) ** 2 for i in range(n))
            
            if denominator > 0:
                slope = numerator / denominator
                # Convert slope to 0-1 score (positive slope = higher score)
                trend_score = 0.5 + slope * 10  # Scaling factor
                return max(0.0, min(1.0, trend_score))
            else:
                return 0.5
                
        except Exception as e:
            logger.warning(f"Error calculating performance trend score: {e}")
            return 0.5
    
    def _build_confidence_factors(self, event: ExecutionEvent) -> Dict[str, float]:
        """Build confidence factors for the event"""
        try:
            factors = {}
            
            # Execution success rate
            if self.execution_success_history:
                success_rate = sum(self.execution_success_history) / len(self.execution_success_history)
                factors["execution_success_rate"] = success_rate
            else:
                factors["execution_success_rate"] = 0.5
            
            # Latency performance
            if self.latency_history:
                avg_latency = statistics.mean(self.latency_history)
                latency_factor = max(0.0, 1.0 - avg_latency / 1000)  # Normalize to 0-1
                factors["latency_performance"] = latency_factor
            else:
                factors["latency_performance"] = 0.5
            
            # Slippage performance
            if self.slippage_history:
                avg_slippage = statistics.mean(abs(s) for s in self.slippage_history)
                slippage_factor = max(0.0, 1.0 - avg_slippage / 0.01)  # 1% as max
                factors["slippage_performance"] = slippage_factor
            else:
                factors["slippage_performance"] = 0.5
            
            # System stability
            factors["system_stability"] = self.system_stability_score
            
            # Recent performance
            if self.reaction_history:
                recent_avg = statistics.mean(r.neural_reaction_score for r in list(self.reaction_history)[-10:])
                factors["recent_performance"] = recent_avg
            else:
                factors["recent_performance"] = 0.5
            
            return factors
            
        except Exception as e:
            logger.warning(f"Error building confidence factors: {e}")
            return {}
    
    def _update_internal_state(self, event: ExecutionEvent, reaction: NeuralReaction) -> None:
        """Update internal engine state based on processed event"""
        try:
            # Update current neural score
            self.current_neural_score = reaction.neural_reaction_score
            
            # Update current confidence
            self.current_confidence = reaction.execution_confidence
            
            # Update performance history
            if event.latency is not None:
                self.latency_history.append(event.latency)
            
            if event.slippage is not None:
                self.slippage_history.append(event.slippage)
            
            # Update execution success history
            if event.event_type == ExecutionEventType.EXECUTION_FILLED:
                self.execution_success_history.append(1.0)
            elif event.event_type in [ExecutionEventType.EXECUTION_FAILED, ExecutionEventType.EXECUTION_CANCELED]:
                self.execution_success_history.append(0.0)
            
            # Update performance metrics
            self.performance_metrics["neural_scores"].append(reaction.neural_reaction_score)
            self.performance_metrics["confidence_scores"].append(reaction.execution_confidence)
            
            # Keep metrics deques at reasonable size
            if len(self.performance_metrics["neural_scores"]) > 1000:
                self.performance_metrics["neural_scores"] = self.performance_metrics["neural_scores"][-500:]
            
            if len(self.performance_metrics["confidence_scores"]) > 1000:
                self.performance_metrics["confidence_scores"] = self.performance_metrics["confidence_scores"][-500:]
                
        except Exception as e:
            logger.warning(f"Error updating internal state: {e}")
    
    def _calculate_performance_metrics(self) -> Dict[str, float]:
        """Calculate comprehensive performance metrics"""
        try:
            metrics = {}
            
            # Neural score metrics
            if self.performance_metrics["neural_scores"]:
                neural_scores = self.performance_metrics["neural_scores"]
                metrics["average_neural_score"] = statistics.mean(neural_scores)
                metrics["neural_score_std"] = statistics.stdev(neural_scores) if len(neural_scores) > 1 else 0
                metrics["max_neural_score"] = max(neural_scores)
                metrics["min_neural_score"] = min(neural_scores)
            
            # Confidence metrics
            if self.performance_metrics["confidence_scores"]:
                confidence_scores = self.performance_metrics["confidence_scores"]
                metrics["average_confidence"] = statistics.mean(confidence_scores)
                metrics["confidence_std"] = statistics.stdev(confidence_scores) if len(confidence_scores) > 1 else 0
                metrics["max_confidence"] = max(confidence_scores)
                metrics["min_confidence"] = min(confidence_scores)
            
            # Latency metrics
            if self.latency_history:
                metrics["average_latency"] = statistics.mean(self.latency_history)
                metrics["latency_std"] = statistics.stdev(self.latency_history) if len(self.latency_history) > 1 else 0
                metrics["max_latency"] = max(self.latency_history)
                metrics["min_latency"] = min(self.latency_history)
            
            # Slippage metrics
            if self.slippage_history:
                abs_slippages = [abs(s) for s in self.slippage_history]
                metrics["average_slippage"] = statistics.mean(abs_slippages)
                metrics["slippage_std"] = statistics.stdev(abs_slippages) if len(abs_slippages) > 1 else 0
                metrics["max_slippage"] = max(abs_slippages)
                metrics["min_slippage"] = min(abs_slippages)
            
            # Success rate
            if self.execution_success_history:
                metrics["execution_success_rate"] = statistics.mean(self.execution_success_history)
            
            return metrics
            
        except Exception as e:
            logger.warning(f"Error calculating performance metrics: {e}")
            return {}
    
    def _build_system_health_indicators(self) -> Dict[str, Any]:
        """Build system health indicators"""
        try:
            indicators = {}
            
            # Processing health
            indicators["total_events_processed"] = self.total_events_processed
            indicators["memory_usage"] = len(self.event_memory)
            indicators["reaction_history_size"] = len(self.reaction_history)
            
            # Event type distribution
            if self.total_events_processed > 0:
                event_distribution = {
                    event_type.value: count / self.total_events_processed
                    for event_type, count in self.event_type_counts.items()
                }
                indicators["event_type_distribution"] = event_distribution
            
            # Reaction type distribution
            total_reactions = sum(self.reaction_type_counts.values())
            if total_reactions > 0:
                reaction_distribution = {
                    reaction_type.value: count / total_reactions
                    for reaction_type, count in self.reaction_type_counts.items()
                }
                indicators["reaction_type_distribution"] = reaction_distribution
            
            # System status
            indicators["system_stability_score"] = self.system_stability_score
            indicators["current_neural_score"] = self.current_neural_score
            indicators["current_confidence"] = self.current_confidence
            
            # Recent performance
            if self.reaction_history:
                recent_reactions = list(self.reaction_history)[-10:]
                indicators["recent_average_neural_score"] = statistics.mean(r.neural_reaction_score for r in recent_reactions)
                indicators["recent_average_confidence"] = statistics.mean(r.execution_confidence for r in recent_reactions)
            
            return indicators
            
        except Exception as e:
            logger.warning(f"Error building system health indicators: {e}")
            return {}


# Global instance
_execution_neural_reaction_engine: Optional[ExecutionNeuralReactionEngine] = None


def get_execution_neural_reaction_engine() -> ExecutionNeuralReactionEngine:
    """Get or create the global Execution Neural Reaction Engine instance"""
    global _execution_neural_reaction_engine
    if _execution_neural_reaction_engine is None:
        _execution_neural_reaction_engine = ExecutionNeuralReactionEngine()
    return _execution_neural_reaction_engine


# Convenience functions for external integration
def process_execution_event(event_type: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process execution event through neural reaction engine
    
    Args:
        event_type: Type of execution event
        event_data: Event data dictionary
        
    Returns:
        Dict: Neural reaction result
    """
    try:
        engine = get_execution_neural_reaction_engine()
        
        # Convert to ExecutionEvent
        event = ExecutionEvent(
            event_type=ExecutionEventType(event_type),
            timestamp=time.time(),
            data=event_data,
            order_id=event_data.get("order_id"),
            symbol=event_data.get("symbol"),
            size=event_data.get("size"),
            price=event_data.get("price"),
            latency=event_data.get("latency"),
            slippage=event_data.get("slippage"),
            risk_level=event_data.get("risk_level")
        )
        
        reaction = engine.process_execution_event(event)
        return reaction.to_dict()
        
    except Exception as e:
        logger.error(f"Error in process_execution_event: {e}")
        return {
            "neural_reaction_score": 0.5,
            "reaction_event": "STABILIZE",
            "execution_confidence": 50.0,
            "error": str(e)
        }


def get_reaction_summary() -> Dict[str, Any]:
    """
    Get neural reaction engine summary
    
    Returns:
        Dict: Engine summary data
    """
    try:
        engine = get_execution_neural_reaction_engine()
        summary = engine.get_reaction_summary()
        
        return {
            "total_events_processed": summary.total_events_processed,
            "recent_neural_score": summary.recent_neural_score,
            "average_neural_score": summary.average_neural_score,
            "current_confidence": summary.current_confidence,
            "average_confidence": summary.average_confidence,
            "recent_slippage_impact": summary.recent_slippage_impact,
            "recent_latency_impact": summary.recent_latency_impact,
            "reaction_distribution": summary.reaction_distribution,
            "performance_metrics": summary.performance_metrics,
            "system_health_indicators": summary.system_health_indicators,
            "last_updated": summary.last_updated
        }
        
    except Exception as e:
        logger.error(f"Error in get_reaction_summary: {e}")
        return {"error": str(e)}