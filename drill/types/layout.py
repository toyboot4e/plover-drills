"""Keyboard layout"""

from abc import ABCMeta, abstractmethod
from copy import deepcopy
from typing import Optional

from plover.steno import Stroke

from .stroke import Outline

# class StrokeDisplay:
#     pass


# class Layout(metaclasss=ABCMeta):
#     """Class for displaying steno stroke."""
#
#     @abstractmethod
#     def visualize(outline: String):
#         pass


def collect_stroke_keys(stroke: Stroke) -> tuple[str, str, str]:
    l = ""
    c = ""
    r = ""
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

    def show_colored_stroke(self, stroke: Stroke) -> list[str]:
        stroke_keys: tuple[str, str, str] = collect_stroke_keys(stroke)

        def process_row(row: str):
            def process_char(ic: tuple[int, str]):
                i, c = ic
                i_stroke: int = 0 if i < self.center else 1 if i == self.center else 2
                if c in stroke_keys[i_stroke]:
                    # contained in the strke
                    return Fore.RED + c + Fore.RESET
                else:
                    # not contained in the strke
                    return c

            # TODO: match default color to Textual
            return Fore.RESET + "".join(map(process_char, enumerate(row)))

        return list(map(process_row, self.rows))


# TODO: allow arbitrary case for input
lapwing_rows: list[str] = [
    # 0123456789
    "#TPH*FPLTD",
    "SKWR*RBGSZ",
    "  AO EU   ",
]

lapwing = LayoutInfo(lapwing_rows, lapwing_rows[0].index("*"))


# TODO: show numbers
def show_colored_stroke(stroke: Stroke) -> list[str]:
    return lapwing.show_colored_stroke(stroke)
