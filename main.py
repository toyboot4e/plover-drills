"""CLI for drills with specific keyboard layouts."""

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
from textual.app import App, ComposeResult
from textual.containers import Vertical
from textual.screen import Screen
from textual.widgets import Input, Static
from typing_extensions import Self

import drill.layout as layout
from drill.types import Outline, StrokeText, Translation


def select_outline(dict: StenoDictionary, target_translation: str) -> Optional[Outline]:
    """Selects the most reasonable steno outline for producing the translation.

    See: https://plover.readthedocs.io/en/latest/dict_formats.html

    TODO: use Suggestion
    """
    stroke_outlines: list[Outline] = dict.reverse_lookup(target_translation)

    if len(stroke_outlines) == 0:
        return

    outline: Outline = next(iter(stroke_outlines))
    return outline


def show_colored_stroke(s: StrokeText) -> list[str]:
    stroke: Stroke = Stroke.from_steno(s)
    return layout.show_colored_stroke(stroke)


def show_colored_outline(outline: Outline) -> str:
    outline_strings: list[list[str]] = map(show_colored_stroke, outline)
    return ["    ".join(rows) for rows in zip(*outline_strings)]


def print_colored_outline(outline: Outline) -> str:
    for row in show_colored_outline(outline):
        print(row)


def run_lookup(dict: StenoDictionaryCollection, target_translation: str):
    outline: Optional[Outline] = select_outline(dict, target_translation)
    if outline is None:
        logger.error("found no steno outline for the input")
        return

    print(outline)
    print_colored_outline(outline)


class Runner:
    def __init__(self, config: Config, system_name: str, dict: StenoDictionaryCollection):
        self.config = config
        self.system_name = system_name
        self.dict = dict

    @classmethod
    def from_config(cls, config: Config, system_name: str) -> Self:
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
        # FIXME: suppress error logs here
        dicts: list[StenoDictionary] = list(
            map(
                lambda d: load_dictionary(d.path),
                enabled_dictionaries,
            )
        )
        dict: StenoDictionaryCollection = StenoDictionaryCollection(dicts)
        return Runner(config, system_name, dict)


class Lesson:
    def __init__(self, data: list[tuple[str, tuple[str, ...]]]):
        """self.data is [expected, [stroke1, stroke2, ..]]"""
        self.data = data

    @classmethod
    def load_typey_type(cls, path: Path):
        def is_comment(line: str) -> bool:
            return line.strip() == ""

        data: list[tuple[str, str]] = []
        # TODO: handle exception
        with path.open(mode="r") as f:
            for line in f:
                if not is_comment(line):
                    word, outline = line.split("\t")
                    strokes = tuple(outline.strip().split("/"))
                    data.append([word.strip(), strokes])
        return Lesson(data)


def show_lesson(runner: Runner, lesson: Lesson):
    for word, outline in lesson.data:
        print(word)
        print_colored_outline(outline)
        print("")


def load_default_runner() -> Runner:
    registry.update()

    # Get available system names
    system_plugins = registry.list_plugins("system")
    system_names = [plugin.name for plugin in system_plugins]
    logger.info(f"available systems: {system_names}")

    # Config
    logger.info(f"config path: {CONFIG_FILE}")
    config = Config(CONFIG_FILE)
    config.load()
    logger.trace(config.as_dict())

    # System
    system_name: str = config["system_name"]
    logger.info(f"system name: {system_name}")

    runner = Runner.from_config(config, system_name)
    return runner


def load_default_lesson() -> Lesson:
    # TODO: TUI for selecting lesson file
    path = Path("./lessons/practice/5-EU.txt")
    logger.trace(f"lesson path: {path}")
    lesson = Lesson.load_typey_type(path)
    return lesson


class LessonMatch(Enum):
    Complete = 1
    Wip = 2
    Wrong = 3


def match_lesson_input(expected: str, user: str) -> LessonMatch:
    if expected == user:
        return LessonMatch.Complete
    elif expected.startswith(user):
        return LessonMatch.Wip
    else:
        return LessonMatch.Wrong


