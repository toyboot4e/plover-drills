import type { Combobox } from '@base-ui/react/combobox';
import { useMemo, useState } from 'react';
import styles from './App.module.scss';
import { MyCheckbox } from './MyCheckbox.tsx';
import { MyCombobox, type MyComboboxItem } from './MyCombobox.tsx';
import type { AccentHintProps, OutlineHintProps } from './stroke';
import './theme.css';
import { createDrillDataIndex, Drill, type DrillData, type DrillProps, type MatchWord } from './Drill';
import { getSystem, type System, type SystemName, systemNames } from './system';
import { id, useLocalStorage } from './utils.ts';

type MyComboboxDrillItem = MyComboboxItem & { drillData: DrillData };

const createComboboxDrillItems = (
  drillFiles: Array<{ name: string; drillData: DrillData }>,
): Array<MyComboboxDrillItem> =>
  drillFiles.map(({ name, drillData }) => {
    return {
      key: name,
      label: name,
      drillData,
    };
  });

const createDrillProps = (
  shuffle: boolean,
  shuffleSeed: number,
  drillItem: MyComboboxDrillItem,
  drillItemIndexKey: string,
  alwaysShowKeyboard: boolean,
  matchWord: MatchWord,
  OutlineHint: (props: OutlineHintProps) => React.JSX.Element,
  AccentHint: (props: AccentHintProps) => React.JSX.Element | null,
): { drillProps: DrillProps; fileName: string } => {
  return {
    drillProps: {
      drillData: drillItem.drillData,
      drillDataIndex: createDrillDataIndex(drillItem.drillData.length, shuffle, shuffleSeed),
      drillItemIndexKey,
      alwaysShowKeyboard,
      matchWord,
      OutlineHint,
      AccentHint,
    },
    fileName: drillItem.key,
  };
};

const defaultSystemName: SystemName = 'lapwing';

const systemItems: Array<MyComboboxItem> = [
  { key: 'lapwing', label: 'Lapwing' },
  { key: 'mejiro', label: 'Mejiro' },
];

const localStorageKey = (system: SystemName, key: string): string => `plover-drills/${system}/${key}`;

export const App = (): React.JSX.Element => {
  // states
  const [systemName, setSystemName] = useLocalStorage<SystemName>(
    'plover-drills/system',
    (s) => systemNames.find((system) => system === s) || defaultSystemName,
    id,
  );

  return <AppImpl systemName={systemName} setSystemName={setSystemName} key={systemName} />;
};

const AppImpl = ({
  systemName,
  setSystemName,
}: {
  systemName: SystemName;
  setSystemName: (systemName: SystemName) => void;
}): React.JSX.Element => {
  const [defaultSystemItem] = useState(() => systemItems.find(({ key }) => key === systemName) || systemItems[0]);

  const [shuffle, setShuffle] = useLocalStorage<boolean>(
    localStorageKey(systemName, 'shuffle'),
    (v) => v === 'true',
    String,
  );
  const [defaultShuffle] = useState(() => shuffle);

  const [shuffleSeed, setShuffleSeed] = useLocalStorage<number>(
    localStorageKey(systemName, 'shuffle-seed'),
    (s) => (s === null ? Math.random() : Number(s)),
    String,
  );

  const [alwaysShowKeyboard, setAlwaysShowKeyboard] = useLocalStorage<boolean>(
    localStorageKey(systemName, 'always-show-keyboard'),
    (v) => v === 'true',
    String,
  );
  const [defaultAlwaysShowKeyboard] = useState(() => alwaysShowKeyboard);

  const [filename, setFilename] = useLocalStorage<string | null>(localStorageKey(systemName, 'drill-name'), id, id);

  // restore other data from the states
  const onSystemChange = (drillItem: MyComboboxItem | null, _: Combobox.Root.ChangeEventDetails) => {
    if (drillItem !== null) {
      const systemName = systemNames.find((s) => s === drillItem.key);
      if (typeof systemName !== 'undefined') {
        setSystemName(systemName);
      }
    }
  };

  const system: System = getSystem(systemName);
  const comboboxDrillItems = useMemo(() => {
    return createComboboxDrillItems(system.drillFiles);
  }, [system]);

  const drill = useMemo<MyComboboxDrillItem | null>(
    () => (typeof filename === 'string' ? comboboxDrillItems.find((d) => d.key === filename) || null : null),
    [comboboxDrillItems, filename],
  );
  const [defaultDrill] = useState(() => drill);

  const drillItemIndexKey = localStorageKey(systemName, 'drill-item-index');

  // biome-ignore lint/correctness/useExhaustiveDependencies: do not shuffle on toggle
  const drillProps = useMemo<{ drillProps: DrillProps; fileName: string } | null>(
    () =>
      drill
        ? createDrillProps(
            shuffle,
            shuffleSeed,
            drill,
            drillItemIndexKey,
            alwaysShowKeyboard,
            system.matchWord,
            system.OutlineHint,
            system.AccentHint,
          )
        : null,
    [drill, shuffle, shuffleSeed, drill, drillItemIndexKey, alwaysShowKeyboard, system],
  );

  const onChangeDrill = (
    drillItem: (MyComboboxItem & { drillData: DrillData }) | null,
    _: Combobox.Root.ChangeEventDetails,
  ) => {
    setFilename(drillItem?.key ?? null);
    setShuffleSeed(Math.random());
    // Discard the item index state. TODO: This is too hacky.
    localStorage.removeItem(drillItemIndexKey);
  };

  return (
    <>
      <h1 className={styles.header}>Plove Drills</h1>
      <main className={styles.main}>
        <p>Choose your system</p>
        <MyCombobox
          items={systemItems}
          width='100%'
          defaultValue={defaultSystemItem}
          placeholder={'System'}
          onValueChange={onSystemChange}
        />
        <p className={styles.checkboxContainer} style={{ display: 'flex' }}>
          Choose your drill
          <MyCheckbox
            title='Shuffle'
            checked={shuffle}
            defaultChecked={defaultShuffle}
            onCheckedChange={(shuffle, _) => {
              setShuffle(shuffle);
            }}
          />
          <MyCheckbox
            title='Always show keyboard'
            checked={alwaysShowKeyboard}
            defaultChecked={defaultAlwaysShowKeyboard}
            onCheckedChange={(alwaysShowKeyboard, _) => {
              setAlwaysShowKeyboard(alwaysShowKeyboard);
            }}
          />
        </p>
        <MyCombobox
          items={comboboxDrillItems}
          placeholder='Drill'
          emptyString='No drill found'
          width='100%'
          defaultValue={defaultDrill}
          onValueChange={onChangeDrill}
        />
        {drillProps && <Drill {...drillProps.drillProps} key={drillProps.fileName} />}
      </main>
      <system.Footer className={styles.footer} />
    </>
  );
};
