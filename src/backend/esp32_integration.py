"""
ESP32 Integration Module
========================
This module integrates ESP32 API endpoints with the main FastAPI app.
Import this module in main.py to enable ESP32 device communication.

Usage in main.py:
    from esp32_integration import setup_esp32_routes
    setup_esp32_routes(app)

Author: SafeEdge Team
"""

from fastapi import FastAPI
from esp32_api import router as esp32_router


def setup_esp32_routes(app: FastAPI):
    """
    Setup ESP32 API routes on the FastAPI app.
    
    Args:
        app: FastAPI application instance
    """
    app.include_router(esp32_router)
    print("✅ ESP32 API routes initialized")


# Export for direct import
__all__ = ['setup_esp32_routes', 'esp32_router']
