import { useEffect, useRef, useState } from 'react';
import styles from './App.module.scss';
import { MyCheckbox } from './MyCheckbox.tsx';
import { MyCombobox, type MyComboboxItem } from './MyCombobox.tsx';
import { OutlineHint } from './Stroke.tsx';
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

const useDebouncedCallback = <T extends (...args: unknown[]) => void>(callback: T, delay: number) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (...args: Parameters<T>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  };
};

type DrillProps = {
  drillData: DrillData;
  drillDataIndex: Array<number>;
};

const Drill = ({ drillData, drillDataIndex }: DrillProps): JSX.Element => {
  // TODO: initialize on prop change
  const [text, setText] = useState('');
  const [drillItemIndex, setDrillItemIndex] = useState(0);
  const [didFail, setDidFail] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // FIXME: This is like an anti pattern
  // biome-ignore lint/correctness/useExhaustiveDependencies: initilize on prop change
  useEffect(() => {
    setText('');
    setDrillItemIndex(0);
    setDidFail(false);
    setIsCompleted(false);
  }, [drillData, drillDataIndex]);

  // biome-ignore lint/style/noNonNullAssertion: ignore
  const i = drillDataIndex[drillItemIndex]!;
  // biome-ignore lint/style/noNonNullAssertion: ignore
  const item = drillData[i]!;
  const word = item.word;
  const accentHint = null;

  const handleDebounced = useDebouncedCallback((text: string) => {
    if (text.trim() === word) {
      setText('');
      if (drillItemIndex + 1 >= drillData.length) {
        setIsCompleted(true);
      } else {
        setDrillItemIndex(drillItemIndex + 1);
        setDidFail(false);
      }
    } else {
      setDidFail(true);
    }
  }, 100); // 100ms delay

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value.trim();
    setText(text);
    handleDebounced(text);
  };

  if (!isCompleted) {
    return (
      <>
        <p>
          [{drillItemIndex + 1} / {drillData.length}] {word}
          {accentHint}
        </p>
        {/* biome-ignore lint/a11y/noAutofocus: ignore */}
        <input className={styles.editor} value={text} placeholder='Type here' autoFocus onChange={onChange} />
        {didFail && <OutlineHint outline={item.outline} />}
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
  // TODO: restore from localStorage

  // shuffle
  const [shuffle, setShuffle] = useState(false);

  // selector
  const [drillProps, setDrillProps] = useState<DrillProps | null>(null);
  const onValueChange = (drillItem, _) => {
    if (drillItem === null) {
      setDrillProps(null);
    } else {
      const drillDataIndex = [...Array(drillItem.drillData.length)].map((_, i) => i);
      if (shuffle) {
        drillDataIndex.sort((_a, _b) => 0.5 - Math.random());
      }
      setDrillProps({ drillData: drillItem.drillData, drillDataIndex });
    }
  };

  return (
    <>
      <h1>Plove Drills for Lapwing Theory</h1>
      <main className={styles.main}>
        <p>
          <MyCheckbox
            title='Shuffle'
            checked={shuffle}
            onCheckedChange={(shuffle, _) => {
              setShuffle(shuffle);
            }}
          />
        </p>
        <MyCombobox
          items={drillItems}
          placeholder='Select a drill'
          emptyString='No drill found'
          width='100%'
          onValueChange={onValueChange}
        />
        {drillProps && <Drill {...drillProps} />}
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
