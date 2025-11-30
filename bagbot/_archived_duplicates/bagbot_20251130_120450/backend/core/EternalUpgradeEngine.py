"""
Eternal Upgrade Engine - Dynamic Module Loading System
Step 24.53 - Advanced Trading Intelligence System

This engine supports dynamic module loading and unloading at runtime,
automatic detection of intelligence modules, validation, and registry management.
Compatible with future extension of Levels 25-100+ without refactoring.
"""

import os
import sys
import importlib
import importlib.util
import logging
from typing import Dict, List, Optional, Any, Callable, Protocol
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
import inspect
from abc import ABC, abstractmethod
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import asyncio
import traceback

logger = logging.getLogger(__name__)


@dataclass
class UpgradeResult:
    """Result from module execution or operation"""
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
    errors: List[str] = field(default_factory=list)


@dataclass 
class ValidationResult:
    """Result from module validation"""
    valid: bool
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)


class UpgradeModule(Protocol):
    """Protocol defining the interface for upgrade modules"""
    
    @property
    def id(self) -> str:
        """Unique module identifier"""
        ...
    
    @property
    def name(self) -> str:
        """Human-readable module name"""
        ...
    
    @property
    def version(self) -> str:
        """Module version string"""
        ...
    
    @property
    def description(self) -> str:
        """Module description"""
        ...
    
    async def execute(self, context: Optional[Dict[str, Any]] = None) -> UpgradeResult:
        """Execute the module's upgrade logic"""
        ...
    
    async def validate(self) -> ValidationResult:
        """Validate module's internal state and dependencies"""
        ...
    
    @property
    def dependencies(self) -> List[str]:
        """List of required dependency module IDs"""
        ...
    
    @property
    def level(self) -> Optional[int]:
        """Module level (for Levels 1-100+ support)"""
        ...
    
    @property
    def category(self) -> Optional[str]:
        """Module category classification"""
        ...


@dataclass
class UpgradeModuleMetadata:
    """Metadata tracking for registered modules"""
    id: str
    name: str
    version: str
    file_path: str
    loaded_at: datetime
    last_executed: Optional[datetime] = None
    execution_count: int = 0
    is_active: bool = True
    category: Optional[str] = None
    level: Optional[int] = None


class UpgradeRegistry:
    """Registry for managing loaded upgrade modules"""
    
    def __init__(self):
        self.modules: Dict[str, UpgradeModuleMetadata] = {}
        self.loaded_modules: Dict[str, UpgradeModule] = {}
    
    def register(self, module: UpgradeModule, file_path: str) -> None:
        """Register a new module"""
        metadata = UpgradeModuleMetadata(
            id=module.id,
            name=module.name,
            version=module.version,
            file_path=file_path,
            loaded_at=datetime.now(),
            category=module.category,
            level=module.level
        )
        
        self.modules[module.id] = metadata
        self.loaded_modules[module.id] = module
    
    def unregister(self, module_id: str) -> bool:
        """Unregister a module"""
        removed = module_id in self.modules
        self.modules.pop(module_id, None)
        self.loaded_modules.pop(module_id, None)
        return removed
    
    def get(self, module_id: str) -> Optional[UpgradeModule]:
        """Get a loaded module by ID"""
        return self.loaded_modules.get(module_id)
    
    def get_metadata(self, module_id: str) -> Optional[UpgradeModuleMetadata]:
        """Get module metadata by ID"""
        return self.modules.get(module_id)
    
    def list_all(self) -> List[UpgradeModuleMetadata]:
        """List all registered modules"""
        return list(self.modules.values())
    
    def list_active(self) -> List[UpgradeModuleMetadata]:
        """List only active modules"""
        return [m for m in self.modules.values() if m.is_active]
    
    def update_execution_stats(self, module_id: str) -> None:
        """Update execution statistics for a module"""
        if module_id in self.modules:
            metadata = self.modules[module_id]
            metadata.last_executed = datetime.now()
            metadata.execution_count += 1
    
    def deactivate(self, module_id: str) -> None:
        """Deactivate a module"""
        if module_id in self.modules:
            self.modules[module_id].is_active = False


