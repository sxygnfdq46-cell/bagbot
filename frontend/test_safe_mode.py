#!/usr/bin/env python3
"""
Safe Mode Verification Test Suite
==================================

This script verifies that all safe mode protection layers are functioning correctly.

Test Coverage:
1. Safe mode manager initialization
2. State persistence
3. Execution layer protection
4. Simulated order generation
5. Status API functionality

Run this BEFORE attempting any live trading to ensure system is protected.
"""

import sys
import asyncio
import json
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "bagbot" / "backend"
sys.path.insert(0, str(backend_path.parent))

from backend.safe_mode import (
    get_safe_mode_manager,
    SafeModeLevel,
    is_safe_mode_active,
    get_safe_mode_status
)


def test_safe_mode_initialization():
    """Test 1: Safe mode manager initializes correctly"""
    print("\n" + "="*60)
    print("TEST 1: Safe Mode Manager Initialization")
    print("="*60)
    
    try:
        manager = get_safe_mode_manager()
        assert manager is not None, "Manager should not be None"
        print("✅ Safe mode manager initialized")
        
        # Check default state
        assert manager.is_safe_mode_active() == True, "Safe mode should be active by default"
        print("✅ Safe mode is active by default")
        
        # Check level
        level = manager.get_safe_mode_level()
        print(f"✅ Default level: {level.value}")
        
        return True
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False


def test_safe_mode_status():
    """Test 2: Safe mode status reporting"""
    print("\n" + "="*60)
    print("TEST 2: Safe Mode Status Reporting")
    print("="*60)
    
    try:
        status = get_safe_mode_status()
        
        # Verify required fields
        required_fields = [
            'enabled', 'level', 'reason', 'is_active', 
            'real_trading_allowed', 'block_real_orders'
        ]
        
        for field in required_fields:
            assert field in status, f"Missing field: {field}"
            print(f"✅ Status contains: {field} = {status[field]}")
        
        # Verify real trading is blocked
        assert status['real_trading_allowed'] == False, "Real trading should be blocked"
        print("✅ Real trading is blocked")
        
        return True
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False


def test_safe_mode_activation():
    """Test 3: Safe mode activation/deactivation"""
    print("\n" + "="*60)
    print("TEST 3: Safe Mode Activation/Deactivation")
    print("="*60)
    
    try:
        manager = get_safe_mode_manager()
        
        # Test activation with different levels
        for level in [SafeModeLevel.SIMULATION, SafeModeLevel.READ_ONLY, SafeModeLevel.FULL_LOCKDOWN]:
            manager.activate_safe_mode(
                level=level,
                reason=f"Testing {level.value} level",
                activated_by="test_suite"
            )
            
            current_level = manager.get_safe_mode_level()
            assert current_level == level, f"Level should be {level.value}"
            print(f"✅ Activated {level.value} level successfully")
        
        # Reset to simulation
        manager.activate_safe_mode(
            level=SafeModeLevel.SIMULATION,
            reason="Reset to simulation",
            activated_by="test_suite"
        )
        print("✅ Reset to simulation level")
        
        return True
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False


def test_trading_blocked():
    """Test 4: Trading operations are blocked"""
    print("\n" + "="*60)
    print("TEST 4: Trading Operations Blocked")
    print("="*60)
    
    try:
        manager = get_safe_mode_manager()
        
        # Ensure safe mode is active
        manager.activate_safe_mode(
            level=SafeModeLevel.SIMULATION,
            reason="Testing trading block",
            activated_by="test_suite"
        )
        
        # Attempt to check if trading is allowed
        try:
            manager.check_trading_allowed("Test order placement")
            print("❌ FAILED: Trading should be blocked but wasn't")
            return False
        except RuntimeError as e:
            if "SAFE MODE ACTIVE" in str(e):
                print("✅ Trading correctly blocked with RuntimeError")
                print(f"   Error message: {str(e)[:100]}...")
            else:
                print(f"❌ FAILED: Wrong exception: {e}")
                return False
        
        # Verify real trading not allowed
        assert not manager.is_real_trading_allowed(), "Real trading should not be allowed"
        print("✅ is_real_trading_allowed() returns False")
        
        return True
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False


