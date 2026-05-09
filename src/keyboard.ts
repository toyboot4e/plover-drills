import * as mejiro31 from './keyboard/mejiro31';
import * as uniV4 from './keyboard/uniV4';

export type KeyboardName = 'UniV4' | 'Mejiro31';

export type Keyboard = {
  Stroke: (props: StrokeProps) => React.JSX.Element;
  OutlineHint: (props: OutlineHintProps) => React.JSX.Element;
  AccentHint: (props: AccentHintProps) => React.JSX.Element | null;
};

export const getKeyboard = (kbd: KeyboardName): Keyboard => {
  switch (kbd) {
    case 'UniV4':
      return uniV4.keyboard;
    case 'Mejiro31':
      return mejiro31.keyboard;
  }
};

export type StrokeProps = {
  stroke: string;
};

export type OutlineHintProps = {
  outline: Array<string>;
};

export type AccentHintProps = {
  show: boolean;
  word: string;
};
