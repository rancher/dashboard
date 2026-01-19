import { BOTTOM, LEFT, RIGHT } from '@shell/utils/position';

export const STORAGE_KEY = {
  [BOTTOM]: 'wm-height',
  [LEFT]:   'wm-vl-width',
  [RIGHT]:  'wm-vr-width',
  pin:      'wm-pin',
};

export const CSS_KEY = {
  [RIGHT]:  '--wm-vr-width',
  [LEFT]:   '--wm-vl-width',
  [BOTTOM]: '--wm-height',
};

export const Z_INDEX = {
  WM:         1000,
  PIN_EFFECT: 996,
  RIGHT:      999,
  LEFT:       999,
  BOTTOM:     999,
  CENTER:     997,
};
