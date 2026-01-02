"""CLI for drills with specific keyboard layouts."""

import random
import sys
from enum import Enum
from pathlib import Path
from typing import Optional

import drill.layout as layout
import plover
from loguru import logger
from natsort import natsorted
from plover import system
from plover.config import Config, DictionaryConfig
from plover.dictionary.base import load_dictionary
from plover.dictionary.json_dict import JsonDictionary
from plover.oslayer.config import CONFIG_DIR, CONFIG_FILE
from plover.registry import registry
from plover.steno import Stroke
from plover.steno_dictionary import StenoDictionary, StenoDictionaryCollection
from rich.panel import Panel
from textual import events
from textual.app import App, ComposeResult
from textual.binding import Binding
from textual.command import CommandList, CommandPalette, SimpleProvider
from textual.containers import Center, Horizontal, HorizontalGroup, Vertical
from textual.reactive import reactive
from textual.screen import Screen
from textual.widgets import Footer, Header, Input, Label, ListItem, ListView, ProgressBar, Static
from typing_extensions import Self

from drill.types import Outline, StrokeText, Translation
from drill.widgets import MyCommandPalette, MyListView


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
    data: list[tuple[str, tuple[str, ...]]]

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


def load_lesson_file(path: Path) -> Lesson:
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


class StrokeHint(Static):
    """Widget for displaying stroke hints."""

    rows: reactive[list[str]] = reactive(["" for i in range(5)], recompose=True)

    def __init__(self):
        super().__init__()

    def compose(self) -> ComposeResult:
        for row in self.rows:
            yield Static(row, markup=False)

    def clear(self):
        self.rows = ["" for i in range(len(self.rows))]

    def update(self, rows: list[list[str]]):
        self.rows = rows


class LessonScreen(Screen):
    current_index: reactive[int] = reactive(0)
    lesson: Lesson
    shuffle: bool
    lesson_data_indices: list[int]
    show_hint: bool
    stroke_hint: StrokeHint

    CSS = """
    #input_prompt {
        margin-bottom: 1;
    }
    .shrink {
        height: auto;
    }
    #progress_bar {
        width: 40;
        height: 1;
    }
    """

    BINDINGS = [
        ("escape", "app.pop_screen", "pop screen"),
        Binding("ctrl+c", "app.pop_screen", "pop screen", priority=True),
    ]

    def __init__(self, lesson: Lesson, shuffle: bool):
        super().__init__()
        self.lesson = lesson

        self.shuffle = shuffle
        self.lesson_data_indices = list(range(len(self.lesson.data)))
        if self.shuffle:
            random.shuffle(self.lesson_data_indices)

        self.show_hint = False
        self.stroke_hint = StrokeHint()

    def goto_next_lesson_data(self):
        self.show_hint = False
        self.current_index += 1
        self.query_one("#progress_bar", ProgressBar).advance(1)
        self.stroke_hint.clear()
        self.query_one("#input_prompt", Input).value = ""

    def current_target(self) -> Optional[tuple[str, str]]:
        """Returns [word, outline]"""
        if self.current_index < len(self.lesson.data):
            # it may be shuffled
            i = self.lesson_data_indices[self.current_index]
            return self.lesson.data[i]
        else:
            return None

    async def on_key(self, event):
        if event.key == "escape" or event.key == "ctrl+c":
            self.app.pop_screen()

    # TODO: show reverse flag as title
    def compose(self) -> ComposeResult:
        n = len(self.lesson.data)
        target = self.current_target()
        if target is not None:
            word, _outline = target
            yield Vertical(
                Header(),
                Static(f"{self.current_index + 1} / {n}", id="numbering"),
                ProgressBar(total=len(self.lesson.data), id="progress_bar", show_eta=False),
                Static(f"Type this: {word}", id="word"),
                Static(""),
                Input(placeholder="Type here...", id="input_prompt"),
                # Allow ANSI color code with `markup=False`
                self.stroke_hint,
                Footer(),
            )
        else:
            yield Vertical(
                Header(),
                Static(f"{n} / {n}", id="numbering"),
                ProgressBar(total=len(self.lesson.data), id="progress_bar", show_eta=False),
                Static(""),
                Static(f"Finished!"),
                Footer(),
            )

    def watch_current_index(self, i: int) -> None:
        if self.is_mounted:
            # FIXME: DRY on construction and watch (maybe use data_bind?)
            n = len(self.lesson.data)
            if i < n:
                word, _outline = self.current_target()
                self.query_one("#numbering", Static).update(f"{self.current_index + 1} / {n}")
                self.query_one("#word", Static).update(f"Type this: {word}")
            else:
                # Switch to the finish branch of `compose`
                self.refresh(recompose=True)

    async def on_input_changed(self, event: Input.Changed) -> None:
        """Triggered on text content change"""
        target = self.current_target()
        if target is None:
            return

        expected, outline = target

        # The first word often starts with whitespace, so strip
        user = event.value.strip()

        m = match_lesson_input(expected, user)
        if m == LessonMatch.Complete:
            self.goto_next_lesson_data()
            return
        elif m == LessonMatch.Wip:
            pass
        elif m == LessonMatch.Wrong:
            self.show_hint = True

        if self.show_hint:
            rows = ["" for i in range(5)]
            outline_rows = show_colored_outline(outline)
            for i, row in enumerate(outline_rows):
                # with offset
                rows[i] = "  " + row
            self.stroke_hint.update(rows)

    # async def on_input_submitted(self, event: Input.Submitted) -> None:


