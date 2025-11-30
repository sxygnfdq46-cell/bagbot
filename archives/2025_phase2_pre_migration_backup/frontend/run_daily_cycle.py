#!/usr/bin/env python3
"""
Run Daily Cycle Script

Executes a daily trading cycle locally for testing and dry runs.
This script is useful for:
- Testing the daily cycle workflow
- Generating sample reports
- Validating mindset integration
- Debugging scheduler issues

Usage:
    python run_daily_cycle.py                    # Dry run mode
    python run_daily_cycle.py --live             # Execute real trades
    python run_daily_cycle.py --log-dir ./logs   # Custom log directory
"""

import os
import sys
import asyncio
import argparse
import logging
from pathlib import Path

# Add bagbot to path
sys.path.insert(0, str(Path(__file__).parent))

from bagbot.trading.scheduler import DailyCycleScheduler, run_daily_cycle


def setup_logging(verbose: bool = False):
    """Setup logging configuration."""
    level = logging.DEBUG if verbose else logging.INFO
    
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler("daily_cycle.log")
        ]
    )


def print_banner():
    """Print startup banner."""
    print("\n" + "=" * 70)
    print("🔄 DAILY CYCLE RUNNER")
    print("=" * 70)
    print("Trading Mindset Integration with Order Execution and EOD Reporting")
    print("=" * 70 + "\n")


def print_summary(report: dict):
    """Print human-readable report summary."""
    print("\n" + "=" * 70)
    print("📊 DAILY CYCLE EXECUTION REPORT")
    print("=" * 70)
    
    # Overall status
    status_emoji = "✅" if report["status"] == "success" else "❌"
    print(f"\n{status_emoji} Status: {report['status'].upper()}")
    print(f"⏱️  Duration: {report['duration_seconds']:.2f} seconds")
    print(f"🔧 Dry Run: {report['dry_run']}")
    
    if report["status"] == "error":
        print(f"\n❌ Error: {report.get('message', 'Unknown error')}")
        return
    
    # Phase results
    print("\n📋 PHASE RESULTS:")
    phases = report.get("phases", {})
    
    # State fetch
    if "state_fetch" in phases:
        state = phases["state_fetch"]
        print(f"\n1️⃣  State Fetch:")
        print(f"    Account Equity: ${state['account_equity']:,.2f}")
        print(f"    Open Positions: {state['open_positions']}")
        print(f"    Signals: {state['signals_received']}")
    
    # Daily mission
    if "daily_mission" in phases:
        mission = phases["daily_mission"]
        print(f"\n2️⃣  Daily Mission:")
        print(f"    Actions Generated: {mission['actions_generated']}")
        print(f"    Trading Halted: {mission['trading_halted']}")
        if mission['trading_halted']:
            print(f"    Halt Reason: {mission['halt_reason']}")
        print(f"    Consecutive Losses: {mission['consecutive_losses']}")
    
    # Action execution
    if "action_execution" in phases:
        exec_phase = phases["action_execution"]
        print(f"\n3️⃣  Action Execution:")
        print(f"    Total Actions: {exec_phase['total_actions']}")
        print(f"    ✅ Executed: {exec_phase['executed']}")
        print(f"    ⏭️  Skipped: {exec_phase['skipped']}")
        print(f"    ❌ Failed: {exec_phase['failed']}")
    
    # EOD routine
    if "eod_routine" in phases:
        eod = phases["eod_routine"]
        print(f"\n4️⃣  End of Day Routine:")
        
        pnl_emoji = "📈" if eod['total_pnl'] >= 0 else "📉"
        print(f"    {pnl_emoji} Daily P&L: ${eod['total_pnl']:,.2f} ({eod['total_pnl_percent']:.2f}%)")
        print(f"    📊 Drawdown: {eod['drawdown_percent']:.2f}%")
        print(f"    📦 Open Positions: {eod['open_positions_count']}")
        print(f"    🎯 Recommended: {eod['recommended_action']}")
        
        if eod['should_stop_trading']:
            print(f"    🛑 ⚠️  TRADING SHOULD BE HALTED TOMORROW ⚠️")
        
        print(f"\n    Analysis: {eod['analysis']}")
        
        if eod['eod_actions']:
            print(f"\n    EOD Actions ({len(eod['eod_actions'])}):")
            for action in eod['eod_actions']:
                print(f"      • {action['type']}: {action['symbol']} - {action['reason']}")
    
    # EOD action execution
    if "eod_action_execution" in phases:
        eod_exec = phases["eod_action_execution"]
        print(f"\n5️⃣  EOD Action Execution:")
        print(f"    ✅ Executed: {eod_exec['executed']}")
        print(f"    ❌ Failed: {eod_exec['failed']}")
    
    print("\n" + "=" * 70 + "\n")


