"""
Evolution Memory Vault - Long-term Evolution Data Storage
Advanced Trading Intelligence System - Step 24.53+

This vault stores long-term evolution data including module improvements,
model upgrades, volatility behavior changes, shield threat shifts, and
performance events with atomic writes and safety measures.
"""

import asyncio
import json
import logging
import os
import time
import threading
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from pathlib import Path
import pickle
import hashlib
from enum import Enum
from collections import defaultdict, deque
import sqlite3
import aiofiles
import aiofiles.os

logger = logging.getLogger(__name__)


class EvolutionEventType(Enum):
    """Types of evolution events"""
    MODULE_IMPROVEMENT = "module_improvement"
    MODEL_UPGRADE = "model_upgrade"
    VOLATILITY_BEHAVIOR_CHANGE = "volatility_behavior_change"
    SHIELD_THREAT_SHIFT = "shield_threat_shift"
    PERFORMANCE_DEGRADATION = "performance_degradation"
    MARKET_REGIME_TRANSITION = "market_regime_transition"
    CONFIGURATION_CHANGE = "configuration_change"
    SYSTEM_OPTIMIZATION = "system_optimization"


@dataclass
class EvolutionRecord:
    """
    Persistent structure for evolution events
    """
    timestamp: float
    module: str
    event_type: EvolutionEventType
    previous_state: Dict[str, Any]
    new_state: Dict[str, Any]
    reason: str
    metrics: Dict[str, Any]
    success: bool = True
    error_message: Optional[str] = None
    correlation_id: Optional[str] = None
    vault_id: str = field(default_factory=lambda: hashlib.md5(f"{time.time()}_{os.urandom(8)}".encode()).hexdigest()[:16])


@dataclass
class EvolutionPattern:
    """Identified pattern in evolution history"""
    pattern_type: str
    frequency: int
    modules_affected: List[str]
    success_rate: float
    average_impact: float
    last_occurrence: datetime
    trend: str  # "increasing", "decreasing", "stable"


@dataclass
class VaultSnapshot:
    """Snapshot of the entire evolution vault"""
    timestamp: datetime
    total_records: int
    modules_tracked: int
    patterns_identified: int
    vault_size_bytes: int
    recent_activity: List[Dict[str, Any]]
    summary_stats: Dict[str, Any]


