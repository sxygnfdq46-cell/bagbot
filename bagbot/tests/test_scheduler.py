"""
Unit tests for Trading Scheduler Module

Tests daily cycle orchestration, report generation, and webhook delivery.
"""

import os
import json
import pytest
import asyncio
from unittest.mock import patch, MagicMock, AsyncMock
from pathlib import Path
from datetime import datetime

from bagbot.trading.scheduler import DailyCycleScheduler, run_daily_cycle
from bagbot.trading.mindset import TradingMindset, TradingAction, ActionType, EODAction


@pytest.fixture
def temp_log_dir(tmp_path):
    """Create temporary log directory."""
    log_dir = tmp_path / "reports"
    log_dir.mkdir()
    return str(log_dir)


@pytest.fixture
def mock_mindset():
    """Create mock mindset."""
    mindset = MagicMock(spec=TradingMindset)
    mindset.trading_halted = False
    mindset.halt_reason = ""
    mindset.consecutive_losses = 0
    
    # Mock daily_mission
    mindset.daily_mission.return_value = []
    
    # Mock eod_routine
    from bagbot.trading.mindset import EODReport
    eod_report = EODReport(
        total_pnl=0.0,
        total_pnl_percent=0.0,
        drawdown_percent=0.0,
        open_positions_count=0,
        recommended_action=EODAction.MAINTAIN,
        should_stop_trading=False,
        analysis="Test analysis",
        actions=[]
    )
    mindset.eod_routine.return_value = eod_report
    
    return mindset


