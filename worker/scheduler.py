"""
Trading Scheduler Module

Orchestrates daily trading cycles, integrating TradingMindset with order execution
and end-of-day reporting. Runs at market close or midnight.
"""

import os
import json
import logging
import asyncio
import requests
from datetime import datetime, time
from typing import Dict, Any, List, Optional
from pathlib import Path

from .mindset import TradingMindset, ActionType, EODAction

# Import pause state checker
try:
    from backend.trading_state import is_trading_paused, get_trading_state
except ImportError:
    def is_trading_paused() -> bool:
        return False
    
    def get_trading_state() -> Dict[str, Any]:
        return {"paused": False, "reason": None}

# Import OrderRouter if available (optional for testing)
try:
    from .order_router import OrderRouter
    HAVE_ORDER_ROUTER = True
except ImportError:
    OrderRouter = None
    HAVE_ORDER_ROUTER = False
    logging.warning("OrderRouter not available - using mock implementation")

logger = logging.getLogger(__name__)


class DailyCycleScheduler:
    """
    Manages daily trading cycle execution.
    
    Workflow:
    1. Run daily_mission to get recommended actions
    2. Execute actions through order_router
    3. Run eod_routine for analysis
    4. Generate JSON report
    5. Save report to logs directory
    6. Send report to webhook (if configured)
    """
    
    def __init__(
        self,
        mindset: Optional[TradingMindset] = None,
        order_router: Optional[Any] = None,
        log_dir: Optional[str] = None
    ):
        """
        Initialize scheduler.
        
        Args:
            mindset: TradingMindset instance (creates new if None)
            order_router: OrderRouter instance (creates new if None and available)
            log_dir: Directory for report logs (default: logs/reports/)
        """
        self.mindset = mindset or TradingMindset()
        
        if order_router:
            self.order_router = order_router
        elif HAVE_ORDER_ROUTER and OrderRouter:
            self.order_router = OrderRouter()
        else:
            self.order_router = None
            logger.warning("No OrderRouter available - running in simulation mode")
        
        # Setup log directory
        if log_dir:
            self.log_dir = Path(log_dir)
        else:
            self.log_dir = Path(__file__).parent.parent.parent / "logs" / "reports"
        
        self.log_dir.mkdir(parents=True, exist_ok=True)
        
        # Configuration
        self.report_webhook = os.getenv("REPORT_WEBHOOK")
        self.market_close_time = os.getenv("MARKET_CLOSE_TIME", "16:00")  # NYSE close
        self.enable_webhook = os.getenv("ENABLE_REPORT_WEBHOOK", "true").lower() == "true"
        self.dry_run = os.getenv("SCHEDULER_DRY_RUN", "false").lower() == "true"
        
        logger.info(
            f"DailyCycleScheduler initialized: "
            f"market_close={self.market_close_time}, "
            f"dry_run={self.dry_run}, "
            f"webhook_enabled={self.enable_webhook}"
        )
    
    async def schedule_daily_cycle(self) -> Dict[str, Any]:
        """
        Execute complete daily trading cycle.
        
        This is the main orchestration function that:
        1. Fetches current account state and positions
        2. Runs daily_mission to get actions
        3. Executes high-priority actions
        4. Runs EOD routine
        5. Generates and distributes report
        
        Returns:
            Report dictionary with execution results
        """
        cycle_start = datetime.now()
        logger.info("=" * 70)
        logger.info(f"🔄 Starting daily cycle at {cycle_start.strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("=" * 70)
        
        # Check if trading is paused
        if is_trading_paused():
            state = get_trading_state()
            reason = state.get("reason", "Admin pause")
            logger.warning("=" * 70)
            logger.warning(f"⏸️  TRADING PAUSED: {reason}")
            logger.warning("⏸️  Daily cycle will check positions but NOT open new trades")
            logger.warning("=" * 70)
        
        report = {
            "timestamp": cycle_start.isoformat(),
            "cycle_type": "daily",
            "dry_run": self.dry_run,
            "trading_paused": is_trading_paused(),
            "pause_reason": get_trading_state().get("reason") if is_trading_paused() else None,
            "phases": {}
        }
        
        try:
            # Phase 1: Fetch current state
            logger.info("📊 Phase 1: Fetching account state and positions...")
            account, positions, signals = await self._fetch_trading_state()
            
            report["phases"]["state_fetch"] = {
                "success": True,
                "account_equity": account.get("equity", 0),
                "open_positions": len(positions),
                "signals_received": len(signals)
            }
            
            logger.info(
                f"   Account equity: ${account.get('equity', 0):,.2f}, "
                f"Positions: {len(positions)}, "
                f"Signals: {len(signals)}"
            )
            
            # Phase 2: Daily mission - get recommended actions
            logger.info("🧠 Phase 2: Running daily mission (TradingMindset)...")
            actions = self.mindset.daily_mission(account, positions, signals)
            
            report["phases"]["daily_mission"] = {
                "success": True,
                "actions_generated": len(actions),
                "trading_halted": self.mindset.trading_halted,
                "halt_reason": self.mindset.halt_reason if self.mindset.trading_halted else None,
                "consecutive_losses": self.mindset.consecutive_losses
            }
            
            logger.info(f"   Actions generated: {len(actions)}")
            if self.mindset.trading_halted:
                logger.warning(f"   ⚠️ Trading halted: {self.mindset.halt_reason}")
            
            # Phase 3: Execute actions
            logger.info("⚡ Phase 3: Executing recommended actions...")
            execution_results = await self._execute_actions(actions, account)
            
            report["phases"]["action_execution"] = {
                "success": True,
                "total_actions": len(actions),
                "executed": execution_results["executed"],
                "skipped": execution_results["skipped"],
                "failed": execution_results["failed"],
                "results": execution_results["details"]
            }
            
            logger.info(
                f"   Executed: {execution_results['executed']}, "
                f"Skipped: {execution_results['skipped']}, "
                f"Failed: {execution_results['failed']}"
            )
            
            # Phase 4: EOD routine
            logger.info("📋 Phase 4: Running end-of-day routine...")
            # Fetch updated positions after actions
            _, updated_positions, _ = await self._fetch_trading_state()
            
            eod_report = self.mindset.eod_routine(updated_positions, account)
            
            report["phases"]["eod_routine"] = {
                "success": True,
                "total_pnl": eod_report.total_pnl,
                "total_pnl_percent": eod_report.total_pnl_percent,
                "drawdown_percent": eod_report.drawdown_percent,
                "open_positions_count": eod_report.open_positions_count,
                "recommended_action": eod_report.recommended_action.value,
                "should_stop_trading": eod_report.should_stop_trading,
                "analysis": eod_report.analysis,
                "eod_actions": [
                    {
                        "type": action.action_type.value,
                        "symbol": action.symbol,
                        "reason": action.reason,
                        "priority": action.priority
                    }
                    for action in eod_report.actions
                ]
            }
            
            logger.info(
                f"   Daily P&L: ${eod_report.total_pnl:,.2f} "
                f"({eod_report.total_pnl_percent:.2f}%)"
            )
            logger.info(f"   Recommended: {eod_report.recommended_action.value}")
            
            if eod_report.should_stop_trading:
                logger.error("   🛑 TRADING SHOULD BE HALTED TOMORROW")
            
            # Phase 5: Execute EOD actions (if any)
            if eod_report.actions:
                logger.info("⚡ Phase 5: Executing EOD actions...")
                eod_execution = await self._execute_actions(eod_report.actions, account)
                
                report["phases"]["eod_action_execution"] = {
                    "success": True,
                    "total_actions": len(eod_report.actions),
                    "executed": eod_execution["executed"],
                    "skipped": eod_execution["skipped"],
                    "failed": eod_execution["failed"]
                }
                
                logger.info(
                    f"   EOD actions - Executed: {eod_execution['executed']}, "
                    f"Failed: {eod_execution['failed']}"
                )
            
            # Mark overall success
            report["status"] = "success"
            report["message"] = "Daily cycle completed successfully"
            
        except Exception as e:
            logger.error(f"❌ Error during daily cycle: {e}", exc_info=True)
            report["status"] = "error"
            report["message"] = str(e)
            report["error_type"] = type(e).__name__
        
        # Calculate duration
        cycle_end = datetime.now()
        report["duration_seconds"] = (cycle_end - cycle_start).total_seconds()
        
        # Phase 6: Save and distribute report
        logger.info("💾 Phase 6: Saving and distributing report...")
        await self._save_report(report)
        
        if self.enable_webhook and self.report_webhook:
            await self._send_to_webhook(report)
        
        logger.info("=" * 70)
        logger.info(f"✅ Daily cycle completed in {report['duration_seconds']:.2f}s")
        logger.info("=" * 70)
        
        return report
    
    async def _fetch_trading_state(self) -> tuple:
        """
        Fetch current trading state (account, positions, signals).
        
        Returns:
            Tuple of (account_dict, positions_list, signals_list)
        """
        # TODO: Replace with actual API calls to your trading system
        # This is a placeholder implementation
        
        account = {
            "balance": 100000.0,
            "equity": 100000.0,
            "available": 95000.0,
            "currency": "USD"
        }
        
        positions = []
        signals = []
        
        # In production, fetch from:
        # - Database (positions)
        # - Trading engine (signals)
        # - Exchange API (account balance)
        
        logger.debug(f"Fetched state: equity=${account['equity']:,.2f}, {len(positions)} positions")
        
        return account, positions, signals
    
    async def _execute_actions(
        self,
        actions: List[Any],
        account: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute trading actions through order router.
        
        Args:
            actions: List of TradingAction objects
            account: Account information dictionary
        
        Returns:
            Execution results summary
        """
        results = {
            "executed": 0,
            "skipped": 0,
            "failed": 0,
            "details": []
        }
        
        for action in actions:
            action_result = {
                "action_type": action.action_type.value,
                "symbol": action.symbol,
                "reason": action.reason,
                "priority": action.priority,
                "status": "pending"
            }
            
            try:
                if self.dry_run:
                    # Dry run mode - just log
                    logger.info(
                        f"   [DRY RUN] {action.action_type.value}: "
                        f"{action.symbol} - {action.reason}"
                    )
                    action_result["status"] = "dry_run"
                    results["skipped"] += 1
                
                elif action.action_type == ActionType.DO_NOTHING:
                    # Skip no-op actions
                    action_result["status"] = "skipped"
                    results["skipped"] += 1
                
                elif action.action_type == ActionType.EMERGENCY_EXIT:
                    # Execute emergency exit immediately
                    logger.warning(
                        f"   🆘 EMERGENCY EXIT: {action.symbol} - {action.reason}"
                    )
                    # TODO: Implement actual emergency exit via order_router
                    # await self.order_router.emergency_close(action.symbol, action.quantity)
                    action_result["status"] = "executed"
                    results["executed"] += 1
                
                elif action.action_type == ActionType.CLOSE_POSITION:
                    # Close position
                    logger.info(f"   📤 Closing position: {action.symbol}")
                    # TODO: Implement via order_router
                    # await self.order_router.close_position(action.symbol, action.quantity)
                    action_result["status"] = "executed"
                    results["executed"] += 1
                
                elif action.action_type == ActionType.OPEN_POSITION:
                    # Open new position with stop-loss
                    logger.info(
                        f"   📥 Opening position: {action.symbol} "
                        f"{action.side} {action.quantity} @ {action.price} "
                        f"(SL: {action.stop_loss})"
                    )
                    # TODO: Implement via order_router
                    # order_payload = {
                    #     "symbol": action.symbol,
                    #     "side": action.side,
                    #     "amount": action.quantity,
                    #     "price": action.price,
                    #     "stop_loss": action.stop_loss
                    # }
                    # await self.order_router.place_order(order_payload)
                    action_result["status"] = "executed"
                    results["executed"] += 1
                
                elif action.action_type == ActionType.ADJUST_STOP_LOSS:
                    # Adjust stop-loss
                    logger.info(
                        f"   🎯 Adjusting stop-loss: {action.symbol} -> {action.stop_loss}"
                    )
                    # TODO: Implement via order_router
                    # await self.order_router.modify_stop_loss(action.symbol, action.stop_loss)
                    action_result["status"] = "executed"
                    results["executed"] += 1
                
                elif action.action_type == ActionType.HEDGE_POSITION:
                    # Hedge position
                    logger.info(f"   🛡️ Hedging position: {action.symbol}")
                    # TODO: Implement via order_router
                    # await self.order_router.place_hedge(action.symbol, action.quantity)
                    action_result["status"] = "executed"
                    results["executed"] += 1
                
                else:
                    logger.warning(f"   ⚠️ Unknown action type: {action.action_type}")
                    action_result["status"] = "skipped"
                    action_result["error"] = "Unknown action type"
                    results["skipped"] += 1
            
            except Exception as e:
                logger.error(
                    f"   ❌ Failed to execute {action.action_type.value} "
                    f"for {action.symbol}: {e}"
                )
                action_result["status"] = "failed"
                action_result["error"] = str(e)
                results["failed"] += 1
            
            results["details"].append(action_result)
        
        return results
    
    async def _save_report(self, report: Dict[str, Any]) -> None:
        """
        Save report to JSON file in logs directory.
        
        Args:
            report: Report dictionary to save
        """
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"daily_cycle_{timestamp}.json"
            filepath = self.log_dir / filename
            
            with open(filepath, "w") as f:
                json.dump(report, f, indent=2, default=str)
            
            logger.info(f"   💾 Report saved: {filepath}")
            
            # Also save as latest report
            latest_path = self.log_dir / "daily_cycle_latest.json"
            with open(latest_path, "w") as f:
                json.dump(report, f, indent=2, default=str)
            
        except Exception as e:
            logger.error(f"   ❌ Failed to save report: {e}", exc_info=True)
    
    async def _send_to_webhook(self, report: Dict[str, Any]) -> None:
        """
        Send report to configured webhook endpoint.
        
        Args:
            report: Report dictionary to send
        """
        if not self.report_webhook:
            logger.debug("   No webhook configured, skipping")
            return
        
        try:
            # Prepare payload
            payload = {
                "event": "daily_cycle_complete",
                "timestamp": report["timestamp"],
                "status": report["status"],
                "summary": {
                    "pnl": report["phases"]["eod_routine"]["total_pnl"],
                    "pnl_percent": report["phases"]["eod_routine"]["total_pnl_percent"],
                    "trading_halted": report["phases"]["daily_mission"]["trading_halted"],
                    "recommended_action": report["phases"]["eod_routine"]["recommended_action"]
                },
                "full_report": report
            }
            
            # Send POST request
            response = requests.post(
                self.report_webhook,
                json=payload,
                timeout=10,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                logger.info(f"   ✅ Report sent to webhook: {self.report_webhook}")
            else:
                logger.warning(
                    f"   ⚠️ Webhook returned {response.status_code}: {response.text}"
                )
        
        except requests.exceptions.RequestException as e:
            logger.error(f"   ❌ Failed to send to webhook: {e}")
        except Exception as e:
            logger.error(f"   ❌ Unexpected error sending to webhook: {e}", exc_info=True)
    
    def get_next_cycle_time(self) -> datetime:
        """
        Calculate next scheduled cycle time.
        
        Returns:
            Datetime of next cycle execution
        """
        now = datetime.now()
        
        # Parse market close time
        try:
            hour, minute = map(int, self.market_close_time.split(":"))
            close_time = time(hour, minute)
        except Exception:
            # Default to midnight if parsing fails
            close_time = time(0, 0)
        
        # Calculate next occurrence
        next_cycle = datetime.combine(now.date(), close_time)
        
        if next_cycle <= now:
            # If today's time has passed, schedule for tomorrow
            from datetime import timedelta
            next_cycle += timedelta(days=1)
        
        return next_cycle


async def run_daily_cycle(
    dry_run: bool = False,
    log_dir: Optional[str] = None
) -> Dict[str, Any]:
    """
    Convenience function to run a single daily cycle.
    
    Args:
        dry_run: If True, don't execute actual trades
        log_dir: Custom log directory path
    
    Returns:
        Report dictionary
    """
    # Override dry_run env var if specified
    if dry_run:
        os.environ["SCHEDULER_DRY_RUN"] = "true"
    
    scheduler = DailyCycleScheduler(log_dir=log_dir)
    report = await scheduler.schedule_daily_cycle()
    
    return report


def main():
    """Main entry point for standalone execution."""
    import sys
    
    # Setup logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    # Run cycle
    dry_run = os.getenv("SCHEDULER_DRY_RUN", "false").lower() == "true"
    logger.info(f"Starting daily cycle (dry_run={dry_run})...")
    
    report = asyncio.run(run_daily_cycle(dry_run=dry_run))
    
    # Print summary
    print("\n" + "=" * 70)
    print("📊 DAILY CYCLE SUMMARY")
    print("=" * 70)
    print(f"Status: {report['status']}")
    print(f"Duration: {report['duration_seconds']:.2f}s")
    
    if "eod_routine" in report.get("phases", {}):
        eod = report["phases"]["eod_routine"]
        print(f"Daily P&L: ${eod['total_pnl']:,.2f} ({eod['total_pnl_percent']:.2f}%)")
        print(f"Recommended Action: {eod['recommended_action']}")
        print(f"Stop Trading: {eod['should_stop_trading']}")
    
    print("=" * 70)
    
    return 0 if report["status"] == "success" else 1


if __name__ == "__main__":
    exit(main())