class LessonScreen(Screen):
    CSS = """
    #input_prompt {
        margin-bottom: 1;
    }
    """

    def __init__(self, lesson: Lesson, **kwargs):
        super().__init__(**kwargs)
        self.lesson = lesson
        self.current = 0
        self.show_hint = False

    def goto_next_lesson_data(self):
        self.show_hint = False
        self.current += 1
        self.query_one("#input_prompt", Input).value = ""
        # TODO: DRY. define a reactive widget?
        n = len(self.lesson.data)
        data = self.current_lesson_data()
        if data != None:
            word, outline = data
            self.query_one("#target_word", Static).update(f"Type this: {word}")
            self.query_one("#numbering", Static).update(f"{self.current + 1} / {n}")
        else:
            self.query_one("#target_word", Static).update("Finished!")

    def current_lesson_data(self) -> Optional[tuple[str, str]]:
        """Returns [word, outline]"""
        if self.current < len(self.lesson.data):
            return self.lesson.data[self.current]
        else:
            return Nothing

    async def on_key(self, event):
        if event.key == "escape" or event.key == "ctrl+c":
            self.app.pop_screen()

    def compose(self) -> ComposeResult:
        n = len(self.lesson.data)
        data = self.current_lesson_data()
        if data != None:
            word, _outline = data
            yield Vertical(
                # TODO: show i/n
                Static("Quit with escape or Ctrl+c"),
                Static(""),
                Static(f"{self.current + 1} / {n}", id="numbering"),
                Static(""),
                Static(f"Type this: {word}", id="target_word"),
                Static(""),
                Input(placeholder="Type here...", id="input_prompt"),
                # Allow ANSI color code with `markup=False`
                Static("", id="reaction_0", markup=False),
                Static("", id="reaction_1", markup=False),
                Static("", id="reaction_2", markup=False),
                Static("", id="reaction_3", markup=False),
                Static("", id="reaction_4", markup=False),
            )
        else:
            yield Vertical(
                Static("Quit with escape or Ctrl+c"),
                Static(""),
                Static(f"1 / {n}", id="numbering"),
                Static(""),
                Static(f"Finished!"),
            )

    async def on_input_changed(self, event: Input.Changed) -> None:
        """Triggered on text content change"""
        data = self.current_lesson_data()
        if data == None:
            return

        # FIXME: The first word starts with whitespace, so strip
        user = event.value.strip()
        expected, outline = data

        m = match_lesson_input(expected, user)
        if m == LessonMatch.Complete:
            self.goto_next_lesson_data()
            return
        elif m == LessonMatch.Wip:
            pass
        elif m == LessonMatch.Wrong:
            self.show_hint = True

        rows = ["", "", "", "", ""]
        if self.show_hint:
            outline_rows = show_colored_outline(outline)
            for i, row in enumerate(outline_rows):
                # offset
                rows[i] = "  " + row

        for i, row in enumerate(rows):
            self.query_one(f"#reaction_{i}", Static).update(row)

    # async def on_input_submitted(self, event: Input.Submitted) -> None:


class ConfigScreen(Screen):
    def __init__(self):
        super().__init__()

    async def on_key(self, event):
        if event.key == "escape" or event.key == "ctrl+c":
            self.app.exit()
        if event.key == "enter":
            lesson = load_default_lesson()
            self.app.push_screen(LessonScreen(lesson))

    def compose(self) -> ComposeResult:
        yield Vertical(
            Static("Quit with escape or Ctrl+c"),
            Static(""),
            Static(f"Press enter to start lesson"),
        )

    async def on_input_changed(self, event: Input.Changed) -> None:
        pass


class App(App):
    def __init__(self, **kwargs):
        super().__init__()
        self.runner = load_default_runner()

    def on_mount(self):
        self.push_screen(ConfigScreen())


if __name__ == "__main__":
    App().run()
