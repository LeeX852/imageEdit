"""Model management API router."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.model_manager import list_models, set_active_model, get_active_model_id

router = APIRouter()


class ModelInfo(BaseModel):
    """Model information."""
    id: str
    name: str
    description: str
    is_active: bool


@router.get("/")
async def get_models():
    """List available background removal models.

    Returns:
        List of available models with their status
    """
    models = list_models()
    return {
        "models": models,
        "active_model": get_active_model_id(),
    }


@router.post("/{model_id}/activate")
async def activate_model(model_id: str):
    """Activate a specific model.

    Args:
        model_id: ID of the model to activate

    Returns:
        Activation confirmation
    """
    try:
        set_active_model(model_id)
        return {"status": "ok", "active_model": model_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
