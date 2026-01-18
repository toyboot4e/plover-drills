import type { Combobox } from '@base-ui/react/combobox';
import { useEffect, useReducer, useRef, useState } from 'react';
import styles from './App.module.scss';
import { MyCheckbox } from './MyCheckbox.tsx';
import { MyCombobox, type MyComboboxItem } from './MyCombobox.tsx';
import { OutlineHint } from './Stroke.tsx';
import './theme.css';

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

const drillItems: Array<MyComboboxItem & { drillData: DrillData }> = drills.map(({ name, drillData }, i) => {
  return { key: String(i), label: name, drillData };
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
            drillItemIndex: state.drilItemIndex,
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

const useDrillState = (
  drillData: DrillData,
  drillDataIndex: Array<number>,
): [DrillState, React.Dispatch<DrillState>] => {
  return useReducer(reduceDrillState, initialDrillState);
};

type DrillProps = {
  drillData: DrillData;
  drillDataIndex: Array<number>;
};

const Drill = ({ drillData, drillDataIndex }: DrillProps): React.JSX.Element => {
  const [state, dispatchState] = useDrillState(drillData, drillDataIndex);

  // FIXME: the dependency array is an anti pattern. Fix it.
  // initialize on prop change
  useEffect(() => {
    dispatchState({ type: 'RESET' });
  }, [drillData, drillDataIndex, dispatchState]);

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

  if (!state.isCompleted) {
    return (
      <>
        <p>
          [{state.drillItemIndex + 1} / {drillData.length}] {expected}
          {accentHint}
        </p>
        {/* biome-ignore lint/a11y/noAutofocus: ignore */}
        <input className={styles.editor} value={state.text} placeholder='Type here' autoFocus onChange={onChange} />
        {state.fail && <OutlineHint outline={item.outline} />}
      </>
    );
  } else {
    return (
      <p>
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
  const onValueChange = (
    drillItem: (MyComboboxItem & { drillData: DrillData }) | null,
    _: Combobox.Root.ChangeEventDetails,
  ) => {
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
