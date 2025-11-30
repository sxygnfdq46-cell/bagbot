#!/usr/bin/env python3
"""
Trading Mindset Usage Example

Demonstrates how to integrate TradingMindset into a trading bot.
This example shows the complete flow from signal processing to EOD routine.
"""

import os
from bagbot.trading.mindset import (
    TradingMindset,
    ActionType,
    EODAction
)


def main():
    """Example usage of TradingMindset module."""
    
    # Configure environment
    os.environ["MAX_ORDER_USD"] = "10000.0"
    os.environ["DAILY_MAX_DRAWDOWN_PERCENT"] = "5.0"
    os.environ["DEFAULT_STOP_LOSS_PERCENT"] = "2.0"
    os.environ["MAX_OPEN_POSITIONS"] = "3"
    os.environ["EOD_ACTION"] = "tighten_stops"
    
    # Initialize mindset
    mindset = TradingMindset()
    print("🧠 Trading Mindset initialized\n")
    
    # =====================================================================
    # SCENARIO 1: Normal Trading Day
    # =====================================================================
    print("=" * 70)
    print("SCENARIO 1: Normal Trading Day")
    print("=" * 70)
    
    account = {
        "balance": 100000.0,
        "equity": 100000.0,
        "available": 95000.0
    }
    
    open_positions = [
        {
            "symbol": "BTCUSDT",
            "side": "long",
            "size": 0.5,
            "entry_price": 50000.0,
            "current_price": 51000.0,
            "stop_loss": 49000.0,
            "unrealized_pnl": 500.0
        }
    ]
    
    signals = [
        {
            "symbol": "ETHUSDT",
            "side": "buy",
            "quantity": 2.0,
            "price": 3000.0,
            "confidence": 0.8
        }
    ]
    
    # Get daily mission actions
    actions = mindset.daily_mission(account, open_positions, signals)
    
    print(f"📊 Account equity: ${account['equity']:,.2f}")
    print(f"📈 Open positions: {len(open_positions)}")
    print(f"📡 Signals received: {len(signals)}")
    print(f"🎯 Actions generated: {len(actions)}\n")
    
    for i, action in enumerate(actions, 1):
        print(f"{i}. [{action.action_type.value}] {action.symbol or 'N/A'}")
        print(f"   Priority: {action.priority}, Reason: {action.reason}\n")
    
    # Pre-trade check for new order
    new_order = {
        "symbol": "ETHUSDT",
        "side": "buy",
        "amount": 2.0,
        "price": 3000.0,
        "stop_loss": 2940.0  # 2% stop
    }
    
    check = mindset.pre_trade_check(new_order, account)
    print(f"✅ Pre-trade check: {check.approved}")
    print(f"   Reason: {check.reason}\n")
    
    # =====================================================================
    # SCENARIO 2: Flash Loss Event
    # =====================================================================
    print("=" * 70)
    print("SCENARIO 2: Flash Loss Event (6% Drawdown)")
    print("=" * 70)
    
    # Reset for new scenario
    mindset_flash = TradingMindset()
    mindset_flash.daily_start_equity = 100000.0
    
    # Account after flash loss
    flash_account = {
        "balance": 94000.0,
        "equity": 94000.0,
        "available": 94000.0
    }
    
    flash_position = {
        "symbol": "BTCUSDT",
        "side": "long",
        "size": 1.0,
        "entry_price": 50000.0,
        "current_price": 44000.0,
        "stop_loss": 49000.0,
        "unrealized_pnl": -6000.0
    }
    
    # Get emergency actions
    flash_actions = mindset_flash.daily_mission(
        flash_account, 
        [flash_position], 
        signals
    )
    
    print(f"🚨 Account equity: ${flash_account['equity']:,.2f}")
    print(f"📉 Drawdown: {mindset_flash._calculate_drawdown_percent(flash_account['equity']):.2f}%")
    print(f"🛑 Trading halted: {mindset_flash.trading_halted}")
    print(f"   Reason: {mindset_flash.halt_reason}\n")
    
    print(f"⚡ Emergency actions: {len(flash_actions)}")
    for action in flash_actions:
        if action.action_type == ActionType.EMERGENCY_EXIT:
            print(f"   🆘 EMERGENCY EXIT: {action.symbol}")
            print(f"      {action.side} {action.quantity} @ market")
            print(f"      Priority: {action.priority}")
            print(f"      Reason: {action.reason}\n")
    
    # Try to place new order (should be rejected)
    new_order_flash = {
        "symbol": "ETHUSDT",
        "side": "buy",
        "amount": 1.0,
        "price": 3000.0,
        "stop_loss": 2940.0
    }
    
    check_flash = mindset_flash.pre_trade_check(new_order_flash, flash_account)
    print(f"❌ New order check: {check_flash.approved}")
    print(f"   Reason: {check_flash.reason}\n")
    
    # =====================================================================
    # SCENARIO 3: End of Day Routine
    # =====================================================================
    print("=" * 70)
    print("SCENARIO 3: End of Day Routine")
    print("=" * 70)
    
    # EOD after losing day
    mindset_eod = TradingMindset()
    mindset_eod.daily_start_equity = 100000.0
    
    eod_account = {
        "balance": 96500.0,
        "equity": 96500.0,
        "available": 96500.0
    }
    
    eod_positions = [
        {
            "symbol": "BTCUSDT",
            "side": "long",
            "size": 0.5,
            "current_price": 50000.0,
            "stop_loss": 49000.0
        },
        {
            "symbol": "ETHUSDT",
            "side": "long",
            "size": 2.0,
            "current_price": 3000.0,
            "stop_loss": 2940.0
        }
    ]
    
    # Run EOD routine
    report = mindset_eod.eod_routine(eod_positions, eod_account)
    
    print(f"📊 EOD Report:")
    print(f"   Daily P&L: ${report.total_pnl:,.2f} ({report.total_pnl_percent:.2f}%)")
    print(f"   Drawdown: {report.drawdown_percent:.2f}%")
    print(f"   Open positions: {report.open_positions_count}")
    print(f"   Recommended action: {report.recommended_action.value}")
    print(f"   Stop trading tomorrow: {report.should_stop_trading}")
    print(f"   Analysis: {report.analysis}\n")
    
    if report.actions:
        print(f"🎬 EOD Actions to execute: {len(report.actions)}")
        for action in report.actions:
            print(f"   • {action.action_type.value}: {action.symbol}")
            print(f"     Reason: {action.reason}")
    
    print("\n" + "=" * 70)
    
    # =====================================================================
    # SCENARIO 4: Defensive Mode After Loss
    # =====================================================================
    print("SCENARIO 4: Defensive Mode After Consecutive Losses")
    print("=" * 70)
    
    mindset_defensive = TradingMindset()
    
    # Record consecutive losses
    losses = [-500, -300, -200]
    for loss in losses:
        mindset_defensive.record_trade_result(loss)
    
    print(f"📉 Recorded losses: {losses}")
    print(f"   Consecutive losses: {mindset_defensive.consecutive_losses}")
    print(f"   Last trade was loss: {mindset_defensive.last_trade_was_loss}")
    print(f"   Defensive mode: ACTIVE\n")
    
    # Try to open new position (should be blocked)
    defensive_account = {"equity": 99000.0, "balance": 99000.0}
    defensive_order = {
        "symbol": "BTCUSDT",
        "side": "buy",
        "amount": 0.1,
        "price": 50000.0,
        "stop_loss": 49000.0
    }
    
    defensive_check = mindset_defensive.pre_trade_check(
        defensive_order,
        defensive_account
    )
    
    print(f"🛡️ New position attempt: {defensive_check.approved}")
    print(f"   Reason: {defensive_check.reason}\n")
    
    # Record a profit to reset defensive mode
    mindset_defensive.record_trade_result(1000.0)
    print(f"📈 Recorded profit: +$1,000")
    print(f"   Consecutive losses: {mindset_defensive.consecutive_losses}")
    print(f"   Defensive mode: RESET ✅\n")
    
    print("=" * 70)
    print("✅ All scenarios demonstrated successfully!")
    print("=" * 70)


if __name__ == "__main__":
    main()
