"""
STEP 24.64 — Execution Reflex Loop Engine (ERLE)

Advanced execution reflex system with real-time reaction path optimization
Handles critical execution events with instant reflex responses

This engine provides:
- Real-time execution path precomputation and optimization
- Instant reflex triggers for critical market conditions
- Advanced reflex action classification and confidence scoring
- Integration with neural reaction engine and stability systems
- Multi-layer execution monitoring with automated responses

CRITICAL: Ultra-low latency execution reflex system
Compatible with all execution engines and stability shield systems
"""

import asyncio
import logging
import time
import json
import hashlib
from typing import Dict, List, Optional, Any, Tuple, Union, Callable
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from collections import defaultdict, deque
import statistics
import math
import uuid

# Import related execution systems
from .ExecutionNeuralReactionEngine import (
    get_execution_neural_reaction_engine, 
    ExecutionEventType,
    NeuralReaction
)

logger = logging.getLogger(__name__)


class ReflexEventType(Enum):
    """Reflex event types for processing"""
    PRICE_SPIKE = "PRICE_SPIKE"
    PRICE_DROP = "PRICE_DROP"
    LATENCY_SPIKE = "LATENCY_SPIKE"
    PARTIAL_FILL = "PARTIAL_FILL"
    SLIPPAGE_HIGH = "SLIPPAGE_HIGH"
    HEDGE_REQUIRED = "HEDGE_REQUIRED"
    SHIELD_ALERT = "SHIELD_ALERT"
    EXECUTION_FAIL = "EXECUTION_FAIL"


class ReflexActionType(Enum):
    """Reflex action classifications"""
    CANCEL = "CANCEL"
    RE_ROUTE = "RE_ROUTE"
    HEDGE = "HEDGE"
    SPLIT = "SPLIT"
    DOUBLE_CONFIRM = "DOUBLE_CONFIRM"
    INVERT = "INVERT"


class ExecutionPathType(Enum):
    """Execution path types"""
    DIRECT = "DIRECT"
    SPLIT_ORDER = "SPLIT_ORDER"
    HEDGE_WRAPPED = "HEDGE_WRAPPED"
    DELAYED = "DELAYED"
    EMERGENCY = "EMERGENCY"
    BACKUP = "BACKUP"


@dataclass
class OrderContext:
    """Order context for execution path computation"""
    order_id: str
    symbol: str
    side: str  # BUY/SELL
    size: float
    order_type: str  # MARKET/LIMIT/STOP
    price: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    urgency_level: str = "NORMAL"  # LOW/NORMAL/HIGH/CRITICAL
    risk_tolerance: float = 0.5  # 0-1 scale
    max_slippage: float = 0.001  # 10 basis points default
    max_latency: float = 500.0  # 500ms default


@dataclass
class ExecutionPath:
    """Precomputed execution path"""
    path_id: str
    path_type: ExecutionPathType
    priority: int  # 1 = highest priority
    confidence: float  # 0-1 scale
    estimated_latency: float
    estimated_slippage: float
    estimated_cost: float
    
    # Path execution strategy
    execution_steps: List[Dict[str, Any]]
    fallback_paths: List[str]  # Other path IDs
    conditions: Dict[str, Any]  # Required conditions for this path
    
    # Metadata
    created_timestamp: float = field(default_factory=time.time)
    last_updated: float = field(default_factory=time.time)
    usage_count: int = 0
    success_rate: float = 1.0


@dataclass
class ReflexEvent:
    """Reflex event data structure"""
    event_type: ReflexEventType
    order_id: str
    timestamp: float
    severity: float  # 0-1 scale (1 = critical)
    data: Dict[str, Any]
    
    # Market context
    current_price: Optional[float] = None
    price_change: Optional[float] = None
    volatility: Optional[float] = None
    volume: Optional[float] = None


