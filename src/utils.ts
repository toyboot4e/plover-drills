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
