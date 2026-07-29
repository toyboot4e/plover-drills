import type { System } from '../system';
import { type DrillFile, generateDrills } from './utils';

const matchWord = (expected: string, userInput: string): boolean => {
  return expected.substring(0, userInput.length) === userInput;
};

const drillFiles: DrillFile[] = generateDrills(
  import.meta.glob('../../drills/Taipo/*.txt', {
    query: '?raw',
  }) as Record<string, () => Promise<{ default: string }>>,
  () => Promise.resolve(),
);

const Footer = (props: React.HTMLAttributes<HTMLElement>): React.JSX.Element => {
  return (
    <footer {...props}>
      <p>
        This is a third-party app for the <a href='https://inkeys.wiki/en/keymaps/taipo'>Taipo layout</a>.
      </p>
    </footer>
  );
};

export const taipoSystem: System = {
  matchWord,
  keyboards: ['Taipo'],
  drillFiles,
  Footer,
};
