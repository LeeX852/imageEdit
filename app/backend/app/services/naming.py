"""Naming template engine for export file naming."""

import re
from typing import Optional


def apply_naming_template(
    template: str,
    original_filename: str,
    sequence_number: int = 1,
) -> str:
    """Apply a naming template to generate output filename.

    Supported variables:
        {original} - Original filename without extension
        {ext} - Original file extension
        {seq} - Sequence number (plain)
        {seq:03d} - Sequence number with zero-padding
        {seq:04d} - Sequence number with 4-digit zero-padding

    Args:
        template: Naming template string
        original_filename: Original file name
        sequence_number: Sequence number for this file

    Returns:
        Generated filename

    Examples:
        >>> apply_naming_template("{original}", "character.png")
        'character'
        >>> apply_naming_template("{original}_nobg", "character.png")
        'character_nobg'
        >>> apply_naming_template("sprite_{seq:03d}", "anything.png", 1)
        'sprite_001'
    """
    # Split filename and extension
    if "." in original_filename:
        name, ext = original_filename.rsplit(".", 1)
        ext = f".{ext}"
    else:
        name = original_filename
        ext = ""

    # Apply replacements
    result = template

    # {original} - filename without extension
    result = result.replace("{original}", name)

    # {ext} - file extension (with dot)
    result = result.replace("{ext}", ext)

    # {seq:Nd} - sequence number with formatting
    seq_pattern = re.compile(r"\{seq:(\d+)d\}")
    match = seq_pattern.search(result)
    if match:
        width = int(match.group(1))
        formatted_seq = str(sequence_number).zfill(width)
        result = seq_pattern.sub(formatted_seq, result)

    # {seq} - plain sequence number
    result = result.replace("{seq}", str(sequence_number))

    return result


def validate_template(template: str) -> tuple[bool, str]:
    """Validate a naming template.

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not template:
        return False, "Template cannot be empty"

    # Check for valid variables
    valid_vars = {"original", "ext", "seq"}
    # Find all {variable} patterns
    variables = re.findall(r"\{([^}:]+)(?::\d+d)?\}", template)

    for var in variables:
        if var not in valid_vars:
            return False, f"Unknown variable: {{{var}}}. Valid: {', '.join(f'{{{v}}}' for v in valid_vars)}"

    # Check for unclosed braces
    open_count = template.count("{")
    close_count = template.count("}")
    if open_count != close_count:
        return False, "Mismatched braces in template"

    return True, ""
