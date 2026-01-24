// word -> translations of prefixes of outlines

import type { DrillData } from '../Drill';
import type { System } from '../System';
import { generateDrills } from './utils';

const matchWord = (expected: string, userInput: string): boolean => {
  return expected.substring(0, userInput.length) === userInput;
};

const drillFiles: Array<{ name: string; drillData: DrillData }> = (() => {
  const rawDrillFiles = import.meta.glob('../../drills/Lapwing/*.txt', {
    query: '?raw',
    eager: true,
  }) as Record<string, { default: string }>;

  return generateDrills(rawDrillFiles);
})();

const Footer = (props: React.HTMLAttributes<HTMLElement>): React.JSX.Element => {
  return (
    <footer {...props}>
      <p>
        This is a third-party app for the <a href='https://github.com/JEEBIS27/Plover_Mejiro'>Mejiro system</a>.
      </p>
    </footer>
  );
};

export const lapwingSystem: System = {
  matchWord,
  drillFiles,
  Footer,
};