@dataclass
class ReflexResponse:
    """Reflex response with action and confidence"""
    reflex_action: ReflexActionType
    reflex_confidence: float  # 0-100 scale
    reflex_timestamp: float
    reaction_path_id: str
    
    # Response details
    action_parameters: Dict[str, Any]
    alternative_actions: List[Dict[str, Any]]
    confidence_factors: Dict[str, float]
    
    # Integration data
    neural_reaction_score: Optional[float] = None
    stability_shield_status: Optional[str] = None
    execution_precision_score: Optional[float] = None
    rtem_alert_level: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert reflex response to dictionary format"""
        return {
            "reflex_action": self.reflex_action.value,
            "reflex_confidence": self.reflex_confidence,
            "reflex_timestamp": self.reflex_timestamp,
            "reaction_path_id": self.reaction_path_id,
            "action_parameters": self.action_parameters,
            "alternative_actions": self.alternative_actions,
            "confidence_factors": self.confidence_factors,
            "neural_reaction_score": self.neural_reaction_score,
            "stability_shield_status": self.stability_shield_status,
            "execution_precision_score": self.execution_precision_score,
            "rtem_alert_level": self.rtem_alert_level
        }


@dataclass
class ReflexState:
    """Current state of the reflex loop engine"""
    active_paths_count: int
    processed_reflexes_count: int
    average_reflex_latency: float
    average_reflex_confidence: float
    
    # Action distribution
    action_distribution: Dict[str, int]
    success_rate: float
    
    # System integration status
    neural_engine_connected: bool
    stability_shield_connected: bool
    precision_core_connected: bool
    rtem_connected: bool
    
    # Performance metrics
    total_orders_processed: int
    total_reflexes_triggered: int
    emergency_actions_taken: int
    
    last_updated: float = field(default_factory=time.time)


class ExecutionReflexLoopEngine:
    """
    Execution Reflex Loop Engine (ERLE)
    
    Ultra-low latency execution reflex system that precomputes execution paths
    and provides instant reflex responses to critical market conditions.
    """
    
    def __init__(self):
        """Initialize the Execution Reflex Loop Engine"""
        logger.info("Initializing Execution Reflex Loop Engine...")
        
        # Core system parameters
        self.reflex_latency_target = 5.0  # Target reflex response time in milliseconds
        self.path_precomputation_depth = 5  # Number of paths to precompute
        self.confidence_threshold = 70.0  # Minimum confidence for action execution
        self.emergency_threshold = 0.8  # Severity threshold for emergency actions
        
        # Path management
        self.active_execution_paths: Dict[str, List[ExecutionPath]] = {}  # order_id -> paths
        self.path_performance_history = defaultdict(list)
        self.path_templates = {}  # Reusable path templates
        
        # Reflex processing
        self.reflex_history: deque = deque(maxlen=1000)  # Last 1000 reflexes
        self.reflex_latencies: deque = deque(maxlen=100)  # Latency tracking
        self.action_counts = defaultdict(int)
        
        # State tracking
        self.total_orders_processed = 0
        self.total_reflexes_triggered = 0
        self.emergency_actions_taken = 0
        self.current_average_latency = 0.0
        self.current_average_confidence = 80.0
        
        # System integration
        self.neural_reaction_engine = None
        self.stability_shield_engine = None  # Mock integration
        self.execution_precision_core = None  # Mock integration
        self.rtem_monitor = None  # Mock integration
        
        # Reflex action weights and priorities
        self.action_priorities = {
            ReflexActionType.CANCEL: 1,  # Highest priority
            ReflexActionType.HEDGE: 2,
            ReflexActionType.RE_ROUTE: 3,
            ReflexActionType.SPLIT: 4,
            ReflexActionType.DOUBLE_CONFIRM: 5,
            ReflexActionType.INVERT: 6  # Lowest priority
        }
        
        # Event severity mappings
        self.event_severity_base = {
            ReflexEventType.EXECUTION_FAIL: 1.0,  # Critical
            ReflexEventType.SHIELD_ALERT: 0.9,   # Very high
            ReflexEventType.PRICE_SPIKE: 0.8,    # High
            ReflexEventType.PRICE_DROP: 0.8,     # High
            ReflexEventType.SLIPPAGE_HIGH: 0.7,  # High
            ReflexEventType.LATENCY_SPIKE: 0.6,  # Medium-high
            ReflexEventType.HEDGE_REQUIRED: 0.5, # Medium
            ReflexEventType.PARTIAL_FILL: 0.3    # Low-medium
        }
    
    async def initialize(self) -> None:
        """Initialize the Execution Reflex Loop Engine"""
        try:
            logger.info("Initializing ERLE system integrations...")
            
            # Connect to neural reaction engine
            self.neural_reaction_engine = get_execution_neural_reaction_engine()
            
            # Initialize mock system integrations
            self.stability_shield_engine = await self._initialize_stability_shield_mock()
            self.execution_precision_core = await self._initialize_precision_core_mock()
            self.rtem_monitor = await self._initialize_rtem_mock()
            
            # Preload execution path templates
            await self._initialize_path_templates()
            
            # Start background optimization
            asyncio.create_task(self._background_path_optimizer())
            
            logger.info("Execution Reflex Loop Engine initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing ERLE: {e}")
            raise
    
    async def precompute_execution_paths(self, order: OrderContext) -> List[ExecutionPath]:
        """
        Precompute multiple execution paths for an order
        
        Args:
            order: Order context for path computation
            
        Returns:
            List[ExecutionPath]: Precomputed execution paths
        """
        start_time = time.time()
        
        try:
            logger.debug(f"Precomputing execution paths for order {order.order_id}")
            
            # Generate primary execution paths
            paths = []
            
            # 1. Direct execution path
            direct_path = await self._create_direct_path(order)
            paths.append(direct_path)
            
            # 2. Split order path (for large orders)
            if order.size > 0.1:  # Large order threshold
                split_path = await self._create_split_path(order)
                paths.append(split_path)
            
            # 3. Hedge-wrapped path (for high risk)
            if order.risk_tolerance < 0.5:
                hedge_path = await self._create_hedge_path(order)
                paths.append(hedge_path)
            
            # 4. Delayed execution path
            delayed_path = await self._create_delayed_path(order)
            paths.append(delayed_path)
            
            # 5. Emergency path
            emergency_path = await self._create_emergency_path(order)
            paths.append(emergency_path)
            
            # Sort paths by priority and confidence
            paths.sort(key=lambda p: (p.priority, -p.confidence))
            
            # Store paths for the order
            self.active_execution_paths[order.order_id] = paths
            self.total_orders_processed += 1
            
            computation_time = (time.time() - start_time) * 1000  # Convert to ms
            logger.debug(f"Precomputed {len(paths)} paths in {computation_time:.2f}ms")
            
            return paths
            
        except Exception as e:
            logger.error(f"Error precomputing execution paths: {e}")
            # Return minimal emergency path
            emergency_path = await self._create_emergency_path(order)
            return [emergency_path]
    
    async def trigger_reflex(self, event: ReflexEvent) -> ReflexResponse:
        """
        Trigger reflex response to execution event
        
        Args:
            event: Reflex event to process
            
        Returns:
            ReflexResponse: Reflex response with action and confidence
        """
        reflex_start = time.time()
        
        try:
            logger.debug(f"Triggering reflex for {event.event_type.value}")
            
            # Store reflex in history
            self.reflex_history.append(event)
            self.total_reflexes_triggered += 1
            
            # Get precomputed paths for the order
            paths = self.active_execution_paths.get(event.order_id, [])
            
            if not paths:
                # No precomputed paths - create emergency response
                return await self._create_emergency_response(event)
            
            # Analyze event and determine reflex action
            reflex_action = await self._determine_reflex_action(event, paths)
            
            # Calculate reflex confidence
            reflex_confidence = await self._calculate_reflex_confidence(event, reflex_action, paths)
            
            # Select reaction path
            reaction_path = await self._select_reaction_path(event, reflex_action, paths)
            
            # Build action parameters
            action_parameters = await self._build_action_parameters(event, reflex_action, reaction_path)
            
            # Generate alternative actions
            alternatives = await self._generate_alternative_actions(event, paths)
            
            # Calculate confidence factors
            confidence_factors = await self._calculate_confidence_factors(event, reflex_action)
            
            # Integrate with other systems
            integration_data = await self._integrate_with_systems(event, reflex_action)
            
            # Create reflex response
            response = ReflexResponse(
                reflex_action=reflex_action,
                reflex_confidence=reflex_confidence,
                reflex_timestamp=time.time(),
                reaction_path_id=reaction_path.path_id if reaction_path else "emergency",
                action_parameters=action_parameters,
                alternative_actions=alternatives,
                confidence_factors=confidence_factors,
                neural_reaction_score=integration_data.get("neural_score"),
                stability_shield_status=integration_data.get("shield_status"),
                execution_precision_score=integration_data.get("precision_score"),
                rtem_alert_level=integration_data.get("rtem_alert")
            )
            
            # Update statistics
            reflex_latency = (time.time() - reflex_start) * 1000  # Convert to ms
            await self._update_reflex_statistics(reflex_latency, response)
            
            # Handle emergency actions
            if event.severity >= self.emergency_threshold:
                self.emergency_actions_taken += 1
                logger.warning(f"Emergency reflex action triggered: {reflex_action.value}")
            
            logger.debug(f"Reflex completed in {reflex_latency:.2f}ms: {reflex_action.value}")
            
            return response
            
        except Exception as e:
            logger.error(f"Error in reflex trigger: {e}")
            # Return safe emergency response
            return await self._create_emergency_response(event)
    
    def get_reflex_state(self) -> ReflexState:
        """
        Get current state of the reflex loop engine
        
        Returns:
            ReflexState: Current engine state and performance metrics
        """
        try:
            # Calculate current metrics
            active_paths_count = sum(len(paths) for paths in self.active_execution_paths.values())
            
            # Calculate averages
            if self.reflex_latencies:
                average_latency = statistics.mean(self.reflex_latencies)
            else:
                average_latency = 0.0
            
            if self.reflex_history:
                recent_reflexes = list(self.reflex_history)[-50:]
                # Mock confidence calculation
                average_confidence = 80.0  # Would be calculated from actual responses
            else:
                average_confidence = self.current_average_confidence
            
            # Build action distribution
            action_distribution = {
                action.value: self.action_counts[action]
                for action in ReflexActionType
            }
            
            # Calculate success rate (mock)
            success_rate = 0.95 if self.total_reflexes_triggered > 0 else 1.0
            
            # Check system connections
            neural_connected = self.neural_reaction_engine is not None
            shield_connected = self.stability_shield_engine is not None
            precision_connected = self.execution_precision_core is not None
            rtem_connected = self.rtem_monitor is not None
            
            return ReflexState(
                active_paths_count=active_paths_count,
                processed_reflexes_count=self.total_reflexes_triggered,
                average_reflex_latency=average_latency,
                average_reflex_confidence=average_confidence,
                action_distribution=action_distribution,
                success_rate=success_rate,
                neural_engine_connected=neural_connected,
                stability_shield_connected=shield_connected,
                precision_core_connected=precision_connected,
                rtem_connected=rtem_connected,
                total_orders_processed=self.total_orders_processed,
                total_reflexes_triggered=self.total_reflexes_triggered,
                emergency_actions_taken=self.emergency_actions_taken
            )
            
        except Exception as e:
            logger.error(f"Error getting reflex state: {e}")
            
            # Return minimal state on error
            return ReflexState(
                active_paths_count=0,
                processed_reflexes_count=self.total_reflexes_triggered,
                average_reflex_latency=0.0,
                average_reflex_confidence=50.0,
                action_distribution={},
                success_rate=0.5,
                neural_engine_connected=False,
                stability_shield_connected=False,
                precision_core_connected=False,
                rtem_connected=False,
                total_orders_processed=self.total_orders_processed,
                total_reflexes_triggered=self.total_reflexes_triggered,
                emergency_actions_taken=self.emergency_actions_taken
            )
    
    # Private helper methods
    
    async def _create_direct_path(self, order: OrderContext) -> ExecutionPath:
        """Create direct execution path"""
        return ExecutionPath(
            path_id=f"direct_{order.order_id}_{int(time.time())}",
            path_type=ExecutionPathType.DIRECT,
            priority=1,
            confidence=0.9,
            estimated_latency=50.0,
            estimated_slippage=0.0002,
            estimated_cost=order.size * 0.0001,  # 1 basis point
            execution_steps=[
                {
                    "step": "submit_order",
                    "order_type": order.order_type,
                    "size": order.size,
                    "price": order.price
                }
            ],
            fallback_paths=[],
            conditions={"market_open": True, "liquidity_adequate": True}
        )
    
    async def _create_split_path(self, order: OrderContext) -> ExecutionPath:
        """Create split order execution path"""
        split_size = order.size / 3  # Split into 3 parts
        
        return ExecutionPath(
            path_id=f"split_{order.order_id}_{int(time.time())}",
            path_type=ExecutionPathType.SPLIT_ORDER,
            priority=2,
            confidence=0.8,
            estimated_latency=150.0,
            estimated_slippage=0.0001,  # Lower slippage due to smaller sizes
            estimated_cost=order.size * 0.00015,
            execution_steps=[
                {"step": "submit_order", "order_type": order.order_type, "size": split_size, "sequence": 1},
                {"step": "submit_order", "order_type": order.order_type, "size": split_size, "sequence": 2},
                {"step": "submit_order", "order_type": order.order_type, "size": split_size, "sequence": 3}
            ],
            fallback_paths=[],
            conditions={"volatility": "low"}
        )
    
    async def _create_hedge_path(self, order: OrderContext) -> ExecutionPath:
        """Create hedge-wrapped execution path"""
        hedge_size = order.size * 0.3  # 30% hedge
        
        return ExecutionPath(
            path_id=f"hedge_{order.order_id}_{int(time.time())}",
            path_type=ExecutionPathType.HEDGE_WRAPPED,
            priority=3,
            confidence=0.85,
            estimated_latency=100.0,
            estimated_slippage=0.0003,
            estimated_cost=order.size * 0.0002,  # Higher cost due to hedging
            execution_steps=[
                {"step": "submit_hedge", "size": hedge_size, "side": "opposite"},
                {"step": "submit_main_order", "order_type": order.order_type, "size": order.size},
                {"step": "adjust_hedge", "action": "close_partial"}
            ],
            fallback_paths=[],
            conditions={"risk_high": True}
        )
    
    async def _create_delayed_path(self, order: OrderContext) -> ExecutionPath:
        """Create delayed execution path"""
        return ExecutionPath(
            path_id=f"delayed_{order.order_id}_{int(time.time())}",
            path_type=ExecutionPathType.DELAYED,
            priority=4,
            confidence=0.7,
            estimated_latency=5000.0,  # 5 second delay
            estimated_slippage=0.0001,
            estimated_cost=order.size * 0.00008,
            execution_steps=[
                {"step": "wait", "duration": 5.0},
                {"step": "assess_market"},
                {"step": "submit_order", "order_type": order.order_type, "size": order.size}
            ],
            fallback_paths=[],
            conditions={"volatility": "high"}
        )
    
    async def _create_emergency_path(self, order: OrderContext) -> ExecutionPath:
        """Create emergency execution path"""
        return ExecutionPath(
            path_id=f"emergency_{order.order_id}_{int(time.time())}",
            path_type=ExecutionPathType.EMERGENCY,
            priority=5,
            confidence=0.6,
            estimated_latency=20.0,
            estimated_slippage=0.001,  # Higher slippage acceptable in emergency
            estimated_cost=order.size * 0.0005,
            execution_steps=[
                {"step": "emergency_submit", "order_type": "MARKET", "size": order.size}
            ],
            fallback_paths=[],
            conditions={}  # No conditions - always executable
        )
    
    async def _determine_reflex_action(self, event: ReflexEvent, paths: List[ExecutionPath]) -> ReflexActionType:
        """Determine appropriate reflex action for the event"""
        try:
            # High severity events
            if event.severity >= 0.9:
                if event.event_type in [ReflexEventType.EXECUTION_FAIL, ReflexEventType.SHIELD_ALERT]:
                    return ReflexActionType.CANCEL
                elif event.event_type in [ReflexEventType.PRICE_SPIKE, ReflexEventType.PRICE_DROP]:
                    return ReflexActionType.HEDGE
            
            # Medium-high severity events
            elif event.severity >= 0.7:
                if event.event_type == ReflexEventType.SLIPPAGE_HIGH:
                    return ReflexActionType.RE_ROUTE
                elif event.event_type == ReflexEventType.LATENCY_SPIKE:
                    return ReflexActionType.SPLIT
            
            # Medium severity events
            elif event.severity >= 0.5:
                if event.event_type == ReflexEventType.HEDGE_REQUIRED:
                    return ReflexActionType.HEDGE
                elif event.event_type == ReflexEventType.PARTIAL_FILL:
                    return ReflexActionType.DOUBLE_CONFIRM
            
            # Low severity - default action
            else:
                return ReflexActionType.DOUBLE_CONFIRM
            
            # Fallback
            return ReflexActionType.RE_ROUTE
            
        except Exception as e:
            logger.warning(f"Error determining reflex action: {e}")
            return ReflexActionType.CANCEL  # Safe fallback
    
    async def _calculate_reflex_confidence(self, event: ReflexEvent, action: ReflexActionType, paths: List[ExecutionPath]) -> float:
        """Calculate confidence in the reflex action"""
        try:
            base_confidence = 70.0
            
            # Adjust based on event severity
            severity_adjustment = (1.0 - event.severity) * 20  # Higher severity = lower confidence
            
            # Adjust based on action type
            action_confidence = {
                ReflexActionType.CANCEL: 90.0,
                ReflexActionType.HEDGE: 85.0,
                ReflexActionType.RE_ROUTE: 80.0,
                ReflexActionType.SPLIT: 75.0,
                ReflexActionType.DOUBLE_CONFIRM: 70.0,
                ReflexActionType.INVERT: 60.0
            }
            
            action_score = action_confidence.get(action, 50.0)
            
            # Adjust based on available paths
            path_confidence = 0.0
            if paths:
                avg_path_confidence = statistics.mean(p.confidence for p in paths) * 100
                path_confidence = avg_path_confidence * 0.2
            
            # Combine factors
            total_confidence = (action_score * 0.6 + severity_adjustment * 0.2 + path_confidence * 0.2)
            
            return max(0.0, min(100.0, total_confidence))
            
        except Exception as e:
            logger.warning(f"Error calculating reflex confidence: {e}")
            return 50.0
    
    async def _select_reaction_path(self, event: ReflexEvent, action: ReflexActionType, paths: List[ExecutionPath]) -> Optional[ExecutionPath]:
        """Select the best reaction path for the reflex action"""
        try:
            if not paths:
                return None
            
            # Filter paths suitable for the action
            suitable_paths = []
            
            if action == ReflexActionType.CANCEL:
                # Any path can be cancelled
                suitable_paths = paths
            elif action == ReflexActionType.RE_ROUTE:
                # Prefer backup or alternative paths
                suitable_paths = [p for p in paths if p.path_type in [ExecutionPathType.BACKUP, ExecutionPathType.DELAYED]]
            elif action == ReflexActionType.SPLIT:
                # Prefer split order paths
                suitable_paths = [p for p in paths if p.path_type == ExecutionPathType.SPLIT_ORDER]
            elif action == ReflexActionType.HEDGE:
                # Prefer hedge-wrapped paths
                suitable_paths = [p for p in paths if p.path_type == ExecutionPathType.HEDGE_WRAPPED]
            else:
                # Use any available path
                suitable_paths = paths
            
            # Fallback to any available path if no suitable ones found
            if not suitable_paths:
                suitable_paths = paths
            
            # Select the best path (highest confidence, lowest latency)
            best_path = max(suitable_paths, key=lambda p: p.confidence - (p.estimated_latency / 1000))
            return best_path
            
        except Exception as e:
            logger.warning(f"Error selecting reaction path: {e}")
            return paths[0] if paths else None
    
    async def _build_action_parameters(self, event: ReflexEvent, action: ReflexActionType, path: Optional[ExecutionPath]) -> Dict[str, Any]:
        """Build parameters for the reflex action"""
        try:
            parameters = {
                "action": action.value,
                "order_id": event.order_id,
                "timestamp": time.time(),
                "severity": event.severity
            }
            
            if path:
                parameters["path_id"] = path.path_id
                parameters["estimated_latency"] = path.estimated_latency
                parameters["confidence"] = path.confidence
            
            # Action-specific parameters
            if action == ReflexActionType.CANCEL:
                parameters["cancel_reason"] = f"Reflex trigger: {event.event_type.value}"
                
            elif action == ReflexActionType.RE_ROUTE:
                parameters["new_path"] = path.path_id if path else "emergency"
                parameters["route_reason"] = "Execution condition changed"
                
            elif action == ReflexActionType.HEDGE:
                parameters["hedge_ratio"] = 0.3
                parameters["hedge_side"] = "opposite"
                
            elif action == ReflexActionType.SPLIT:
                parameters["split_count"] = 3
                parameters["split_strategy"] = "time_weighted"
                
            elif action == ReflexActionType.DOUBLE_CONFIRM:
                parameters["confirmation_required"] = True
                parameters["timeout"] = 10.0
                
            elif action == ReflexActionType.INVERT:
                parameters["invert_side"] = True
                parameters["invert_reason"] = "Market condition reversal"
            
            return parameters
            
        except Exception as e:
            logger.warning(f"Error building action parameters: {e}")
            return {"action": action.value, "order_id": event.order_id}
    
    async def _generate_alternative_actions(self, event: ReflexEvent, paths: List[ExecutionPath]) -> List[Dict[str, Any]]:
        """Generate alternative reflex actions"""
        try:
            alternatives = []
            
            # Generate 2-3 alternative actions based on event type
            primary_action = await self._determine_reflex_action(event, paths)
            
            for action in ReflexActionType:
                if action != primary_action and len(alternatives) < 3:
                    confidence = await self._calculate_reflex_confidence(event, action, paths)
                    
                    alternatives.append({
                        "action": action.value,
                        "confidence": confidence,
                        "priority": self.action_priorities.get(action, 10)
                    })
            
            # Sort by confidence
            alternatives.sort(key=lambda x: x["confidence"], reverse=True)
            return alternatives[:3]  # Return top 3 alternatives
            
        except Exception as e:
            logger.warning(f"Error generating alternative actions: {e}")
            return []
    
    async def _calculate_confidence_factors(self, event: ReflexEvent, action: ReflexActionType) -> Dict[str, float]:
        """Calculate factors contributing to confidence"""
        try:
            factors = {}
            
            # Event severity factor
            factors["event_severity"] = 1.0 - event.severity  # Lower severity = higher confidence
            
            # Action appropriateness factor
            action_appropriateness = {
                ReflexEventType.EXECUTION_FAIL: {
                    ReflexActionType.CANCEL: 1.0,
                    ReflexActionType.RE_ROUTE: 0.8,
                    ReflexActionType.HEDGE: 0.3
                },
                ReflexEventType.PRICE_SPIKE: {
                    ReflexActionType.HEDGE: 1.0,
                    ReflexActionType.CANCEL: 0.7,
                    ReflexActionType.RE_ROUTE: 0.5
                }
            }
            
            if event.event_type in action_appropriateness:
                factors["action_appropriateness"] = action_appropriateness[event.event_type].get(action, 0.5)
            else:
                factors["action_appropriateness"] = 0.7
            
            # Historical success factor (mock)
            factors["historical_success"] = 0.85
            
            # Market condition factor (mock)
            factors["market_conditions"] = 0.8
            
            # System stability factor
            factors["system_stability"] = 0.9
            
            return factors
            
        except Exception as e:
            logger.warning(f"Error calculating confidence factors: {e}")
            return {"default": 0.5}
    
    async def _integrate_with_systems(self, event: ReflexEvent, action: ReflexActionType) -> Dict[str, Any]:
        """Integrate with other execution systems"""
        try:
            integration_data = {}
            
            # Neural reaction engine integration
            if self.neural_reaction_engine:
                try:
                    # Mock neural reaction score
                    integration_data["neural_score"] = 0.75
                except Exception as e:
                    logger.warning(f"Neural reaction engine integration error: {e}")
            
            # Stability shield integration
            if self.stability_shield_engine:
                integration_data["shield_status"] = "ACTIVE"
            else:
                integration_data["shield_status"] = "DISCONNECTED"
            
            # Execution precision core integration
            if self.execution_precision_core:
                integration_data["precision_score"] = 0.85
            else:
                integration_data["precision_score"] = None
            
            # Real-Time Execution Monitor integration
            if self.rtem_monitor:
                if event.severity > 0.8:
                    integration_data["rtem_alert"] = "HIGH"
                elif event.severity > 0.5:
                    integration_data["rtem_alert"] = "MEDIUM"
                else:
                    integration_data["rtem_alert"] = "LOW"
            else:
                integration_data["rtem_alert"] = None
            
            return integration_data
            
        except Exception as e:
            logger.warning(f"Error in system integration: {e}")
            return {}
    
    async def _update_reflex_statistics(self, latency: float, response: ReflexResponse) -> None:
        """Update reflex performance statistics"""
        try:
            # Update latency tracking
            self.reflex_latencies.append(latency)
            
            # Update action counts
            self.action_counts[response.reflex_action] += 1
            
            # Update average metrics
            if self.reflex_latencies:
                self.current_average_latency = statistics.mean(self.reflex_latencies)
            
            # Update confidence tracking (mock)
            self.current_average_confidence = (
                0.9 * self.current_average_confidence + 
                0.1 * response.reflex_confidence
            )
            
        except Exception as e:
            logger.warning(f"Error updating reflex statistics: {e}")
    
    async def _create_emergency_response(self, event: ReflexEvent) -> ReflexResponse:
        """Create emergency reflex response when no paths available"""
        return ReflexResponse(
            reflex_action=ReflexActionType.CANCEL,
            reflex_confidence=90.0,  # High confidence in emergency cancellation
            reflex_timestamp=time.time(),
            reaction_path_id="emergency_cancel",
            action_parameters={
                "action": "CANCEL",
                "order_id": event.order_id,
                "reason": "Emergency response - no paths available",
                "severity": event.severity
            },
            alternative_actions=[],
            confidence_factors={"emergency": 1.0}
        )
    
    async def _initialize_stability_shield_mock(self) -> Dict[str, Any]:
        """Initialize mock stability shield engine"""
        return {
            "status": "active",
            "shield_level": "normal",
            "last_ping": time.time()
        }
    
    async def _initialize_precision_core_mock(self) -> Dict[str, Any]:
        """Initialize mock execution precision core"""
        return {
            "status": "active",
            "precision_level": 0.85,
            "last_calibration": time.time()
        }
    
    async def _initialize_rtem_mock(self) -> Dict[str, Any]:
        """Initialize mock RTEM monitor"""
        return {
            "status": "monitoring",
            "alert_level": "low",
            "last_update": time.time()
        }
    
    async def _initialize_path_templates(self) -> None:
        """Initialize reusable path templates"""
        try:
            # Basic path templates for common scenarios
            self.path_templates = {
                "market_order": {
                    "priority": 1,
                    "confidence": 0.9,
                    "estimated_latency": 50.0,
                    "steps": [{"step": "submit_market_order"}]
                },
                "limit_order": {
                    "priority": 2,
                    "confidence": 0.8,
                    "estimated_latency": 100.0,
                    "steps": [{"step": "submit_limit_order"}]
                },
                "split_execution": {
                    "priority": 3,
                    "confidence": 0.75,
                    "estimated_latency": 200.0,
                    "steps": [{"step": "split_and_submit"}]
                }
            }
            
        except Exception as e:
            logger.warning(f"Error initializing path templates: {e}")
    
    async def _background_path_optimizer(self) -> None:
        """Background task for optimizing execution paths"""
        while True:
            try:
                await asyncio.sleep(10)  # Run every 10 seconds
                
                # Optimize path performance based on historical data
                for order_id, paths in self.active_execution_paths.items():
                    for path in paths:
                        # Update path confidence based on historical performance
                        if path.path_id in self.path_performance_history:
                            performance_data = self.path_performance_history[path.path_id]
                            if performance_data:
                                avg_success = statistics.mean(performance_data)
                                path.success_rate = avg_success
                                path.confidence = path.confidence * 0.9 + avg_success * 0.1
                
                # Clean up old paths (older than 1 hour)
                current_time = time.time()
                for order_id in list(self.active_execution_paths.keys()):
                    paths = self.active_execution_paths[order_id]
                    active_paths = [
                        p for p in paths 
                        if current_time - p.created_timestamp < 3600  # 1 hour
                    ]
                    
                    if active_paths:
                        self.active_execution_paths[order_id] = active_paths
                    else:
                        del self.active_execution_paths[order_id]
                
            except Exception as e:
                logger.error(f"Error in background path optimizer: {e}")


# Global instance
_execution_reflex_loop_engine: Optional[ExecutionReflexLoopEngine] = None


def get_execution_reflex_loop_engine() -> ExecutionReflexLoopEngine:
    """Get or create the global Execution Reflex Loop Engine instance"""
    global _execution_reflex_loop_engine
    if _execution_reflex_loop_engine is None:
        _execution_reflex_loop_engine = ExecutionReflexLoopEngine()
    return _execution_reflex_loop_engine


async def initialize_execution_reflex_loop_engine() -> ExecutionReflexLoopEngine:
    """Initialize and return the global Execution Reflex Loop Engine instance"""
    engine = get_execution_reflex_loop_engine()
    await engine.initialize()
    return engine


# Convenience functions for external integration
async def precompute_execution_paths(order_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Precompute execution paths for an order
    
    Args:
        order_data: Order data dictionary
        
    Returns:
        List[Dict]: Precomputed execution paths
    """
    try:
        engine = get_execution_reflex_loop_engine()
        
        # Convert to OrderContext
        order = OrderContext(
            order_id=order_data["order_id"],
            symbol=order_data["symbol"],
            side=order_data["side"],
            size=order_data["size"],
            order_type=order_data.get("order_type", "MARKET"),
            price=order_data.get("price"),
            stop_loss=order_data.get("stop_loss"),
            take_profit=order_data.get("take_profit"),
            urgency_level=order_data.get("urgency_level", "NORMAL"),
            risk_tolerance=order_data.get("risk_tolerance", 0.5),
            max_slippage=order_data.get("max_slippage", 0.001),
            max_latency=order_data.get("max_latency", 500.0)
        )
        
        paths = await engine.precompute_execution_paths(order)
        
        return [
            {
                "path_id": path.path_id,
                "path_type": path.path_type.value,
                "priority": path.priority,
                "confidence": path.confidence,
                "estimated_latency": path.estimated_latency,
                "estimated_slippage": path.estimated_slippage,
                "estimated_cost": path.estimated_cost,
                "execution_steps": path.execution_steps
            }
            for path in paths
        ]
        
    except Exception as e:
        logger.error(f"Error in precompute_execution_paths: {e}")
        return []


