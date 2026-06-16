"""Tests for export API router."""

import pytest


class TestExportNamingIntegration:
    """Integration tests for export with naming templates."""

    def test_naming_template_in_export(self):
        """Verify naming template produces correct filenames."""
        from app.services.naming import apply_naming_template

        # Simulate export naming
        template = "{original}_nobg"
        result = apply_naming_template(template, "character.png")
        assert result == "character_nobg"

    def test_sequential_naming(self):
        """Verify sequential naming works for batch export."""
        from app.services.naming import apply_naming_template

        template = "sprite_{seq:03d}"
        names = [apply_naming_template(template, f"img{i}.png", i + 1) for i in range(5)]
        assert names == ["sprite_001", "sprite_002", "sprite_003", "sprite_004", "sprite_005"]
