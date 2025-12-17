from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import os
import logging
import time
from api.routes import router as api_router
from api.backtest_routes import router as backtest_router
from api.optimizer_routes import router as optimizer_router
from api.artifacts_routes import router as artifacts_router
from api.strategy_routes import router as strategy_router
from api.logs_routes import router as logs_router
from api.payment_routes import router as payment_router
from api.order_routes import router as order_router
from api.tradingview_routes import router as tradingview_router
from api.admin_routes import router as admin_router
from api.strategy_arsenal_routes import router as strategy_arsenal_router
from api.risk_engine_routes import router as risk_engine_router
from api.systems_routes import router as systems_router
from backend.queue_bridge import submit_job
from worker.tasks import JobType
from backend.models import init_db
from backend.core.EternalUpgradeEngine import initialize_eternal_upgrade_engine, get_eternal_upgrade_engine
from backend.core.AutonomousEvolutionLayer import initialize_autonomous_evolution_layer, get_autonomous_evolution_layer
from backend.core.EvolutionMemoryVault import initialize_evolution_memory_vault, get_evolution_memory_vault, EvolutionRecord, EvolutionEventType
from backend.ai.RegimeTransitionIntelligenceOrb import initialize_regime_orb, get_regime_transition_orb, get_regime_transition_orb, RegimeState

# 🛡️ SAFE MODE PROTECTION - Import safe mode manager
from backend.safe_mode import get_safe_mode_manager, get_safe_mode_status

# Load configuration
try:
    from backend.config import Config
    config = Config
except ImportError:
    # Fallback if config not available
    class Config:
        ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
        DEBUG = os.getenv("DEBUG", "false").lower() == "true"

# Configure logging (never log secrets)
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize database
init_db()
logger.info("Database initialized")

# Initialize Eternal Upgrade Engine
eternal_upgrade_engine = None

# Initialize Autonomous Evolution Layer
autonomous_evolution_layer = None

# Initialize Evolution Memory Vault
evolution_memory_vault = None

# Initialize Regime Transition Intelligence Orb
regime_transition_orb = None

# Disable debug mode in production
app = FastAPI(
    title="Bagbot Backend",
    description="Institutional-grade trading bot backend API",
    version="2.0.0",
    docs_url="/docs" if config.DEBUG else None,  # Disable docs in production
    redoc_url="/redoc" if config.DEBUG else None,
    debug=config.DEBUG
)

# Configure CORS with environment-based origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 🛡️ SAFE MODE MIDDLEWARE - Block trading operations when safe mode is active
@app.middleware("http")
async def safe_mode_middleware(request: Request, call_next):
    """
    Middleware to intercept and block trading operations when safe mode is active
    """
    safe_mode_manager = get_safe_mode_manager()
    
    # Check if this is a trading-related endpoint
    trading_endpoints = [
        "/api/orders",
        "/api/order",
        "/api/tradingview/webhook",
        "/api/trade",
        "/api/execute",
        "/api/position"
    ]
    
    path = request.url.path.lower()
    
    # Block POST/PUT/DELETE operations on trading endpoints when safe mode is active
    if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
        for endpoint in trading_endpoints:
            if endpoint in path:
                if safe_mode_manager.is_safe_mode_active():
                    logger.warning(
                        f"🛡️ SAFE MODE BLOCKED: {request.method} {path}"
                    )
                    return JSONResponse(
                        status_code=403,
                        content={
                            "error": "Safe Mode Active",
                            "message": "All trading operations are currently blocked",
                            "safe_mode_status": safe_mode_manager.get_status(),
                            "endpoint": path,
                            "method": request.method
                        }
                    )
    
    response = await call_next(request)
    return response


# Mount all routers
app.include_router(api_router)
app.include_router(backtest_router)
app.include_router(optimizer_router)
app.include_router(artifacts_router)
app.include_router(strategy_router)
app.include_router(logs_router)
app.include_router(payment_router)
app.include_router(order_router)
app.include_router(tradingview_router)
app.include_router(admin_router)
app.include_router(strategy_arsenal_router)
app.include_router(risk_engine_router)
app.include_router(systems_router)


# 🛡️ SAFE MODE API ENDPOINTS
@app.get("/api/safe-mode/status")
async def get_safe_mode_status_endpoint():
    """Get current safe mode status"""
    return get_safe_mode_status()


