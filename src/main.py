from pathlib import Path

import plover

from plover.dictionary.base import load_dictionary


def demo_lookup(dict_path: Path):
    print(f"loading dictionary at `{dict_path}`")
    dictionary = load_dictionary(str(dict_path))
    print(dictionary)


def main():
    print(f"Plover version: {plover.__version__}")
    dict_path = Path.home() / ".config/plover/main.json"
    demo_lookup(dict_path)


if __name__ == "__main__":
    main()
