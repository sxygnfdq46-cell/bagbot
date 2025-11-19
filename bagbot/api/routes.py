from fastapi import APIRouter
from api.run_worker import create_stop_event, run_loop
import threading
import logging

router = APIRouter()

# Global worker thread and stop event
worker_thread = None
stop_event = None

@router.get("/api/health")
async def health_check():
    return {"status": "api healthy"}

@router.post("/api/worker/start")
async def start_worker():
    global worker_thread, stop_event
    
    if worker_thread and worker_thread.is_alive():
        return {"status": "worker already running"}
    
    stop_event = create_stop_event()
    worker_thread = threading.Thread(target=run_loop, args=(stop_event,))
    worker_thread.start()
    
    return {"status": "worker started"}

@router.post("/api/worker/stop")
async def stop_worker():
    global worker_thread, stop_event
    
    if not worker_thread or not worker_thread.is_alive():
        return {"status": "worker not running"}
    
    stop_event.set()
    worker_thread.join(timeout=10)
    
    return {"status": "worker stopped"}

@router.get("/api/worker/status")
async def worker_status():
    global worker_thread
    
    if worker_thread and worker_thread.is_alive():
        return {"status": "running", "thread_id": worker_thread.ident}
    else:
        return {"status": "stopped"}