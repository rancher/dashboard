import { BOTTOM, CENTER, LEFT, RIGHT } from '@shell/utils/position';

export const enum Layout {
  default = 'default', // eslint-disable-line no-unused-vars
  home = 'home', // eslint-disable-line no-unused-vars
}

export type Position = typeof BOTTOM | typeof LEFT | typeof RIGHT | typeof CENTER;

export interface Tab {
  id: string,
  icon: string,
  label: string,
  component?: string,
  extensionId?: string,
  position: Position,
  layouts: Layout[],
  showHeader: boolean,
  containerHeight: number | null,
  containerWidth: number | null,
  attrs?: Record<string, any>,
}