class EvolutionMemoryVault:
    """
    Evolution Memory Vault - Persistent storage for evolution data
    
    Features:
    - Long-term storage of evolution events
    - Atomic write operations
    - Pattern recognition and analysis
    - Integration with AutonomousEvolutionLayer and EternalUpgradeEngine
    - Read-only access for TradingPipelineCore and Shield Intelligence API
    - Fallback caching for storage overload scenarios
    - Thread-safe operations
    """
    
    def __init__(self, vault_path: Optional[str] = None, max_cache_size: int = 10000):
        # Configuration
        self.vault_path = vault_path or os.path.join(os.path.dirname(__file__), '../../data/evolution')
        self.max_cache_size = max_cache_size
        
        # Database path
        self.db_path = os.path.join(self.vault_path, 'evolution.db')
        self.backup_path = os.path.join(self.vault_path, 'backups')
        
        # In-memory cache for performance
        self.record_cache: deque = deque(maxlen=max_cache_size)
        self.pattern_cache: Dict[str, EvolutionPattern] = {}
        self.module_stats_cache: Dict[str, Dict[str, Any]] = {}
        
        # Thread safety
        self.write_lock = asyncio.Lock()
        self.cache_lock = threading.Lock()
        
        # State tracking
        self.is_initialized = False
        self.storage_overload = False
        self.last_backup_time = datetime.now()
        
        # Statistics
        self.total_writes = 0
        self.failed_writes = 0
        self.cache_hits = 0
        self.cache_misses = 0
    
    async def initialize(self) -> None:
        """Initialize the Evolution Memory Vault"""
        logger.info("Initializing Evolution Memory Vault...")
        
        try:
            # Ensure vault directory exists
            await self._ensure_vault_directory()
            
            # Initialize database
            await self._initialize_database()
            
            # Load recent records into cache
            await self._load_cache()
            
            # Perform initial pattern analysis
            await self._analyze_patterns()
            
            self.is_initialized = True
            logger.info(f"Evolution Memory Vault initialized successfully at {self.vault_path}")
            
        except Exception as error:
            logger.error(f"Failed to initialize Evolution Memory Vault: {error}")
            raise error
    
    async def save_evolution_record(self, record: EvolutionRecord) -> bool:
        """
        Save an evolution record with atomic writes
        """
        if not self.is_initialized:
            logger.warning("Vault not initialized, using fallback cache")
            return await self._fallback_cache_save(record)
        
        async with self.write_lock:
            try:
                # Validate record
                if not self._validate_record(record):
                    logger.error(f"Invalid evolution record: {record}")
                    return False
                
                # Check for storage overload
                if self.storage_overload:
                    logger.warning("Storage overload detected, using fallback cache")
                    return await self._fallback_cache_save(record)
                
                # Save to database
                success = await self._save_to_database(record)
                
                if success:
                    # Update cache
                    with self.cache_lock:
                        self.record_cache.append(record)
                        self._update_module_stats_cache(record)
                    
                    self.total_writes += 1
                    
                    # Trigger pattern analysis if needed
                    if self.total_writes % 100 == 0:
                        asyncio.create_task(self._analyze_patterns())
                    
                    logger.debug(f"Saved evolution record for module {record.module}")
                else:
                    self.failed_writes += 1
                
                return success
                
            except Exception as error:
                logger.error(f"Error saving evolution record: {error}")
                self.failed_writes += 1
                return await self._fallback_cache_save(record)
    
    async def load_recent_evolution(self, count: int = 100) -> List[EvolutionRecord]:
        """
        Load recent evolution records
        """
        try:
            # Try cache first
            with self.cache_lock:
                if len(self.record_cache) >= count:
                    self.cache_hits += 1
                    return list(self.record_cache)[-count:]
            
            # Load from database
            self.cache_misses += 1
            return await self._load_from_database(limit=count)
            
        except Exception as error:
            logger.error(f"Error loading recent evolution: {error}")
            return []
    
    async def get_evolution_history_for(self, module: str, limit: int = 500) -> List[EvolutionRecord]:
        """
        Get evolution history for a specific module
        """
        try:
            # Check cache first
            cached_records = []
            with self.cache_lock:
                cached_records = [r for r in self.record_cache if r.module == module]
            
            if len(cached_records) >= limit:
                self.cache_hits += 1
                return cached_records[-limit:]
            
            # Load from database
            self.cache_misses += 1
            return await self._load_module_history_from_database(module, limit)
            
        except Exception as error:
            logger.error(f"Error loading evolution history for {module}: {error}")
            return []
    
    async def summarize_patterns(self) -> Dict[str, Any]:
        """
        Summarize evolution patterns from historical data
        """
        try:
            if not self.pattern_cache:
                await self._analyze_patterns()
            
            summary = {
                "total_patterns": len(self.pattern_cache),
                "patterns": {},
                "module_trends": {},
                "event_frequencies": defaultdict(int),
                "success_rates": {},
                "last_analysis": datetime.now().isoformat()
            }
            
            # Summarize patterns
            for pattern_id, pattern in self.pattern_cache.items():
                summary["patterns"][pattern_id] = {
                    "type": pattern.pattern_type,
                    "frequency": pattern.frequency,
                    "modules_affected": len(pattern.modules_affected),
                    "success_rate": pattern.success_rate,
                    "trend": pattern.trend
                }
            
            # Module trends
            with self.cache_lock:
                for record in self.record_cache:
                    summary["event_frequencies"][record.event_type.value] += 1
                    
                    if record.module not in summary["module_trends"]:
                        summary["module_trends"][record.module] = {
                            "total_events": 0,
                            "success_rate": 0.0,
                            "last_activity": None
                        }
                    
                    module_trends = summary["module_trends"][record.module]
                    module_trends["total_events"] += 1
                    module_trends["last_activity"] = record.timestamp
            
            # Calculate success rates
            for module, trends in summary["module_trends"].items():
                module_records = [r for r in self.record_cache if r.module == module]
                if module_records:
                    successes = sum(1 for r in module_records if r.success)
                    trends["success_rate"] = successes / len(module_records)
            
            return summary
            
        except Exception as error:
            logger.error(f"Error summarizing patterns: {error}")
            return {"error": str(error)}
    
    async def export_vault_snapshot(self) -> VaultSnapshot:
        """
        Export a complete snapshot of the vault
        """
        try:
            # Get recent activity
            recent_records = await self.load_recent_evolution(50)
            recent_activity = [
                {
                    "timestamp": r.timestamp,
                    "module": r.module,
                    "event_type": r.event_type.value,
                    "success": r.success,
                    "reason": r.reason
                } for r in recent_records
            ]
            
            # Calculate vault size
            vault_size = await self._calculate_vault_size()
            
            # Get module count
            modules_tracked = len(set(r.module for r in self.record_cache))
            
            # Summary statistics
            summary_stats = {
                "total_writes": self.total_writes,
                "failed_writes": self.failed_writes,
                "cache_hits": self.cache_hits,
                "cache_misses": self.cache_misses,
                "cache_size": len(self.record_cache),
                "storage_overload": self.storage_overload,
                "last_backup": self.last_backup_time.isoformat()
            }
            
            return VaultSnapshot(
                timestamp=datetime.now(),
                total_records=len(self.record_cache),
                modules_tracked=modules_tracked,
                patterns_identified=len(self.pattern_cache),
                vault_size_bytes=vault_size,
                recent_activity=recent_activity,
                summary_stats=summary_stats
            )
            
        except Exception as error:
            logger.error(f"Error exporting vault snapshot: {error}")
            # Return minimal snapshot on error
            return VaultSnapshot(
                timestamp=datetime.now(),
                total_records=0,
                modules_tracked=0,
                patterns_identified=0,
                vault_size_bytes=0,
                recent_activity=[],
                summary_stats={"error": str(error)}
            )
    
    async def get_vault_statistics(self) -> Dict[str, Any]:
        """Get vault statistics and health metrics"""
        return {
            "initialized": self.is_initialized,
            "vault_path": self.vault_path,
            "total_writes": self.total_writes,
            "failed_writes": self.failed_writes,
            "success_rate": (self.total_writes - self.failed_writes) / max(1, self.total_writes),
            "cache_hits": self.cache_hits,
            "cache_misses": self.cache_misses,
            "cache_hit_rate": self.cache_hits / max(1, self.cache_hits + self.cache_misses),
            "cache_size": len(self.record_cache),
            "max_cache_size": self.max_cache_size,
            "storage_overload": self.storage_overload,
            "patterns_identified": len(self.pattern_cache),
            "last_backup": self.last_backup_time.isoformat()
        }
    
    async def create_backup(self) -> bool:
        """Create a backup of the vault"""
        try:
            backup_dir = os.path.join(self.backup_path, datetime.now().strftime("%Y%m%d_%H%M%S"))
            await aiofiles.os.makedirs(backup_dir, exist_ok=True)
            
            # Backup database
            if os.path.exists(self.db_path):
                backup_db_path = os.path.join(backup_dir, "evolution.db")
                async with aiofiles.open(self.db_path, 'rb') as src:
                    async with aiofiles.open(backup_db_path, 'wb') as dst:
                        await dst.write(await src.read())
            
            # Backup cache as JSON
            cache_backup_path = os.path.join(backup_dir, "cache_snapshot.json")
            with self.cache_lock:
                cache_data = [asdict(record) for record in self.record_cache]
                # Convert enum to string for JSON serialization
                for record in cache_data:
                    record['event_type'] = record['event_type'].value if hasattr(record['event_type'], 'value') else record['event_type']
            
            async with aiofiles.open(cache_backup_path, 'w') as f:
                await f.write(json.dumps(cache_data, indent=2))
            
            self.last_backup_time = datetime.now()
            logger.info(f"Vault backup created at {backup_dir}")
            return True
            
        except Exception as error:
            logger.error(f"Error creating backup: {error}")
            return False
    
    async def _ensure_vault_directory(self) -> None:
        """Ensure vault directory structure exists"""
        await aiofiles.os.makedirs(self.vault_path, exist_ok=True)
        await aiofiles.os.makedirs(self.backup_path, exist_ok=True)
        await aiofiles.os.makedirs(os.path.join(self.vault_path, 'temp'), exist_ok=True)
    
    async def _initialize_database(self) -> None:
        """Initialize SQLite database for persistent storage"""
        def init_db():
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS evolution_records (
                    vault_id TEXT PRIMARY KEY,
                    timestamp REAL NOT NULL,
                    module TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    previous_state TEXT,
                    new_state TEXT,
                    reason TEXT,
                    metrics TEXT,
                    success INTEGER NOT NULL,
                    error_message TEXT,
                    correlation_id TEXT,
                    created_at REAL DEFAULT (julianday('now'))
                )
            ''')
            
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_module ON evolution_records(module)
            ''')
            
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_timestamp ON evolution_records(timestamp)
            ''')
            
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_event_type ON evolution_records(event_type)
            ''')
            
            conn.commit()
            conn.close()
        
        # Run database initialization in thread pool
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, init_db)
    
    async def _load_cache(self) -> None:
        """Load recent records into cache"""
        try:
            recent_records = await self._load_from_database(limit=self.max_cache_size)
            with self.cache_lock:
                self.record_cache.clear()
                self.record_cache.extend(recent_records)
            
            logger.info(f"Loaded {len(recent_records)} records into cache")
            
        except Exception as error:
            logger.warning(f"Error loading cache: {error}")
    
    async def _save_to_database(self, record: EvolutionRecord) -> bool:
        """Save record to SQLite database"""
        def save_record():
            try:
                conn = sqlite3.connect(self.db_path, timeout=10)
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO evolution_records 
                    (vault_id, timestamp, module, event_type, previous_state, new_state, 
                     reason, metrics, success, error_message, correlation_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    record.vault_id,
                    record.timestamp,
                    record.module,
                    record.event_type.value,
                    json.dumps(record.previous_state),
                    json.dumps(record.new_state),
                    record.reason,
                    json.dumps(record.metrics),
                    1 if record.success else 0,
                    record.error_message,
                    record.correlation_id
                ))
                
                conn.commit()
                conn.close()
                return True
                
            except Exception as e:
                logger.error(f"Database save error: {e}")
                return False
        
        # Run in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, save_record)
    
    async def _load_from_database(self, limit: int = 100) -> List[EvolutionRecord]:
        """Load records from SQLite database"""
        def load_records():
            try:
                conn = sqlite3.connect(self.db_path, timeout=10)
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT * FROM evolution_records 
                    ORDER BY timestamp DESC 
                    LIMIT ?
                ''', (limit,))
                
                rows = cursor.fetchall()
                conn.close()
                
                records = []
                for row in rows:
                    try:
                        record = EvolutionRecord(
                            vault_id=row[0],
                            timestamp=row[1],
                            module=row[2],
                            event_type=EvolutionEventType(row[3]),
                            previous_state=json.loads(row[4]) if row[4] else {},
                            new_state=json.loads(row[5]) if row[5] else {},
                            reason=row[6] or "",
                            metrics=json.loads(row[7]) if row[7] else {},
                            success=bool(row[8]),
                            error_message=row[9],
                            correlation_id=row[10]
                        )
                        records.append(record)
                    except Exception as e:
                        logger.warning(f"Error parsing record: {e}")
                
                return records
                
            except Exception as e:
                logger.error(f"Database load error: {e}")
                return []
        
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, load_records)
    
    async def _load_module_history_from_database(self, module: str, limit: int) -> List[EvolutionRecord]:
        """Load evolution history for specific module from database"""
        def load_module_records():
            try:
                conn = sqlite3.connect(self.db_path, timeout=10)
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT * FROM evolution_records 
                    WHERE module = ?
                    ORDER BY timestamp DESC 
                    LIMIT ?
                ''', (module, limit))
                
                rows = cursor.fetchall()
                conn.close()
                
                records = []
                for row in rows:
                    try:
                        record = EvolutionRecord(
                            vault_id=row[0],
                            timestamp=row[1],
                            module=row[2],
                            event_type=EvolutionEventType(row[3]),
                            previous_state=json.loads(row[4]) if row[4] else {},
                            new_state=json.loads(row[5]) if row[5] else {},
                            reason=row[6] or "",
                            metrics=json.loads(row[7]) if row[7] else {},
                            success=bool(row[8]),
                            error_message=row[9],
                            correlation_id=row[10]
                        )
                        records.append(record)
                    except Exception as e:
                        logger.warning(f"Error parsing module record: {e}")
                
                return records
                
            except Exception as e:
                logger.error(f"Database module load error: {e}")
                return []
        
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, load_module_records)
    
    async def _fallback_cache_save(self, record: EvolutionRecord) -> bool:
        """Fallback save to cache when database is unavailable"""
        try:
            with self.cache_lock:
                self.record_cache.append(record)
                self._update_module_stats_cache(record)
            
            logger.debug(f"Saved record to fallback cache: {record.module}")
            return True
            
        except Exception as error:
            logger.error(f"Fallback cache save error: {error}")
            return False
    
    def _validate_record(self, record: EvolutionRecord) -> bool:
        """Validate evolution record"""
        if not record.module or not record.reason:
            return False
        
        if not isinstance(record.previous_state, dict) or not isinstance(record.new_state, dict):
            return False
        
        if not isinstance(record.metrics, dict):
            return False
        
        return True
    
    def _update_module_stats_cache(self, record: EvolutionRecord) -> None:
        """Update module statistics cache"""
        if record.module not in self.module_stats_cache:
            self.module_stats_cache[record.module] = {
                "total_events": 0,
                "success_count": 0,
                "last_update": None
            }
        
        stats = self.module_stats_cache[record.module]
        stats["total_events"] += 1
        if record.success:
            stats["success_count"] += 1
        stats["last_update"] = record.timestamp
    
    async def _analyze_patterns(self) -> None:
        """Analyze evolution patterns from historical data"""
        try:
            # Simple pattern analysis - would be more sophisticated in production
            with self.cache_lock:
                records = list(self.record_cache)
            
            # Group by event type and module
            event_groups = defaultdict(list)
            for record in records:
                key = f"{record.event_type.value}_{record.module}"
                event_groups[key].append(record)
            
            # Analyze patterns
            for group_key, group_records in event_groups.items():
                if len(group_records) >= 3:  # Need at least 3 occurrences
                    event_type, module = group_key.rsplit('_', 1)
                    
                    success_rate = sum(1 for r in group_records if r.success) / len(group_records)
                    
                    # Calculate trend (simple)
                    recent_records = group_records[-5:] if len(group_records) >= 5 else group_records
                    recent_success_rate = sum(1 for r in recent_records if r.success) / len(recent_records)
                    
                    if recent_success_rate > success_rate + 0.1:
                        trend = "increasing"
                    elif recent_success_rate < success_rate - 0.1:
                        trend = "decreasing"
                    else:
                        trend = "stable"
                    
                    pattern = EvolutionPattern(
                        pattern_type=event_type,
                        frequency=len(group_records),
                        modules_affected=[module],
                        success_rate=success_rate,
                        average_impact=0.5,  # Would calculate from metrics in production
                        last_occurrence=datetime.fromtimestamp(max(r.timestamp for r in group_records)),
                        trend=trend
                    )
                    
                    self.pattern_cache[group_key] = pattern
            
            logger.debug(f"Analyzed {len(self.pattern_cache)} patterns")
            
        except Exception as error:
            logger.error(f"Error analyzing patterns: {error}")
    
    async def _calculate_vault_size(self) -> int:
        """Calculate total vault size in bytes"""
        try:
            total_size = 0
            for root, dirs, files in os.walk(self.vault_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    if os.path.exists(file_path):
                        total_size += os.path.getsize(file_path)
            return total_size
        except Exception:
            return 0
    
    async def shutdown(self) -> None:
        """Shutdown the vault and cleanup resources"""
        logger.info("Shutting down Evolution Memory Vault...")
        
        # Create final backup
        await self.create_backup()
        
        # Clear caches
        with self.cache_lock:
            self.record_cache.clear()
            self.pattern_cache.clear()
            self.module_stats_cache.clear()
        
        logger.info("Evolution Memory Vault shutdown complete")


# Configuration
EVOLUTION_VAULT_PATH = os.path.join(os.path.dirname(__file__), '../../data/evolution')

# Global instance
_evolution_memory_vault: Optional[EvolutionMemoryVault] = None


def get_evolution_memory_vault(vault_path: Optional[str] = None) -> EvolutionMemoryVault:
    """Get or create the global Evolution Memory Vault instance"""
    global _evolution_memory_vault
    if _evolution_memory_vault is None:
        _evolution_memory_vault = EvolutionMemoryVault(vault_path or EVOLUTION_VAULT_PATH)
    return _evolution_memory_vault


async def initialize_evolution_memory_vault(vault_path: Optional[str] = None) -> EvolutionMemoryVault:
    """Initialize and return the global Evolution Memory Vault instance"""
    vault = get_evolution_memory_vault(vault_path)
    await vault.initialize()
    return vault