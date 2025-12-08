"""
SAFE MODE CONFIGURATION - System-Wide Trading Protection
===============================================================================

This module provides centralized safe mode control across the entire BAGBOT2 system.
When activated, all real trading operations are disabled and replaced with simulations.

CRITICAL: This is the master safety switch for the entire trading system.
All execution paths MUST check this before any real trading operations.

Safe Mode Features:
- Disables all real order execution
- Mocks exchange API calls with simulated responses
- Prevents any write operations to live trading accounts
- Provides simulated market data and order fills
- Logs all attempted operations for analysis
- Visual indicators in UI to show safe mode status

===============================================================================
"""

import os
import json
import logging
import time
from pathlib import Path
from typing import Dict, Optional, Any
from enum import Enum
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


class SafeModeLevel(Enum):
    """Safe mode protection levels"""
    OFF = "off"                      # Normal operation - DANGEROUS
    SIMULATION = "simulation"        # Mock all trading operations
    READ_ONLY = "read_only"         # Read data only, no execution
    FULL_LOCKDOWN = "full_lockdown" # No trading or market data access


@dataclass
class SafeModeConfig:
    """Safe mode configuration"""
    enabled: bool = True
    level: SafeModeLevel = SafeModeLevel.SIMULATION
    reason: str = "System protection - manual activation required"
    activated_at: float = field(default_factory=time.time)
    activated_by: str = "system"
    allow_paper_trading: bool = True
    allow_backtesting: bool = True
    block_real_orders: bool = True
    block_exchange_writes: bool = True
    mock_exchange_data: bool = False
    log_blocked_operations: bool = True
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "enabled": self.enabled,
            "level": self.level.value,
            "reason": self.reason,
            "activated_at": self.activated_at,
            "activated_by": self.activated_by,
            "allow_paper_trading": self.allow_paper_trading,
            "allow_backtesting": self.allow_backtesting,
            "block_real_orders": self.block_real_orders,
            "block_exchange_writes": self.block_exchange_writes,
            "mock_exchange_data": self.mock_exchange_data,
            "log_blocked_operations": self.log_blocked_operations,
            "status": "ACTIVE" if self.enabled else "INACTIVE"
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SafeModeConfig':
        """Create from dictionary"""
        return cls(
            enabled=data.get("enabled", True),
            level=SafeModeLevel(data.get("level", "simulation")),
            reason=data.get("reason", "Unknown"),
            activated_at=data.get("activated_at", time.time()),
            activated_by=data.get("activated_by", "system"),
            allow_paper_trading=data.get("allow_paper_trading", True),
            allow_backtesting=data.get("allow_backtesting", True),
            block_real_orders=data.get("block_real_orders", True),
            block_exchange_writes=data.get("block_exchange_writes", True),
            mock_exchange_data=data.get("mock_exchange_data", False),
            log_blocked_operations=data.get("log_blocked_operations", True)
        )


# Storage paths
STATE_DIR = Path(__file__).parent.parent.parent / "data" / "state"
SAFE_MODE_FILE = STATE_DIR / "safe_mode.json"

# Ensure state directory exists
STATE_DIR.mkdir(parents=True, exist_ok=True)