class ModuleFileHandler(FileSystemEventHandler):
    """File system event handler for module auto-loading"""
    
    def __init__(self, upgrade_engine: 'EternalUpgradeEngine'):
        self.upgrade_engine = upgrade_engine
    
    def on_modified(self, event):
        if not event.is_directory and self._is_module_file(event.src_path):
            logger.info(f"Module file modified: {event.src_path}")
            asyncio.create_task(self._reload_module(event.src_path))
    
    def on_created(self, event):
        if not event.is_directory and self._is_module_file(event.src_path):
            logger.info(f"New module file created: {event.src_path}")
            asyncio.create_task(self.upgrade_engine.register_upgrade_module(event.src_path))
    
    def on_deleted(self, event):
        if not event.is_directory and self._is_module_file(event.src_path):
            logger.info(f"Module file deleted: {event.src_path}")
            self._remove_module_by_path(event.src_path)
    
    def _is_module_file(self, file_path: str) -> bool:
        """Check if file is a valid module file"""
        path = Path(file_path)
        return (
            path.suffix == '.py' and
            not path.name.startswith('.') and
            not path.name.startswith('__') and
            'test' not in path.name.lower() and
            'spec' not in path.name.lower()
        )
    
    async def _reload_module(self, file_path: str):
        """Reload an existing module"""
        # Find existing module by file path
        for metadata in self.upgrade_engine.registry.list_all():
            if metadata.file_path == file_path:
                self.upgrade_engine.remove_upgrade_module(metadata.id)
                await self.upgrade_engine.register_upgrade_module(file_path)
                break
    
    def _remove_module_by_path(self, file_path: str):
        """Remove module by file path"""
        for metadata in self.upgrade_engine.registry.list_all():
            if metadata.file_path == file_path:
                self.upgrade_engine.remove_upgrade_module(metadata.id)
                break


