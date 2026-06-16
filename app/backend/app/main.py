"""Game Asset Processor - Python Backend

FastAPI application providing AI-powered background removal and image processing.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routers import background_removal, batch, export, models

app = FastAPI(
    title="Game Asset Processor API",
    description="AI-powered background removal and image processing for game assets",
    version="0.1.0",
)

# CORS configuration - allow Tauri frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:1420",  # Tauri default
        "tauri://localhost",      # Tauri production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(background_removal.router, prefix="/api", tags=["background-removal"])
app.include_router(batch.router, prefix="/api/batch", tags=["batch"])
app.include_router(export.router, prefix="/api/export", tags=["export"])
app.include_router(models.router, prefix="/api/models", tags=["models"])


@app.get("/health")
async def health_check():
    """Health check endpoint for Tauri to verify backend is running."""
    return JSONResponse(content={"status": "healthy", "service": "game-asset-processor"})


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled errors."""
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
    )
