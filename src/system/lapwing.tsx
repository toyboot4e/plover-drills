// word -> translations of prefixes of outlines

import wordMapData from '../generated/Lapwing.json' with { type: 'json' };
import type { System } from '../system';
import { type DrillFile, generateDrills } from './utils';

const generatedWordMap = wordMapData as Record<string, Array<string>>;

const matchWord = (expected: string, userInput: string): boolean => {
  const prefixes = generatedWordMap[expected];
  if (typeof prefixes !== 'undefined') {
    // TODO: Is this deep comparison?
    return prefixes.some((p) => p === userInput);
  } else {
    // needs regeneration of `drills-gen.json`
    console.error(`error: non-registerd word '${expected}' was looked up`);
    return false;
  }
};

const drillFiles: DrillFile[] = generateDrills(
  import.meta.glob('../../drills/Lapwing/*.txt', {
    query: '?raw',
  }) as Record<string, () => Promise<{ default: string }>>,
);

const Footer = (props: React.HTMLAttributes<HTMLElement>): React.JSX.Element => {
  return (
    <footer {...props}>
      <p>
        This is a third-party app for <a href='https://lapwing.aerick.ca/'>Lapwing for Beginners</a>. Every lesson data
        comes from the book.
      </p>
    </footer>
  );
};

export const lapwingSystem: System = {
  matchWord,
  keyboards: ['UniV4'],
  drillFiles,
  Footer,
};
