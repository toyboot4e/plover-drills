/**
 * https://inkeys.wiki/en/keymaps/taipo
 */

import style from './style.module.scss';
import type { AccentHintProps, OutlineHintProps, StrokeProps } from './types';

const chars: Array<Array<string>> = [
  ['r', 's', 'n', 'i', '', 'i', 'n', 's', 'r'],
  ['a', 'o', 't', 'e', '', 'e', 't', 'o', 'a'],
  ['', '', '⌫', '␣', '', '␣', '⌫', '', ''],
];

//   0 1 2 3 4 5 6 7 8
// 0 r s n i _ i n s r
// 1 a o t e _ e t o a
// 2 _ _ ⌫ ␣ _ ␣ ⌫ _ _

const chords: Record<string, Array<[number, number]>> = {
  i: [[0, 0]],
  n: [[0, 1]],
  s: [[0, 2]],
  r: [[0, 3]],
  e: [[1, 0]],
  t: [[1, 1]],
  o: [[1, 2]],
  a: [[1, 3]],
  y: [
    [0, 0],
    [0, 1],
  ],
  f: [
    [0, 0],
    [0, 2],
  ],
  g: [
    [0, 0],
    [0, 3],
  ],
  p: [
    [0, 1],
    [0, 2],
  ],
  z: [
    [0, 1],
    [0, 3],
  ],
  b: [
    [0, 2],
    [0, 3],
  ],
  h: [
    [1, 0],
    [1, 1],
  ],
  c: [
    [1, 0],
    [1, 2],
  ],
  d: [
    [1, 0],
    [1, 3],
  ],
  u: [
    [1, 1],
    [1, 2],
  ],
  q: [
    [1, 1],
    [1, 3],
  ],
  l: [
    [1, 2],
    [1, 3],
  ],
  k: [
    [0, 0],
    [1, 2],
  ],
  w: [
    [0, 0],
    [1, 3],
  ],
  j: [
    [0, 1],
    [1, 3],
  ],
  v: [
    [0, 2],
    [1, 0],
  ],
  x: [
    [0, 3],
    [1, 1],
  ],
  m: [
    [0, 3],
    [1, 0],
  ],
};

const leftColumn = (finger: number): number => 3 - finger;
const rightColumn = (finger: number): number => 5 + finger;

const collectKeyPress = (stroke: string): Array<Array<boolean>> => {
  const ret = [
    Array(chars[0].length).fill(false),
    Array(chars[1].length).fill(false),
    Array(chars[2].length).fill(false),
  ];

  if (stroke === undefined || stroke === null || stroke === '') {
    return ret;
  }

  const left = !stroke.startsWith('-');
  const right = !stroke.endsWith('-');
  const chord = chords[stroke.replaceAll('-', '').toLowerCase()];
  if (typeof chord === 'undefined') {
    return ret;
  }

  for (const [row, finger] of chord) {
    if (left) ret[row][leftColumn(finger)] = true;
    if (right) ret[row][rightColumn(finger)] = true;
  }

  return ret;
};

const Stroke = ({ stroke }: StrokeProps): React.JSX.Element => {
  const isPressed = collectKeyPress(stroke);
  const keys = chars.flatMap((cs, row) => {
    return cs.map((c, col) => {
      return (
        <div
          className={`${c === '' ? style.stenoVizEmpty : style.stenoVizRect} ${isPressed[row][col] && style.stenoVizRectPressed}`}
          style={{ gridRow: row + 1, gridColumn: col + 1 }}
          // biome-ignore lint/suspicious/noArrayIndexKey: immutable array
          key={`${row}-${col}`}
        >
          {c}
        </div>
      );
    });
  });

  return <div className={style.stenoVizStroke}>{keys}</div>;
};

const OutlineHint = ({ outline }: OutlineHintProps): React.JSX.Element => {
  return (
    <div className={style.stenoViz}>
      {outline.map((stroke, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: immutable array
        <Stroke key={i} stroke={stroke} />
      ))}
    </div>
  );
};

const AccentHint = (_: AccentHintProps): React.JSX.Element | null => {
  return null;
};

export const keyboard = {
  Stroke,
  OutlineHint,
  AccentHint,
};
