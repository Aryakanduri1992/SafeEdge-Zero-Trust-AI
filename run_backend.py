#!/usr/bin/env python3
"""
SafeEdge Backend Launcher
Runs the FastAPI backend server with proper module imports
"""

import sys
import os

# Add the project root to Python path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

if __name__ == "__main__":
    import uvicorn
    from src.backend.config import settings
    
    print("=" * 60)
    print("🚀 SafeEdge Backend Starting...")
    print("🏥 Hospital IoT Security Platform")
    print("🏆 Imagine Cup 2026 - World Championship")
    print("=" * 60)
    print(f"📍 Host: {settings.api_host}")
    print(f"🔌 Port: {settings.api_port}")
    print(f"📚 API Docs: http://{settings.api_host}:{settings.api_port}/docs")
    print("=" * 60)
    
    uvicorn.run(
        "src.backend.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.api_reload
    )
