"""Troubleshooting Engine - Diagnoses and fixes issues."""

import logging
from typing import Dict, Any, List, Optional
import re

logger = logging.getLogger(__name__)


class TroubleshootingEngine:
    """
    Diagnoses common problems and suggests fixes.
    
    Capabilities:
    - Read and interpret logs
    - Suggest fixes for common errors
    - Explain API/network/exchange errors
    """
    
    def __init__(self):
        self.error_patterns = self._load_error_patterns()
        logger.info("🔧 Troubleshooting Engine initialized")
    
    def _load_error_patterns(self) -> Dict[str, Dict[str, Any]]:
        """Load common error patterns and solutions."""
        return {
            "api_key_invalid": {
                "patterns": [
                    r"invalid.*api.*key",
                    r"authentication.*failed",
                    r"401.*unauthorized"
                ],
                "diagnosis": "Invalid API Key",
                "solution": """**Fix Invalid API Key:**
1. Go to your exchange account
2. Generate new API key with trading permissions
3. Copy EXACT key and secret (no spaces)
4. Update in Settings → API Keys
5. Save and test connection

**Note:** Some exchanges require IP whitelisting.""",
                "severity": "critical"
            },
            "insufficient_balance": {
                "patterns": [
                    r"insufficient.*balance",
                    r"not.*enough.*funds",
                    r"balance.*too.*low"
                ],
                "diagnosis": "Insufficient Balance",
                "solution": """**Fix Insufficient Balance:**
1. Check exchange account balance
2. Ensure funds are in trading account (not wallet)
3. Check minimum order size for pair
4. Reduce position size in Risk Manager
5. Deposit more funds if needed

**Tip:** Set `max_position_size` to lower % of capital.""",
                "severity": "high"
            },
            "rate_limit": {
                "patterns": [
                    r"rate.*limit",
                    r"too.*many.*requests",
                    r"429"
                ],
                "diagnosis": "Rate Limit Exceeded",
                "solution": """**Fix Rate Limit:**
1. Reduce number of active strategies
2. Increase `update_interval` in settings
3. Use fewer market adapters simultaneously
4. Check if other bots using same API key
5. Wait a few minutes before retrying

**Note:** Each exchange has different rate limits.""",
                "severity": "medium"
            },
            "network_timeout": {
                "patterns": [
                    r"timeout",
                    r"connection.*timed.*out",
                    r"network.*error"
                ],
                "diagnosis": "Network Timeout",
                "solution": """**Fix Network Issues:**
1. Check internet connection
2. Test exchange website accessibility
3. Check firewall settings
4. Try different network/VPN
5. Verify exchange isn't under maintenance

Check exchange status page for ongoing issues.""",
                "severity": "medium"
            },
            "invalid_symbol": {
                "patterns": [
                    r"invalid.*symbol",
                    r"symbol.*not.*found",
                    r"market.*not.*available"
                ],
                "diagnosis": "Invalid Trading Pair",
                "solution": """**Fix Invalid Symbol:**
1. Check symbol format (e.g., BTCUSDT not BTC/USDT)
2. Verify pair exists on exchange
3. Check if pair is delisted
4. Update symbol in strategy settings
5. Use exchange's symbol list as reference

**Format varies:** Binance uses BTCUSDT, others use BTC-USDT.""",
                "severity": "high"
            },
            "strategy_not_running": {
                "patterns": [
                    r"strategy.*not.*enabled",
                    r"no.*signals.*generated",
                    r"strategy.*inactive"
                ],
                "diagnosis": "Strategy Not Running",
                "solution": """**Fix Strategy Issues:**
1. Enable strategy in Strategy Arsenal
2. Check market conditions match strategy requirements
3. Verify HTF direction bias aligns
4. Check News Filter isn't blocking
5. Review logs for why strategy is quiet

**Tip:** Some strategies only work in specific conditions.""",
                "severity": "medium"
            },
            "position_rejected": {
                "patterns": [
                    r"order.*rejected",
                    r"position.*not.*allowed",
                    r"margin.*insufficient"
                ],
                "diagnosis": "Order Rejected",
                "solution": """**Fix Order Rejection:**
1. Check available margin
2. Verify pair is tradeable
3. Check exchange trading restrictions
4. Ensure order size meets minimums
5. Check if KYC is required

**For leverage:** Ensure sufficient margin for position.""",
                "severity": "high"
            }
        }
    
    def diagnose(self, error_message: str) -> Dict[str, Any]:
        """
        Diagnose an error message.
        
        Args:
            error_message: Error text from logs
            
        Returns:
            Diagnosis and solution
        """
        error_lower = error_message.lower()
        
        # Match against patterns
        matches = []
        for error_type, info in self.error_patterns.items():
            for pattern in info["patterns"]:
                if re.search(pattern, error_lower):
                    matches.append({
                        "type": error_type,
                        "diagnosis": info["diagnosis"],
                        "solution": info["solution"],
                        "severity": info["severity"]
                    })
                    break
        
        if not matches:
            return {
                "diagnosis": "Unknown Error",
                "solution": """**General Troubleshooting:**
1. Check the full error message in logs
2. Verify all API keys and connections
3. Check exchange status page
4. Restart the backend service
5. Contact support with error details

Include the exact error message when asking for help.""",
                "severity": "unknown",
                "matched": False
            }
        
        # Return first match (most specific)
        result = matches[0]
        result["matched"] = True
        return result
    
    def suggest_fixes(self, problem_description: str) -> Dict[str, Any]:
        """
        Suggest fixes for a described problem.
        
        Args:
            problem_description: User's description of the issue
            
        Returns:
            Suggested fixes
        """
        desc_lower = problem_description.lower()
        
        # Detect problem type from description
        if any(word in desc_lower for word in ["not trading", "no trades", "not working"]):
            return {
                "problem": "Bot Not Trading",
                "possible_causes": [
                    "Strategy not enabled",
                    "Market conditions don't match",
                    "Risk limits exceeded",
                    "News Filter blocking",
                    "Insufficient balance"
                ],
                "steps": """**Troubleshooting Steps:**
1. Check dashboard - is strategy enabled?
2. Review market conditions vs strategy requirements
3. Check Risk Manager - any limits hit?
4. Look at News Filter - high-impact event?
5. Verify account balance is sufficient

Check logs at `/api/logs` for specific reasons."""
            }
        
        elif any(word in desc_lower for word in ["api", "connection", "authenticate"]):
            return self.diagnose(problem_description)
        
        elif any(word in desc_lower for word in ["balance", "funds", "money"]):
            return self.diagnose("insufficient balance")
        
        elif any(word in desc_lower for word in ["slow", "lag", "delay"]):
            return {
                "problem": "Performance Issues",
                "possible_causes": [
                    "Too many strategies running",
                    "Network latency",
                    "Exchange API slow",
                    "High CPU usage"
                ],
                "steps": """**Fix Performance:**
1. Reduce number of active strategies
2. Increase update intervals
3. Check system resources (CPU/RAM)
4. Use closer exchange servers (region)
5. Disable unused market adapters"""
            }
        
        else:
            return {
                "problem": "General Issue",
                "steps": """**General Troubleshooting:**
1. Describe the exact problem you're seeing
2. Check logs at `/api/logs`
3. Note any error messages
4. Check when the issue started
5. Try restarting services

Provide specific details for better help."""
            }
    
    def read_logs(self, log_entries: List[str]) -> Dict[str, Any]:
        """
        Analyze log entries for issues.
        
        Args:
            log_entries: List of log lines
            
        Returns:
            Analysis of logs
        """
        errors = []
        warnings = []
        
        for entry in log_entries:
            entry_lower = entry.lower()
            
            if "error" in entry_lower:
                diagnosis = self.diagnose(entry)
                errors.append({
                    "log": entry,
                    "diagnosis": diagnosis
                })
            
            elif "warning" in entry_lower or "warn" in entry_lower:
                warnings.append(entry)
        
        return {
            "total_entries": len(log_entries),
            "errors_found": len(errors),
            "warnings_found": len(warnings),
            "errors": errors[:5],  # Return first 5
            "warnings": warnings[:5],
            "summary": self._generate_log_summary(errors, warnings)
        }
    
    def _generate_log_summary(self, errors: List, warnings: List) -> str:
        """Generate summary of log analysis."""
        if not errors and not warnings:
            return "✅ No issues found in logs. System is healthy."
        
        summary = "**Log Analysis:**\n\n"
        
        if errors:
            summary += f"🔴 **{len(errors)} Error(s) Found:**\n"
            for i, error in enumerate(errors[:3], 1):
                summary += f"{i}. {error['diagnosis']['diagnosis']}\n"
            summary += "\n"
        
        if warnings:
            summary += f"⚠️ **{len(warnings)} Warning(s) Found:**\n"
            summary += "Review warnings for potential issues.\n\n"
        
        summary += "Check `/api/logs` for full details."
        
        return summary
    
    def explain_error_code(self, code: int) -> str:
        """Explain HTTP error codes."""
        codes = {
            400: "**Bad Request (400)**\nRequest format is incorrect. Check parameters.",
            401: "**Unauthorized (401)**\nAuthentication failed. Check API keys.",
            403: "**Forbidden (403)**\nRequest not allowed. Check permissions.",
            404: "**Not Found (404)**\nResource doesn't exist. Check symbol/endpoint.",
            429: "**Rate Limit (429)**\nToo many requests. Slow down API calls.",
            500: "**Internal Server Error (500)**\nExchange server issue. Try again later.",
            503: "**Service Unavailable (503)**\nExchange under maintenance. Wait and retry."
        }
        
        return codes.get(code, f"**Error {code}**\nCheck exchange documentation for details.")
