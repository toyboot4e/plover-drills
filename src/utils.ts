import { useEffect, useState } from 'react';

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
