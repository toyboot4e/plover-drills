"""Old main"""

import random
import sys
from enum import Enum
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


def main():
    config, system_name = load_default()
    dict = load_dict(config, system_name)
    print(dict)
    print(dict.reverse_lookup('word'))


main()
