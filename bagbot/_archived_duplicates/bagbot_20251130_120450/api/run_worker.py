import threading
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_stop_event():
    """Factory function to create a new threading Event."""
    return threading.Event()

def run_loop(stop_event):
    """
    Safe run loop that logs ticks every 5 seconds.
    
    Args:
        stop_event (threading.Event): Event to signal when to stop the loop
    """
    logger.info("Worker loop started")
    tick_count = 0
    
    try:
        while not stop_event.is_set():
            tick_count += 1
            logger.info(f"Worker tick #{tick_count}")
            
            # Wait for 5 seconds or until stop event is set
            if stop_event.wait(timeout=5.0):
                break
                
    except Exception as e:
        logger.error(f"Error in worker loop: {e}")
    finally:
        logger.info(f"Worker loop stopped after {tick_count} ticks")