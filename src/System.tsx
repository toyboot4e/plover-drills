import type { DrillData, MatchWord } from './Drill';
import * as lapwing from './system/Lapwing';

export type SystemName = 'lapwing' | 'mejiro';

export const systemNames: Array<SystemName> = ['lapwing', 'mejiro'];

/**
 * Each system's drill definition.
 */
export type System = {
  matchWord: MatchWord;
  drillFiles: Array<{ name: string; drillData: DrillData }>;
  Footer: (props: React.HTMLAttributes<HTMLElement>) => React.JSX.Element;
};

export const getSystem = (systemName: SystemName): System => {
  switch (systemName) {
    case 'lapwing':
      return lapwing.lapwingSystem;
    case 'mejiro':
      return lapwing.lapwingSystem;
  }
};
