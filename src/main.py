from pathlib import Path

import plover
from plover import system

from plover.dictionary.base import load_dictionary
from plover.dictionary.json_dict import JsonDictionary
from plover.registry import registry

registry.update()

# TODO: setup other system?
system.setup("English Stenotype")


def demo_lookup(dict_path: Path):
    print(f"loading dictionary at `{dict_path}`")
    dict: JsonDictionary = load_dictionary(str(dict_path))
    print(dict)
    print(dict.reverse_lookup("cat"))
    # => {('KAT',)}


def main():
    print(f"Plover version: {plover.__version__}")
    dict_path = Path.home() / ".config/plover/main.json"
    demo_lookup(dict_path)


if __name__ == "__main__":
    main()
