"""
STEP 24.67 — Master Execution Governor (MEG)

Supreme execution authority with ultimate veto power over all trading decisions
Central command system that integrates all execution engines for final authorization

This governor provides:
- Global state evaluation across all execution systems
- Ultimate go/no-go authority for all trading decisions
- Emergency override capabilities with system-wide control
- Comprehensive risk assessment and position sizing decisions
- Timing optimization with market condition awareness
- Hedging requirements and emergency protocol enforcement
- Authority scoring with confidence-based decision making

CRITICAL: Supreme execution authority layer
Final checkpoint before any trading action is executed
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

# Import execution system components
from .ExecutionNervousSystem import (
    ExecutionNervousSystem,
    UnifiedState,
    FinalExecutionAction,
    EngineSignal,
    get_execution_nervous_system
)

from .ExecutionConsciousnessLayer import (
    ExecutionConsciousnessLayer,
    ConsciousnessReport,
    AnomalyDetection,
    MetaCognitionInsight,
    get_execution_consciousness_layer
)

# Import other system components (mock references for now)
# from ..shield.ShieldNetwork import ShieldNetwork
# from ..reflex.ReflexEngine import ReflexEngine
# from ..threat.ThreatMatrix import ThreatMatrix
# from ..survival.SurvivalMatrix import SurvivalMatrix
# from ..decision.DecisionEngine import DecisionEngine

logger = logging.getLogger(__name__)


class ExecutionDecision(Enum):
    """Execution decision types"""
    ALLOW = "allow"
    DENY = "deny"
    DELAY = "delay"
    CANCEL = "cancel"
    EMERGENCY_HALT = "emergency_halt"


class EmergencyAction(Enum):
    """Emergency action types"""
    NONE = "none"
    PARTIAL_HALT = "partial_halt"
    FULL_HALT = "full_halt"
    EMERGENCY_LIQUIDATION = "emergency_liquidation"
    SYSTEM_SHUTDOWN = "system_shutdown"
    DEFENSIVE_REPOSITIONING = "defensive_repositioning"


class TimingDecision(Enum):
    """Timing decision types"""
    NOW = "now"
    DELAY_SHORT = "delay_short"  # 1-5 seconds
    DELAY_MEDIUM = "delay_medium"  # 5-30 seconds
    DELAY_LONG = "delay_long"  # 30+ seconds
    CANCEL = "cancel"


@dataclass
class GovernorDecisionCommand:
    """Final structured command from the Governor"""
    allow_trade: bool
    reason: str
    position_size: float  # 0.0 to 1.0 scale
    timing: str  # "now", "delay", "cancel"
    hedge_required: bool
    emergency_action: Optional[str]
    confidence: float  # 0-100 scale
    timestamp: float = field(default_factory=time.time)
    
    # Extended command data
    risk_assessment: Dict[str, Any] = field(default_factory=dict)
    system_overrides: List[str] = field(default_factory=list)
    execution_parameters: Dict[str, Any] = field(default_factory=dict)
    authority_score: float = 75.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert command to dictionary format"""
        return {
            "allowTrade": self.allow_trade,
            "reason": self.reason,
            "positionSize": self.position_size,
            "timing": self.timing,
            "hedgeRequired": self.hedge_required,
            "emergencyAction": self.emergency_action,
            "confidence": self.confidence,
            "timestamp": self.timestamp,
            "riskAssessment": self.risk_assessment,
            "systemOverrides": self.system_overrides,
            "executionParameters": self.execution_parameters,
            "authorityScore": self.authority_score
        }


@dataclass
class GlobalSystemState:
    """Comprehensive global system state assessment"""
    ens_state: Optional[UnifiedState] = None
    consciousness_report: Optional[ConsciousnessReport] = None
    shield_status: Dict[str, Any] = field(default_factory=dict)
    threat_level: float = 0.0
    survival_score: float = 75.0
    reflex_activation: float = 0.0
    
    # Calculated metrics
    overall_stability: float = 75.0
    system_stress: float = 0.3
    confidence_aggregate: float = 70.0
    emergency_indicators: List[str] = field(default_factory=list)
    
    def get_overall_health(self) -> float:
        """Calculate overall system health score (0-100)"""
        try:
            health_factors = [
                self.overall_stability,
                self.survival_score,
                self.confidence_aggregate,
                (1 - self.system_stress) * 100,
                (1 - self.threat_level) * 100
            ]
            return statistics.mean(health_factors)
        except:
            return 50.0


@dataclass
class GovernorCycleLog:
    """Log entry for each governor decision cycle"""
    cycle_id: str
    global_state: GlobalSystemState
    decision_command: GovernorDecisionCommand
    processing_time: float
    timestamp: float = field(default_factory=time.time)
    
    # Cycle metadata
    anomalies_detected: int = 0
    overrides_applied: int = 0
    risk_factors: List[str] = field(default_factory=list)


