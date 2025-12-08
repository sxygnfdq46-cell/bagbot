"""
Trading Action Execution Mapper - Advanced Order Execution Planning System
Converts high-level trading decisions into detailed execution plans

This mapper transforms Decision Fusion Reactor outputs into actionable execution plans:
- Intelligent order type selection based on market conditions
- Dynamic position sizing with volatility adjustments
- Sophisticated stop-loss and take-profit calculations
- Comprehensive safety constraints and overrides
- Execution confidence assessment

CRITICAL: This system generates execution PLANS only - no direct broker integration
Compatible with any market adapter through abstracted interfaces
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

# Import required decision and execution types
from ..ai.DecisionFusionReactor import get_decision_fusion_reactor, ReactorDecision, FinalDecision
from ..ai.RegimeTransitionIntelligenceOrb import get_regime_transition_orb, RegimeState
from ..core.EvolutionMemoryVault import get_evolution_memory_vault, EvolutionRecord, EvolutionEventType

logger = logging.getLogger(__name__)


class ExecutionAction(Enum):
    """Execution actions for trading"""
    BUY = "BUY"
    SELL = "SELL"
    WAIT = "WAIT"


class OrderType(Enum):
    """Order types for execution"""
    MARKET = "MARKET"
    LIMIT = "LIMIT"
    STOP = "STOP"
    SCALED = "SCALED"


@dataclass
class ExecutionMeta:
    """Metadata for execution plan"""
    volatility_score: float = 0.0
    stability_score: float = 0.0
    execution_confidence: float = 0.0


@dataclass
class ExecutionPlan:
    """Complete execution plan output"""
    action: ExecutionAction
    order_type: OrderType
    size: float  # Position size as percentage
    sl: float  # Stop-loss in points or percentage
    tp: float  # Take-profit in points or percentage
    safety_lock: bool
    reason: List[str] = field(default_factory=list)
    meta: ExecutionMeta = field(default_factory=ExecutionMeta)
    timestamp: float = field(default_factory=time.time)
    
    # Additional execution metrics
    risk_reward_ratio: float = 0.0
    max_drawdown_estimate: float = 0.0
    expected_holding_time: str = "unknown"
    execution_priority: str = "normal"


class TradingActionExecutionMapper:
    """
    Trading Action Execution Mapper - Converts decisions into detailed execution plans
    
    Transforms high-level trading decisions from the Decision Fusion Reactor
    into actionable execution plans with sophisticated risk management.
    """
    
    def __init__(self):
        """Initialize the Trading Action Execution Mapper"""
        logger.info("Initializing Trading Action Execution Mapper...")
        
        # Position sizing parameters
        self.base_size_divisor = 150  # Base size = decisionStrength / 150
        self.max_position_size = 0.10  # Maximum 10% position size
        self.min_position_size = 0.01  # Minimum 1% position size
        
        # Volatility adjustment factors
        self.high_volatility_threshold = 80.0
        self.low_volatility_threshold = 40.0
        self.high_vol_size_multiplier = 0.4
        self.low_vol_size_multiplier = 1.2
        
        # Order type selection thresholds
        self.high_volatility_order_threshold = 70.0
        self.high_confidence_threshold = 0.7
        self.low_confidence_threshold = 0.5
        
        # Stop-loss and take-profit parameters
        self.default_stop_loss_points = 20  # Default SL in points
        self.trending_tp_multiplier = 1.8
        self.ranging_tp_multiplier = 1.2
        self.safety_override_sl_tightening = 0.6  # 40% tighter (multiply by 0.6)
        
        # Risk management parameters
        self.max_risk_per_trade = 0.02  # Maximum 2% risk per trade
        self.min_risk_reward_ratio = 1.5
        
        # Intelligence layer connections
        self.regime_orb = None
        self.evolution_vault = None
        
        # Execution history and tracking
        self.execution_history = deque(maxlen=100)
        self.performance_metrics = defaultdict(float)
        
        # Market adapter abstraction (no broker-specific code)
        self.market_conditions = {
            "spread": 2.0,  # Average spread in points
            "slippage": 1.5,  # Expected slippage in points
            "commission": 0.0001  # Commission as percentage
        }
        
        # Safety and compliance
        self.safety_mode_active = False
        self.emergency_shutdown = False
    
    async def initialize(self) -> None:
        """Initialize the Trading Action Execution Mapper"""
        logger.info("Initializing Trading Action Execution Mapper connections...")
        
        try:
            # Connect to intelligence layers
            self.regime_orb = get_regime_transition_orb()
            self.evolution_vault = get_evolution_memory_vault()
            
            logger.info("Trading Action Execution Mapper initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing Trading Action Execution Mapper: {e}")
            raise
    
    async def map_decision_to_action(self, reactor_decision: ReactorDecision) -> ExecutionAction:
        """
        Map reactor decision to execution action
        
        Args:
            reactor_decision: Decision from the Decision Fusion Reactor
            
        Returns:
            ExecutionAction: Mapped execution action
        """
        try:
            # Direct mapping from reactor decision
            if reactor_decision.final_decision == FinalDecision.LONG:
                return ExecutionAction.BUY
            elif reactor_decision.final_decision == FinalDecision.SHORT:
                return ExecutionAction.SELL
            else:
                return ExecutionAction.WAIT
                
        except Exception as e:
            logger.error(f"Error mapping decision to action: {e}")
            return ExecutionAction.WAIT
    
    async def determine_order_type(self, reactor_decision: ReactorDecision,
                                 volatility_score: float) -> OrderType:
        """
        Determine optimal order type based on market conditions
        
        Args:
            reactor_decision: Decision from the reactor
            volatility_score: Current volatility score
            
        Returns:
            OrderType: Optimal order type for execution
        """
        try:
            # Order Type Logic:
            # - If volatility > 70 → use LIMIT or SCALED
            # - If high confidence > 0.7 → MARKET
            # - If low confidence < 0.5 → WAIT
            
            confidence = reactor_decision.meta.confidence
            decision_strength = reactor_decision.decision_strength
            
            # High volatility conditions
            if volatility_score > self.high_volatility_order_threshold:
                if decision_strength > 80:
                    return OrderType.SCALED  # Scale in during high volatility with strong signal
                else:
                    return OrderType.LIMIT  # Use limit orders in volatile conditions
            
            # High confidence conditions
            elif confidence > self.high_confidence_threshold:
                return OrderType.MARKET  # Execute immediately with high confidence
            
            # Low confidence conditions
            elif confidence < self.low_confidence_threshold:
                return OrderType.LIMIT  # Be cautious with limit orders
            
            # Default conditions
            else:
                if decision_strength > 60:
                    return OrderType.MARKET
                else:
                    return OrderType.LIMIT
                    
        except Exception as e:
            logger.error(f"Error determining order type: {e}")
            return OrderType.LIMIT  # Safe default
    
    async def compute_position_size(self, reactor_decision: ReactorDecision,
                                  volatility_score: float) -> float:
        """
        Compute position size with volatility adjustments
        
        Args:
            reactor_decision: Decision from the reactor
            volatility_score: Current volatility score
            
        Returns:
            float: Position size as percentage (0-1)
        """
        try:
            # Position Sizing Rules:
            # Base size = decisionStrength / 150
            # Volatility adjustment:
            #   - If vol > 80 → size *= 0.4
            #   - If vol < 40 → size *= 1.2
            # Safety override → size = 0
            
            decision_strength = reactor_decision.decision_strength
            safety_override = reactor_decision.safety_override
            
            # Safety override check
            if safety_override or self.emergency_shutdown:
                return 0.0
            
            # Calculate base size
            base_size = decision_strength / self.base_size_divisor
            
            # Apply volatility adjustments
            if volatility_score > self.high_volatility_threshold:
                adjusted_size = base_size * self.high_vol_size_multiplier
            elif volatility_score < self.low_volatility_threshold:
                adjusted_size = base_size * self.low_vol_size_multiplier
            else:
                adjusted_size = base_size
            
            # Apply confidence adjustment
            confidence = reactor_decision.meta.confidence
            confidence_multiplier = 0.5 + (confidence * 0.5)  # 0.5 to 1.0 range
            adjusted_size *= confidence_multiplier
            
            # Apply stability adjustment
            stability_score = reactor_decision.meta.stability_score
            stability_multiplier = 0.7 + (stability_score / 100 * 0.3)  # 0.7 to 1.0 range
            adjusted_size *= stability_multiplier
            
            # Clamp to valid range
            final_size = max(self.min_position_size, 
                           min(self.max_position_size, adjusted_size))
            
            logger.debug(f"Position size: {final_size:.3f} (base: {base_size:.3f}, vol_adj: {volatility_score:.1f})")
            
            return final_size
            
        except Exception as e:
            logger.error(f"Error computing position size: {e}")
            return 0.0
    
    async def compute_stop_loss_take_profit(self, reactor_decision: ReactorDecision,
                                          volatility_score: float,
                                          position_size: float) -> Tuple[float, float]:
        """
        Compute stop-loss and take-profit levels
        
        Args:
            reactor_decision: Decision from the reactor
            volatility_score: Current volatility score
            position_size: Calculated position size
            
        Returns:
            Tuple[float, float]: Stop-loss and take-profit in points
        """
        try:
            # SL/TP Logic:
            # - sl = dynamic stop based on volatilityEngine output
            # - tp = 1.8 × sl for trending
            # - tp = 1.2 × sl for ranging
            # - safetyOverride forces sl to tighten by 40%
            
            safety_override = reactor_decision.safety_override
            
            # Calculate dynamic stop-loss based on volatility
            base_sl = await self._calculate_volatility_based_sl(volatility_score)
            
            # Apply safety override tightening
            if safety_override:
                stop_loss = base_sl * self.safety_override_sl_tightening
            else:
                stop_loss = base_sl
            
            # Determine market regime for take-profit calculation
            market_regime = await self._get_current_market_regime()
            
            # Calculate take-profit based on regime
            if market_regime in [RegimeState.TRENDING, RegimeState.STABLE]:
                take_profit = stop_loss * self.trending_tp_multiplier
            else:
                take_profit = stop_loss * self.ranging_tp_multiplier
            
            # Apply decision strength adjustment
            decision_strength = reactor_decision.decision_strength
            strength_multiplier = 0.8 + (decision_strength / 100 * 0.4)  # 0.8 to 1.2 range
            take_profit *= strength_multiplier
            
            # Ensure minimum risk-reward ratio
            risk_reward = take_profit / stop_loss
            if risk_reward < self.min_risk_reward_ratio:
                take_profit = stop_loss * self.min_risk_reward_ratio
            
            # Apply position size adjustment (larger positions need tighter stops)
            if position_size > 0.05:  # 5%
                size_adjustment = 1.0 - ((position_size - 0.05) * 2)  # Reduce SL/TP for large positions
                stop_loss *= max(0.7, size_adjustment)
                take_profit *= max(0.7, size_adjustment)
            
            logger.debug(f"SL/TP: {stop_loss:.1f}/{take_profit:.1f} points (regime: {market_regime}, R:R {take_profit/stop_loss:.1f})")
            
            return stop_loss, take_profit
            
        except Exception as e:
            logger.error(f"Error computing SL/TP: {e}")
            # Return conservative defaults
            return self.default_stop_loss_points, self.default_stop_loss_points * 1.5
    
    async def apply_safety_constraints(self, execution_plan: ExecutionPlan,
                                     reactor_decision: ReactorDecision) -> ExecutionPlan:
        """
        Apply final safety constraints to execution plan
        
        Args:
            execution_plan: Initial execution plan
            reactor_decision: Original reactor decision
            
        Returns:
            ExecutionPlan: Safety-adjusted execution plan
        """
        try:
            # Safety constraint checks
            safety_violations = []
            
            # Check maximum risk per trade
            risk_amount = execution_plan.size * (execution_plan.sl / 100)  # Rough risk calculation
            if risk_amount > self.max_risk_per_trade:
                execution_plan.size = self.max_risk_per_trade / (execution_plan.sl / 100)
                safety_violations.append(f"Position size reduced for risk management: {risk_amount:.3f} > {self.max_risk_per_trade}")
            
            # Check minimum risk-reward ratio
            if execution_plan.tp > 0 and execution_plan.sl > 0:
                risk_reward = execution_plan.tp / execution_plan.sl
                if risk_reward < self.min_risk_reward_ratio:
                    execution_plan.tp = execution_plan.sl * self.min_risk_reward_ratio
                    safety_violations.append(f"Take-profit adjusted for minimum R:R ratio: {risk_reward:.1f} < {self.min_risk_reward_ratio}")
            
            # Apply safety lock conditions
            if (reactor_decision.safety_override or 
                self.safety_mode_active or 
                self.emergency_shutdown):
                execution_plan.safety_lock = True
                execution_plan.action = ExecutionAction.WAIT
                execution_plan.size = 0.0
                safety_violations.append("Safety lock activated")
            
            # Emergency conditions
            if reactor_decision.meta.threat_level > 90:
                execution_plan.safety_lock = True
                execution_plan.action = ExecutionAction.WAIT
                execution_plan.size = 0.0
                safety_violations.append(f"Extreme threat level: {reactor_decision.meta.threat_level}")
            
            # Market conditions check
            if self.market_conditions["spread"] > 10:  # Very wide spreads
                execution_plan.order_type = OrderType.LIMIT
                safety_violations.append("Wide spreads detected - switching to limit orders")
            
            # Add safety violations to reasons
            execution_plan.reason.extend(safety_violations)
            
            return execution_plan
            
        except Exception as e:
            logger.error(f"Error applying safety constraints: {e}")
            # Return ultra-safe plan
            execution_plan.action = ExecutionAction.WAIT
            execution_plan.size = 0.0
            execution_plan.safety_lock = True
            execution_plan.reason.append(f"Safety constraint error: {str(e)}")
            return execution_plan
    
    async def finalize_execution_plan(self, reactor_decision: ReactorDecision,
                                    market_data: Optional[Dict[str, Any]] = None) -> ExecutionPlan:
        """
        Finalize complete execution plan
        
        Args:
            reactor_decision: Decision from the Decision Fusion Reactor
            market_data: Optional market data for analysis
            
        Returns:
            ExecutionPlan: Complete execution plan
        """
        try:
            # Gather market conditions
            volatility_score = await self._assess_current_volatility(market_data)
            
            # Step 1: Map decision to action
            execution_action = await self.map_decision_to_action(reactor_decision)
            
            # Step 2: Determine order type
            order_type = await self.determine_order_type(reactor_decision, volatility_score)
            
            # Step 3: Compute position size
            position_size = await self.compute_position_size(reactor_decision, volatility_score)
            
            # Step 4: Compute stop-loss and take-profit
            stop_loss, take_profit = await self.compute_stop_loss_take_profit(
                reactor_decision, volatility_score, position_size
            )
            
            # Step 5: Generate execution reasons
            reasons = await self._generate_execution_reasons(
                reactor_decision, execution_action, order_type, position_size, volatility_score
            )
            
            # Step 6: Calculate execution confidence
            execution_confidence = await self._calculate_execution_confidence(
                reactor_decision, volatility_score, position_size
            )
            
            # Create initial execution plan
            execution_plan = ExecutionPlan(
                action=execution_action,
                order_type=order_type,
                size=position_size,
                sl=stop_loss,
                tp=take_profit,
                safety_lock=reactor_decision.safety_override,
                reason=reasons,
                meta=ExecutionMeta(
                    volatility_score=volatility_score,
                    stability_score=reactor_decision.meta.stability_score,
                    execution_confidence=execution_confidence
                ),
                timestamp=time.time(),
                risk_reward_ratio=take_profit / stop_loss if stop_loss > 0 else 0,
                max_drawdown_estimate=position_size * (stop_loss / 100),
                expected_holding_time=await self._estimate_holding_time(reactor_decision),
                execution_priority=await self._determine_execution_priority(reactor_decision)
            )
            
            # Step 7: Apply final safety constraints
            final_execution_plan = await self.apply_safety_constraints(execution_plan, reactor_decision)
            
            # Update tracking
            self.execution_history.append(final_execution_plan)
            
            # Sync with evolution vault
            await self._sync_execution_with_vault(final_execution_plan, reactor_decision)
            
            logger.info(f"Execution Plan: {final_execution_plan.action.value} {final_execution_plan.size:.2%} "
                       f"{final_execution_plan.order_type.value} (SL: {final_execution_plan.sl:.1f}, "
                       f"TP: {final_execution_plan.tp:.1f}, Safety: {final_execution_plan.safety_lock})")
            
            return final_execution_plan
            
        except Exception as e:
            logger.error(f"Error finalizing execution plan: {e}")
            
            # Return ultra-safe fallback plan
            return ExecutionPlan(
                action=ExecutionAction.WAIT,
                order_type=OrderType.LIMIT,
                size=0.0,
                sl=0.0,
                tp=0.0,
                safety_lock=True,
                reason=[f"Execution planning error: {str(e)}"],
                meta=ExecutionMeta(),
                timestamp=time.time()
            )
    
    async def build_execution_plan(self, reactor_decision: ReactorDecision,
                                 market_data: Optional[Dict[str, Any]] = None) -> ExecutionPlan:
        """
        Main public function to build execution plan
        
        Args:
            reactor_decision: Decision from the Decision Fusion Reactor
            market_data: Optional market data for analysis
            
        Returns:
            ExecutionPlan: Complete execution plan
        """
        return await self.finalize_execution_plan(reactor_decision, market_data)
    
    # Private helper methods
    
    async def _assess_current_volatility(self, market_data: Optional[Dict[str, Any]]) -> float:
        """Assess current market volatility (mock VolatilityEngine integration)"""
        # Mock volatility assessment - ready for real VolatilityEngine integration
        base_volatility = 45.0
        
        if market_data:
            # Add realistic volatility factors
            if "prices" in market_data:
                prices = market_data["prices"][-20:] if len(market_data["prices"]) > 20 else market_data["prices"]
                if len(prices) > 1:
                    returns = np.diff(prices) / prices[:-1]
                    volatility_estimate = np.std(returns) * 100 * np.sqrt(252)  # Annualized
                    base_volatility = min(100, max(10, volatility_estimate))
        
        return base_volatility
    
    async def _calculate_volatility_based_sl(self, volatility_score: float) -> float:
        """Calculate dynamic stop-loss based on volatility"""
        # Dynamic SL calculation based on volatility
        base_sl = self.default_stop_loss_points
        
        if volatility_score > 80:
            return base_sl * 2.0  # Wider stops in high volatility
        elif volatility_score > 60:
            return base_sl * 1.5
        elif volatility_score < 30:
            return base_sl * 0.8  # Tighter stops in low volatility
        else:
            return base_sl
    
    async def _get_current_market_regime(self) -> RegimeState:
        """Get current market regime from regime orb"""
        if self.regime_orb:
            try:
                current_regime = await self.regime_orb.get_current_regime()
                regime_str = current_regime.get("regime", "unknown")
                
                # Convert string to RegimeState enum
                for state in RegimeState:
                    if state.value == regime_str:
                        return state
            except Exception as e:
                logger.warning(f"Error getting market regime: {e}")
        
        return RegimeState.UNKNOWN
    
    async def _generate_execution_reasons(self, reactor_decision: ReactorDecision,
                                        execution_action: ExecutionAction,
                                        order_type: OrderType,
                                        position_size: float,
                                        volatility_score: float) -> List[str]:
        """Generate explanatory reasons for execution plan"""
        reasons = []
        
        # Action reasoning
        reasons.append(f"Execution action: {execution_action.value} based on reactor decision {reactor_decision.final_decision.value}")
        
        # Order type reasoning
        if order_type == OrderType.MARKET:
            reasons.append(f"Market order: High confidence ({reactor_decision.meta.confidence:.2f})")
        elif order_type == OrderType.LIMIT:
            reasons.append(f"Limit order: Moderate confidence or high volatility ({volatility_score:.1f})")
        elif order_type == OrderType.SCALED:
            reasons.append(f"Scaled order: High volatility ({volatility_score:.1f}) with strong signal")
        
        # Size reasoning
        if position_size == 0:
            reasons.append("Zero position: Safety override or insufficient confidence")
        elif position_size < 0.02:
            reasons.append(f"Small position ({position_size:.1%}): Conservative sizing due to conditions")
        elif position_size > 0.05:
            reasons.append(f"Large position ({position_size:.1%}): High confidence signal")
        
        # Safety reasoning
        if reactor_decision.safety_override:
            reasons.append("Safety measures active from reactor decision")
        
        return reasons
    
    async def _calculate_execution_confidence(self, reactor_decision: ReactorDecision,
                                            volatility_score: float,
                                            position_size: float) -> float:
        """Calculate execution-specific confidence"""
        base_confidence = reactor_decision.meta.confidence
        
        # Adjust for volatility
        if volatility_score > 80:
            volatility_adjustment = -0.2  # Reduce confidence in high volatility
        elif volatility_score < 30:
            volatility_adjustment = 0.1  # Boost confidence in low volatility
        else:
            volatility_adjustment = 0
        
        # Adjust for position size (larger positions need higher confidence)
        if position_size > 0.05:
            size_adjustment = -0.1
        else:
            size_adjustment = 0
        
        # Adjust for market conditions
        spread_adjustment = -min(0.1, self.market_conditions["spread"] / 50)
        
        execution_confidence = base_confidence + volatility_adjustment + size_adjustment + spread_adjustment
        
        return max(0.1, min(1.0, execution_confidence))
    
    async def _estimate_holding_time(self, reactor_decision: ReactorDecision) -> str:
        """Estimate expected holding time for the trade"""
        decision_strength = reactor_decision.decision_strength
        
        if decision_strength > 80:
            return "1-4 hours"  # Strong signals for shorter timeframes
        elif decision_strength > 60:
            return "4-8 hours"
        elif decision_strength > 40:
            return "8-24 hours"
        else:
            return "1-3 days"
    
    async def _determine_execution_priority(self, reactor_decision: ReactorDecision) -> str:
        """Determine execution priority level"""
        if reactor_decision.safety_override:
            return "low"
        elif reactor_decision.decision_strength > 75 and reactor_decision.meta.confidence > 0.7:
            return "high"
        elif reactor_decision.decision_strength > 50:
            return "normal"
        else:
            return "low"
    
    async def _sync_execution_with_vault(self, execution_plan: ExecutionPlan,
                                       reactor_decision: ReactorDecision) -> None:
        """Sync execution plan with evolution memory vault"""
        if not self.evolution_vault:
            return
        
        try:
            record = EvolutionRecord(
                timestamp=execution_plan.timestamp,
                module="TradingActionExecutionMapper",
                event_type=EvolutionEventType.SYSTEM_OPTIMIZATION,
                previous_state={"execution": "none"},
                new_state={"execution": execution_plan.action.value},
                reason=f"Execution plan: {execution_plan.action.value}",
                metrics={
                    "position_size": execution_plan.size,
                    "stop_loss": execution_plan.sl,
                    "take_profit": execution_plan.tp,
                    "execution_confidence": execution_plan.meta.execution_confidence,
                    "safety_lock": execution_plan.safety_lock
                }
            )
            
            await self.evolution_vault.save_evolution_record(record)
            
        except Exception as e:
            logger.warning(f"Failed to sync execution with vault: {e}")
    
    async def shutdown(self) -> None:
        """Shutdown the Trading Action Execution Mapper"""
        logger.info("Shutting down Trading Action Execution Mapper...")
        
        # Clear execution history
        self.execution_history.clear()
        self.performance_metrics.clear()
        
        logger.info("Trading Action Execution Mapper shutdown complete")


# Global instance
_trading_action_execution_mapper: Optional[TradingActionExecutionMapper] = None


def get_trading_action_execution_mapper() -> TradingActionExecutionMapper:
    """Get or create the global Trading Action Execution Mapper instance"""
    global _trading_action_execution_mapper
    if _trading_action_execution_mapper is None:
        _trading_action_execution_mapper = TradingActionExecutionMapper()
    return _trading_action_execution_mapper


async def initialize_trading_action_execution_mapper() -> TradingActionExecutionMapper:
    """Initialize and return the global Trading Action Execution Mapper instance"""
    mapper = get_trading_action_execution_mapper()
    await mapper.initialize()
    return mapper


# Public wrapper function
async def build_execution_plan(reactor_decision: ReactorDecision,
                             market_data: Optional[Dict[str, Any]] = None) -> ExecutionPlan:
    """
    Public wrapper for building execution plans
    
    Args:
        reactor_decision: Decision from the Decision Fusion Reactor
        market_data: Optional market data for analysis
        
    Returns:
        ExecutionPlan: Complete execution plan
    """
    mapper = get_trading_action_execution_mapper()
    return await mapper.build_execution_plan(reactor_decision, market_data)