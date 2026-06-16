"""Image processing service for background removal and edge optimization."""

import io
from typing import Optional
from PIL import Image, ImageFilter
import numpy as np
from rembg import remove

from app.services.model_manager import get_session, get_active_model_id


def remove_background(
    image: Image.Image,
    model_id: Optional[str] = None,
    threshold: int = 128,
    smoothing: int = 0,
) -> Image.Image:
    """Remove background from an image using AI segmentation.

    Args:
        image: Input PIL Image
        model_id: Model to use (None for active model)
        threshold: Edge threshold (0-255) for mask binarization
        smoothing: Edge smoothing radius (0-10) for Gaussian blur

    Returns:
        PIL Image with transparent background (RGBA)
    """
    session = get_session(model_id)

    # Run rembg to get the mask
    result = remove(
        image,
        session=session,
        only_mask=True,
    )

    # Apply threshold to the mask
    if threshold != 128:
        mask_array = np.array(result)
        mask_array = np.where(mask_array > threshold, 255, 0).astype(np.uint8)
        result = Image.fromarray(mask_array, mode="L")

    # Apply smoothing
    if smoothing > 0:
        result = result.filter(ImageFilter.GaussianBlur(radius=smoothing))

    # Apply mask to original image
    image_rgba = image.convert("RGBA")
    image_rgba.putalpha(result)

    return image_rgba


def remove_background_raw(
    image: Image.Image,
    model_id: Optional[str] = None,
) -> Image.Image:
    """Remove background without post-processing (raw rembg output).

    Args:
        image: Input PIL Image
        model_id: Model to use (None for active model)

    Returns:
        PIL Image with transparent background (RGBA)
    """
    session = get_session(model_id)

    result = remove(
        image,
        session=session,
    )

    return result.convert("RGBA")


def image_to_bytes(image: Image.Image, format: str = "PNG", quality: int = 95) -> bytes:
    """Convert PIL Image to bytes.

    Args:
        image: PIL Image to convert
        format: Output format (PNG, WEBP, JPEG)
        quality: Quality for lossy formats (1-100)

    Returns:
        Image bytes
    """
    buffer = io.BytesIO()

    if format.upper() == "PNG":
        image.save(buffer, format="PNG", optimize=True)
    elif format.upper() == "WEBP":
        image.save(buffer, format="WEBP", quality=quality)
    elif format.upper() in ("JPEG", "JPG"):
        # JPEG doesn't support alpha, convert to RGB
        if image.mode == "RGBA":
            bg = Image.new("RGB", image.size, (255, 255, 255))
            bg.paste(image, mask=image.split()[3])
            image = bg
        image.save(buffer, format="JPEG", quality=quality)
    else:
        image.save(buffer, format=format)

    buffer.seek(0)
    return buffer.getvalue()


def resize_image(
    image: Image.Image,
    width: Optional[int] = None,
    height: Optional[int] = None,
    maintain_aspect: bool = True,
) -> Image.Image:
    """Resize image to specified dimensions.

    Args:
        image: PIL Image to resize
        width: Target width (None to auto-calculate from height)
        height: Target height (None to auto-calculate from width)
        maintain_aspect: Whether to maintain aspect ratio with transparent padding

    Returns:
        Resized PIL Image
    """
    if width is None and height is None:
        return image

    orig_w, orig_h = image.size

    if maintain_aspect:
        # Calculate scale factor
        if width and height:
            scale = min(width / orig_w, height / orig_h)
        elif width:
            scale = width / orig_w
        else:
            scale = height / orig_h

        new_w = int(orig_w * scale)
        new_h = int(orig_h * scale)

        # Resize the image
        resized = image.resize((new_w, new_h), Image.Resampling.LANCZOS)

        # Create canvas with target size and paste centered
        if width and height:
            canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
            offset_x = (width - new_w) // 2
            offset_y = (height - new_h) // 2
            canvas.paste(resized, (offset_x, offset_y))
            return canvas

        return resized
    else:
        target_w = width or orig_w
        target_h = height or orig_h
        return image.resize((target_w, target_h), Image.Resampling.LANCZOS)