async def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Run daily trading cycle with mindset integration",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s                          # Dry run mode (default)
  %(prog)s --live                   # Execute real trades
  %(prog)s --verbose                # Enable debug logging
  %(prog)s --log-dir ./reports      # Custom report directory
  %(prog)s --webhook https://...    # Send report to webhook

Environment Variables:
  SCHEDULER_DRY_RUN                 # Set to 'false' for live trading
  REPORT_WEBHOOK                    # Webhook URL for report delivery
  ENABLE_REPORT_WEBHOOK             # Set to 'true' to enable webhook
  MARKET_CLOSE_TIME                 # Format: HH:MM (default: 16:00)
  MAX_ORDER_USD                     # Max order size
  DAILY_MAX_DRAWDOWN_PERCENT        # Daily drawdown limit
        """
    )
    
    parser.add_argument(
        "--live",
        action="store_true",
        help="Execute real trades (default: dry run)"
    )
    
    parser.add_argument(
        "--dry-run",
        action="store_true",
        default=True,
        help="Dry run mode - don't execute trades (default)"
    )
    
    parser.add_argument(
        "--log-dir",
        type=str,
        help="Directory for report logs"
    )
    
    parser.add_argument(
        "--webhook",
        type=str,
        help="Webhook URL for report delivery"
    )
    
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose logging"
    )
    
    parser.add_argument(
        "--no-banner",
        action="store_true",
        help="Suppress startup banner"
    )
    
    args = parser.parse_args()
    
    # Setup logging
    setup_logging(args.verbose)
    
    # Print banner
    if not args.no_banner:
        print_banner()
    
    # Configure environment
    if args.live:
        os.environ["SCHEDULER_DRY_RUN"] = "false"
        print("⚠️  LIVE TRADING MODE - Real trades will be executed\n")
    else:
        os.environ["SCHEDULER_DRY_RUN"] = "true"
        print("🔧 DRY RUN MODE - No real trades will be executed\n")
    
    if args.webhook:
        os.environ["REPORT_WEBHOOK"] = args.webhook
        os.environ["ENABLE_REPORT_WEBHOOK"] = "true"
        print(f"📡 Webhook configured: {args.webhook}\n")
    
    # Show configuration
    print("⚙️  Configuration:")
    print(f"   MAX_ORDER_USD: ${float(os.getenv('MAX_ORDER_USD', '10000')):,.2f}")
    print(f"   DAILY_MAX_DRAWDOWN_PERCENT: {os.getenv('DAILY_MAX_DRAWDOWN_PERCENT', '5.0')}%")
    print(f"   MARKET_CLOSE_TIME: {os.getenv('MARKET_CLOSE_TIME', '16:00')}")
    print(f"   EOD_ACTION: {os.getenv('EOD_ACTION', 'tighten_stops')}")
    print()
    
    # Run cycle
    try:
        report = await run_daily_cycle(
            dry_run=not args.live,
            log_dir=args.log_dir
        )
        
        # Print summary
        print_summary(report)
        
        # Exit code
        if report["status"] == "success":
            print("✅ Daily cycle completed successfully\n")
            return 0
        else:
            print("❌ Daily cycle failed\n")
            return 1
    
    except KeyboardInterrupt:
        print("\n⚠️  Interrupted by user\n")
        return 130
    
    except Exception as e:
        logging.error(f"Fatal error: {e}", exc_info=True)
        print(f"\n❌ Fatal error: {e}\n")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
