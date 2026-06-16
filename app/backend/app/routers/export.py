"""Image export API router."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class ExportRequest(BaseModel):
    """Export request parameters."""
    image_data: str  # Base64 encoded image
    format: str = "png"  # png, webp, tga
    quality: int = 95  # For webp
    width: Optional[int] = None
    height: Optional[int] = None
    naming_template: str = "{original}"
    original_filename: str = ""
    sequence_number: int = 1


@router.post("/")
async def export_image(request: ExportRequest):
    """Export a processed image with specified format and settings.

    Returns:
        Exported image file
    """
    # TODO: Implement image export
    raise HTTPException(status_code=501, detail="Not implemented yet")
