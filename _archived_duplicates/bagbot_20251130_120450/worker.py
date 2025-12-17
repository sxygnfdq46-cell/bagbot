#!/usr/bin/env python3
"""
STANDALONE BAGBOT WORKER - NO DEPENDENCIES
"""

import time
import logging

# Configure logging  
logging.basicConfig(level=logging.INFO, format='%(asctime)s - BAGBOT WORKER - %(message)s')
logger = logging.getLogger(__name__)

print("🚀 BAGBOT WORKER STARTING...")
logger.info("Bagbot worker initialized successfully")

if __name__ == "__main__":
    tick = 0
    try:
        while True:
            tick += 1
            logger.info(f"🤖 Bagbot worker tick #{tick} - All systems running")
            time.sleep(10)  # 10 second intervals
    except KeyboardInterrupt:
        logger.info("🛑 Bagbot worker stopped")
    except Exception as e:
        logger.error(f"❌ Bagbot worker error: {e}")
        exit(1)