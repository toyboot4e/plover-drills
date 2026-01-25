import { useEffect, useRef, useState } from 'react';

export const id = <T>(x: T): T => x;

export const useLocalStorage = <T>(
  key: string,
  fromLocalStorage: (s: string | null) => T,
  toLocalStorage: (v: T) => string | null,
): [T, (newState: T | ((prevState: T) => T)) => void] => {
  const [v, setV] = useState(() => {
    return fromLocalStorage(localStorage.getItem(key));
  });

  useEffect(() => {
    const s = toLocalStorage(v);
    if (s === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, s);
    }
  }, [v, key, toLocalStorage]);

  return [v, setV];
};

// TODO: avoid any
// biome-ignore lint/suspicious/noExplicitAny: ignore
export const useDebouncedCallback = <T extends (...args: any[]) => void>(callback: T, delay: number) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (...args: Parameters<T>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  };
};

/**
 * O(n) Sorts an array randomly based on a seed.
 * https://stackoverflow.com/a/53758827
 */
export const shuffleArray = <T>(array: Array<T>, seed: number): Array<T> => {
  if (array.length === 0) return array;

  let m = array.length;
  let t = array[0];

  // While there remain elements to shuffle…
  while (m) {
    // Pick a remaining element…
    const i = Math.floor(random(seed) * m--);
    seed += 1;

    // And swap it with the current element.
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
};

const random = (seed: number): number => {
  var x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};