class TestDailyCycleScheduler:
    """Test daily cycle scheduler functionality."""
    
    @pytest.mark.asyncio
    async def test_initialization(self, temp_log_dir):
        """Test scheduler initialization."""
        scheduler = DailyCycleScheduler(log_dir=temp_log_dir)
        
        assert scheduler.mindset is not None
        assert scheduler.log_dir == Path(temp_log_dir)
        assert scheduler.dry_run is False  # Default
    
    @patch.dict(os.environ, {"SCHEDULER_DRY_RUN": "true"})
    def test_initialization_dry_run(self, temp_log_dir):
        """Test scheduler initialization in dry run mode."""
        scheduler = DailyCycleScheduler(log_dir=temp_log_dir)
        
        assert scheduler.dry_run is True
    
    @pytest.mark.asyncio
    async def test_schedule_daily_cycle_success(self, temp_log_dir, mock_mindset):
        """Test successful daily cycle execution."""
        scheduler = DailyCycleScheduler(
            mindset=mock_mindset,
            log_dir=temp_log_dir
        )
        
        report = await scheduler.schedule_daily_cycle()
        
        # Verify report structure
        assert report["status"] == "success"
        assert "timestamp" in report
        assert "cycle_type" in report
        assert "phases" in report
        assert "duration_seconds" in report
        
        # Verify phases
        assert "state_fetch" in report["phases"]
        assert "daily_mission" in report["phases"]
        assert "action_execution" in report["phases"]
        assert "eod_routine" in report["phases"]
        
        # Verify mindset was called
        mock_mindset.daily_mission.assert_called_once()
        mock_mindset.eod_routine.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_schedule_daily_cycle_with_actions(self, temp_log_dir, mock_mindset):
        """Test daily cycle with trading actions."""
        # Setup actions
        action1 = TradingAction(
            action_type=ActionType.CLOSE_POSITION,
            symbol="BTCUSDT",
            side="sell",
            quantity=0.5,
            reason="Stop-loss hit",
            priority=90
        )
        
        action2 = TradingAction(
            action_type=ActionType.OPEN_POSITION,
            symbol="ETHUSDT",
            side="buy",
            quantity=2.0,
            price=3000.0,
            stop_loss=2940.0,
            reason="Signal processed",
            priority=50
        )
        
        mock_mindset.daily_mission.return_value = [action1, action2]
        
        scheduler = DailyCycleScheduler(
            mindset=mock_mindset,
            log_dir=temp_log_dir
        )
        
        report = await scheduler.schedule_daily_cycle()
        
        assert report["status"] == "success"
        assert report["phases"]["action_execution"]["total_actions"] == 2
        assert len(report["phases"]["action_execution"]["results"]) == 2
    
    @pytest.mark.asyncio
    async def test_schedule_daily_cycle_with_emergency_exit(self, temp_log_dir, mock_mindset):
        """Test daily cycle with emergency exit action."""
        emergency_action = TradingAction(
            action_type=ActionType.EMERGENCY_EXIT,
            symbol="BTCUSDT",
            side="sell",
            quantity=1.0,
            reason="Drawdown breach",
            priority=100
        )
        
        mock_mindset.trading_halted = True
        mock_mindset.halt_reason = "Daily drawdown limit breached"
        mock_mindset.daily_mission.return_value = [emergency_action]
        
        scheduler = DailyCycleScheduler(
            mindset=mock_mindset,
            log_dir=temp_log_dir
        )
        
        report = await scheduler.schedule_daily_cycle()
        
        assert report["status"] == "success"
        assert report["phases"]["daily_mission"]["trading_halted"] is True
        assert report["phases"]["action_execution"]["total_actions"] == 1
    
    @pytest.mark.asyncio
    async def test_report_saved_to_file(self, temp_log_dir, mock_mindset):
        """Test that report is saved to JSON file."""
        scheduler = DailyCycleScheduler(
            mindset=mock_mindset,
            log_dir=temp_log_dir
        )
        
        report = await scheduler.schedule_daily_cycle()
        
        # Check latest report exists
        latest_path = Path(temp_log_dir) / "daily_cycle_latest.json"
        assert latest_path.exists()
        
        # Verify content
        with open(latest_path) as f:
            saved_report = json.load(f)
        
        assert saved_report["status"] == report["status"]
        assert saved_report["cycle_type"] == "daily"
    
    @pytest.mark.skip(reason="Async test with patches - pytest-asyncio compatibility issue")
    @patch.dict(os.environ, {
        "REPORT_WEBHOOK": "https://example.com/webhook",
        "ENABLE_REPORT_WEBHOOK": "true"
    })
    @patch("requests.post")
    @pytest.mark.asyncio
    async def test_webhook_delivery(self, mock_post, temp_log_dir, mock_mindset):
        """Test report webhook delivery."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response
        
        scheduler = DailyCycleScheduler(
            mindset=mock_mindset,
            log_dir=temp_log_dir
        )
        
        report = await scheduler.schedule_daily_cycle()
        
        # Verify webhook was called
        mock_post.assert_called_once()
        call_args = mock_post.call_args
        
        assert call_args[0][0] == "https://example.com/webhook"
        assert "json" in call_args[1]
        
        payload = call_args[1]["json"]
        assert payload["event"] == "daily_cycle_complete"
        assert "full_report" in payload
    
    @pytest.mark.skip(reason="Async test with patches - pytest-asyncio compatibility issue")
    @patch.dict(os.environ, {
        "REPORT_WEBHOOK": "https://example.com/webhook",
        "ENABLE_REPORT_WEBHOOK": "false"
    })
    @patch("requests.post")
    @pytest.mark.asyncio
    async def test_webhook_disabled(self, mock_post, temp_log_dir, mock_mindset):
        """Test webhook delivery when disabled."""
        scheduler = DailyCycleScheduler(
            mindset=mock_mindset,
            log_dir=temp_log_dir
        )
        
        await scheduler.schedule_daily_cycle()
        
        # Verify webhook was NOT called
        mock_post.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_dry_run_mode(self, temp_log_dir, mock_mindset):
        """Test dry run mode doesn't execute trades."""
        with patch.dict(os.environ, {"SCHEDULER_DRY_RUN": "true"}):
            action = TradingAction(
                action_type=ActionType.OPEN_POSITION,
                symbol="BTCUSDT",
                side="buy",
                quantity=0.1,
                price=50000.0,
                stop_loss=49000.0,
                reason="Test signal",
                priority=50
            )
            
            mock_mindset.daily_mission.return_value = [action]
            
            scheduler = DailyCycleScheduler(
                mindset=mock_mindset,
                log_dir=temp_log_dir
            )
            
            report = await scheduler.schedule_daily_cycle()
            
            assert report["dry_run"] is True
            assert report["phases"]["action_execution"]["skipped"] == 1
            assert report["phases"]["action_execution"]["executed"] == 0
    
    @pytest.mark.asyncio
    async def test_eod_actions_execution(self, temp_log_dir, mock_mindset):
        """Test EOD actions are executed."""
        eod_action = TradingAction(
            action_type=ActionType.ADJUST_STOP_LOSS,
            symbol="BTCUSDT",
            stop_loss=51000.0,
            reason="EOD tighten stop-loss",
            priority=60
        )
        
        from bagbot.trading.mindset import EODReport
        eod_report = EODReport(
            total_pnl=-1000.0,
            total_pnl_percent=-1.0,
            drawdown_percent=1.0,
            open_positions_count=1,
            recommended_action=EODAction.TIGHTEN_STOPS,
            should_stop_trading=False,
            analysis="Minor loss, tightening stops",
            actions=[eod_action]
        )
        
        mock_mindset.eod_routine.return_value = eod_report
        
        scheduler = DailyCycleScheduler(
            mindset=mock_mindset,
            log_dir=temp_log_dir
        )
        
        report = await scheduler.schedule_daily_cycle()
        
        assert "eod_action_execution" in report["phases"]
        assert report["phases"]["eod_action_execution"]["total_actions"] == 1
    
    def test_get_next_cycle_time(self, temp_log_dir):
        """Test next cycle time calculation."""
        scheduler = DailyCycleScheduler(log_dir=temp_log_dir)
        
        next_time = scheduler.get_next_cycle_time()
        
        assert isinstance(next_time, datetime)
        assert next_time > datetime.now()
    
    @patch.dict(os.environ, {"MARKET_CLOSE_TIME": "16:00"})
    def test_market_close_time_config(self, temp_log_dir):
        """Test market close time configuration."""
        scheduler = DailyCycleScheduler(log_dir=temp_log_dir)
        
        assert scheduler.market_close_time == "16:00"


