"""
Production configuration settings for Bagbot Backend.
All sensitive values are loaded from environment variables.
"""
import os
from typing import List

class ProductionConfig:
    """Production environment configuration."""
    
    # Environment
    ENVIRONMENT: str = "production"
    DEBUG: bool = False
    TESTING: bool = False
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    if not SECRET_KEY:
        raise ValueError("SECRET_KEY environment variable must be set in production")
    
    # CORS
    ALLOWED_ORIGINS: List[str] = os.getenv(
        "ALLOWED_ORIGINS", 
        "https://yourdomain.com"
    ).split(",")
    
    # API Configuration
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    API_WORKERS: int = int(os.getenv("API_WORKERS", "4"))
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT: str = "json"  # Use structured logging in production
    
    # Error Tracking
    SENTRY_DSN: str = os.getenv("SENTRY_DSN", "")
    SENTRY_ENVIRONMENT: str = "production"
    
    # Trading API (Never log these!)
    BINANCE_API_KEY: str = os.getenv("BINANCE_API_KEY", "")
    BINANCE_API_SECRET: str = os.getenv("BINANCE_API_SECRET", "")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "")
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_PER_MINUTE: int = 60
    
    @classmethod
    def validate(cls):
        """Validate that all required settings are present."""
        required = ["SECRET_KEY"]
        missing = [key for key in required if not getattr(cls, key, None)]
        if missing:
            raise ValueError(f"Missing required environment variables: {', '.join(missing)}")
    
    @classmethod
    def mask_secret(cls, value: str, show_chars: int = 4) -> str:
        """Mask sensitive values for logging."""
        if not value or len(value) <= show_chars:
            return "****"
        return f"{value[:show_chars]}{'*' * (len(value) - show_chars)}"
    
    @classmethod
    def get_safe_config(cls) -> dict:
        """Return configuration dict with secrets masked."""
        return {
            "environment": cls.ENVIRONMENT,
            "debug": cls.DEBUG,
            "api_host": cls.API_HOST,
            "api_port": cls.API_PORT,
            "log_level": cls.LOG_LEVEL,
            "sentry_enabled": bool(cls.SENTRY_DSN),
            "binance_api_configured": bool(cls.BINANCE_API_KEY),
            # Never expose actual secrets
            "secret_key": cls.mask_secret(cls.SECRET_KEY) if cls.SECRET_KEY else "NOT_SET",
        }


# Validate on import
ProductionConfig.validate()
