import type { DrillData, MatchWord } from './Drill';
import type { KeyboardName } from './keyboard/types';
import { lapwingSystem } from './system/lapwing';
import { mejiroSystem } from './system/mejiro';
import { taipoSystem } from './system/taipo';

export type SystemName = 'lapwing' | 'mejiro' | 'taipo';

export const systemNames: Array<SystemName> = ['lapwing', 'mejiro', 'taipo'];

/**
 * Each system's drill definition.
 */
export type System = {
  matchWord: MatchWord;
  keyboards: KeyboardName[];
  drillFiles: Array<{ name: string; loadDrillData: () => Promise<DrillData> }>;
  Footer: (props: React.HTMLAttributes<HTMLElement>) => React.JSX.Element;
};

export const getSystem = (systemName: SystemName): System => {
  switch (systemName) {
    case 'lapwing':
      return lapwingSystem;
    case 'mejiro':
      return mejiroSystem;
    case 'taipo':
      return taipoSystem;
  }
};
