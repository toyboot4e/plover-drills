import type { DrillData, MatchWord } from './Drill';
import type { OutlineHintProps, StrokeProps } from './stroke';
import { lapwingSystem } from './system/lapwing';
import { mejiroSystem } from './system/mejiro';

export type SystemName = 'lapwing' | 'mejiro';

export const systemNames: Array<SystemName> = ['lapwing', 'mejiro'];

/**
 * Each system's drill definition.
 */
export type System = {
  matchWord: MatchWord;
  drillFiles: Array<{ name: string; drillData: DrillData }>;
  Footer: (props: React.HTMLAttributes<HTMLElement>) => React.JSX.Element;
  Stroke: (props: StrokeProps) => React.JSX.Element;
  OutlineHint: (props: OutlineHintProps) => React.JSX.Element;
};

export const getSystem = (systemName: SystemName): System => {
  switch (systemName) {
    case 'lapwing':
      return lapwingSystem;
    case 'mejiro':
      return mejiroSystem;
  }
};
