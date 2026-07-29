import * as mejiro31 from './keyboard/mejiro31';
import * as taipo from './keyboard/taipo';
import type { Keyboard, KeyboardName } from './keyboard/types';
import * as uniV4 from './keyboard/uniV4';

export const getKeyboard = (kbd: KeyboardName): Keyboard => {
  switch (kbd) {
    case 'UniV4':
      return uniV4.keyboard;
    case 'Mejiro31':
      return mejiro31.keyboard;
    case 'Taipo':
      return taipo.keyboard;
  }
};
