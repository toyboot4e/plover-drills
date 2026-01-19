'use client';
import { Combobox } from '@base-ui/react/combobox';
import * as React from 'react';
import styles from './MyCombobox.module.scss';

export interface MyComboboxItem {
  key: string;
  label: string;
}

export type MyComboboxProps<T extends MyComboboxItem> = {
  items: Array<T>;
  placeholder: string;
  emptyString: string;
  width: string;
  defaultValue: T | null;
  onValueChange?: (value: T | null, eventDetails: Combobox.Root.ChangeEventDetails) => void;
};

/**
 * https://base-ui.com/react/components/combobox
 */
export const MyCombobox = <T extends MyComboboxItem>({
  items,
  placeholder,
  emptyString,
  width,
  defaultValue,
  onValueChange,
}: MyComboboxProps<T>): React.JSX.Element => {
  const id = React.useId();
  return (
    <Combobox.Root items={items} defaultValue={defaultValue} onValueChange={onValueChange}>
      <div className={styles.Label} style={{ width }}>
        <div className={styles.InputWrapper}>
          <Combobox.Input placeholder={placeholder} id={id} className={styles.Input} style={{ width }} />
          <div className={styles.ActionButtons}>
            <Combobox.Clear className={styles.Clear} aria-label='Clear selection'>
              <ClearIcon className={styles.ClearIcon} />
            </Combobox.Clear>
            <Combobox.Trigger className={styles.Trigger} aria-label='Open popup'>
              <ChevronDownIcon className={styles.TriggerIcon} />
            </Combobox.Trigger>
          </div>
        </div>
      </div>

      <Combobox.Portal>
        <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
          <Combobox.Popup className={styles.Popup}>
            <Combobox.Empty className={styles.Empty}>{emptyString}</Combobox.Empty>
            <Combobox.List className={styles.List}>
              {(item) => (
                <Combobox.Item key={item.key} value={item} className={styles.Item}>
                  <Combobox.ItemIndicator className={styles.ItemIndicator}>
                    <CheckIcon className={styles.ItemIndicatorIcon} />
                  </Combobox.ItemIndicator>
                  <div className={styles.ItemText}>{item.label}</div>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
};

const CheckIcon = (props: React.ComponentProps<'svg'>): React.JSX.Element => {
  return (
    <svg fill='currentcolor' width='10' height='10' viewBox='0 0 10 10' {...props}>
      <title>check</title>
      <path d='M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z' />
    </svg>
  );
};

const ClearIcon = (props: React.ComponentProps<'svg'>): React.JSX.Element => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...props}
    >
      <title>clear</title>
      <path d='M18 6L6 18' />
      <path d='M6 6l12 12' />
    </svg>
  );
};

const ChevronDownIcon = (props: React.ComponentProps<'svg'>): React.JSX.Element => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...props}
    >
      <title>chevron down</title>
      <path d='M6 9l6 6 6-6' />
    </svg>
  );
};
