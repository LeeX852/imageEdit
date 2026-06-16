"""Tests for image processing service."""

import pytest
from PIL import Image
import io

from app.services.image_processor import image_to_bytes, resize_image


class TestImageToBytes:
    def test_png_output(self):
        img = Image.new("RGBA", (10, 10), (255, 0, 0, 128))
        data = image_to_bytes(img, format="PNG")
        assert data[:4] == b"\x89PNG"

    def test_webp_output(self):
        img = Image.new("RGBA", (10, 10), (0, 255, 0, 255))
        data = image_to_bytes(img, format="WEBP", quality=80)
        assert len(data) > 0

    def test_jpeg_converts_rgba(self):
        img = Image.new("RGBA", (10, 10), (0, 0, 255, 128))
        data = image_to_bytes(img, format="JPEG")
        # JPEG magic bytes
        assert data[:2] == b"\xff\xd8"


class TestResizeImage:
    def test_resize_by_width(self):
        img = Image.new("RGBA", (200, 100), (255, 0, 0, 255))
        result = resize_image(img, width=100)
        assert result.size[0] == 100
        assert result.size[1] == 50

    def test_resize_by_height(self):
        img = Image.new("RGBA", (200, 100), (255, 0, 0, 255))
        result = resize_image(img, height=50)
        assert result.size[0] == 100
        assert result.size[1] == 50

    def test_resize_with_padding(self):
        img = Image.new("RGBA", (200, 100), (255, 0, 0, 255))
        result = resize_image(img, width=100, height=100, maintain_aspect=True)
        assert result.size == (100, 100)

    def test_no_resize(self):
        img = Image.new("RGBA", (200, 100), (255, 0, 0, 255))
        result = resize_image(img)
        assert result.size == (200, 100)
