"""CLI for drills with specific keyboard layouts."""

import sys
from pathlib import Path
from typing import Optional

import plover
from plover import system
from plover.config import Config
from plover.dictionary.base import load_dictionary
from plover.dictionary.json_dict import JsonDictionary
from plover.oslayer.config import CONFIG_FILE
from plover.registry import registry
from plover.steno import Stroke
from plover.steno_dictionary import StenoDictionary, StenoDictionaryCollection

import drill.layout as layout
from drill.types import Outline, StrokeText, Translation

# TODO: Use some logger.


# TODO: use Suggestion
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
        return

    outline_strings: list[list[str]] = map(
        lambda s: layout.show_colored_stroke(Stroke.from_steno(s)), outline
    )

    print(outline)
    concatenated_rows = ["    ".join(rows) for rows in zip(*outline_strings)]
    for row in concatenated_rows:
        print(row)


def run_lesson(system_name: str):
    # Load the default system defined in user configuration
    # print(f"system name: {config["system_name"]}")

    # Setup system
    system_name = config["system_name"]
    print(f"system name: {system_name}")
    system.setup(system_name)

    # Load dictionaries
    enabled_dictionaries = [
        dict_config for dict_config in config["dictionaries"] if dict_config.enabled
    ]
    print(f"enabled dictionaries: {enabled_dictionaries}")
    dicts: list[StenoDictionary] = list(
        map(
            lambda d: load_dictionary(str(Path(system.DICTIONARIES_ROOT) / d)),
            system.DEFAULT_DICTIONARIES,
        )
    )
    dict: StenoDictionaryCollection = StenoDictionaryCollection(dicts)

    pass


# FIXME: be ready with plugins installed with `plover_flake`
def not_main():
    # FIXME: It does not detect plugins installed with `plover-flake`
    registry.update()
    print(f"Plover version: {plover.__version__}")
    # print(f"Plugins: {}")

    # TODO: get available system names
    system_plugins = registry.list_plugins("system")
    system_names = [plugin.name for plugin in system_plugins]
    print(f"available systems: {system_names}")

    # Load the configuration
    print(f"config path: {CONFIG_FILE}")
    config = Config(CONFIG_FILE)
    config.load()
    # print(config.as_dict())

    system_name: str = config["system_name"]
    print(f"system name: {system_name}")
    run_lesson(system_name)


def main():
    registry.update()

    # FIXME: plover-flake registry
    system.setup("English Stenotype")
    dict = load_dictionary(str(Path.home() / ".config/plover/main.json"))
    dict = StenoDictionaryCollection([dict])

    # run
    run_lookup(dict, sys.argv[1])


if __name__ == "__main__":
    main()
