"""Configuration module for Bagbot Backend."""
import os

def get_config():
    """Get configuration based on environment."""
    env = os.getenv("ENVIRONMENT", "development")
    
    if env == "production":
        from .production import ProductionConfig
        return ProductionConfig
    else:
        # Development config (can create later)
        from .production import ProductionConfig
        return ProductionConfig  # Use production config as base for now


Config = get_config()