class SafeModeManager:
    """
    Central Safe Mode Manager
    
    Controls all trading safety mechanisms across the system.
    This is the authoritative source for safe mode status.
    """
    
    def __init__(self):
        """Initialize Safe Mode Manager"""
        self.config = self._load_config()
        logger.info(f"Safe Mode Manager initialized: {self.config.level.value}")
    
    def _load_config(self) -> SafeModeConfig:
        """Load safe mode configuration from disk"""
        try:
            if SAFE_MODE_FILE.exists():
                with open(SAFE_MODE_FILE, "r") as f:
                    data = json.load(f)
                return SafeModeConfig.from_dict(data)
        except Exception as e:
            logger.warning(f"Error loading safe mode config: {e}")
        
        # Default to safe mode ENABLED
        return SafeModeConfig(
            enabled=True,
            level=SafeModeLevel.SIMULATION,
            reason="Default configuration - system protection active"
        )
    
    def _save_config(self):
        """Save safe mode configuration to disk"""
        try:
            with open(SAFE_MODE_FILE, "w") as f:
                json.dump(self.config.to_dict(), f, indent=2)
            logger.info(f"Safe mode config saved: {self.config.level.value}")
        except Exception as e:
            logger.error(f"Error saving safe mode config: {e}")
    
    def is_safe_mode_active(self) -> bool:
        """Check if safe mode is currently active"""
        return self.config.enabled
    
    def get_safe_mode_level(self) -> SafeModeLevel:
        """Get current safe mode level"""
        return self.config.level
    
    def is_real_trading_allowed(self) -> bool:
        """Check if real trading operations are allowed"""
        if not self.config.enabled:
            # Safe mode OFF - real trading allowed (DANGEROUS)
            logger.warning("⚠️ SAFE MODE DISABLED - REAL TRADING ACTIVE")
            return True
        
        # Safe mode ON - block real trading
        return False
    
    def activate_safe_mode(
        self,
        level: SafeModeLevel = SafeModeLevel.SIMULATION,
        reason: str = "Manual activation",
        activated_by: str = "admin"
    ):
        """
        Activate safe mode
        
        Args:
            level: Safe mode protection level
            reason: Reason for activation
            activated_by: User or system that activated safe mode
        """
        self.config.enabled = True
        self.config.level = level
        self.config.reason = reason
        self.config.activated_at = time.time()
        self.config.activated_by = activated_by
        self.config.block_real_orders = True
        self.config.block_exchange_writes = True
        
        self._save_config()
        
        logger.warning(
            f"🛡️ SAFE MODE ACTIVATED\n"
            f"Level: {level.value}\n"
            f"Reason: {reason}\n"
            f"By: {activated_by}\n"
            f"All real trading operations are now BLOCKED"
        )
    
    def deactivate_safe_mode(self, deactivated_by: str = "admin"):
        """
        Deactivate safe mode (DANGEROUS - requires explicit authorization)
        
        Args:
            deactivated_by: User who deactivated safe mode
        """
        logger.critical(
            f"⚠️ ATTEMPTING TO DEACTIVATE SAFE MODE\n"
            f"Requested by: {deactivated_by}\n"
            f"This will enable REAL TRADING operations"
        )
        
        # Require explicit environment variable to deactivate
        if os.getenv("ALLOW_REAL_TRADING") != "CONFIRMED_ENABLED":
            logger.error(
                "❌ SAFE MODE DEACTIVATION BLOCKED\n"
                "Set environment variable: ALLOW_REAL_TRADING=CONFIRMED_ENABLED\n"
                "to enable real trading operations"
            )
            raise RuntimeError(
                "Cannot deactivate safe mode without ALLOW_REAL_TRADING=CONFIRMED_ENABLED"
            )
        
        self.config.enabled = False
        self.config.reason = f"Deactivated by {deactivated_by}"
        self.config.activated_at = time.time()
        
        self._save_config()
        
        logger.critical(
            f"⚠️⚠️⚠️ SAFE MODE DEACTIVATED ⚠️⚠️⚠️\n"
            f"REAL TRADING IS NOW ACTIVE\n"
            f"Deactivated by: {deactivated_by}"
        )
    
    def check_trading_allowed(self, operation: str = "trading operation") -> None:
        """
        Check if trading is allowed, raise exception if blocked
        
        Args:
            operation: Description of the operation being attempted
        
        Raises:
            RuntimeError: If safe mode blocks the operation
        """
        if not self.is_real_trading_allowed():
            if self.config.log_blocked_operations:
                logger.warning(
                    f"🛡️ SAFE MODE BLOCKED: {operation}\n"
                    f"Level: {self.config.level.value}\n"
                    f"Reason: {self.config.reason}"
                )
            
            raise RuntimeError(
                f"🛡️ SAFE MODE ACTIVE - Operation blocked: {operation}\n"
                f"Safe mode level: {self.config.level.value}\n"
                f"Reason: {self.config.reason}\n"
                f"To enable real trading, use SafeModeManager.deactivate_safe_mode()"
            )
    
    def get_status(self) -> Dict[str, Any]:
        """Get current safe mode status"""
        return {
            **self.config.to_dict(),
            "is_active": self.is_safe_mode_active(),
            "real_trading_allowed": self.is_real_trading_allowed(),
            "timestamp": time.time()
        }
    
    def simulate_order_response(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate simulated order response for safe mode testing
        
        Args:
            order_data: Order details
        
        Returns:
            Simulated order response
        """
        return {
            "order_id": f"SIMULATED_{int(time.time() * 1000)}",
            "status": "FILLED",
            "symbol": order_data.get("symbol", "BTC/USD"),
            "side": order_data.get("side", "BUY"),
            "type": order_data.get("type", "MARKET"),
            "quantity": order_data.get("quantity", 0.0),
            "price": order_data.get("price", 0.0),
            "filled_quantity": order_data.get("quantity", 0.0),
            "average_price": order_data.get("price", 0.0),
            "commission": 0.0,
            "timestamp": time.time(),
            "simulated": True,
            "safe_mode": True,
            "note": f"SIMULATED ORDER - Safe mode active ({self.config.level.value})"
        }


# Singleton instance
_safe_mode_manager: Optional[SafeModeManager] = None


def get_safe_mode_manager() -> SafeModeManager:
    """Get singleton instance of Safe Mode Manager"""
    global _safe_mode_manager
    if _safe_mode_manager is None:
        _safe_mode_manager = SafeModeManager()
    return _safe_mode_manager


def is_safe_mode_active() -> bool:
    """Quick check if safe mode is active"""
    return get_safe_mode_manager().is_safe_mode_active()


def check_safe_mode(operation: str = "trading operation"):
    """Quick check that raises exception if safe mode blocks operation"""
    get_safe_mode_manager().check_trading_allowed(operation)


def get_safe_mode_status() -> Dict[str, Any]:
    """Get current safe mode status"""
    return get_safe_mode_manager().get_status()


# Initialize on module import
logger.info("🛡️ Safe Mode Protection System Loaded")
logger.info(f"Status: {'ACTIVE' if is_safe_mode_active() else 'INACTIVE'}")