@app.post("/api/safe-mode/activate")
async def activate_safe_mode_endpoint(
    level: str = "simulation",
    reason: str = "Manual activation via API",
    activated_by: str = "api_user"
):
    """Activate safe mode"""
    safe_mode_manager = get_safe_mode_manager()
    
    from backend.safe_mode import SafeModeLevel
    try:
        safe_mode_level = SafeModeLevel(level)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid safe mode level: {level}. Valid levels: simulation, read_only, full_lockdown"
        )
    
    safe_mode_manager.activate_safe_mode(
        level=safe_mode_level,
        reason=reason,
        activated_by=activated_by
    )
    
    return {
        "success": True,
        "message": "Safe mode activated",
        "status": safe_mode_manager.get_status()
    }


@app.post("/api/safe-mode/deactivate")
async def deactivate_safe_mode_endpoint(deactivated_by: str = "api_user"):
    """
    Deactivate safe mode (DANGEROUS - requires ALLOW_REAL_TRADING=CONFIRMED_ENABLED)
    """
    safe_mode_manager = get_safe_mode_manager()
    
    try:
        safe_mode_manager.deactivate_safe_mode(deactivated_by=deactivated_by)
        return {
            "success": True,
            "message": "⚠️ Safe mode deactivated - REAL TRADING ACTIVE",
            "status": safe_mode_manager.get_status()
        }
    except RuntimeError as e:
        raise HTTPException(
            status_code=403,
            detail=str(e)
        )


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global eternal_upgrade_engine, autonomous_evolution_layer, evolution_memory_vault, regime_transition_orb
    try:
        # Initialize Evolution Memory Vault FIRST
        evolution_memory_vault = await initialize_evolution_memory_vault()
        logger.info("Evolution Memory Vault initialized successfully")
        
        # Initialize Regime Transition Intelligence Orb
        regime_transition_orb = await initialize_regime_orb()
        logger.info("Regime Transition Intelligence Orb initialized successfully")
        
        # Initialize Eternal Upgrade Engine
        modules_path = os.path.join(os.path.dirname(__file__), "modules")
        eternal_upgrade_engine = await initialize_eternal_upgrade_engine(modules_path)
        logger.info("Eternal Upgrade Engine initialized successfully")
        
        # Initialize Autonomous Evolution Layer AFTER all other components
        autonomous_evolution_layer = await initialize_autonomous_evolution_layer()
        logger.info("Autonomous Evolution Layer initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize backend services: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    global eternal_upgrade_engine, autonomous_evolution_layer, evolution_memory_vault, regime_transition_orb
    
    # Shutdown in reverse order
    
    # Shutdown Autonomous Evolution Layer first
    if autonomous_evolution_layer:
        try:
            await autonomous_evolution_layer.shutdown()
            logger.info("Autonomous Evolution Layer shutdown complete")
        except Exception as e:
            logger.error(f"Error during Autonomous Evolution Layer shutdown: {e}")
    
    # Shutdown Eternal Upgrade Engine
    if eternal_upgrade_engine:
        try:
            await eternal_upgrade_engine.shutdown()
            logger.info("Eternal Upgrade Engine shutdown complete")
        except Exception as e:
            logger.error(f"Error during Eternal Upgrade Engine shutdown: {e}")
    
    # Shutdown Regime Transition Intelligence Orb
    if regime_transition_orb:
        try:
            await regime_transition_orb.shutdown()
            logger.info("Regime Transition Intelligence Orb shutdown complete")
        except Exception as e:
            logger.error(f"Error during Regime Transition Intelligence Orb shutdown: {e}")
    
    # Shutdown Evolution Memory Vault last
    if evolution_memory_vault:
        try:
            await evolution_memory_vault.shutdown()
            logger.info("Evolution Memory Vault shutdown complete")
        except Exception as e:
            logger.error(f"Error during Evolution Memory Vault shutdown: {e}")


class JobSubmission(BaseModel):
    job_type: str
    payload: dict


@app.get("/", tags=["health"])
async def root():
    return {"status": "ok", "service": "bagbot backend"}


@app.get("/api/health", tags=["health"])
async def health_check():
    """Health check endpoint for monitoring and load balancers."""
    return {
        "ok": True,
        "status": "healthy",
        "service": "bagbot-backend",
        "version": "2.0.0"
    }


@app.post("/jobs")
async def submit_job_endpoint(job: JobSubmission):
    """Submit a job to the worker queue."""
    # Validate job_type exists in JobType
    try:
        JobType[job.job_type]
    except KeyError:
        raise HTTPException(status_code=400, detail=f"Invalid job_type: {job.job_type}")
    
    # Validate payload is a dict
    if not isinstance(job.payload, dict):
        raise HTTPException(status_code=400, detail="payload must be a dictionary")
    
    # Submit job
    job_id = submit_job(job.job_type, job.payload)
    
    return {"status": "queued", "job_id": job_id}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ETERNAL UPGRADE ENGINE ENDPOINTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.get("/upgrade/status")
async def get_upgrade_engine_status():
    """Get Eternal Upgrade Engine status and statistics"""
    try:
        engine = get_eternal_upgrade_engine()
        status = engine.get_engine_status()
        return status
    except Exception as e:
        logger.error(f"Error getting upgrade engine status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get upgrade engine status")


@app.get("/upgrade/modules")
async def list_upgrade_modules(active_only: bool = False):
    """List all registered upgrade modules"""
    try:
        engine = get_eternal_upgrade_engine()
        modules = engine.list_upgrade_modules(active_only=active_only)
        return {
            "modules": [
                {
                    "id": m.id,
                    "name": m.name,
                    "version": m.version,
                    "category": m.category,
                    "level": m.level,
                    "loaded_at": m.loaded_at.isoformat(),
                    "last_executed": m.last_executed.isoformat() if m.last_executed else None,
                    "execution_count": m.execution_count,
                    "is_active": m.is_active
                } for m in modules
            ]
        }
    except Exception as e:
        logger.error(f"Error listing upgrade modules: {e}")
        raise HTTPException(status_code=500, detail="Failed to list upgrade modules")


@app.post("/upgrade/execute/{module_id}")
async def execute_upgrade_module(module_id: str, context: dict = None):
    """Execute a specific upgrade module"""
    try:
        engine = get_eternal_upgrade_engine()
        result = await engine.execute_upgrade(module_id, context)
        return {
            "success": result.success,
            "message": result.message,
            "data": result.data,
            "errors": result.errors
        }
    except Exception as e:
        logger.error(f"Error executing upgrade module {module_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to execute module: {str(e)}")


@app.delete("/upgrade/modules/{module_id}")
async def remove_upgrade_module(module_id: str):
    """Remove a registered upgrade module"""
    try:
        engine = get_eternal_upgrade_engine()
        result = engine.remove_upgrade_module(module_id)
        return {
            "success": result.success,
            "message": result.message,
            "errors": result.errors
        }
    except Exception as e:
        logger.error(f"Error removing upgrade module {module_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to remove module: {str(e)}")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# AUTONOMOUS EVOLUTION LAYER ENDPOINTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.get("/evolution/status")
async def get_evolution_layer_status():
    """Get Autonomous Evolution Layer status and statistics"""
    try:
        layer = get_autonomous_evolution_layer()
        status = layer.get_status()
        return status
    except Exception as e:
        logger.error(f"Error getting evolution layer status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get evolution layer status")


@app.get("/evolution/scores")
async def get_evolution_scores():
    """Get evolution scores for all modules"""
    try:
        layer = get_autonomous_evolution_layer()
        scores = {}
        for module_id, score in layer.evolution_scores.items():
            scores[module_id] = {
                "score": score.score,
                "confidence": score.confidence,
                "triggers": [t.value for t in score.triggers],
                "recommendation": score.recommendation,
                "urgency": score.urgency,
                "last_computed": score.last_computed.isoformat()
            }
        return {"evolution_scores": scores}
    except Exception as e:
        logger.error(f"Error getting evolution scores: {e}")
        raise HTTPException(status_code=500, detail="Failed to get evolution scores")


@app.get("/evolution/metrics/{module_id}")
async def get_module_metrics(module_id: str):
    """Get performance metrics for a specific module"""
    try:
        layer = get_autonomous_evolution_layer()
        metrics = layer.fetch_module_metrics(module_id)
        if not metrics:
            raise HTTPException(status_code=404, detail=f"Module {module_id} not found")
        
        return {
            "module_id": metrics.module_id,
            "accuracy": metrics.accuracy,
            "precision": metrics.precision,
            "recall": metrics.recall,
            "latency": metrics.latency,
            "error_rate": metrics.error_rate,
            "confidence": metrics.confidence,
            "last_updated": metrics.last_updated.isoformat(),
            "execution_count": metrics.execution_count,
            "success_rate": metrics.success_rate
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting module metrics for {module_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get module metrics: {str(e)}")


@app.post("/evolution/evaluate")
async def evaluate_upgrade_readiness():
    """Evaluate which modules are ready for upgrades"""
    try:
        layer = get_autonomous_evolution_layer()
        decisions = await layer.evaluate_upgrade_readiness()
        return {
            "decisions": [
                {
                    "action": d.action,
                    "module_id": d.module_id,
                    "trigger": d.trigger.value,
                    "confidence": d.confidence,
                    "reasoning": d.reasoning,
                    "timestamp": d.timestamp.isoformat(),
                    "executed": d.executed
                } for d in decisions
            ]
        }
    except Exception as e:
        logger.error(f"Error evaluating upgrade readiness: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to evaluate upgrade readiness: {str(e)}")


@app.post("/evolution/auto-evolve/{module_id}")
async def trigger_auto_evolution(module_id: str, trigger_type: str = "performance_degradation"):
    """Manually trigger auto-evolution for a specific module"""
    try:
        layer = get_autonomous_evolution_layer()
        
        # Parse trigger type
        from backend.core.AutonomousEvolutionLayer import EvolutionTrigger
        try:
            trigger = EvolutionTrigger(trigger_type)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid trigger type: {trigger_type}")
        
        result = await layer.auto_evolve(module_id, trigger)
        return {
            "success": result.success,
            "message": result.message,
            "data": result.data,
            "errors": result.errors
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error triggering auto-evolution for {module_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to trigger auto-evolution: {str(e)}")


@app.get("/evolution/decisions")
async def get_evolution_decisions(limit: int = 50):
    """Get recent evolution decisions"""
    try:
        layer = get_autonomous_evolution_layer()
        recent_decisions = layer.evolution_decisions[-limit:] if layer.evolution_decisions else []
        return {
            "decisions": [
                {
                    "action": d.action,
                    "module_id": d.module_id,
                    "trigger": d.trigger.value,
                    "confidence": d.confidence,
                    "reasoning": d.reasoning,
                    "timestamp": d.timestamp.isoformat(),
                    "executed": d.executed,
                    "result": {
                        "success": d.result.success,
                        "message": d.result.message
                    } if d.result else None
                } for d in recent_decisions
            ]
        }
    except Exception as e:
        logger.error(f"Error getting evolution decisions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get evolution decisions: {str(e)}")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# REGIME TRANSITION INTELLIGENCE ORB ENDPOINTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.post("/regime/analyze", tags=["Regime Intelligence"])
async def analyze_current_regime():
    """Analyze current market regime"""
    try:
        regime_orb = get_regime_transition_orb()
        result = await regime_orb.analyze_regime()
        return {
            "success": True,
            "regime_analysis": result
        }
    except Exception as e:
        logger.error(f"Error analyzing current regime: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/regime/current", tags=["Regime Intelligence"])
async def get_current_regime():
    """Get current regime classification"""
    try:
        regime_orb = get_regime_transition_orb()
        current_regime = await regime_orb.get_current_regime()
        return {
            "success": True,
            "current_regime": current_regime
        }
    except Exception as e:
        logger.error(f"Error getting current regime: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/regime/history", tags=["Regime Intelligence"])
async def get_regime_history(days: int = 30):
    """Get regime transition history"""
    try:
        regime_orb = get_regime_transition_orb()
        history = await regime_orb.get_regime_history(days=days)
        return {
            "success": True,
            "regime_history": history
        }
    except Exception as e:
        logger.error(f"Error getting regime history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/regime/alerts", tags=["Regime Intelligence"])
async def get_regime_alerts():
    """Get regime transition alerts"""
    try:
        regime_orb = get_regime_transition_orb()
        alerts = await regime_orb.generate_regime_alerts()
        return {
            "success": True,
            "alerts": alerts
        }
    except Exception as e:
        logger.error(f"Error generating regime alerts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/regime/statistics", tags=["Regime Intelligence"])
async def get_regime_statistics():
    """Get regime analysis statistics"""
    try:
        regime_orb = get_regime_transition_orb()
        stats = await regime_orb.get_statistics()
        return {
            "success": True,
            "statistics": stats
        }
    except Exception as e:
        logger.error(f"Error getting regime statistics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/regime/detect-shift", tags=["Regime Intelligence"])
async def detect_regime_shift():
    """Detect if a regime shift is occurring"""
    try:
        regime_orb = get_regime_transition_orb()
        shift_analysis = await regime_orb.detect_regime_shift()
        return {
            "success": True,
            "shift_analysis": shift_analysis
        }
    except Exception as e:
        logger.error(f"Error detecting regime shift: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# EVOLUTION MEMORY VAULT ENDPOINTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.get("/vault/status")
async def get_vault_status():
    """Get Evolution Memory Vault status and statistics"""
    try:
        vault = get_evolution_memory_vault()
        status = await vault.get_vault_statistics()
        return status
    except Exception as e:
        logger.error(f"Error getting vault status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get vault status")


@app.post("/vault/record")
async def save_evolution_record(record_data: dict):
    """Save an evolution record to the vault"""
    try:
        vault = get_evolution_memory_vault()
        
        # Create EvolutionRecord from request data
        record = EvolutionRecord(
            timestamp=record_data.get("timestamp", time.time()),
            module=record_data["module"],
            event_type=EvolutionEventType(record_data["event_type"]),
            previous_state=record_data.get("previous_state", {}),
            new_state=record_data.get("new_state", {}),
            reason=record_data["reason"],
            metrics=record_data.get("metrics", {}),
            success=record_data.get("success", True),
            error_message=record_data.get("error_message"),
            correlation_id=record_data.get("correlation_id")
        )
        
        success = await vault.save_evolution_record(record)
        return {
            "success": success,
            "message": "Evolution record saved successfully" if success else "Failed to save evolution record",
            "vault_id": record.vault_id if success else None
        }
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing required field: {e}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid value: {e}")
    except Exception as e:
        logger.error(f"Error saving evolution record: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save evolution record: {str(e)}")


@app.get("/vault/recent")
async def get_recent_evolution_records(count: int = 100):
    """Get recent evolution records from the vault"""
    try:
        vault = get_evolution_memory_vault()
        records = await vault.load_recent_evolution(count)
        return {
            "records": [
                {
                    "vault_id": r.vault_id,
                    "timestamp": r.timestamp,
                    "module": r.module,
                    "event_type": r.event_type.value,
                    "previous_state": r.previous_state,
                    "new_state": r.new_state,
                    "reason": r.reason,
                    "metrics": r.metrics,
                    "success": r.success,
                    "error_message": r.error_message,
                    "correlation_id": r.correlation_id
                } for r in records
            ],
            "total_count": len(records)
        }
    except Exception as e:
        logger.error(f"Error getting recent evolution records: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get recent records: {str(e)}")


@app.get("/vault/history/{module_name}")
async def get_module_evolution_history(module_name: str, limit: int = 500):
    """Get evolution history for a specific module"""
    try:
        vault = get_evolution_memory_vault()
        records = await vault.get_evolution_history_for(module_name, limit)
        return {
            "module": module_name,
            "records": [
                {
                    "vault_id": r.vault_id,
                    "timestamp": r.timestamp,
                    "event_type": r.event_type.value,
                    "previous_state": r.previous_state,
                    "new_state": r.new_state,
                    "reason": r.reason,
                    "metrics": r.metrics,
                    "success": r.success,
                    "correlation_id": r.correlation_id
                } for r in records
            ],
            "total_count": len(records)
        }
    except Exception as e:
        logger.error(f"Error getting module evolution history for {module_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get module history: {str(e)}")


@app.get("/vault/patterns")
async def get_evolution_patterns():
    """Get summarized evolution patterns from the vault"""
    try:
        vault = get_evolution_memory_vault()
        patterns = await vault.summarize_patterns()
        return patterns
    except Exception as e:
        logger.error(f"Error getting evolution patterns: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get evolution patterns: {str(e)}")


@app.get("/vault/snapshot")
async def get_vault_snapshot():
    """Export a complete snapshot of the vault"""
    try:
        vault = get_evolution_memory_vault()
        snapshot = await vault.export_vault_snapshot()
        return {
            "timestamp": snapshot.timestamp.isoformat(),
            "total_records": snapshot.total_records,
            "modules_tracked": snapshot.modules_tracked,
            "patterns_identified": snapshot.patterns_identified,
            "vault_size_bytes": snapshot.vault_size_bytes,
            "recent_activity": snapshot.recent_activity,
            "summary_stats": snapshot.summary_stats
        }
    except Exception as e:
        logger.error(f"Error getting vault snapshot: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get vault snapshot: {str(e)}")


@app.post("/vault/backup")
async def create_vault_backup():
    """Create a backup of the Evolution Memory Vault"""
    try:
        vault = get_evolution_memory_vault()
        success = await vault.create_backup()
        return {
            "success": success,
            "message": "Vault backup created successfully" if success else "Failed to create vault backup"
        }
    except Exception as e:
        logger.error(f"Error creating vault backup: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create backup: {str(e)}")