class MasterExecutionGovernor:
    """
    Master Execution Governor (MEG)
    
    Supreme execution authority that coordinates all execution engines and makes
    final go/no-go decisions for trading actions with emergency override capabilities.
    """
    
    def __init__(self, 
                 ens: Optional[ExecutionNervousSystem] = None,
                 ecl: Optional[ExecutionConsciousnessLayer] = None,
                 shield_network=None,
                 reflex_engine=None,
                 threat_matrix=None,
                 survival_matrix=None,
                 decision_engine=None):
        """
        Initialize the Master Execution Governor
        
        Args:
            ens: Execution Nervous System
            ecl: Execution Consciousness Layer
            shield_network: Shield Network system
            reflex_engine: Reflex Engine system
            threat_matrix: Threat Matrix system
            survival_matrix: Survival Matrix system
            decision_engine: Decision Engine system
        """
        logger.info("Initializing Master Execution Governor...")
        
        # Core system integrations
        self.ens = ens or get_execution_nervous_system()
        self.ecl = ecl or get_execution_consciousness_layer()
        self.shield_network = shield_network  # Mock for now
        self.reflex_engine = reflex_engine    # Mock for now
        self.threat_matrix = threat_matrix    # Mock for now
        self.survival_matrix = survival_matrix # Mock for now
        self.decision_engine = decision_engine # Mock for now
        
        # Governor parameters
        self.max_risk_threshold = 0.8     # Maximum allowable risk (0-1)
        self.min_confidence_threshold = 60.0  # Minimum confidence for execution
        self.emergency_halt_threshold = 0.9   # Emergency halt trigger
        self.position_size_max = 1.0      # Maximum position size multiplier
        self.authority_score_threshold = 50.0  # Minimum authority for execution
        
        # Rolling logs and state tracking
        self.cycle_logs: deque = deque(maxlen=200)  # Last 200 decision cycles
        self.global_fatigue_index = 0.2   # System-wide fatigue level
        self.global_instability_index = 0.3  # System-wide instability
        self.governor_authority_score = 85.0  # Current authority level
        
        # Performance tracking
        self.total_decisions_made = 0
        self.total_trades_allowed = 0
        self.total_trades_denied = 0
        self.total_emergency_overrides = 0
        self.emergency_protocols_active = False
        
        # Decision parameters
        self.decision_weights = {
            "ens_confidence": 0.25,
            "consciousness_score": 0.20,
            "threat_level": 0.20,
            "survival_score": 0.15,
            "shield_status": 0.10,
            "reflex_activation": 0.10
        }
        
        # Emergency override conditions
        self.emergency_conditions = {
            "high_threat_level": 0.85,
            "low_survival_score": 30.0,
            "critical_anomalies": 3,
            "system_overload": 0.9,
            "confidence_collapse": 20.0
        }
    
    def evaluate_global_state(self) -> GlobalSystemState:
        """
        Evaluate comprehensive global system state
        
        Returns:
            GlobalSystemState: Complete system assessment
        """
        try:
            logger.debug("Evaluating global system state...")
            
            # Get current ENS state
            ens_state = None
            if hasattr(self.ens, 'get_current_unified_state'):
                ens_state = self.ens.get_current_unified_state()
            
            # Get consciousness report
            consciousness_report = self.ecl.get_consciousness_report()
            
            # Mock system states (in real implementation, these would be actual values)
            shield_status = self._get_shield_status()
            threat_level = self._get_threat_level()
            survival_score = self._get_survival_score()
            reflex_activation = self._get_reflex_activation()
            
            # Calculate derived metrics
            overall_stability = self._calculate_overall_stability(
                ens_state, consciousness_report, shield_status
            )
            
            system_stress = self._calculate_system_stress(
                consciousness_report, threat_level, reflex_activation
            )
            
            confidence_aggregate = self._calculate_confidence_aggregate(
                ens_state, consciousness_report
            )
            
            emergency_indicators = self._detect_emergency_indicators(
                ens_state, consciousness_report, threat_level, survival_score
            )
            
            # Create global state
            global_state = GlobalSystemState(
                ens_state=ens_state,
                consciousness_report=consciousness_report,
                shield_status=shield_status,
                threat_level=threat_level,
                survival_score=survival_score,
                reflex_activation=reflex_activation,
                overall_stability=overall_stability,
                system_stress=system_stress,
                confidence_aggregate=confidence_aggregate,
                emergency_indicators=emergency_indicators
            )
            
            # Update global indices
            self._update_global_fatigue(global_state)
            self._update_global_instability(global_state)
            self._update_authority_score(global_state)
            
            logger.debug(f"Global state evaluated: stability={overall_stability:.1f}, "
                        f"stress={system_stress:.2f}, confidence={confidence_aggregate:.1f}")
            
            return global_state
            
        except Exception as e:
            logger.error(f"Error evaluating global state: {e}")
            
            # Return safe fallback state
            return GlobalSystemState(
                overall_stability=30.0,
                system_stress=0.8,
                confidence_aggregate=20.0,
                emergency_indicators=["evaluation_error"]
            )
    
    def compute_go_no_go(self, global_state: GlobalSystemState) -> ExecutionDecision:
        """
        Compute primary go/no-go decision
        
        Args:
            global_state: Current global system state
            
        Returns:
            ExecutionDecision: Primary execution decision
        """
        try:
            # Check emergency conditions first
            if self._check_emergency_conditions(global_state):
                return ExecutionDecision.EMERGENCY_HALT
            
            # Check critical risk thresholds
            execution_risk = self.compute_execution_risk(global_state)
            if execution_risk > self.max_risk_threshold:
                return ExecutionDecision.DENY
            
            # Check confidence thresholds
            if global_state.confidence_aggregate < self.min_confidence_threshold:
                return ExecutionDecision.DELAY
            
            # Check authority score
            if self.governor_authority_score < self.authority_score_threshold:
                return ExecutionDecision.DELAY
            
            # Check system stress
            if global_state.system_stress > 0.8:
                return ExecutionDecision.DELAY
            
            # Check for temporary delays due to anomalies
            if global_state.consciousness_report:
                anomaly_count = len(global_state.consciousness_report.anomaly_list)
                if anomaly_count >= 3:  # Multiple anomalies
                    return ExecutionDecision.DELAY
                elif anomaly_count >= 5:  # Critical anomaly count
                    return ExecutionDecision.DENY
            
            # Check survival score
            if global_state.survival_score < 40.0:
                return ExecutionDecision.DELAY
            
            # All checks passed - allow execution
            return ExecutionDecision.ALLOW
            
        except Exception as e:
            logger.error(f"Error computing go/no-go decision: {e}")
            return ExecutionDecision.DENY  # Safe fallback
    
    def compute_execution_risk(self, global_state: GlobalSystemState) -> float:
        """
        Compute comprehensive execution risk score (0-1)
        
        Args:
            global_state: Current global system state
            
        Returns:
            float: Execution risk score (0=low risk, 1=high risk)
        """
        try:
            risk_factors = []
            
            # Threat level risk
            risk_factors.append(global_state.threat_level * self.decision_weights["threat_level"])
            
            # Survival risk (inverted)
            survival_risk = max(0, (100 - global_state.survival_score) / 100)
            risk_factors.append(survival_risk * self.decision_weights["survival_score"])
            
            # Confidence risk (inverted)
            confidence_risk = max(0, (100 - global_state.confidence_aggregate) / 100)
            risk_factors.append(confidence_risk * self.decision_weights["ens_confidence"])
            
            # Consciousness risk
            if global_state.consciousness_report:
                consciousness_risk = max(0, (100 - global_state.consciousness_report.consciousness_score) / 100)
                risk_factors.append(consciousness_risk * self.decision_weights["consciousness_score"])
                
                # Anomaly risk
                anomaly_risk = min(1.0, len(global_state.consciousness_report.anomaly_list) / 5)
                risk_factors.append(anomaly_risk * 0.2)
            
            # System stress risk
            risk_factors.append(global_state.system_stress * 0.3)
            
            # Stability risk (inverted)
            stability_risk = max(0, (100 - global_state.overall_stability) / 100)
            risk_factors.append(stability_risk * 0.25)
            
            # Reflex overactivation risk
            reflex_risk = min(1.0, global_state.reflex_activation / 0.8)
            risk_factors.append(reflex_risk * self.decision_weights["reflex_activation"])
            
            # Global fatigue risk
            risk_factors.append(self.global_fatigue_index * 0.15)
            
            # Global instability risk
            risk_factors.append(self.global_instability_index * 0.15)
            
            # Calculate weighted risk score
            total_risk = sum(risk_factors)
            
            # Apply emergency indicators penalty
            emergency_penalty = len(global_state.emergency_indicators) * 0.1
            total_risk += emergency_penalty
            
            # Clamp to valid range
            return max(0.0, min(1.0, total_risk))
            
        except Exception as e:
            logger.error(f"Error computing execution risk: {e}")
            return 1.0  # Maximum risk on error
    
    def enforce_restrictions(self, global_state: GlobalSystemState) -> Dict[str, Any]:
        """
        Enforce system-wide restrictions based on current state
        
        Args:
            global_state: Current global system state
            
        Returns:
            Dict: Restrictions to enforce
        """
        try:
            restrictions = {
                "position_size_limit": 1.0,  # No limit by default
                "timing_delay": 0,           # No delay by default
                "hedge_requirement": False,   # No hedge required by default
                "emergency_protocols": [],    # No emergency protocols by default
                "system_overrides": []       # No overrides by default
            }
            
            # Risk-based position sizing restrictions
            execution_risk = self.compute_execution_risk(global_state)
            if execution_risk > 0.6:
                restrictions["position_size_limit"] = 0.5  # Reduce to 50%
            if execution_risk > 0.8:
                restrictions["position_size_limit"] = 0.2  # Reduce to 20%
            
            # Confidence-based restrictions
            if global_state.confidence_aggregate < 50:
                restrictions["position_size_limit"] = min(
                    restrictions["position_size_limit"], 0.3
                )
                restrictions["hedge_requirement"] = True
            
            # System stress restrictions
            if global_state.system_stress > 0.7:
                restrictions["timing_delay"] = 5  # 5 second delay
                restrictions["hedge_requirement"] = True
            
            # Anomaly-based restrictions
            if global_state.consciousness_report:
                anomaly_count = len(global_state.consciousness_report.anomaly_list)
                if anomaly_count >= 2:
                    restrictions["timing_delay"] = max(restrictions["timing_delay"], 3)
                if anomaly_count >= 4:
                    restrictions["position_size_limit"] = min(
                        restrictions["position_size_limit"], 0.1
                    )
            
            # Emergency restrictions
            if global_state.emergency_indicators:
                restrictions["emergency_protocols"] = global_state.emergency_indicators
                restrictions["position_size_limit"] = min(
                    restrictions["position_size_limit"], 0.05
                )
                restrictions["hedge_requirement"] = True
                restrictions["timing_delay"] = max(restrictions["timing_delay"], 10)
            
            # Authority-based restrictions
            if self.governor_authority_score < 60:
                restrictions["system_overrides"].append("low_authority_mode")
                restrictions["position_size_limit"] = min(
                    restrictions["position_size_limit"], 0.3
                )
            
            return restrictions
            
        except Exception as e:
            logger.error(f"Error enforcing restrictions: {e}")
            return {
                "position_size_limit": 0.1,  # Very conservative
                "timing_delay": 30,          # Long delay
                "hedge_requirement": True,   # Force hedge
                "emergency_protocols": ["error_state"],
                "system_overrides": ["error_mode"]
            }
    
    def decide_position_sizing(self, global_state: GlobalSystemState, 
                              restrictions: Dict[str, Any]) -> float:
        """
        Decide optimal position sizing based on risk and restrictions
        
        Args:
            global_state: Current global system state
            restrictions: Active restrictions
            
        Returns:
            float: Position size multiplier (0-1)
        """
        try:
            # Start with base position size
            base_size = self.position_size_max
            
            # Apply risk-based sizing
            execution_risk = self.compute_execution_risk(global_state)
            risk_adjustment = 1.0 - (execution_risk * 0.8)  # Reduce size with risk
            base_size *= risk_adjustment
            
            # Apply confidence-based sizing
            confidence_factor = global_state.confidence_aggregate / 100
            base_size *= confidence_factor
            
            # Apply stability-based sizing
            stability_factor = global_state.overall_stability / 100
            base_size *= stability_factor
            
            # Apply survival-based sizing
            survival_factor = global_state.survival_score / 100
            base_size *= survival_factor
            
            # Apply fatigue penalty
            fatigue_penalty = self.global_fatigue_index * 0.5
            base_size *= (1.0 - fatigue_penalty)
            
            # Apply instability penalty
            instability_penalty = self.global_instability_index * 0.3
            base_size *= (1.0 - instability_penalty)
            
            # Apply restrictions
            restriction_limit = restrictions.get("position_size_limit", 1.0)
            base_size = min(base_size, restriction_limit)
            
            # Emergency size reduction
            if global_state.emergency_indicators:
                emergency_factor = max(0.01, 1.0 - len(global_state.emergency_indicators) * 0.2)
                base_size *= emergency_factor
            
            # Clamp to valid range
            return max(0.0, min(self.position_size_max, base_size))
            
        except Exception as e:
            logger.error(f"Error deciding position sizing: {e}")
            return 0.01  # Minimal position size on error
    
    def decide_timing(self, global_state: GlobalSystemState, 
                     restrictions: Dict[str, Any]) -> TimingDecision:
        """
        Decide optimal execution timing
        
        Args:
            global_state: Current global system state
            restrictions: Active restrictions
            
        Returns:
            TimingDecision: Timing decision
        """
        try:
            # Check for forced delays from restrictions
            forced_delay = restrictions.get("timing_delay", 0)
            
            if forced_delay > 30:
                return TimingDecision.CANCEL
            elif forced_delay > 10:
                return TimingDecision.DELAY_LONG
            elif forced_delay > 5:
                return TimingDecision.DELAY_MEDIUM
            elif forced_delay > 0:
                return TimingDecision.DELAY_SHORT
            
            # Check emergency conditions
            if global_state.emergency_indicators:
                return TimingDecision.CANCEL
            
            # Check high risk conditions
            execution_risk = self.compute_execution_risk(global_state)
            if execution_risk > 0.8:
                return TimingDecision.CANCEL
            elif execution_risk > 0.6:
                return TimingDecision.DELAY_LONG
            elif execution_risk > 0.4:
                return TimingDecision.DELAY_MEDIUM
            
            # Check system stress
            if global_state.system_stress > 0.8:
                return TimingDecision.DELAY_LONG
            elif global_state.system_stress > 0.6:
                return TimingDecision.DELAY_MEDIUM
            
            # Check confidence levels
            if global_state.confidence_aggregate < 30:
                return TimingDecision.CANCEL
            elif global_state.confidence_aggregate < 50:
                return TimingDecision.DELAY_MEDIUM
            elif global_state.confidence_aggregate < 70:
                return TimingDecision.DELAY_SHORT
            
            # Check anomaly conditions
            if global_state.consciousness_report:
                anomaly_count = len(global_state.consciousness_report.anomaly_list)
                if anomaly_count >= 5:
                    return TimingDecision.CANCEL
                elif anomaly_count >= 3:
                    return TimingDecision.DELAY_LONG
                elif anomaly_count >= 1:
                    return TimingDecision.DELAY_SHORT
            
            # All clear - execute now
            return TimingDecision.NOW
            
        except Exception as e:
            logger.error(f"Error deciding timing: {e}")
            return TimingDecision.CANCEL  # Safe fallback
    
    def decide_hedging(self, global_state: GlobalSystemState, 
                      restrictions: Dict[str, Any]) -> bool:
        """
        Decide if hedging is required
        
        Args:
            global_state: Current global system state
            restrictions: Active restrictions
            
        Returns:
            bool: True if hedging required
        """
        try:
            # Check forced hedging from restrictions
            if restrictions.get("hedge_requirement", False):
                return True
            
            # Risk-based hedging
            execution_risk = self.compute_execution_risk(global_state)
            if execution_risk > 0.5:
                return True
            
            # Threat-based hedging
            if global_state.threat_level > 0.6:
                return True
            
            # Survival-based hedging
            if global_state.survival_score < 60:
                return True
            
            # System stress hedging
            if global_state.system_stress > 0.6:
                return True
            
            # Confidence-based hedging
            if global_state.confidence_aggregate < 60:
                return True
            
            # Instability hedging
            if self.global_instability_index > 0.5:
                return True
            
            # Emergency hedging
            if global_state.emergency_indicators:
                return True
            
            # Anomaly-based hedging
            if global_state.consciousness_report:
                anomaly_count = len(global_state.consciousness_report.anomaly_list)
                if anomaly_count >= 2:
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error deciding hedging: {e}")
            return True  # Conservative fallback
    
    def override_emergency_protocols(self, global_state: GlobalSystemState) -> Optional[str]:
        """
        Check for and override emergency protocols if needed
        
        Args:
            global_state: Current global system state
            
        Returns:
            Optional[str]: Emergency action to take, if any
        """
        try:
            # Check critical threat level
            if global_state.threat_level >= self.emergency_conditions["high_threat_level"]:
                self.total_emergency_overrides += 1
                self.emergency_protocols_active = True
                return EmergencyAction.FULL_HALT.value
            
            # Check critical survival score
            if global_state.survival_score <= self.emergency_conditions["low_survival_score"]:
                self.total_emergency_overrides += 1
                self.emergency_protocols_active = True
                return EmergencyAction.DEFENSIVE_REPOSITIONING.value
            
            # Check critical anomaly count
            if global_state.consciousness_report:
                anomaly_count = len(global_state.consciousness_report.anomaly_list)
                if anomaly_count >= self.emergency_conditions["critical_anomalies"]:
                    self.total_emergency_overrides += 1
                    return EmergencyAction.PARTIAL_HALT.value
            
            # Check system overload
            if global_state.system_stress >= self.emergency_conditions["system_overload"]:
                self.total_emergency_overrides += 1
                self.emergency_protocols_active = True
                return EmergencyAction.SYSTEM_SHUTDOWN.value
            
            # Check confidence collapse
            if global_state.confidence_aggregate <= self.emergency_conditions["confidence_collapse"]:
                self.total_emergency_overrides += 1
                return EmergencyAction.PARTIAL_HALT.value
            
            # Check multiple emergency indicators
            if len(global_state.emergency_indicators) >= 3:
                self.total_emergency_overrides += 1
                self.emergency_protocols_active = True
                return EmergencyAction.EMERGENCY_LIQUIDATION.value
            
            # No emergency action needed
            self.emergency_protocols_active = False
            return None
            
        except Exception as e:
            logger.error(f"Error in emergency protocol override: {e}")
            self.total_emergency_overrides += 1
            self.emergency_protocols_active = True
            return EmergencyAction.SYSTEM_SHUTDOWN.value  # Safe fallback
    
    def generate_governor_report(self, global_state: GlobalSystemState, 
                               decision_command: GovernorDecisionCommand) -> GovernorDecisionCommand:
        """
        Generate comprehensive governor decision report
        
        Args:
            global_state: Current global system state
            decision_command: Current decision command
            
        Returns:
            GovernorDecisionCommand: Enhanced command with full report
        """
        try:
            start_time = time.time()
            
            # Enhanced risk assessment
            execution_risk = self.compute_execution_risk(global_state)
            
            risk_assessment = {
                "overall_risk": execution_risk,
                "threat_level": global_state.threat_level,
                "survival_score": global_state.survival_score,
                "confidence_aggregate": global_state.confidence_aggregate,
                "system_stress": global_state.system_stress,
                "global_fatigue": self.global_fatigue_index,
                "global_instability": self.global_instability_index,
                "emergency_indicators": global_state.emergency_indicators
            }
            
            # System overrides applied
            system_overrides = []
            if self.emergency_protocols_active:
                system_overrides.append("emergency_protocols_active")
            if self.governor_authority_score < 70:
                system_overrides.append("reduced_authority_mode")
            if execution_risk > 0.7:
                system_overrides.append("high_risk_mode")
            
            # Execution parameters
            execution_parameters = {
                "max_position_size": self.position_size_max,
                "risk_threshold": self.max_risk_threshold,
                "confidence_threshold": self.min_confidence_threshold,
                "authority_threshold": self.authority_score_threshold,
                "decision_weights": self.decision_weights
            }
            
            # Update command with enhanced data
            decision_command.risk_assessment = risk_assessment
            decision_command.system_overrides = system_overrides
            decision_command.execution_parameters = execution_parameters
            decision_command.authority_score = self.governor_authority_score
            
            # Log the decision cycle
            processing_time = time.time() - start_time
            
            cycle_log = GovernorCycleLog(
                cycle_id=str(uuid.uuid4())[:8],
                global_state=global_state,
                decision_command=decision_command,
                processing_time=processing_time,
                anomalies_detected=len(global_state.consciousness_report.anomaly_list) 
                    if global_state.consciousness_report else 0,
                overrides_applied=len(system_overrides),
                risk_factors=global_state.emergency_indicators
            )
            
            self.cycle_logs.append(cycle_log)
            self.total_decisions_made += 1
            
            # Update decision counters
            if decision_command.allow_trade:
                self.total_trades_allowed += 1
            else:
                self.total_trades_denied += 1
            
            logger.info(f"Governor decision: {decision_command.reason} "
                       f"(confidence: {decision_command.confidence:.1f}%, "
                       f"risk: {execution_risk:.2f})")
            
            return decision_command
            
        except Exception as e:
            logger.error(f"Error generating governor report: {e}")
            
            # Return safe fallback command
            decision_command.reason = f"Report generation failed: {str(e)}"
            decision_command.confidence = 10.0
            decision_command.allow_trade = False
            decision_command.emergency_action = EmergencyAction.SYSTEM_SHUTDOWN.value
            
            return decision_command
    
    def execute_master_decision_cycle(self, trade_request: Dict[str, Any] = None) -> GovernorDecisionCommand:
        """
        Execute a complete master decision cycle
        
        Args:
            trade_request: Optional trade request details
            
        Returns:
            GovernorDecisionCommand: Final execution decision
        """
        try:
            logger.debug("Executing master decision cycle...")
            
            # Step 1: Evaluate global state
            global_state = self.evaluate_global_state()
            
            # Step 2: Compute go/no-go decision
            go_no_go = self.compute_go_no_go(global_state)
            
            # Step 3: Check for emergency overrides
            emergency_action = self.override_emergency_protocols(global_state)
            
            # Step 4: Enforce restrictions
            restrictions = self.enforce_restrictions(global_state)
            
            # Step 5: Make specific decisions
            position_size = self.decide_position_sizing(global_state, restrictions)
            timing = self.decide_timing(global_state, restrictions)
            hedging = self.decide_hedging(global_state, restrictions)
            
            # Step 6: Calculate confidence
            confidence = self._calculate_decision_confidence(global_state, go_no_go)
            
            # Step 7: Generate final command
            allow_trade = go_no_go == ExecutionDecision.ALLOW and emergency_action is None
            
            # Generate reason
            if emergency_action:
                reason = f"Emergency override: {emergency_action}"
            elif go_no_go == ExecutionDecision.DENY:
                reason = f"Trade denied due to high risk (risk={self.compute_execution_risk(global_state):.2f})"
            elif go_no_go == ExecutionDecision.DELAY:
                reason = f"Trade delayed due to system conditions"
            elif go_no_go == ExecutionDecision.EMERGENCY_HALT:
                reason = "Emergency halt triggered"
            else:
                reason = f"Trade approved with {position_size:.1%} sizing"
            
            # Create decision command
            command = GovernorDecisionCommand(
                allow_trade=allow_trade,
                reason=reason,
                position_size=position_size,
                timing=timing.value if hasattr(timing, 'value') else str(timing),
                hedge_required=hedging,
                emergency_action=emergency_action,
                confidence=confidence
            )
            
            # Step 8: Generate comprehensive report
            final_command = self.generate_governor_report(global_state, command)
            
            logger.info(f"Master decision cycle complete: {final_command.reason}")
            
            return final_command
            
        except Exception as e:
            logger.error(f"Error in master decision cycle: {e}")
            
            # Return emergency fallback command
            return GovernorDecisionCommand(
                allow_trade=False,
                reason=f"Master decision cycle failed: {str(e)}",
                position_size=0.0,
                timing=TimingDecision.CANCEL.value,
                hedge_required=True,
                emergency_action=EmergencyAction.SYSTEM_SHUTDOWN.value,
                confidence=0.0
            )
    
    def get_governor_status(self) -> Dict[str, Any]:
        """Get comprehensive governor status"""
        try:
            return {
                "governor_authority_score": self.governor_authority_score,
                "global_fatigue_index": self.global_fatigue_index,
                "global_instability_index": self.global_instability_index,
                "emergency_protocols_active": self.emergency_protocols_active,
                "total_decisions_made": self.total_decisions_made,
                "total_trades_allowed": self.total_trades_allowed,
                "total_trades_denied": self.total_trades_denied,
                "total_emergency_overrides": self.total_emergency_overrides,
                "cycle_logs_count": len(self.cycle_logs),
                "decision_approval_rate": (self.total_trades_allowed / max(1, self.total_decisions_made)) * 100,
                "emergency_override_rate": (self.total_emergency_overrides / max(1, self.total_decisions_made)) * 100,
                "thresholds": {
                    "max_risk_threshold": self.max_risk_threshold,
                    "min_confidence_threshold": self.min_confidence_threshold,
                    "emergency_halt_threshold": self.emergency_halt_threshold,
                    "authority_score_threshold": self.authority_score_threshold
                },
                "decision_weights": self.decision_weights,
                "emergency_conditions": self.emergency_conditions
            }
            
        except Exception as e:
            logger.error(f"Error getting governor status: {e}")
            return {"error": str(e)}
    
    # Private helper methods
    
    def _get_shield_status(self) -> Dict[str, Any]:
        """Get shield network status (mock implementation)"""
        # In real implementation, this would query the actual shield network
        return {
            "active_shields": 3,
            "shield_strength": 0.75,
            "shield_fatigue": 0.25,
            "last_activation": time.time() - 30
        }
    
    def _get_threat_level(self) -> float:
        """Get current threat level (mock implementation)"""
        # In real implementation, this would query the threat matrix
        return 0.3  # Mock moderate threat level
    
    def _get_survival_score(self) -> float:
        """Get survival matrix score (mock implementation)"""
        # In real implementation, this would query the survival matrix
        return 75.0  # Mock good survival score
    
    def _get_reflex_activation(self) -> float:
        """Get reflex engine activation level (mock implementation)"""
        # In real implementation, this would query the reflex engine
        return 0.4  # Mock moderate activation
    
    def _calculate_overall_stability(self, ens_state, consciousness_report, shield_status) -> float:
        """Calculate overall system stability"""
        try:
            stability_factors = []
            
            if ens_state and hasattr(ens_state, 'stability_score'):
                stability_factors.append(ens_state.stability_score)
            
            if consciousness_report:
                stability_factors.append(consciousness_report.consciousness_score)
            
            if shield_status:
                shield_stability = shield_status.get('shield_strength', 0.5) * 100
                stability_factors.append(shield_stability)
            
            if stability_factors:
                return statistics.mean(stability_factors)
            else:
                return 50.0  # Neutral stability
                
        except Exception:
            return 50.0
    
    def _calculate_system_stress(self, consciousness_report, threat_level, reflex_activation) -> float:
        """Calculate overall system stress"""
        try:
            stress_factors = []
            
            # Threat stress
            stress_factors.append(threat_level)
            
            # Reflex stress
            stress_factors.append(reflex_activation)
            
            # Consciousness stress
            if consciousness_report:
                fatigue_stress = consciousness_report.system_fatigue_index
                risk_stress = consciousness_report.risk_pressure_index
                stress_factors.extend([fatigue_stress, risk_stress])
            
            # Global stress
            stress_factors.extend([self.global_fatigue_index, self.global_instability_index])
            
            return statistics.mean(stress_factors) if stress_factors else 0.5
            
        except Exception:
            return 0.5
    
    def _calculate_confidence_aggregate(self, ens_state, consciousness_report) -> float:
        """Calculate aggregate confidence score"""
        try:
            confidence_factors = []
            
            if ens_state and hasattr(ens_state, 'aggregated_confidence'):
                confidence_factors.append(ens_state.aggregated_confidence)
            
            if consciousness_report:
                confidence_factors.append(consciousness_report.consciousness_score)
            
            # Authority confidence
            confidence_factors.append(self.governor_authority_score)
            
            return statistics.mean(confidence_factors) if confidence_factors else 50.0
            
        except Exception:
            return 50.0
    
    def _detect_emergency_indicators(self, ens_state, consciousness_report, threat_level, survival_score) -> List[str]:
        """Detect emergency indicators"""
        try:
            indicators = []
            
            # High threat
            if threat_level > 0.8:
                indicators.append("high_threat_level")
            
            # Low survival
            if survival_score < 40:
                indicators.append("low_survival_score")
            
            # System overload
            if self.global_fatigue_index > 0.8:
                indicators.append("system_fatigue_critical")
            
            # Instability
            if self.global_instability_index > 0.8:
                indicators.append("system_instability_critical")
            
            # Consciousness anomalies
            if consciousness_report and len(consciousness_report.anomaly_list) >= 4:
                indicators.append("critical_anomaly_count")
            
            # Low confidence
            if consciousness_report and consciousness_report.consciousness_score < 30:
                indicators.append("consciousness_collapse")
            
            # ENS issues
            if ens_state:
                if hasattr(ens_state, 'stability_score') and ens_state.stability_score < 25:
                    indicators.append("ens_stability_critical")
                if hasattr(ens_state, 'aggregated_confidence') and ens_state.aggregated_confidence < 20:
                    indicators.append("ens_confidence_collapse")
            
            return indicators
            
        except Exception as e:
            logger.warning(f"Error detecting emergency indicators: {e}")
            return ["detection_error"]
    
    def _update_global_fatigue(self, global_state: GlobalSystemState) -> None:
        """Update global fatigue index"""
        try:
            fatigue_factors = []
            
            # Consciousness fatigue
            if global_state.consciousness_report:
                fatigue_factors.append(global_state.consciousness_report.system_fatigue_index)
            
            # System stress fatigue
            fatigue_factors.append(global_state.system_stress * 0.5)
            
            # Decision frequency fatigue
            if self.total_decisions_made > 0:
                decision_rate = len(self.cycle_logs) / min(200, self.total_decisions_made)
                fatigue_factors.append(min(1.0, decision_rate))
            
            # Calculate new fatigue with exponential smoothing
            if fatigue_factors:
                new_fatigue = statistics.mean(fatigue_factors)
                alpha = 0.1  # Smoothing factor
                self.global_fatigue_index = alpha * new_fatigue + (1 - alpha) * self.global_fatigue_index
            
            # Clamp to valid range
            self.global_fatigue_index = max(0.0, min(1.0, self.global_fatigue_index))
            
        except Exception as e:
            logger.warning(f"Error updating global fatigue: {e}")
    
    def _update_global_instability(self, global_state: GlobalSystemState) -> None:
        """Update global instability index"""
        try:
            instability_factors = []
            
            # Stability variance
            stability_variance = 100 - global_state.overall_stability
            instability_factors.append(stability_variance / 100)
            
            # Threat instability
            instability_factors.append(global_state.threat_level)
            
            # Confidence instability
            confidence_instability = max(0, 100 - global_state.confidence_aggregate) / 100
            instability_factors.append(confidence_instability)
            
            # Emergency indicators
            emergency_instability = min(1.0, len(global_state.emergency_indicators) / 5)
            instability_factors.append(emergency_instability)
            
            # Calculate new instability with exponential smoothing
            if instability_factors:
                new_instability = statistics.mean(instability_factors)
                alpha = 0.15  # Slightly more responsive than fatigue
                self.global_instability_index = alpha * new_instability + (1 - alpha) * self.global_instability_index
            
            # Clamp to valid range
            self.global_instability_index = max(0.0, min(1.0, self.global_instability_index))
            
        except Exception as e:
            logger.warning(f"Error updating global instability: {e}")
    
    def _update_authority_score(self, global_state: GlobalSystemState) -> None:
        """Update governor authority score"""
        try:
            # Base authority factors
            authority_factors = []
            
            # System health authority
            system_health = global_state.get_overall_health()
            authority_factors.append(system_health)
            
            # Decision success rate
            if self.total_decisions_made > 0:
                success_rate = (self.total_trades_allowed / self.total_decisions_made) * 100
                authority_factors.append(success_rate)
            
            # Emergency override penalty
            if self.total_decisions_made > 0:
                override_rate = self.total_emergency_overrides / self.total_decisions_made
                authority_penalty = override_rate * 30  # Penalty for overrides
                authority_factors.append(max(0, 80 - authority_penalty))
            
            # Confidence authority
            authority_factors.append(global_state.confidence_aggregate)
            
            # Calculate new authority with smoothing
            if authority_factors:
                new_authority = statistics.mean(authority_factors)
                alpha = 0.05  # Slow changes in authority
                self.governor_authority_score = alpha * new_authority + (1 - alpha) * self.governor_authority_score
            
            # Clamp to valid range
            self.governor_authority_score = max(0.0, min(100.0, self.governor_authority_score))
            
        except Exception as e:
            logger.warning(f"Error updating authority score: {e}")
    
    def _check_emergency_conditions(self, global_state: GlobalSystemState) -> bool:
        """Check if emergency conditions are met"""
        try:
            # High threat emergency
            if global_state.threat_level >= self.emergency_conditions["high_threat_level"]:
                return True
            
            # Low survival emergency
            if global_state.survival_score <= self.emergency_conditions["low_survival_score"]:
                return True
            
            # Critical anomaly count
            if global_state.consciousness_report:
                anomaly_count = len(global_state.consciousness_report.anomaly_list)
                if anomaly_count >= self.emergency_conditions["critical_anomalies"]:
                    return True
            
            # System overload emergency
            if global_state.system_stress >= self.emergency_conditions["system_overload"]:
                return True
            
            # Confidence collapse emergency
            if global_state.confidence_aggregate <= self.emergency_conditions["confidence_collapse"]:
                return True
            
            # Multiple emergency indicators
            if len(global_state.emergency_indicators) >= 2:
                return True
            
            return False
            
        except Exception:
            return True  # Safe fallback - assume emergency
    
    def _calculate_decision_confidence(self, global_state: GlobalSystemState, 
                                     go_no_go: ExecutionDecision) -> float:
        """Calculate confidence in the decision"""
        try:
            confidence_factors = []
            
            # Base confidence from global state
            confidence_factors.append(global_state.confidence_aggregate)
            
            # Authority confidence
            confidence_factors.append(self.governor_authority_score)
            
            # Decision clarity (higher for clear allow/deny, lower for delays)
            if go_no_go in [ExecutionDecision.ALLOW, ExecutionDecision.EMERGENCY_HALT]:
                decision_clarity = 90.0  # High clarity
            elif go_no_go == ExecutionDecision.DENY:
                decision_clarity = 80.0  # Good clarity
            else:
                decision_clarity = 60.0  # Moderate clarity (delay/cancel)
            
            confidence_factors.append(decision_clarity)
            
            # System stability confidence
            stability_confidence = global_state.overall_stability
            confidence_factors.append(stability_confidence)
            
            # Risk assessment confidence (inverted)
            execution_risk = self.compute_execution_risk(global_state)
            risk_confidence = (1.0 - execution_risk) * 100
            confidence_factors.append(risk_confidence)
            
            # Emergency penalty
            if global_state.emergency_indicators:
                emergency_penalty = len(global_state.emergency_indicators) * 10
            else:
                emergency_penalty = 0
            
            # Calculate final confidence
            base_confidence = statistics.mean(confidence_factors)
            final_confidence = base_confidence - emergency_penalty
            
            return max(0.0, min(100.0, final_confidence))
            
        except Exception as e:
            logger.warning(f"Error calculating decision confidence: {e}")
            return 30.0  # Low confidence fallback


