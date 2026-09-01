import { BOTTOM, CENTER, LEFT, RIGHT } from '@shell/utils/position';

// Defines the possible layouts where the window manager can be used.
export const enum Layout {
  default = 'default', // eslint-disable-line no-unused-vars
  home = 'home', // eslint-disable-line no-unused-vars
  plain = 'plain', // eslint-disable-line no-unused-vars
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
