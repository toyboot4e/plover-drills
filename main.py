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
from plover.steno_dictionary import StenoDictionary, StenoDictionaryCollection

import drill.layout as layout
from drill.types import Outline, StrokeText, Translation

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


def run_lookup(dict: StenoDictionaryCollection, target_translation: str):
    outline: Optional[Outline] = select_outline(dict, target_translation)
    if outline is None:
        print("cannot find outline")
        return

    for stroke_str in outline:
        stroke: Stroke = Stroke.from_steno(stroke_str)
        # print(stroke.steno_keys)
        print(layout.show_stroke(stroke))


def run_lesson(system_name: str):
    system.setup("English Stenotype")
    pass


def main():
    registry.update()
    print(f"Plover version: {plover.__version__}")

    # TODO: get available system names
    system_plugins = registry.list_plugins("system")
    system_names = [plugin.name for plugin in system_plugins]
    print(f"available systems: {system_names}")

    # select system
    system_name = system_names[0]

    # setup system
    system.setup(system_name)

    # load dictionaries
    dicts: list[StenoDictionary] = list(
        map(
            lambda d: load_dictionary(str(Path(system.DICTIONARIES_ROOT) / d)),
            system.DEFAULT_DICTIONARIES,
        )
    )
    dict: StenoDictionaryCollection = StenoDictionaryCollection(dicts)

    # run
    run_lookup(dict, sys.argv[1])


if __name__ == "__main__":
    main()
