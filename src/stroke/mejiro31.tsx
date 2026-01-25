import type { AccentHintProps, OutlineHintProps, StrokeProps } from '../stroke';
import style from './style.module.scss';

// Uni V4
const chars: Array<Array<string>> = [
  ['#', 'S', 'T', 'Y', 'I', 'U', '', 'U', 'I', 'Y', 'T', 'S', '*'],
  ['', '', 'K', 'N', 'A', 'U', '', 'U', 'A', 'N', 'K', '', ''],
  ['', '', '', '', 'n', '', '', 'n', '', '', '', '', ''],
  ['', '', '', '', 't', 'k', '', 'k', 't', '', '', '', ''],
];

//   0 1 2 3 4 5 6 7 8 9 A B C
// 0 # S T Y I U   U I Y T S *
// 1 # S K N A U   U A N K S *
// 2         n n   n n
// 3         t k   k t

const stenoOrder = [
  [0, 0], //   0 #
  [0, 1], //   1 S
  [0, 2], //   2 T
  [1, 2], //   3 K
  [0, 3], //   4 Y
  [1, 3], //   5 N
  [0, 4], //   6 I
  [1, 4], //   7 A
  [0, 5], //   8 U
  [2, 4], //   9 n
  [3, 4], //   9 t
  [3, 5], //  10 k
];

const collectKeyPress = (chars: Array<Array<string>>, stroke: string): Array<Array<boolean>> => {
  const ret = [
    Array(chars[0].length).fill(false),
    Array(chars[1].length).fill(false),
    Array(chars[2].length).fill(false),
    Array(chars[3].length).fill(false),
  ];

  if (stroke === undefined || stroke === null || stroke === '') {
    return ret;
  }

  const iRhs = 11;

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

  // TODO:

  return ret;
};

export const Stroke = ({ stroke }: StrokeProps): React.JSX.Element => {
  const isPressed = collectKeyPress(chars, stroke);
  const keys = chars.flatMap((cs, row) => {
    return cs.map((c, col) => {
      const fat = ('#*S'.includes(c) && style.stenoVizFatY) || (c === 'n' && style.stenoVizFatX);
      return (
        <div
          className={`${c === '' ? style.stenoVizEmpty : style.stenoVizRect} ${fat} ${isPressed[row][col] && style.stenoVizRectPressed}`}
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

export const AccentHint = (_: AccentHintProps): React.JSX.Element | null => {
  return null;
};