async def trigger_reflex(event_type: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Trigger reflex response to execution event
    
    Args:
        event_type: Type of reflex event
        event_data: Event data dictionary
        
    Returns:
        Dict: Reflex response data
    """
    try:
        engine = get_execution_reflex_loop_engine()
        
        # Convert to ReflexEvent
        event = ReflexEvent(
            event_type=ReflexEventType(event_type),
            order_id=event_data["order_id"],
            timestamp=time.time(),
            severity=event_data.get("severity", 0.5),
            data=event_data,
            current_price=event_data.get("current_price"),
            price_change=event_data.get("price_change"),
            volatility=event_data.get("volatility"),
            volume=event_data.get("volume")
        )
        
        response = await engine.trigger_reflex(event)
        return response.to_dict()
        
    except Exception as e:
        logger.error(f"Error in trigger_reflex: {e}")
        return {
            "reflex_action": "CANCEL",
            "reflex_confidence": 50.0,
            "reflex_timestamp": time.time(),
            "reaction_path_id": "emergency",
            "error": str(e)
        }


def get_reflex_state() -> Dict[str, Any]:
    """
    Get reflex engine state
    
    Returns:
        Dict: Engine state data
    """
    try:
        engine = get_execution_reflex_loop_engine()
        state = engine.get_reflex_state()
        
        return {
            "active_paths_count": state.active_paths_count,
            "processed_reflexes_count": state.processed_reflexes_count,
            "average_reflex_latency": state.average_reflex_latency,
            "average_reflex_confidence": state.average_reflex_confidence,
            "action_distribution": state.action_distribution,
            "success_rate": state.success_rate,
            "neural_engine_connected": state.neural_engine_connected,
            "stability_shield_connected": state.stability_shield_connected,
            "precision_core_connected": state.precision_core_connected,
            "rtem_connected": state.rtem_connected,
            "total_orders_processed": state.total_orders_processed,
            "total_reflexes_triggered": state.total_reflexes_triggered,
            "emergency_actions_taken": state.emergency_actions_taken,
            "last_updated": state.last_updated
        }
        
    except Exception as e:
        logger.error(f"Error in get_reflex_state: {e}")
        return {"error": str(e)}