class EternalUpgradeEngine:
    """
    The Eternal Upgrade Engine - A self-expanding modular engine where BAGBOT 
    can install new abilities without refactoring the core structure.
    
    Features:
    - Dynamic module loading and unloading at runtime
    - Automatic detection of newly added intelligence modules
    - Module structure validation and interface compliance checking
    - Global UpgradeRegistry for module management
    - Protection against invalid or broken modules
    - Support for future extension of Levels 25-100+
    - Compatible with the upcoming Adaptive Brain Grid
    """
    
    def __init__(self, modules_path: Optional[str] = None):
        self.registry = UpgradeRegistry()
        self.modules_path = modules_path or os.path.join(os.path.dirname(__file__), '../modules')
        self.watching_enabled = False
        self.file_observer: Optional[Observer] = None
        self._ensure_modules_directory()
    
    async def initialize(self) -> None:
        """Initialize the upgrade engine"""
        logger.info("Initializing Eternal Upgrade Engine...")
        
        try:
            await self._scan_and_load_modules()
            self._start_module_watcher()
            logger.info("Eternal Upgrade Engine initialized successfully")
        except Exception as error:
            logger.error(f"Failed to initialize Eternal Upgrade Engine: {error}")
            raise error
    
    async def register_upgrade_module(self, module_path: str) -> UpgradeResult:
        """Register a new upgrade module"""
        logger.info(f"Registering upgrade module: {module_path}")
        
        try:
            module = await self._load_module_from_file(module_path)
            validation = await self.validate_module(module)
            
            if not validation.valid:
                return UpgradeResult(
                    success=False,
                    message="Module validation failed",
                    errors=validation.errors
                )
            
            # Check for conflicts
            if self.registry.get(module.id):
                return UpgradeResult(
                    success=False,
                    message=f"Module with ID '{module.id}' already exists",
                    errors=["Duplicate module ID"]
                )
            
            self.registry.register(module, module_path)
            logger.info(f"Successfully registered module: {module.name} ({module.id})")
            
            return UpgradeResult(
                success=True,
                message=f"Module {module.name} registered successfully",
                data={"module_id": module.id}
            )
        
        except Exception as error:
            logger.error(f"Failed to register module from {module_path}: {error}")
            return UpgradeResult(
                success=False,
                message="Failed to load module",
                errors=[str(error)]
            )
    
    def remove_upgrade_module(self, module_id: str) -> UpgradeResult:
        """Remove an upgrade module"""
        logger.info(f"Removing upgrade module: {module_id}")
        
        metadata = self.registry.get_metadata(module_id)
        if not metadata:
            return UpgradeResult(
                success=False,
                message=f"Module '{module_id}' not found",
                errors=["Module not registered"]
            )
        
        removed = self.registry.unregister(module_id)
        if removed:
            logger.info(f"Successfully removed module: {module_id}")
            return UpgradeResult(
                success=True,
                message=f"Module {module_id} removed successfully"
            )
        
        return UpgradeResult(
            success=False,
            message="Failed to remove module",
            errors=["Internal registry error"]
        )
    
    def list_upgrade_modules(self, active_only: bool = False) -> List[UpgradeModuleMetadata]:
        """List all registered upgrade modules"""
        return self.registry.list_active() if active_only else self.registry.list_all()
    
    async def execute_upgrade(self, module_id: str, context: Optional[Dict[str, Any]] = None) -> UpgradeResult:
        """Execute an upgrade module"""
        logger.info(f"Executing upgrade module: {module_id}")
        
        module = self.registry.get(module_id)
        if not module:
            return UpgradeResult(
                success=False,
                message=f"Module '{module_id}' not found",
                errors=["Module not registered"]
            )
        
        metadata = self.registry.get_metadata(module_id)
        if not metadata or not metadata.is_active:
            return UpgradeResult(
                success=False,
                message=f"Module '{module_id}' is deactivated",
                errors=["Module is not active"]
            )
        
        try:
            # Validate module before execution
            validation = await self.validate_module(module)
            if not validation.valid:
                self.registry.deactivate(module_id)
                return UpgradeResult(
                    success=False,
                    message="Module validation failed before execution",
                    errors=validation.errors
                )
            
            # Execute the module
            start_time = datetime.now()
            result = await module.execute(context)
            duration = (datetime.now() - start_time).total_seconds() * 1000
            
            # Update execution statistics
            self.registry.update_execution_stats(module_id)
            
            logger.info(f"Module {module_id} executed in {duration:.1f}ms with result: {'SUCCESS' if result.success else 'FAILURE'}")
            
            return result
        
        except Exception as error:
            logger.error(f"Error executing module {module_id}: {error}")
            logger.error(traceback.format_exc())
            self.registry.deactivate(module_id)
            
            return UpgradeResult(
                success=False,
                message="Module execution failed",
                errors=[str(error)]
            )
    
    async def validate_module(self, module: UpgradeModule) -> ValidationResult:
        """Validate a module structure and interface compliance"""
        errors: List[str] = []
        warnings: List[str] = []
        
        # Required fields validation
        if not hasattr(module, 'id') or not isinstance(module.id, str) or not module.id:
            errors.append("Module must have a valid string ID")
        
        if not hasattr(module, 'name') or not isinstance(module.name, str) or not module.name:
            errors.append("Module must have a valid string name")
        
        if not hasattr(module, 'version') or not isinstance(module.version, str) or not module.version:
            errors.append("Module must have a valid string version")
        
        if not hasattr(module, 'execute') or not callable(getattr(module, 'execute')):
            errors.append("Module must have an execute method")
        
        # Check execute method signature
        if hasattr(module, 'execute'):
            sig = inspect.signature(module.execute)
            if len(sig.parameters) > 2:  # self + context parameter
                errors.append("Module execute method should take at most one parameter (context)")
        
        # Optional fields validation
        if hasattr(module, 'validate') and not callable(getattr(module, 'validate')):
            errors.append("Module validate property must be a callable if provided")
        
        if hasattr(module, 'dependencies') and not isinstance(module.dependencies, list):
            errors.append("Module dependencies must be a list if provided")
        
        if hasattr(module, 'level') and module.level is not None and not isinstance(module.level, int):
            errors.append("Module level must be an integer if provided")
        
        # Safety checks
        if hasattr(module, 'id') and isinstance(module.id, str):
            if '..' in module.id or '/' in module.id or '\\' in module.id:
                errors.append("Module ID contains unsafe characters")
        
        # Check for module's own validation
        if hasattr(module, 'validate') and callable(module.validate):
            try:
                module_validation = await module.validate()
                if not module_validation.valid:
                    errors.extend(module_validation.errors)
                    if module_validation.warnings:
                        warnings.extend(module_validation.warnings)
            except Exception as error:
                errors.append(f"Module self-validation failed: {error}")
        
        # Future compatibility checks
        if hasattr(module, 'level') and module.level and module.level > 100:
            warnings.append("Module level is beyond current supported range (>100)")
        
        return ValidationResult(
            valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )
    
    async def _scan_and_load_modules(self) -> None:
        """Scan modules directory and auto-load modules"""
        if not os.path.exists(self.modules_path):
            logger.warning(f"Modules directory does not exist: {self.modules_path}")
            return
        
        module_files = [
            f for f in os.listdir(self.modules_path)
            if f.endswith('.py') and 
            not f.startswith('.') and 
            not f.startswith('__') and
            'test' not in f.lower() and
            'spec' not in f.lower()
        ]
        
        logger.info(f"Found {len(module_files)} potential module files")
        
        for file in module_files:
            file_path = os.path.join(self.modules_path, file)
            try:
                await self.register_upgrade_module(file_path)
            except Exception as error:
                logger.warning(f"Failed to auto-load module {file}: {error}")
    
    async def _load_module_from_file(self, file_path: str) -> UpgradeModule:
        """Load a module from file"""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Module file not found: {file_path}")
        
        # Generate a module name from the file path
        module_name = Path(file_path).stem
        
        # Load the module
        spec = importlib.util.spec_from_file_location(module_name, file_path)
        if not spec or not spec.loader:
            raise ImportError(f"Cannot create module spec for {file_path}")
        
        module = importlib.util.module_from_spec(spec)
        
        # Clear from sys.modules if it exists to ensure fresh load
        if module_name in sys.modules:
            del sys.modules[module_name]
        
        spec.loader.exec_module(module)
        
        # Look for the upgrade module instance
        upgrade_module = None
        for attr_name in dir(module):
            attr = getattr(module, attr_name)
            if hasattr(attr, 'id') and hasattr(attr, 'execute') and callable(getattr(attr, 'execute')):
                upgrade_module = attr
                break
        
        if not upgrade_module:
            raise ImportError("Module must export an object with 'id' and 'execute' attributes")
        
        return upgrade_module
    
    def _start_module_watcher(self) -> None:
        """Start watching the modules directory for changes"""
        if self.watching_enabled or not os.path.exists(self.modules_path):
            return
        
        try:
            self.file_observer = Observer()
            event_handler = ModuleFileHandler(self)
            self.file_observer.schedule(event_handler, self.modules_path, recursive=False)
            self.file_observer.start()
            
            self.watching_enabled = True
            logger.info("Started watching modules directory for changes")
        
        except Exception as error:
            logger.error(f"Failed to start module watcher: {error}")
    
    def _ensure_modules_directory(self) -> None:
        """Ensure modules directory exists"""
        if not os.path.exists(self.modules_path):
            os.makedirs(self.modules_path, exist_ok=True)
            logger.info(f"Created modules directory: {self.modules_path}")
    
    async def shutdown(self) -> None:
        """Stop the upgrade engine and cleanup resources"""
        logger.info("Shutting down Eternal Upgrade Engine...")
        
        if self.file_observer:
            self.file_observer.stop()
            self.file_observer.join()
            self.watching_enabled = False
        
        logger.info("Eternal Upgrade Engine shutdown complete")
    
    def get_engine_status(self) -> Dict[str, Any]:
        """Get engine status and statistics"""
        all_modules = self.registry.list_all()
        active_modules = self.registry.list_active()
        total_executions = sum(m.execution_count for m in all_modules)
        
        return {
            "total_modules": len(all_modules),
            "active_modules": len(active_modules),
            "inactive_modules": len(all_modules) - len(active_modules),
            "total_executions": total_executions,
            "watching_enabled": self.watching_enabled,
            "modules_path": self.modules_path
        }


# Global instance
_eternal_upgrade_engine: Optional[EternalUpgradeEngine] = None


def get_eternal_upgrade_engine(modules_path: Optional[str] = None) -> EternalUpgradeEngine:
    """Get or create the global Eternal Upgrade Engine instance"""
    global _eternal_upgrade_engine
    if _eternal_upgrade_engine is None:
        _eternal_upgrade_engine = EternalUpgradeEngine(modules_path)
    return _eternal_upgrade_engine


async def initialize_eternal_upgrade_engine(modules_path: Optional[str] = None) -> EternalUpgradeEngine:
    """Initialize and return the global Eternal Upgrade Engine instance"""
    engine = get_eternal_upgrade_engine(modules_path)
    await engine.initialize()
    return engine