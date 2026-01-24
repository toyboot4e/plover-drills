// word -> translations of prefixes of outlines
import wordMapData from '../../public/drills-gen/Lapwing.json' with { type: 'json' };
import type { DrillData } from '../Drill';
import type { System } from '../System';

const generatedWordMap = wordMapData as Record<string, Array<string>>;

const matchWord = (expected: string, userInput: string): boolean => {
  const prefixes = generatedWordMap[expected];
  if (typeof prefixes !== 'undefined') {
    // TODO: Is this deep comparison?
    return prefixes.some((p) => p === userInput);
  } else {
    // needs regeneration of `drills-gen.json`
    console.log(`error: non-registerd word '${expected}' was looked up`);
    return false;
  }
};

const rawDrillFiles = import.meta.glob('../../drills/Lapwing/*.txt', {
  query: '?raw',
  eager: true,
}) as Record<string, { default: string }>;

const drillFiles: Array<{ name: string; drillData: DrillData }> = Object.entries(rawDrillFiles)
  .map(([path, text]) => {
    const drillData: DrillData = text.default
      .trim()
      .split('\n')
      .map((line) => {
        const columns = line.split('\t');
        return {
          word: columns[0],
          outline: columns[1].split('/'),
        };
      });

    return {
      // biome-ignore lint/style/noNonNullAssertion: ignore
      name: path.split('/').pop()!,
      drillData,
    };
  })
  .sort((a, b) => {
    return a.name.localeCompare(b.name, undefined, { numeric: true });
  });

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
  drillFiles,
  Footer,
};
