import { useState } from 'react';
import styles from './App.module.scss';
import { MyCheckbox } from './MyCheckbox.tsx';
import { MyCombobox, type MyComboboxItem } from './MyCombobox.tsx';
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

const drillItems: MyComboboxItem[] = drills.map(({ name, drillData }, i) => {
  return { key: String(i), label: name, drillData };
});

type DrillProps = {
  drillData: DrillData;
};

const Drill = ({ drillData }): JSX.Element => {
  const [text, setText] = useState('');
  const [drillItemIndex, setDrillItemIndex] = useState(0);
  const [didFail, setDidFail] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // biome-ignore lint/style/noNonNullAssertion: ignore
  const item = drillData[drillItemIndex]!;
  const word = item.word;
  const accentHint = null;

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    if (text.trim() === word) {
      setText('');
      if (drillItemIndex + 1 >= drillData.length) {
        setIsCompleted(true);
        setDidFail(false);
      } else {
        setDrillItemIndex(drillItemIndex + 1);
        setDidFail(false);
      }
    } else {
      setText(text);
      setDidFail(true);
    }
  };

  if (!isCompleted) {
    return (
      <>
        <p>
          [{drillItemIndex + 1} / {drillData.length}] {word}
          {accentHint}
        </p>
        <input className={styles.editor} value={text} placeholder='Type here' autoFocus onChange={onChange} />
        {didFail && <p>{item.outline}</p>}
      </>
    );
  } else {
    return (
      <p>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='16'
          height='16'
          viewBox='0 0 24 24'
          fill='none'
          stroke='green'
          strokeWidth='3'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <title>check</title>
          <polyline points='20 6 9 17 4 12' />
        </svg>
        Completed!
      </p>
    );
  }
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
      <main className={styles.main}>
        <p>
          <MyCheckbox title='Shuffle' defaultChecked={false} />
        </p>
        <MyCombobox
          items={drillItems}
          placeholder='Select a drill'
          emptyString='No drill found'
          width='100%'
          onValueChange={onValueChange}
        />
        {drillData && <Drill drillData={drillData} />}
      </main>
      <footer className={styles.footer}>
        <p>
          This is a third-party app for <a href='https://lapwing.aerick.ca/'>Lapwing for Beginners</a>. Every lesson
          data comes from the book.
        </p>
      </footer>
    </>
  );
};
