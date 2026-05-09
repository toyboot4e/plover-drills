export type KeyboardName = 'UniV4' | 'Mejiro31';

export type Keyboard = {
  Stroke: (props: StrokeProps) => React.JSX.Element;
  OutlineHint: (props: OutlineHintProps) => React.JSX.Element;
  AccentHint: (props: AccentHintProps) => React.JSX.Element | null;
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