def test_simulated_orders():
    """Test 5: Simulated order generation"""
    print("\n" + "="*60)
    print("TEST 5: Simulated Order Generation")
    print("="*60)
    
    try:
        manager = get_safe_mode_manager()
        
        # Test order data
        test_orders = [
            {"symbol": "BTC/USD", "side": "BUY", "type": "MARKET", "quantity": 0.1, "price": 50000.0},
            {"symbol": "ETH/USD", "side": "SELL", "type": "LIMIT", "quantity": 1.0, "price": 3000.0},
            {"symbol": "SOL/USD", "side": "BUY", "type": "STOP", "quantity": 10.0, "price": 100.0}
        ]
        
        for order_data in test_orders:
            simulated = manager.simulate_order_response(order_data)
            
            # Verify simulated response
            assert simulated['simulated'] == True, "Should be marked as simulated"
            assert simulated['safe_mode'] == True, "Should indicate safe mode"
            assert simulated['status'] == 'FILLED', "Should show as filled"
            assert 'SIMULATED' in simulated['order_id'], "Order ID should contain SIMULATED"
            
            print(f"✅ Simulated {order_data['side']} {order_data['symbol']}")
            print(f"   Order ID: {simulated['order_id']}")
        
        return True
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False


def test_state_persistence():
    """Test 6: State persistence to disk"""
    print("\n" + "="*60)
    print("TEST 6: State Persistence")
    print("="*60)
    
    try:
        from backend.safe_mode import SAFE_MODE_FILE
        
        # Check file exists
        assert SAFE_MODE_FILE.exists(), f"State file should exist at {SAFE_MODE_FILE}"
        print(f"✅ State file exists: {SAFE_MODE_FILE}")
        
        # Read and verify contents
        with open(SAFE_MODE_FILE, 'r') as f:
            state_data = json.load(f)
        
        # Verify structure
        required_fields = ['enabled', 'level', 'reason', 'block_real_orders']
        for field in required_fields:
            assert field in state_data, f"Missing field in state file: {field}"
        
        print("✅ State file structure is valid")
        print(f"   Enabled: {state_data['enabled']}")
        print(f"   Level: {state_data['level']}")
        print(f"   Block real orders: {state_data['block_real_orders']}")
        
        return True
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False


async def test_execution_layer():
    """Test 7: Execution layer protection"""
    print("\n" + "="*60)
    print("TEST 7: Execution Layer Protection")
    print("="*60)
    
    try:
        # Import execution layer
        from backend.execution.LiveExecutionRelaySync import LiveExecutionRelaySync
        from backend.execution.TradingActionExecutionMapper import (
            ExecutionPlan, ExecutionAction, OrderType
        )
        
        # Initialize relay
        relay = LiveExecutionRelaySync()
        await relay.initialize()
        
        # Verify safe mode manager is initialized
        assert relay.safe_mode_manager is not None, "Safe mode manager should be initialized"
        print("✅ Execution layer has safe mode manager")
        
        # Create test execution plan
        plan = ExecutionPlan(
            action=ExecutionAction.BUY,
            order_type=OrderType.MARKET,
            size=0.1,
            sl=None,
            tp=None
        )
        
        # Attempt dispatch
        result = await relay.dispatch_execution_plan(plan)
        
        # Verify simulated response
        assert result.success == True, "Should succeed with simulation"
        assert "SIMULATED" in str(result.broker_order_id), "Should be simulated order ID"
        assert result.reason == "SIMULATED - Safe mode active", "Should indicate safe mode"
        assert result.adapter_status == "SIMULATED", "Adapter should be simulated"
        
        print("✅ Execution layer correctly simulates orders")
        print(f"   Order ID: {result.broker_order_id}")
        print(f"   Reason: {result.reason}")
        
        return True
    except Exception as e:
        print(f"❌ FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


def print_summary(results):
    """Print test summary"""
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    total = len(results)
    passed = sum(results.values())
    failed = total - passed
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status}: {test_name}")
    
    print()
    print(f"Total Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    print()
    
    if failed == 0:
        print("🎉 ALL TESTS PASSED - SAFE MODE IS OPERATIONAL")
        print("🛡️  System is protected from real trading operations")
        return True
    else:
        print("⚠️  SOME TESTS FAILED - REVIEW SAFE MODE CONFIGURATION")
        return False


async def main():
    """Run all tests"""
    print("\n" + "🛡️"*30)
    print("SAFE MODE VERIFICATION TEST SUITE")
    print("🛡️"*30)
    print("\nThis suite verifies all safe mode protection layers")
    print("Run this BEFORE attempting any live trading")
    print()
    
    results = {}
    
    # Run synchronous tests
    results["Safe Mode Initialization"] = test_safe_mode_initialization()
    results["Status Reporting"] = test_safe_mode_status()
    results["Activation/Deactivation"] = test_safe_mode_activation()
    results["Trading Blocked"] = test_trading_blocked()
    results["Simulated Orders"] = test_simulated_orders()
    results["State Persistence"] = test_state_persistence()
    
    # Run async tests
    results["Execution Layer Protection"] = await test_execution_layer()
    
    # Print summary
    all_passed = print_summary(results)
    
    return 0 if all_passed else 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
