import { useMemo, useReducer } from 'react';
import styles from './Drill.module.scss';
import type { AccentHintProps, OutlineHintProps } from './keyboard/types';
import { MyCombobox } from './MyCombobox';
import './theme.css';
import { shuffleArray, useDebouncedCallback, useLocalStorage } from './utils';

export type DrillItem = {
  word: string;
  outline: Array<string>;
};

export type DrillData = Array<DrillItem>;

export type DrillState = {
  text: string;
  drillItemIndex: number;
  setDrillItemIndex: (i: number) => void;
  fail: boolean;
  isCompleted: boolean;
};

export type Action =
  | { type: 'SET_TEXT'; text: string }
  | { type: 'FAIL' }
  | { type: 'NEXT'; length: number }
  | { type: 'PREV'; length: number }
  | { type: 'SELECT'; index: number };

const createInitialDrillState = (drillItemIndex: number, setDrillItemIndex: (i: number) => void): DrillState => {
  return {
    text: '',
    drillItemIndex,
    setDrillItemIndex,
    fail: false,
    isCompleted: false,
  };
};

const reduceDrillState = (state: DrillState, action: Action): DrillState => {
  const newState = reduceDrillStateImpl(state, action);
  state.setDrillItemIndex(newState.drillItemIndex);
  return newState;
};

const reduceDrillStateImpl = (state: DrillState, action: Action): DrillState => {
  switch (action.type) {
    case 'SET_TEXT':
      return { ...state, text: action.text };

    case 'SELECT':
      return {
        text: '',
        fail: false,
        drillItemIndex: action.index,
        setDrillItemIndex: state.setDrillItemIndex,
        isCompleted: false,
      };

    case 'FAIL':
      return { ...state, fail: true };

    case 'NEXT': {
      return {
        text: '',
        fail: false,
        drillItemIndex: Math.min(action.length - 1, state.drillItemIndex + 1),
        setDrillItemIndex: state.setDrillItemIndex,
        isCompleted: state.drillItemIndex + 1 >= action.length,
      };
    }

    case 'PREV': {
      return state.isCompleted
        ? {
            text: '',
            fail: false,
            drillItemIndex: state.drillItemIndex,
            setDrillItemIndex: state.setDrillItemIndex,
            isCompleted: false,
          }
        : {
            text: '',
            fail: false,
            drillItemIndex: Math.max(0, state.drillItemIndex - 1),
            setDrillItemIndex: state.setDrillItemIndex,
            isCompleted: false,
          };
    }

    default: {
      console.error(`error: ${action}`);
      return state;
    }
  }
};

export const createDrillDataIndex = (length: number, shuffle: boolean, seed: number): Array<number> => {
  const drillDataIndex = [...Array(length)].map((_, i) => i);
  if (shuffle) {
    shuffleArray(drillDataIndex, seed);
  }
  return drillDataIndex;
};

export type MatchWord = (expected: string, userInput: string) => boolean;

export type DrillProps = {
  drillData: DrillData;
  drillDataIndex: Array<number>;
  drillItemIndexKey: string;
  alwaysShowKeyboard: boolean;
  alwaysShowOutline: boolean;
  matchWord: MatchWord;
  OutlineHint: (props: OutlineHintProps) => React.JSX.Element;
  AccentHint: (props: AccentHintProps) => React.JSX.Element | null;
  showAccentHint: boolean;
};

export const Drill = ({
  drillData,
  drillDataIndex,
  drillItemIndexKey,
  alwaysShowKeyboard,
  alwaysShowOutline,
  matchWord,
  OutlineHint,
  AccentHint,
  showAccentHint,
}: DrillProps): React.JSX.Element => {
  const inits = useLocalStorage<number>(drillItemIndexKey, Number, String);
  const [state, dispatchState] = useReducer(reduceDrillState, inits, ([drillItemIndex, setDrillItemIndex]) => {
    const index = Math.max(0, Math.min(drillData.length - 1, drillItemIndex));
    return createInitialDrillState(index, setDrillItemIndex);
  });

  // biome-ignore lint/style/noNonNullAssertion: ignore
  const i = drillDataIndex[state.drillItemIndex]!;
  // biome-ignore lint/style/noNonNullAssertion: ignore
  const item = drillData[i]!;
  const expected = item.word.trim();

  const onChangeDebounced = useDebouncedCallback((text: string) => {
    if (text.trim() === expected) {
      dispatchState({ type: 'NEXT', length: drillData.length });
    } else if (text.trim() !== '' && !matchWord(expected, text.trim())) {
      dispatchState({ type: 'FAIL' });
    }
  }, 100); // 100ms delay

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    dispatchState({ type: 'SET_TEXT', text });
    // Skip while the IME is composing
    if ((e.nativeEvent as InputEvent).isComposing) return;
    onChangeDebounced(text);
  };

  const onCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    onChangeDebounced(e.currentTarget.value);
  };

  const comboboxItems = useMemo(
    () =>
      drillDataIndex.map((dataIndex, pos) => ({
        key: String(pos),
        label: `${pos + 1} - ${drillData[dataIndex]?.word.trim() ?? ''}`,
      })),
    [drillData, drillDataIndex],
  );

  const itemCombobox = (
    <MyCombobox
      key={state.drillItemIndex}
      items={comboboxItems}
      width='100%'
      placeholder='Drill item'
      defaultValue={comboboxItems[state.drillItemIndex] ?? null}
      allowClear={false}
      onValueChange={(item) => {
        if (item !== null) {
          dispatchState({ type: 'SELECT', index: Number(item.key) });
        }
      }}
    />
  );

  const nextPrev = (
    <span className={styles.right}>
      <button
        type='button'
        aria-label='Previous'
        onClick={() => dispatchState({ type: 'PREV', length: drillData.length })}
        disabled={state.drillItemIndex === 0}
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
      <button
        type='button'
        aria-label='Next'
        onClick={() => dispatchState({ type: 'NEXT', length: drillData.length })}
        disabled={state.isCompleted}
      >
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

  return (
    <>
      <p className={styles.lessonStatus}>
        <span className={styles.count}>
          [{state.drillItemIndex + 1} / {drillData.length}]
        </span>
        <span className={styles.comboboxSpan}>{itemCombobox}</span>
        {showAccentHint && <AccentHint show={state.fail} word={expected} />}
        {nextPrev}
      </p>
      {!state.isCompleted ? (
        // typing
        <>
          <input
            className={styles.editor}
            value={state.text}
            placeholder='Type here'
            // biome-ignore lint/a11y/noAutofocus: ignore
            autoFocus
            onChange={onChange}
            onCompositionEnd={onCompositionEnd}
          />
          {(state.fail || alwaysShowKeyboard || alwaysShowOutline) && (
            <OutlineHint outline={alwaysShowOutline || state.fail ? item.outline : ['']} />
          )}
        </>
      ) : (
        // completed
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
      )}
    </>
  );
};