# Global instance
_master_execution_governor: Optional[MasterExecutionGovernor] = None


def get_master_execution_governor() -> MasterExecutionGovernor:
    """Get or create the global Master Execution Governor instance"""
    global _master_execution_governor
    if _master_execution_governor is None:
        _master_execution_governor = MasterExecutionGovernor()
    return _master_execution_governor


# Convenience functions for external integration
def make_execution_decision(trade_request: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Make a master execution decision
    
    Args:
        trade_request: Optional trade request details
        
    Returns:
        Dict: Governor decision command
    """
    try:
        meg = get_master_execution_governor()
        command = meg.execute_master_decision_cycle(trade_request)
        return command.to_dict()
        
    except Exception as e:
        logger.error(f"Error in make_execution_decision: {e}")
        return {
            "allowTrade": False,
            "reason": f"Decision failed: {str(e)}",
            "positionSize": 0.0,
            "timing": "cancel",
            "hedgeRequired": True,
            "emergencyAction": "system_shutdown",
            "confidence": 0.0,
            "timestamp": time.time(),
            "error": str(e)
        }


def get_governor_status() -> Dict[str, Any]:
    """
    Get Master Execution Governor status
    
    Returns:
        Dict: Governor status data
    """
    try:
        meg = get_master_execution_governor()
        return meg.get_governor_status()
        
    except Exception as e:
        logger.error(f"Error in get_governor_status: {e}")
        return {"error": str(e)}


def evaluate_system_health() -> Dict[str, Any]:
    """
    Evaluate overall system health through governor
    
    Returns:
        Dict: System health assessment
    """
    try:
        meg = get_master_execution_governor()
        global_state = meg.evaluate_global_state()
        
        return {
            "overall_health": global_state.get_overall_health(),
            "stability": global_state.overall_stability,
            "stress": global_state.system_stress,
            "confidence": global_state.confidence_aggregate,
            "threat_level": global_state.threat_level,
            "survival_score": global_state.survival_score,
            "emergency_indicators": global_state.emergency_indicators,
            "timestamp": time.time()
        }
        
    except Exception as e:
        logger.error(f"Error in evaluate_system_health: {e}")
        return {
            "overall_health": 25.0,
            "error": str(e),
            "timestamp": time.time()
        }