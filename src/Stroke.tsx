import style from './Stroke.module.scss';

// Uni V4
const chars: Array<Array<string>> = [
  ['#', 'T', 'P', 'H', '*', '', '*', 'F', 'P', 'L', 'T', 'D'],
  ['S', 'K', 'W', 'R', '', '', '', 'R', 'B', 'G', 'S', 'Z'],
  ['', '', '#', 'A', 'O', '', 'E', 'U', '#', '', '', ''],
];

// # T P H * _ * F P L T D
// S K W R _ _ _ R B G S Z
// _ _ # A O _ E U # _ _ _

// steno order: #STKPWHRAO*EUFRPBLGTSDZ
const stenoOrder = [
  // #0    1       2       3       4       5       6       7
  [0, 0],
  [1, 0],
  [0, 1],
  [1, 1],
  [0, 2],
  [1, 2],
  [0, 3],
  [1, 3],
  // *8
  [0, 4],
  // #9    A10     O11     E12     U13      #14
  [2, 2],
  [2, 3],
  [2, 4],
  [2, 6],
  [2, 7],
  [2, 8],
  // *15
  [0, 6],
  [0, 7],
  [1, 7],
  [0, 8],
  [1, 8],
  [0, 9],
  [1, 9],
  [0, 10],
  [1, 10],
  [0, 11],
  [1, 11],
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

export type StrokeProps = {
  stroke: string;
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

export type OutlineHintProps = {
  outline: Array<string>;
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
