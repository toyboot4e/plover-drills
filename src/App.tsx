import { useState } from 'react';
import styles from './App.module.scss';
import { type Item, LessonSelector } from './LessonSelector.tsx';
import { ShuffleCheckbox } from './ShuffleCheckbox.tsx';
import './theme.css';

type DrillData = Array<DrillItem>;

type DrillItem = {
  word: string;
  outline: string;
};

const drillFiles: Record<string, { default: string }> = import.meta.glob<string>('../drills/*.txt', {
  query: '?raw',
  eager: true,
});

const drills: Array<{ name: string; drillData: DrillData }> = Object.entries(drillFiles)
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

const drillItems: Item[] = drills.map(({ name, drillData }, i) => {
  return { key: String(i), label: name, drillData };
});

type DrillProps = {
  drillData: DrillData;
};

const Drill = ({ drillData }): JSX.Element => {
  const [drillItemIndex, setDrillItemIndex] = useState(0);
  const [didFail, setDidFail] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // biome-ignore lint/style/noNonNullAssertion: ignore
  const item = drillData[drillItemIndex]!;
  const word = item.word;
  const accentHint = null;

  return (
    <>
      <p>
        [1/n] {word}
        {accentHint}
      </p>
      <input className={styles.editor} placeholder='Type here' autoFocus />
      <p>Show outline here on type error</p>
      <footer className={styles.footer}>
        This is a third-party app for <a href='https://lapwing.aerick.ca/'>Lapwing for Beginners</a>. Every lesson data
        comes from the book.
      </footer>
    </>
  );
};

export const App = (): React.JSX.Element => {
  const [drillData, setDrillData] = useState<DrillData | null>(null);
  const onValueChange = (drillItem, _) => {
    if (drillItem === null) {
      setDrillData(null);
    } else {
      setDrillData(drillItem.drillData);
    }
  };

  return (
    <>
      <h1>Plove Drills for Lapwing Theory</h1>
      <ShuffleCheckbox title='Shuffle' />
      <LessonSelector
        items={drillItems}
        placeholder='Select a drill'
        emptyString='No drill found'
        width='100%'
        onValueChange={onValueChange}
      />
      {drillData && <Drill drillData={drillData} />}
    </>
  );
};
