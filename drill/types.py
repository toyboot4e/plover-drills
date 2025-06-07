"""Steno data model types."""

# Text created from steno outline.
type Translation = str

type StrokeText = str

# A series of strokes performed in succession.
# https://plover.readthedocs.io/en/latest/api/steno.html#steno-notation
type Outline = tuple[StrokeText, ...]
