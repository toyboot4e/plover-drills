"""Widgets."""

from textual.binding import Binding
from textual.command import CommandList, CommandPalette
from textual.widgets import ListView


class MyCommandPalette(CommandPalette):
    """CommandPalette with terminal friendly key bindings"""

    BINDINGS = [
        Binding("ctrl+c", "escape", "Close", priority=True),
        ("ctrl+n", "cursor_down", "Down"),
        ("ctrl+p", "command_list('cursor_up')", "Up"),
        Binding("ctrl+f", "command_list('page_down')", "Next page", priority=True),
        Binding("ctrl+b", "command_list('page_up')", "Previous page"),
        Binding("ctrl+d", "scroll_half_page_down", "Half page Down", priority=True),
        Binding("ctrl+u", "scroll_half_page_up", "Half page up", priority=True),
    ]

    def action_scroll_half_page_down(self):
        list = self.query_one(CommandList)
        half_page = self.scrollable_content_region.height // 2
        list.highlighted = min(list.highlighted + half_page, len(list._lines) - 1)

    def action_scroll_half_page_up(self):
        list = self.query_one(CommandList)
        half_page = self.scrollable_content_region.height // 2
        list.highlighted = max(list.highlighted - half_page, 0)


class MyListView(ListView):
    """ListView with terminal friendly key bindings"""

    BINDINGS = [
        Binding("ctrl+c", "escape", "Close", priority=True),
        ("j", "cursor_down", "Down"),
        ("k", "cursor_up", "Up"),
        ("ctrl+n", "cursor_down", "Down"),
        ("ctrl+p", "cursor_up", "Up"),
        ("ctrl+d", "half_page_down", "Half page down"),
        ("ctrl+u", "half_page_up", "Half page up"),
        ("ctrl+f", "full_page_down", "Half page down"),
        ("ctrl+b", "full_page_up", "Half page up"),
        # TODO: include base bindings?
    ]

    def action_half_page_down(self) -> None:
        self.do_scroll(max(1, self.size.height // 2))

    def action_half_page_up(self) -> None:
        self.do_scroll(-max(1, self.size.height // 2))

    def action_full_page_down(self) -> None:
        self.do_scroll(max(1, self.size.height))

    def action_full_page_up(self) -> None:
        self.do_scroll(-max(1, self.size.height))

    def do_scroll(self, delta: int) -> None:
        n = len(self.children)
        i = max(0, min(n - 1, self.index + delta))
        self.index = i
