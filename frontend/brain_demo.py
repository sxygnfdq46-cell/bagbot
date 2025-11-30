"""
Example: Complete BAGBOT2 Brain Integration

This script demonstrates how all new components work together:
1. Mindset Engine for psychological trading
2. Strategy Arsenal with Micro Trend Follower
3. Multi-Market Router
4. Subscription validation

Run this to see the complete system in action.
"""

import asyncio
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


async def main():
    """Demonstrate the complete BAGBOT2 brain system."""
    
    logger.info("=" * 60)
    logger.info("BAGBOT2 BRAIN SYSTEM DEMO")
    logger.info("=" * 60)
    
    # ===================================================================
    # 1. INITIALIZE MINDSET ENGINE
    # ===================================================================
    logger.info("\n" + "=" * 60)
    logger.info("1. Initializing Mindset Engine")
    logger.info("=" * 60)
    
    from bagbot.trading.mindset_engine import MindsetEngine
    
    mindset = MindsetEngine()
    
    # Simulate starting balance
    starting_equity = 10000.0
    mindset.reset_daily(starting_equity)
    
    logger.info(f"✅ Mindset Engine ready | Starting equity: ${starting_equity:,.2f}")
    
    # ===================================================================
    # 2. INITIALIZE STRATEGY ARSENAL
    # ===================================================================
    logger.info("\n" + "=" * 60)
    logger.info("2. Setting Up Strategy Arsenal")
    logger.info("=" * 60)
    
    from bagbot.trading.strategy_arsenal import StrategyArsenal
    from bagbot.trading.strategies.micro_trend_follower import MicroTrendFollower
    
    arsenal = StrategyArsenal()
    
    # Register Micro Trend Follower
    micro_strategy = MicroTrendFollower()
    arsenal.register_strategy(micro_strategy, auto_activate=True)
    
    strategies = arsenal.get_strategy_list()
    logger.info(f"✅ {len(strategies)} strategies registered:")
    for strategy in strategies:
        logger.info(f"   • {strategy['name']} ({strategy['type']}) - Active: {strategy['is_active']}")
    
    # ===================================================================
    # 3. SIMULATE TICK TRADING
    # ===================================================================
    logger.info("\n" + "=" * 60)
    logger.info("3. Simulating Tick-Based Trading")
    logger.info("=" * 60)
    
    current_equity = starting_equity
    
    # Simulate price ticks
    base_price = 50000.0
    price_ticks = [
        50000.0,
        50000.5,  # Up
        50001.0,  # Up - should trigger BUY
        50000.8,  # Down slightly
        50000.3,  # Down more
        49999.5,  # Down - should trigger reversal to SELL
        49999.0,  # Down
        49999.5,  # Up
        50000.0,  # Up - should trigger reversal to BUY
    ]
    
    for i, price in enumerate(price_ticks):
        tick = {
            "symbol": "BTCUSDT",
            "price": price,
            "volume": 0.5,
            "bid": price - 0.1,
            "ask": price + 0.1,
            "timestamp": datetime.now().isoformat()
        }
        
        # Route tick to strategies
        signals = arsenal.route_tick(tick)
        
        if signals:
            for signal in signals:
                logger.info(f"\n⚡ SIGNAL GENERATED:")
                logger.info(f"   Strategy: {signal.strategy_name}")
                logger.info(f"   Action: {signal.side.upper()} {signal.symbol}")
                logger.info(f"   Price: ${signal.entry_price:.2f}")
                logger.info(f"   Stop Loss: ${signal.stop_loss:.2f}")
                logger.info(f"   Take Profit: ${signal.take_profit:.2f}")
                logger.info(f"   Reason: {signal.reason}")
                logger.info(f"   Strength: {signal.strength:.2%}")
                
                # Check with mindset engine
                proposed_trade = {
                    "symbol": signal.symbol,
                    "side": signal.side,
                    "quantity": 0.1
                }
                
                can_trade, reason = mindset.should_trade(current_equity, proposed_trade)
                
                if can_trade:
                    logger.info(f"   ✅ {reason}")
                    
                    # Simulate trade execution
                    profit = 25.0 if signal.side == "buy" else -10.0
                    profit_percent = (profit / signal.entry_price) * 100
                    
                    current_equity += profit
                    
                    # Record with mindset
                    mindset.record_trade_outcome(proposed_trade, profit, profit_percent)
                    
                    # Notify strategy
                    trade = {
                        "strategy_name": signal.strategy_name,
                        "symbol": signal.symbol,
                        "side": signal.side,
                        "price": signal.entry_price
                    }
                    arsenal.notify_trade_executed(trade)
                    arsenal.notify_trade_closed(trade, profit)
                    
                    logger.info(f"   💰 Trade executed | P&L: ${profit:+.2f} | Equity: ${current_equity:,.2f}")
                else:
                    logger.info(f"   ❌ Trade blocked: {reason}")
        
        await asyncio.sleep(0.1)  # Simulate time between ticks
    
    # ===================================================================
    # 4. DAILY PERFORMANCE EVALUATION
    # ===================================================================
    logger.info("\n" + "=" * 60)
    logger.info("4. Daily Performance Evaluation")
    logger.info("=" * 60)
    
    metrics = mindset.evaluate_daily_performance(current_equity)
    
    logger.info(f"\n📊 DAILY REPORT:")
    logger.info(f"   Date: {metrics.date}")
    logger.info(f"   Starting Equity: ${metrics.starting_equity:,.2f}")
    logger.info(f"   Ending Equity: ${metrics.ending_equity:,.2f}")
    logger.info(f"   P&L: ${metrics.pnl:+,.2f} ({metrics.pnl_percent:+.2f}%)")
    logger.info(f"   Grade: {metrics.grade}")
    logger.info(f"   Trades: {metrics.trades_count}")
    logger.info(f"   Max Drawdown: {metrics.max_drawdown:.2f}%")
    logger.info(f"   Emotional State: {metrics.emotional_state}")
    logger.info(f"   Notes: {metrics.notes}")
    
    # ===================================================================
    # 5. STRATEGY PERFORMANCE
    # ===================================================================
    logger.info("\n" + "=" * 60)
    logger.info("5. Strategy Performance")
    logger.info("=" * 60)
    
    strategies = arsenal.get_strategy_list()
    for strategy in strategies:
        logger.info(f"\n📈 {strategy['name']}:")
        perf = strategy['performance']
        logger.info(f"   Total Signals: {perf.get('total_signals', 0)}")
        logger.info(f"   Executed: {perf.get('signals_executed', 0)}")
        logger.info(f"   Win Rate: {perf.get('win_rate', 0):.1f}%")
        logger.info(f"   Avg Profit: ${perf.get('avg_profit', 0):.2f}")
    
    # Get micro strategy stats
    stats = micro_strategy.get_statistics()
    logger.info(f"\n⚡ Micro Trend Follower Stats:")
    logger.info(f"   Total Ticks: {stats['total_ticks_processed']}")
    logger.info(f"   Signals Generated: {stats['signals_generated']}")
    logger.info(f"   Reversals: {stats['reversals_count']}")
    logger.info(f"   Signal Rate: {stats['signal_rate']:.2f}%")
    
    # ===================================================================
    # 6. RISK ASSESSMENT
    # ===================================================================
    logger.info("\n" + "=" * 60)
    logger.info("6. Risk Assessment")
    logger.info("=" * 60)
    
    risk_multiplier = mindset.get_risk_multiplier()
    logger.info(f"   Current Risk Multiplier: {risk_multiplier:.2f}x")
    logger.info(f"   Emotional State: {mindset.emotional_state.value}")
    logger.info(f"   Consecutive Losses: {mindset.consecutive_losses}")
    logger.info(f"   Daily Trades: {mindset.daily_trades_count}/{mindset.max_trades_per_day}")
    
    # ===================================================================
    # 7. SUBSCRIPTION DEMO
    # ===================================================================
    logger.info("\n" + "=" * 60)
    logger.info("7. Subscription System Demo")
    logger.info("=" * 60)
    
    from bagbot.backend.subscription_manager import SubscriptionManager, SubscriptionTier, TIER_LIMITS
    
    sub_manager = SubscriptionManager()
    
    # Show tier limits
    logger.info("\n💳 Subscription Tiers:")
    for tier, limits in TIER_LIMITS.items():
        logger.info(f"\n   {tier.value.upper()}:")
        logger.info(f"      API Calls/Day: {limits.max_api_calls_per_day}")
        logger.info(f"      Strategies: {limits.max_concurrent_strategies}")
        logger.info(f"      Positions: {limits.max_positions}")
        logger.info(f"      Max Order: ${limits.max_order_value_usd:,.0f}")
        logger.info(f"      Tick Data: {'✅' if limits.can_access_tick_data else '❌'}")
        logger.info(f"      Multi-Market: {'✅' if limits.can_use_multi_market else '❌'}")
    
    # Create a demo token
    token_string, token = sub_manager.create_token(
        user_id="demo_user",
        tier=SubscriptionTier.PRO,
        name="Demo Token",
        expires_in_days=30
    )
    
    logger.info(f"\n🔑 Demo Token Created:")
    logger.info(f"   Token: {token_string[:16]}...{token_string[-8:]}")
    logger.info(f"   Tier: {token.tier}")
    logger.info(f"   Daily Limit: {token.daily_call_limit:,}")
    logger.info(f"   Expires: {token.expires_at}")
    
    # Validate token
    validated = sub_manager.validate_token(token_string)
    if validated:
        logger.info(f"   ✅ Token validated successfully")
    
    # ===================================================================
    # SUMMARY
    # ===================================================================
    logger.info("\n" + "=" * 60)
    logger.info("✅ BAGBOT2 BRAIN SYSTEM DEMO COMPLETE")
    logger.info("=" * 60)
    
    logger.info("\nAll systems operational:")
    logger.info("   ✅ Mindset Engine - Trading psychology active")
    logger.info("   ✅ Strategy Arsenal - Multi-strategy support ready")
    logger.info("   ✅ Micro Trend Follower - Tick-based trading functional")
    logger.info("   ✅ Subscription System - Token-based auth ready")
    logger.info("\nNext steps:")
    logger.info("   1. Integrate with live market data feeds")
    logger.info("   2. Connect to exchange APIs")
    logger.info("   3. Deploy to production")
    logger.info("   4. Monitor performance")


if __name__ == "__main__":
    asyncio.run(main())
