"""CLI for drills with specific keyboard layouts."""

import sys
from pathlib import Path
from typing import Optional

import plover
from loguru import logger
from plover import system
from plover.config import Config, DictionaryConfig
from plover.dictionary.base import load_dictionary
from plover.dictionary.json_dict import JsonDictionary
from plover.oslayer.config import CONFIG_DIR, CONFIG_FILE
from plover.registry import registry
from plover.steno import Stroke
from plover.steno_dictionary import StenoDictionary, StenoDictionaryCollection

import drill.layout as layout
from drill.types import Outline, StrokeText, Translation

# TODO: use Suggestion
def select_outline(dict: StenoDictionary, target_translation: str) -> Optional[Outline]:
    """Selects the most reasonable steno outline for producing the translation.

    See: https://plover.readthedocs.io/en/latest/dict_formats.html
    """
    stroke_outlines: list[Outline] = dict.reverse_lookup(target_translation)

    if len(stroke_outlines) == 0:
        return

    outline: Outline = next(iter(stroke_outlines))
    return outline


def run_lookup(dict: StenoDictionaryCollection, target_translation: str):
    outline: Optional[Outline] = select_outline(dict, target_translation)
    if outline is None:
        logger.error("found no steno outline for the input")
        return

    outline_strings: list[list[str]] = map(
        lambda s: layout.show_colored_stroke(Stroke.from_steno(s)), outline
    )

    print(outline)
    concatenated_rows = ["    ".join(rows) for rows in zip(*outline_strings)]
    for row in concatenated_rows:
        print(row)


def run_lesson(config: Config, system_name: str):
    # Load the default system defined in user configuration

    # Setup system
    system.setup(system_name)

    # Load dictionaries
    enabled_dictionaries: list[DictionaryConfig] = [
        dict_config for dict_config in config["dictionaries"] if dict_config.enabled
    ]
    logger.info(f"enabled dictionaries: {enabled_dictionaries}")

    # FIXME: suppress error logs here
    dicts: list[StenoDictionary] = list(
        map(
            lambda d: load_dictionary(d.path),
            enabled_dictionaries,
        )
    )
    dict: StenoDictionaryCollection = StenoDictionaryCollection(dicts)

    # TODO: run
    run_lookup(dict, "beginner")


def main():
    registry.update()

    # Get available system names
    system_plugins = registry.list_plugins("system")
    system_names = [plugin.name for plugin in system_plugins]
    logger.info(f"available systems: {system_names}")

    # Load the configuration
    logger.info(f"config path: {CONFIG_FILE}")
    config = Config(CONFIG_FILE)
    config.load()

    logger.trace(config.as_dict())

    system_name: str = config["system_name"]
    logger.info(f"system name: {system_name}")
    run_lesson(config, system_name)


if __name__ == "__main__":
    main()