def collect_lesson_files() -> list[Path]:
    return natsorted([p for p in Path("lessons/practice").iterdir() if p.is_file()])


# TODO: I want to write it in a reactive way
class ConfigScreen(Screen):
    list: MyListView
    lesson_file: Optional[Path]
    shuffle: bool

    BINDINGS = [
        ("ctrl+c", "app.quit", "Quit"),
    ]

    def __init__(self):
        super().__init__()

        items = [
            ListItem(
                HorizontalGroup(Label("Steno system    "), Static("<default>", id="steno-system"))
            ),
            ListItem(HorizontalGroup(Label("Lesson file     "), Static("-", id="lesson-file"))),
            ListItem(HorizontalGroup(Label("Shuffle lesson  "), Static("No", id="shuffle-lesson"))),
            ListItem(Label("Start lesson")),
        ]

        self.list = MyListView(*items, initial_index=1)
        self.lesson_file = None
        self.shuffle = False

    async def on_list_view_selected(self, event: ListView.Selected):
        if self.list.index == 0:
            # Steno system
            self.notify(f"Steno system cannot be changed.")

        elif self.list.index == 1:
            # Lesson
            commands = [
                (item, lambda item=item: self.select_lesson(item))
                for item in map(lambda p: str(p), collect_lesson_files())
            ]

            # Set initial index
            initial_index = 0
            if self.lesson_file != None:
                # FIXME: not list
                for i, path in enumerate(collect_lesson_files()):
                    if path == self.lesson_file:
                        initial_index = i
                        break

            palette = MyCommandPalette(
                initial_index,
                providers=[SimpleProvider(self.app.screen, commands)],
                placeholder="Select a lesson...",
            )

            return self.app.push_screen(palette)

        elif self.list.index == 2:
            # Shuffle flag
            self.shuffle = not self.shuffle
            s = "Yes" if self.shuffle else "No"
            self.query_one("#shuffle-lesson", Static).update(s)

        elif self.list.index == 3:
            # Start lesson
            if self.lesson_file == None:
                self.notify(f"Select lesson.")
            else:
                lesson = load_lesson_file(self.lesson_file)
                self.app.push_screen(LessonScreen(lesson, self.shuffle))

    def select_lesson(self, file: str):
        self.lesson_file = Path(file)
        self.query_one("#lesson-file", Static).update(file)

    # TODO: Select steno system etc.
    def compose(self) -> ComposeResult:
        yield Vertical(
            Header(),
            self.list,
            Footer(),
        )


class PloverDrills(App):
    TITLE = "Plover Drills"

    # Free ctrl+p
    # COMMAND_PALETTE_BINDING = "f1"
    ENABLE_COMMAND_PALETTE = False

    def __init__(self):
        super().__init__()
        self.runner = load_default_runner()

    def on_mount(self):
        self.push_screen(ConfigScreen())


if __name__ == "__main__":
    PloverDrills().run()
