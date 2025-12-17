"""
Simple entry point for Render deployment.
This file allows Render to easily import the FastAPI app.
"""

from backend.main import app

# This allows Render to import with just "main:app"
__all__ = ["app"]