import { Suspense, use, useMemo, useReducer } from 'react';
import styles from './Drill.module.scss';
import type { OutlineHintProps } from './stroke';
import './theme.css';
import { useDebouncedCallback } from './utils';

export type DrillItem = {
  word: string;
  outline: Array<string>;
};

export type DrillData = Array<DrillItem>;

export type DrillState = {
  text: string;
  drillItemIndex: number;
  fail: boolean;
  isCompleted: boolean;
};

export type Action =
  | { type: 'RESET' }
  | { type: 'SET_TEXT'; text: string }
  | { type: 'FAIL' }
  | { type: 'NEXT'; length: number }
  | { type: 'PREV'; length: number };

export const initialDrillState: DrillState = {
  text: '',
  drillItemIndex: 0,
  fail: false,
  isCompleted: false,
};

export const reduceDrillState = (state: DrillState, action: Action): DrillState => {
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

export const createDrillDataIndex = (length: number, shuffle: boolean): Array<number> => {
  const drillDataIndex = [...Array(length)].map((_, i) => i);
  if (shuffle) {
    drillDataIndex.sort((_a, _b) => 0.5 - Math.random());
  }
  return drillDataIndex;
};

export type MatchWord = (expected: string, userInput: string) => boolean;

/**
 * Free dictionary API
 * https://dictionaryapi.dev/
 */
const fetchAccent = async (word: string): Promise<string | null> => {
  const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
  const data = await res.json();

  if (Array.isArray(data) && data[0].phonetics?.length) {
    // FIXME: any
    // @ts-expect-error
    const american = data[0].phonetics.find((p) => p.audio?.includes('us'));
    return american?.text || data[0].phonetics[0].text || null;
  }
  return null;
};

const AccentHintInner = ({ resource }: { resource: Promise<string | null> }): React.JSX.Element => {
  const accent = use(resource);
  return accent !== null ? (
    <span className={styles.accentHint}>{accent}</span>
  ) : (
    <span className={styles.accentHint}>/Not found/</span>
  );
};

type AccentHintProps = {
  show: boolean;
  word: string;
};

const AccentHint = ({ show, word }: AccentHintProps): React.JSX.Element | null => {
  // important, otherwise loading forever
  const resource = useMemo(() => fetchAccent(word), [word]);
  if (!show) return null;
  return (
    <Suspense fallback={<span className={styles.accentHint}> /.../</span>}>
      <AccentHintInner resource={resource} />
    </Suspense>
  );
};

export type DrillProps = {
  drillData: DrillData;
  drillDataIndex: Array<number>;
  matchWord: MatchWord;
  OutlineHint: (props: OutlineHintProps) => React.JSX.Element;
};

export const Drill = ({ drillData, drillDataIndex, matchWord, OutlineHint }: DrillProps): React.JSX.Element => {
  const [state, dispatchState] = useReducer(reduceDrillState, initialDrillState);

  // biome-ignore lint/style/noNonNullAssertion: ignore
  const i = drillDataIndex[state.drillItemIndex]!;
  // biome-ignore lint/style/noNonNullAssertion: ignore
  const item = drillData[i]!;
  const expected = item.word.trim();

  const onChangeDebounced = useDebouncedCallback((text: string) => {
    if (text.trim() === expected) {
      dispatchState({ type: 'NEXT', length: drillData.length });
    } else if (!matchWord(expected, text.trim())) {
      dispatchState({ type: 'FAIL' });
    }
  }, 100); // 100ms delay

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
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
          <AccentHint show={state.fail} word={expected} />
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
