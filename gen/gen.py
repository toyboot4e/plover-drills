"""Old main"""

from collections import defaultdict
from enum import Enum
import json
from pathlib import Path
import random
import sys
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


def load_default() -> tuple[Config, str]:
    registry.update()

    # Get available system names
    system_plugins = registry.list_plugins("system")
    system_names = [plugin.name for plugin in system_plugins]
    logger.info(f"available systems: {system_names}")

    # Config
    logger.info(f"config path: {CONFIG_FILE}")
    config = Config(CONFIG_FILE)
    config.load()

    # System
    system_name: str = config["system_name"]
    logger.info(f"system name: {system_name}")

    return config, system_name


def load_dict(config: Config, system_name: str) -> StenoDictionaryCollection:
    logger.info(f"retrieving dictionary files of system: {system_name}")

    enabled_dictionaries: list[DictionaryConfig] = [
        dict_config for dict_config in config["dictionaries"] if dict_config.enabled
    ]
    logger.info(f"enabled dictionaries: {enabled_dictionaries}")

    # TODO: suppress error logs here
    dicts: list[StenoDictionary] = list(
        map(
            lambda d: load_dictionary(d.path),
            enabled_dictionaries,
        )
    )

    dict: StenoDictionaryCollection = StenoDictionaryCollection(dicts)
    # FIXME: suppress error logs here
    dicts: list[StenoDictionary] = list(
        map(
            lambda d: load_dictionary(d.path),
            enabled_dictionaries,
        )
    )
    return StenoDictionaryCollection(dicts)


# Collect word -> translations of prefixes of outlines
def main():
    config, system_name = load_default()
    system.setup(system_name)
    dict = load_dict(config, system_name)

    root = Path("../drills")
    word_to_outlines = defaultdict(set)
    for path in root.glob("*.txt"):
        logger.info(f'collecting words in {path}')
        with path.open("r", encoding="utf-8") as f:
            for line in f:
                columns = line.rstrip("\n").split("\t")
                if len(columns) >= 2:
                    word = columns[0]
                    word_to_outlines[word] = dict.reverse_lookup(word)

    word_to_strokes = defaultdict(set)
    for word, outlines in word_to_outlines.items():
        strokes = set()
        translations = set()
        for outline in outlines:
            # for stroke in outline:
            #     strokes.add(stroke)
            #     word_to_strokes[word] = list(strokes)
            for i in range(1, len(outline) + 1):  
                prefix = outline[:i]  
                translation = dict.lookup(prefix)  
                translations.add(translation)
        word_to_strokes[word] = list(translations)
    print(json.dumps(word_to_strokes))


main()
