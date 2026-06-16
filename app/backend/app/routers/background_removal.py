"""Background removal API router."""

from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import Response
from urllib.parse import quote
from PIL import Image
import io
import uuid

from app.services.image_processor import remove_background, remove_background_raw, image_to_bytes
from app.services.model_manager import get_active_model_id

router = APIRouter()


@router.post("/remove-background")
async def remove_background_endpoint(
    file: UploadFile = File(...),
    model: str = Form(default=None),
    threshold: int = Form(default=128),
    smoothing: int = Form(default=0),
):
    """Remove background from an uploaded image.

    Args:
        file: Image file to process
        model: Model to use (None for active model)
        threshold: Edge threshold (0-255)
        smoothing: Edge smoothing radius (0-10)

    Returns:
        Processed PNG image with transparent background
    """
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        # Read uploaded image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        image = image.convert("RGB")

        # Use active model if not specified
        model_id = model if model else get_active_model_id()

        # Process image
        if threshold == 128 and smoothing == 0:
            # Use raw removal for default settings (faster)
            result = remove_background_raw(image, model_id)
        else:
            result = remove_background(image, model_id, threshold, smoothing)

        # Convert to PNG bytes
        png_bytes = image_to_bytes(result, format="PNG")

        # Use RFC 5987 encoding for non-ASCII filenames
        safe_name = f"processed_{uuid.uuid4().hex[:8]}.png"
        ascii_name = file.filename.encode('ascii', 'ignore').decode() if file.filename else "image.png"
        if not ascii_name:
            ascii_name = "image.png"

        return Response(
            content=png_bytes,
            media_type="image/png",
            headers={
                "Content-Disposition": f'inline; filename="{safe_name}"; filename*=UTF-8\'\'{quote(f"processed_{file.filename}.png")}',
            },
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
