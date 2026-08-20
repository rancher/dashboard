import type { RcModalSize } from './types';

export const RC_MODAL_WIDTHS: Record<RcModalSize, number> = {
  small:  480,
  medium: 640,
  large:  960,
};

/**
 * The CSS width for a modal size, falling back to `medium` for anything that is
 * not one of the three. `size` is only a compile-time constraint, and untyped
 * callers reach it through `shell.modal.open()`.
 */
export const widthFor = (size?: RcModalSize | null): string => {
  const width = RC_MODAL_WIDTHS[size as RcModalSize] ?? RC_MODAL_WIDTHS.medium;

  return `${ width }px`;
};
