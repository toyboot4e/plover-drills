"""CLI for drills with specific keyboard layouts."""

import sys
from pathlib import Path
from typing import Optional

import plover
from plover import system
from plover.dictionary.base import load_dictionary
from plover.dictionary.json_dict import JsonDictionary
from plover.registry import registry
from plover.steno import Stroke
from plover.steno_dictionary import StenoDictionary

from drill.types import Outline, StrokeText, Translation

# TODO: Update only required cmponents?
registry.update()

# TODO: What is the 'system'?
system.setup("English Stenotype")

# TODO: Use some logger.


def select_outline(dict: StenoDictionary, target_translation: str) -> Optional[Outline]:
    """Selects the most reasonable steno outline for producing the translation.

    See: https://plover.readthedocs.io/en/latest/dict_formats.html
    """
    stroke_outlines: list[Outline] = dict.reverse_lookup(target_translation)

    if len(stroke_outlines) == 0:
        print("found no steno outline for the input")
        return

    outline: Outline = next(iter(stroke_outlines))
    return outline


def run_lookup(dict_path: Path, target_translation: str):
    dict: JsonDictionary = load_dictionary(str(dict_path))

    outline: Optional[Outline] = select_outline(dict, target_translation)
    if outline is None:
        print("cannot find outline")
        return

    for stroke_str in outline:
        stroke: Stroke = Stroke.from_steno(stroke_str)
        print(stroke.steno_keys)


def default_dict_path() -> Path:
    return Path.home() / ".config/plover/main.json"


def main():
    print(f"Plover version: {plover.__version__}")
    dict_path: Path = default_dict_path()
    run_lookup(dict_path, sys.argv[1])


if __name__ == "__main__":
    main()
