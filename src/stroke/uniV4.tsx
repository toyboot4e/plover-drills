import type { OutlineHintProps, StrokeProps } from '../stroke';
import style from './uniV4.module.scss';

// Uni V4
const chars: Array<Array<string>> = [
  ['#', 'T', 'P', 'H', '*', '', '*', 'F', 'P', 'L', 'T', 'D'],
  ['S', 'K', 'W', 'R', '', '', '', 'R', 'B', 'G', 'S', 'Z'],
  ['', '', '#', 'A', 'O', '', 'E', 'U', '#', '', '', ''],
];

//   0 1 2 3 4 5 6 7 8 9 A B
// 0 # T P H * _ * F P L T D
// 1 S K W R _ _ _ R B G S Z
// 2 _ _ # A O _ E U # _ _ _

// steno order: #STKPWHRAO*EUFRPBLGTSDZ
const stenoOrder = [
  [0, 0], //   0 #
  [1, 0], //   1 S
  [0, 1], //   2 T
  [1, 1], //   3 K
  [0, 2], //   4 P
  [1, 2], //   5 W
  [0, 3], //   6 H
  [1, 3], //   7 R
  [2, 2], //   8 # <--
  [2, 3], //   9 A
  [2, 4], //  10 O
  [0, 4], //  11 *
  [2, 6], //  12 E <--
  [2, 7], //  13 U
  [2, 8], //  14 #
  [0, 7], //  15 F
  [1, 7], //  16 R
  [0, 8], //  17 P
  [1, 8], //  18 B
  [0, 9], //  19 L
  [1, 9], //  20 G
  [0, 10], // 21 T
  [1, 10], // 22 S
  [0, 11], // 23 D
  [1, 11], // 24 Z
];

const collectKeyPress = (chars: Array<Array<string>>, stroke: string): Array<Array<boolean>> => {
  const ret = [
    Array(chars[0].length).fill(false),
    Array(chars[1].length).fill(false),
    Array(chars[2].length).fill(false),
  ];

  if (stroke === undefined || stroke === null || stroke === '') {
    return ret;
  }

  const iRhs = 12;

  let iOrder = 0;
  for (const c of stroke) {
    if (iOrder >= stenoOrder.length) break;
    if (c === '-') {
      if (iOrder < iRhs) iOrder = iRhs;
      continue;
    }
    while (iOrder < stenoOrder.length) {
      const [row, col] = stenoOrder[iOrder++];
      if (c === chars[row][col]) {
        ret[row][col] = true;
        break;
      }
    }
  }

  // '*'
  ret[0][6] |= ret[0][4];
  ret[0][4] |= ret[0][6];

  // '#'
  ret[0][0] |= ret[2][2] || ret[2][8];
  ret[2][2] = ret[0][0];
  ret[2][8] = ret[0][0];

  return ret;
};

export const Stroke = ({ stroke }: StrokeProps): React.JSX.Element => {
  const isPressed = collectKeyPress(chars, stroke);
  const keys = chars.flatMap((cs, row) => {
    return cs.map((c, col) => {
      return (
        <div
          className={`${c === '' ? style.stenoVizEmpty : style.stenoVizRect} ${c === '*' && style.stenoVizFat} ${isPressed[row][col] && style.stenoVizRectPressed}`}
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

export const OutlineHint = ({ outline }: OutlineHintProps): React.JSX.Element => {
  return (
    <div className={style.stenoViz}>
      {outline.map((stroke, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: immutable array
        <Stroke key={i} stroke={stroke} />
      ))}
    </div>
  );
};
