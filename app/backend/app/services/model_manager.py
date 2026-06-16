"""Model management service for background removal models."""

import os
from pathlib import Path
from typing import Optional
from PIL import Image
import numpy as np

# Model cache directory
MODEL_DIR = Path.home() / ".game-asset-processor" / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

# Available models
AVAILABLE_MODELS = {
    "u2net": {
        "id": "u2net",
        "name": "U²-Net",
        "description": "General purpose salient object detection",
        "session_name": "u2net",
    },
    "u2net_human_seg": {
        "id": "u2net_human_seg",
        "name": "U²-Net Human Segmentation",
        "description": "Optimized for human/portrait segmentation",
        "session_name": "u2net_human_seg",
    },
    "isnet-general-use": {
        "id": "isnet-general-use",
        "name": "ISNet General Use",
        "description": "High accuracy general purpose segmentation",
        "session_name": "isnet-general-use",
    },
    "silueta": {
        "id": "silueta",
        "name": "Silueta",
        "description": "Lightweight model with good quality/speed balance",
        "session_name": "silueta",
    },
}

# Cache for loaded sessions
_sessions: dict = {}
_active_model_id: str = "u2net"


def get_active_model_id() -> str:
    """Get the currently active model ID."""
    return _active_model_id


def set_active_model(model_id: str) -> None:
    """Set the active model by ID."""
    global _active_model_id
    if model_id not in AVAILABLE_MODELS:
        raise ValueError(f"Unknown model: {model_id}. Available: {list(AVAILABLE_MODELS.keys())}")
    _active_model_id = model_id


def get_session(model_id: Optional[str] = None):
    """Get or create a rembg session for the specified model.

    Args:
        model_id: Model ID to use. If None, uses the active model.

    Returns:
        rembg session object
    """
    from rembg import new_session

    if model_id is None:
        model_id = _active_model_id

    if model_id not in _sessions:
        session_name = AVAILABLE_MODELS[model_id]["session_name"]
        _sessions[model_id] = new_session(session_name)

    return _sessions[model_id]


def list_models() -> list[dict]:
    """List all available models with their status."""
    active_id = get_active_model_id()
    return [
        {
            "id": model["id"],
            "name": model["name"],
            "description": model["description"],
            "is_active": model["id"] == active_id,
        }
        for model in AVAILABLE_MODELS.values()
    ]


def unload_model(model_id: str) -> None:
    """Unload a model from cache to free memory."""
    if model_id in _sessions:
        del _sessions[model_id]


def unload_all_models() -> None:
    """Unload all models from cache."""
    _sessions.clear()
