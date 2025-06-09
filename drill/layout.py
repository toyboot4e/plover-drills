from abc import ABCMeta, abstractmethod
from copy import deepcopy
from typing import Optional

from colorama import Back, Fore, Style
from plover.steno import Stroke

from .types import Outline

# class StrokeDisplay:
#     pass


# class Layout(metaclasss=ABCMeta):
#     """Class for displaying steno stroke."""
#
#     @abstractmethod
#     def visualize(outline: String):
#         pass


def collect_stroke_keys(stroke: Stroke) -> tuple[str, str, str]:
    l = []
    c = []
    r = []
    for key in stroke.keys():
        if key[-1] == "-":
            # left hand
            l.append(key[:-1])
        elif key[0] == "-":
            # right hand
            r.append(key[1:])
        else:
            # other
            c.append(key)
        return [l, c, r]


class LayoutInfo:
    def __init__(self, rows: list[str], center: int):
        self.rows = rows
        self.center = center

    def show_stroke(self, stroke: Stroke) -> list[str]:
        rows = deepcopy(self.rows)
        return rows


lapwing_rows: list[str] = [
    # 0123456789
    "#TPH*FPLTD",
    "SKWR*RBGSZ",
    "  AO EU   ",
]

lapwing = LayoutInfo(lapwing_rows, lapwing_rows[0].index("*"))


def show_stroke(stroke: Stroke) -> str:
    l, c, r = collect_stroke_keys(stroke)
    rows: list[str] = lapwing.show_stroke(stroke)
    # TODO: string builder
    out = ""
    for row in rows:
        print(Fore.RED + row, end="")
    return ""