class TestRunDailyCycle:
    """Test convenience function."""
    
    @pytest.mark.asyncio
    @patch("bagbot.trading.scheduler.DailyCycleScheduler")
    async def test_run_daily_cycle_function(self, mock_scheduler_class, temp_log_dir):
        """Test run_daily_cycle convenience function."""
        mock_scheduler = MagicMock()
        mock_scheduler.schedule_daily_cycle = AsyncMock(return_value={"status": "success"})
        mock_scheduler_class.return_value = mock_scheduler
        
        report = await run_daily_cycle(dry_run=True, log_dir=temp_log_dir)
        
        assert report["status"] == "success"
        mock_scheduler.schedule_daily_cycle.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_run_daily_cycle_sets_dry_run(self, temp_log_dir):
        """Test run_daily_cycle sets dry_run environment variable."""
        with patch.dict(os.environ, {}, clear=True):
            await run_daily_cycle(dry_run=True, log_dir=temp_log_dir)
            
            assert os.getenv("SCHEDULER_DRY_RUN") == "true"


class TestActionExecution:
    """Test action execution logic."""
    
    @pytest.mark.asyncio
    async def test_execute_multiple_action_types(self, temp_log_dir, mock_mindset):
        """Test execution of various action types."""
        actions = [
            TradingAction(
                action_type=ActionType.CLOSE_POSITION,
                symbol="BTC",
                side="sell",
                quantity=0.5,
                reason="Close",
                priority=90
            ),
            TradingAction(
                action_type=ActionType.OPEN_POSITION,
                symbol="ETH",
                side="buy",
                quantity=2.0,
                price=3000.0,
                stop_loss=2940.0,
                reason="Open",
                priority=50
            ),
            TradingAction(
                action_type=ActionType.ADJUST_STOP_LOSS,
                symbol="BTC",
                stop_loss=51000.0,
                reason="Adjust",
                priority=60
            ),
            TradingAction(
                action_type=ActionType.DO_NOTHING,
                reason="No action",
                priority=0
            )
        ]
        
        mock_mindset.daily_mission.return_value = actions
        
        scheduler = DailyCycleScheduler(
            mindset=mock_mindset,
            log_dir=temp_log_dir
        )
        
        report = await scheduler.schedule_daily_cycle()
        
        # Verify all actions were processed
        assert report["phases"]["action_execution"]["total_actions"] == 4
        results = report["phases"]["action_execution"]["results"]
        assert len(results) == 4
        
        # Verify action types
        action_types = [r["action_type"] for r in results]
        assert "close_position" in action_types
        assert "open_position" in action_types
        assert "adjust_stop_loss" in action_types
        assert "do_nothing" in action_types


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
