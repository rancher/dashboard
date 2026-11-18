export type RcSeparatorOrientation = 'horizontal' | 'vertical';

export interface RcSeparatorProps {
  /**
   * Purely cosmetic separator that is hidden from the accessibility tree.
   *
   * Set to `false` when the separator conveys meaning, for example when
   * grouping tems within a menu or a listbox.
   */
  decorative?: boolean;

  /**
   * Orientation of the separator. Drives `aria-orientation` when the
   * separator is not decorative.
   */
  orientation?: RcSeparatorOrientation;
}
