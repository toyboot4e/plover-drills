import type { Combobox } from '@base-ui/react/combobox';
import { useMemo, useState } from 'react';
import styles from './App.module.scss';
import { MyCheckbox } from './MyCheckbox.tsx';
import { MyCombobox, type MyComboboxItem } from './MyCombobox.tsx';
import './theme.css';
import { createDrillDataIndex, Drill, type DrillData, type DrillProps } from './Drill';
import { drillFiles, matchWord } from './drill/Lapwing';
import { id, useLocalStorage } from './utils.ts';

type MyComboboxDrillItem = MyComboboxItem & { drillData: DrillData };

const combobboxDrillItems: Array<MyComboboxDrillItem> = drillFiles.map(({ name, drillData }) => {
  return { key: name, label: name, drillData };
});

const createDrillProps = (shuffle: boolean, drillItem: MyComboboxDrillItem): DrillProps & { filename: string } => {
  return {
    drillData: drillItem.drillData,
    drillDataIndex: createDrillDataIndex(drillItem.drillData.length, shuffle),
    matchWord,
    filename: drillItem.key,
  };
};

const localStorageKeys = {
  shuffle: 'plover-drills/shuffle',
  drillName: 'plover-drills/drill-name',
};

export const App = (): React.JSX.Element => {
  // states
  const [shuffle, setShuffle] = useLocalStorage<boolean>(localStorageKeys.shuffle, (v) => v === 'true', String);
  const [defaultShuffle] = useState(() => shuffle);
  const [filename, setFilename] = useLocalStorage<string | null>(localStorageKeys.drillName, id, id);

  // restore other data from the states
  const drill = useMemo<(MyComboboxItem & { drillData: DrillData }) | null>(
    () => (typeof filename === 'string' ? combobboxDrillItems.find((d) => d.key === filename) || null : null),
    [filename],
  );
  const [defaultDrill] = useState(() => drill);

  // biome-ignore lint/correctness/useExhaustiveDependencies: do not shuffle on toggle
  const drillProps = useMemo<(DrillProps & { filename: string }) | null>(
    () => (drill ? createDrillProps(shuffle, drill) : null),
    [drill],
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
          items={combobboxDrillItems}
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
            matchWord={drillProps.matchWord}
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
