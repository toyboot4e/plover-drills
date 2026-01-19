import type { Combobox } from '@base-ui/react/combobox';
import { useMemo, useReducer, useRef, useState } from 'react';
import styles from './App.module.scss';
import { MyCheckbox } from './MyCheckbox.tsx';
import { MyCombobox, type MyComboboxItem } from './MyCombobox.tsx';
import { OutlineHint } from './Stroke.tsx';
import './theme.css';
import { id, useLocalStorage } from './utils.ts';

type DrillData = Array<DrillItem>;

type DrillItem = {
  word: string;
  outline: Array<string>;
};

// word -> translations of prefixes of outlines
import wordMapData from '../public/drills-gen.json' with { type: 'json' };

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

const drillFiles = import.meta.glob('../drills/*.txt', {
  query: '?raw',
  eager: true,
}) as Record<string, { default: string }>;

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

const drillItems: Array<MyComboboxItem & { drillData: DrillData }> = drills.map(({ name, drillData }) => {
  return { key: name, label: name, drillData };
});

type DrillState = {
  text: string;
  drillItemIndex: number;
  fail: boolean;
  isCompleted: boolean;
};

type Action =
  | { type: 'RESET' }
  | { type: 'SET_TEXT'; text: string }
  | { type: 'FAIL' }
  | { type: 'NEXT'; length: number }
  | { type: 'PREV'; length: number };

const initialDrillState: DrillState = {
  text: '',
  drillItemIndex: 0,
  fail: false,
  isCompleted: false,
};

const reduceDrillState = (state: DrillState, action: Action): DrillState => {
  switch (action.type) {
    case 'RESET':
      return initialDrillState;

    case 'SET_TEXT':
      return { ...state, text: action.text };

    case 'FAIL':
      return { ...state, fail: true };

    case 'NEXT': {
      return {
        text: '',
        fail: false,
        drillItemIndex: Math.min(action.length - 1, state.drillItemIndex + 1),
        isCompleted: state.drillItemIndex + 1 >= action.length,
      };
    }

    case 'PREV': {
      return state.isCompleted
        ? {
            text: '',
            fail: false,
            drillItemIndex: state.drillItemIndex,
            isCompleted: false,
          }
        : {
            text: '',
            fail: false,
            drillItemIndex: Math.max(0, state.drillItemIndex - 1),
            isCompleted: false,
          };
    }

    default: {
      console.log(`error: ${action}`);
      return state;
    }
  }
};

type DrillProps = {
  drillData: DrillData;
  drillDataIndex: Array<number>;
};

const Drill = ({ drillData, drillDataIndex }: DrillProps): React.JSX.Element => {
  const [state, dispatchState] = useReducer(reduceDrillState, initialDrillState);

  // biome-ignore lint/style/noNonNullAssertion: ignore
  const i = drillDataIndex[state.drillItemIndex]!;
  // biome-ignore lint/style/noNonNullAssertion: ignore
  const item = drillData[i]!;
  const expected = item.word.trim();
  const accentHint = null;

  // biome-ignore lint/suspicious/noExplicitAny: ignore
  const useDebouncedCallback = <T extends (...args: any[]) => void>(callback: T, delay: number) => {
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    return (...args: Parameters<T>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    };
  };

  const onChangeDebounced = useDebouncedCallback((text: string) => {
    if (text === expected) {
      dispatchState({ type: 'NEXT', length: drillData.length });
    } else if (!matchWord(expected, text.trim())) {
      dispatchState({ type: 'FAIL' });
    }
  }, 100); // 100ms delay

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value; // TODO: trim?
    dispatchState({ type: 'SET_TEXT', text });
    onChangeDebounced(text);
  };

  const nextPrev = (
    <span className={styles.right}>
      <button
        type='button'
        aria-label='Previous'
        onClick={() => dispatchState({ type: 'PREV', length: drillData.length })}
      >
        <svg width='24' height='24' viewBox='0 0 24 24' style={{ verticalAlign: 'middle' }} aria-hidden='true'>
          <title>previous</title>
          <path
            d='M15 18l-6-6 6-6'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      </button>
      <button type='button' aria-label='Next' onClick={() => dispatchState({ type: 'NEXT', length: drillData.length })}>
        <svg width='24' height='24' viewBox='0 0 24 24' style={{ verticalAlign: 'middle' }} aria-hidden='true'>
          <title>next</title>
          <path
            d='M9 6l6 6-6 6'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      </button>
    </span>
  );

  if (!state.isCompleted) {
    return (
      <>
        <p className={styles.lessonStatus}>
          [{state.drillItemIndex + 1} / {drillData.length}] {expected}
          {accentHint}
          {nextPrev}
        </p>
        {/* biome-ignore lint/a11y/noAutofocus: ignore */}
        <input className={styles.editor} value={state.text} placeholder='Type here' autoFocus onChange={onChange} />
        {state.fail && <OutlineHint outline={item.outline} />}
      </>
    );
  } else {
    return (
      <p className={styles.lessonStatus}>
        [{drillData.length} / {drillData.length}]{' '}
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
        {nextPrev}
      </p>
    );
  }
};

const localStorageKeys = {
  shuffle: 'plover-drills/shuffle',
  drillName: 'plover-drills/drill-name',
};

const createDrillDataIndex = (length: number, shuffle: boolean): Array<number> => {
  const drillDataIndex = [...Array(length)].map((_, i) => i);
  if (shuffle) {
    drillDataIndex.sort((_a, _b) => 0.5 - Math.random());
  }
  return drillDataIndex;
};

export const App = (): React.JSX.Element => {
  // states
  const [shuffle, setShuffle] = useLocalStorage<boolean>(localStorageKeys.shuffle, (v) => v === 'true', String);
  const [defaultShuffle] = useState(() => shuffle);
  const [filename, setFilename] = useLocalStorage<string | null>(localStorageKeys.drillName, id, id);

  // restore other data from the states
  const drill = useMemo<(MyComboboxItem & { drillData: DrillData }) | null>(
    () => (typeof filename === 'string' ? drillItems.find((d) => d.key === filename) || null : null),
    [filename],
  );
  const [defaultDrill] = useState(() => drill);

  const drillProps = useMemo<(DrillProps & { filename: string }) | null>(
    () =>
      drill
        ? {
            drillData: drill.drillData,
            drillDataIndex: createDrillDataIndex(drill.drillData.length, shuffle),
            filename: drill.key,
          }
        : null,
    [drill, shuffle],
  );

  const onValueChange = (
    drillItem: (MyComboboxItem & { drillData: DrillData }) | null,
    _: Combobox.Root.ChangeEventDetails,
  ) => {
    setFilename(drillItem?.key ?? null);
  };

  return (
    <>
      <h1 className={styles.header}>Plove Drills for Lapwing Theory</h1>
      <main className={styles.main}>
        <p className={styles.checkboxContainer}>
          <MyCheckbox
            title='Shuffle'
            checked={shuffle}
            defaultChecked={defaultShuffle}
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
          defaultValue={defaultDrill}
          onValueChange={onValueChange}
        />
        {drillProps && (
          <Drill
            drillData={drillProps.drillData}
            drillDataIndex={drillProps.drillDataIndex}
            /* key change = new component (reset state) */
            key={drillProps.filename}
          />
        )}
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
