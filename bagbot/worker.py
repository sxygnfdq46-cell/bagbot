#!/usr/bin/env python3
"""
Simple standalone worker for Render deployment.
"""

import threading
import time
import logging
import sys
import os

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def run_worker():
    """Standalone worker loop that logs ticks every 5 seconds."""
    logger.info("Worker loop started")
    tick_count = 0
    
    try:
        while True:
            tick_count += 1
            logger.info(f"Worker tick #{tick_count}")
            time.sleep(5.0)
    except KeyboardInterrupt:
        logger.info("Worker stopped by keyboard interrupt")
    except Exception as e:
        logger.error(f"Worker error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("Starting bagbot worker...")
    run_worker()