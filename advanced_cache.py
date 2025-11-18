"""
Advanced Cache Management System
Provides intelligent caching with TTL, compression, and multi-level storage
"""

import sqlite3
import pickle
import gzip
import hashlib
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, Optional, List
import logging

logger = logging.getLogger(__name__)


class AdvancedCache:
    """Advanced caching system with TTL, compression, and persistence"""
    
    def __init__(self, cache_dir: str = "data/cache", config: 'CacheConfig' = None):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        self.config = config or CacheConfig()
        self.db_path = self.cache_dir / "cache_metadata.db"
        self.data_dir = self.cache_dir / "data"
        self.data_dir.mkdir(exist_ok=True)
        
        # Initialize database
        self._init_db()
        
        # Auto-cleanup if enabled
        if self.config.auto_cleanup:
            self.cleanup_expired()
    
    def _init_db(self):
        """Initialize cache metadata database"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS cache_entries (
                    key TEXT PRIMARY KEY,
                    symbol TEXT,
                    source TEXT,
                    period TEXT,
                    interval TEXT,
                    created_at TEXT,
                    expires_at TEXT,
                    file_path TEXT,
                    size_bytes INTEGER,
                    compressed BOOLEAN,
                    checksum TEXT,
                    metadata TEXT
                )
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_symbol_source 
                ON cache_entries (symbol, source)
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_expires_at 
                ON cache_entries (expires_at)
            """)
    
    def _generate_key(self, symbol: str, source: str, period: str, 
                     interval: str, **kwargs) -> str:
        """Generate cache key"""
        key_data = f"{symbol}_{source}_{period}_{interval}"
        if kwargs:
            key_data += f"_{hashlib.md5(str(sorted(kwargs.items())).encode()).hexdigest()[:8]}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def _calculate_checksum(self, data: bytes) -> str:
        """Calculate data checksum"""
        return hashlib.sha256(data).hexdigest()
    
    def _save_data(self, data: pd.DataFrame, file_path: Path) -> Tuple[int, str]:
        """Save data to file with optional compression"""
        # Convert to bytes
        data_bytes = pickle.dumps(data)
        checksum = self._calculate_checksum(data_bytes)
        
        if self.config.compression:
            data_bytes = gzip.compress(data_bytes)
            file_path = file_path.with_suffix('.gz')
        
        with open(file_path, 'wb') as f:
            f.write(data_bytes)
        
        return len(data_bytes), checksum
    
    def _load_data(self, file_path: Path, compressed: bool = False) -> pd.DataFrame:
        """Load data from file with decompression if needed"""
        with open(file_path, 'rb') as f:
            data_bytes = f.read()
        
        if compressed:
            data_bytes = gzip.decompress(data_bytes)
        
        return pickle.loads(data_bytes)
    
    def put(self, data: pd.DataFrame, symbol: str, source: str, 
            period: str, interval: str, **metadata) -> str:
        """Store data in cache"""
        if not self.config.enabled:
            return None
        
        try:
            cache_key = self._generate_key(symbol, source, period, interval, **metadata)
            file_name = f"{cache_key}.pkl"
            file_path = self.data_dir / file_name
            
            # Save data
            size_bytes, checksum = self._save_data(data, file_path)
            
            # Update metadata
            created_at = datetime.now()
            expires_at = created_at + timedelta(hours=self.config.ttl_hours)
            
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    INSERT OR REPLACE INTO cache_entries 
                    (key, symbol, source, period, interval, created_at, expires_at, 
                     file_path, size_bytes, compressed, checksum, metadata)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    cache_key, symbol, source, period, interval,
                    created_at.isoformat(), expires_at.isoformat(),
                    str(file_path), size_bytes, self.config.compression,
                    checksum, json.dumps(metadata)
                ))
            
            logger.debug(f"Cached data for {symbol} ({source}) - Key: {cache_key}")
            return cache_key
            
        except Exception as e:
            logger.error(f"Error caching data: {e}")
            return None
    
    def get(self, symbol: str, source: str, period: str, 
            interval: str, **metadata) -> Optional[pd.DataFrame]:
        """Retrieve data from cache"""
        if not self.config.enabled:
            return None
        
        try:
            cache_key = self._generate_key(symbol, source, period, interval, **metadata)
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("""
                    SELECT file_path, compressed, checksum, expires_at
                    FROM cache_entries 
                    WHERE key = ?
                """, (cache_key,))
                
                result = cursor.fetchone()
                if not result:
                    return None
                
                file_path, compressed, checksum, expires_at = result
                
                # Check if expired
                expires_datetime = datetime.fromisoformat(expires_at)
                if datetime.now() > expires_datetime:
                    logger.debug(f"Cache expired for {cache_key}")
                    self._remove_entry(cache_key)
                    return None
                
                # Check if file exists
                if not Path(file_path).exists():
                    logger.warning(f"Cache file missing: {file_path}")
                    self._remove_entry(cache_key)
                    return None
                
                # Load and validate data
                data = self._load_data(Path(file_path), compressed)
                
                # Verify checksum if not compressed (compression changes checksum)
                if not compressed:
                    data_bytes = pickle.dumps(data)
                    if self._calculate_checksum(data_bytes) != checksum:
                        logger.warning(f"Checksum mismatch for {cache_key}")
                        self._remove_entry(cache_key)
                        return None
                
                logger.debug(f"Cache hit for {symbol} ({source}) - Key: {cache_key}")
                return data
                
        except Exception as e:
            logger.error(f"Error retrieving cached data: {e}")
            return None
    
    def _remove_entry(self, cache_key: str):
        """Remove cache entry and file"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute(
                    "SELECT file_path FROM cache_entries WHERE key = ?", 
                    (cache_key,)
                )
                result = cursor.fetchone()
                
                if result:
                    file_path = Path(result[0])
                    if file_path.exists():
                        file_path.unlink()
                
                conn.execute("DELETE FROM cache_entries WHERE key = ?", (cache_key,))
                
        except Exception as e:
            logger.error(f"Error removing cache entry {cache_key}: {e}")
    
    def cleanup_expired(self) -> int:
        """Clean up expired cache entries"""
        try:
            current_time = datetime.now().isoformat()
            
            with sqlite3.connect(self.db_path) as conn:
                # Get expired entries
                cursor = conn.execute("""
                    SELECT key, file_path FROM cache_entries 
                    WHERE expires_at < ?
                """, (current_time,))
                
                expired_entries = cursor.fetchall()
                
                # Remove files
                for cache_key, file_path in expired_entries:
                    try:
                        Path(file_path).unlink(missing_ok=True)
                    except Exception as e:
                        logger.warning(f"Error removing expired file {file_path}: {e}")
                
                # Remove database entries
                conn.execute("DELETE FROM cache_entries WHERE expires_at < ?", (current_time,))
                
                logger.info(f"Cleaned up {len(expired_entries)} expired cache entries")
                return len(expired_entries)
                
        except Exception as e:
            logger.error(f"Error during cache cleanup: {e}")
            return 0
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                # Total entries
                cursor = conn.execute("SELECT COUNT(*) FROM cache_entries")
                total_entries = cursor.fetchone()[0]
                
                # Total size
                cursor = conn.execute("SELECT SUM(size_bytes) FROM cache_entries")
                total_size = cursor.fetchone()[0] or 0
                
                # Expired entries
                current_time = datetime.now().isoformat()
                cursor = conn.execute(
                    "SELECT COUNT(*) FROM cache_entries WHERE expires_at < ?", 
                    (current_time,)
                )
                expired_entries = cursor.fetchone()[0]
                
                # By source
                cursor = conn.execute("""
                    SELECT source, COUNT(*), SUM(size_bytes) 
                    FROM cache_entries 
                    GROUP BY source
                """)
                by_source = {row[0]: {'count': row[1], 'size': row[2] or 0} 
                           for row in cursor.fetchall()}
                
                return {
                    'total_entries': total_entries,
                    'total_size_mb': total_size / (1024 * 1024),
                    'expired_entries': expired_entries,
                    'hit_ratio': getattr(self, '_hit_ratio', 0.0),
                    'by_source': by_source
                }
                
        except Exception as e:
            logger.error(f"Error getting cache stats: {e}")
            return {}
    
    def clear_cache(self, symbol: str = None, source: str = None) -> int:
        """Clear cache entries"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                if symbol and source:
                    # Clear specific symbol/source
                    cursor = conn.execute("""
                        SELECT key, file_path FROM cache_entries 
                        WHERE symbol = ? AND source = ?
                    """, (symbol, source))
                    query = "DELETE FROM cache_entries WHERE symbol = ? AND source = ?"
                    params = (symbol, source)
                elif symbol:
                    # Clear all entries for symbol
                    cursor = conn.execute("""
                        SELECT key, file_path FROM cache_entries WHERE symbol = ?
                    """, (symbol,))
                    query = "DELETE FROM cache_entries WHERE symbol = ?"
                    params = (symbol,)
                else:
                    # Clear all cache
                    cursor = conn.execute("SELECT key, file_path FROM cache_entries")
                    query = "DELETE FROM cache_entries"
                    params = ()
                
                entries_to_remove = cursor.fetchall()
                
                # Remove files
                for cache_key, file_path in entries_to_remove:
                    try:
                        Path(file_path).unlink(missing_ok=True)
                    except Exception as e:
                        logger.warning(f"Error removing file {file_path}: {e}")
                
                # Remove database entries
                conn.execute(query, params)
                
                logger.info(f"Cleared {len(entries_to_remove)} cache entries")
                return len(entries_to_remove)
                
        except Exception as e:
            logger.error(f"Error clearing cache: {e}")
            return 0


def cache_decorator(cache_instance: AdvancedCache, ttl_hours: int = 1):
    """Decorator for automatic caching of function results"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            cache_key = f"{func.__name__}_{hashlib.md5(str(args).encode() + str(sorted(kwargs.items())).encode()).hexdigest()}"
            
            # Try to get from cache
            cached_result = cache_instance.get(cache_key, "function_cache", "result", str(ttl_hours))
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            if result is not None:
                cache_instance.put(result, cache_key, "function_cache", "result", str(ttl_hours))
            
            return result
        return wrapper
    return decorator