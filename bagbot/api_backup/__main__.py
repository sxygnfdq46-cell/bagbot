#!/usr/bin/env python3
"""
Entry point for running the worker as a module.
Usage: python -m api.run_worker
"""
import sys
import os

# Add the project root to the Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from api.run_worker import create_stop_event, run_loop

if __name__ == "__main__":
    print("Starting worker via module execution...")
    stop_event = create_stop_event()
    
    try:
        run_loop(stop_event)
    except KeyboardInterrupt:
        print("\nShutting down worker...")
        stop_event.set()
    except Exception as e:
        print(f"Worker error: {e}")
        sys.exit(1)