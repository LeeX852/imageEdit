"""Tests for the naming template engine."""

import pytest
from app.services.naming import apply_naming_template, validate_template


class TestApplyNamingTemplate:
    def test_original_only(self):
        assert apply_naming_template("{original}", "character.png") == "character"

    def test_original_with_suffix(self):
        assert apply_naming_template("{original}_nobg", "character.png") == "character_nobg"

    def test_plain_sequence(self):
        assert apply_naming_template("sprite_{seq}", "anything.png", 1) == "sprite_1"

    def test_zero_padded_sequence(self):
        assert apply_naming_template("sprite_{seq:03d}", "anything.png", 1) == "sprite_001"
        assert apply_naming_template("sprite_{seq:03d}", "anything.png", 42) == "sprite_042"

    def test_four_digit_sequence(self):
        assert apply_naming_template("frame_{seq:04d}", "img.png", 7) == "frame_0007"

    def test_extension_variable(self):
        assert apply_naming_template("{original}{ext}", "photo.jpg") == "photo.jpg"

    def test_no_extension(self):
        assert apply_naming_template("{original}_out", "noext") == "noext_out"

    def test_multiple_variables(self):
        assert apply_naming_template("{original}_{seq:02d}{ext}", "a.png", 3) == "a_03.png"


class TestValidateTemplate:
    def test_valid_template(self):
        ok, err = validate_template("{original}_nobg")
        assert ok is True
        assert err == ""

    def test_empty_template(self):
        ok, err = validate_template("")
        assert ok is False
        assert "empty" in err.lower()

    def test_unknown_variable(self):
        ok, err = validate_template("{unknown}")
        assert ok is False
        assert "unknown" in err.lower()

    def test_mismatched_braces(self):
        ok, err = validate_template("{original")
        assert ok is False
        assert "braces" in err.lower()

    def test_valid_with_seq(self):
        ok, err = validate_template("sprite_{seq:03d}")
        assert ok is True
