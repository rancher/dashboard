/**
 * The three modal widths defined by the design system.
 */
export type RcModalSize = 'small' | 'medium' | 'large';

export interface RcModalProps {
  /**
   * Whether the modal is open. The modal owns no visibility state of its own,
   * so it stays open until the consumer sets this false in response to `close`.
   */
  show?: boolean;

  /**
   * The modal title. Renders as the modal's heading and names it for assistive
   * technology. Use the `title` slot instead when the heading needs markup.
   *
   * With neither, the modal renders no heading and has no accessible name, so
   * only leave both out for a modal whose body is self-describing.
   */
  title?: string;

  /**
   * The modal width, borders and padding included.
   * - `small` (480px): confirmations and single-field prompts.
   * - `medium` (640px): the default, short forms.
   * - `large` (960px): long forms, tables and side-by-side content.
   */
  size?: RcModalSize;

  /**
   * When false, clicking the background does not emit `close`. Use for modals
   * whose work must not be abandoned by a stray click. `Esc` closes either way,
   * so the modal is never a keyboard trap.
   */
  clickToClose?: boolean;
}

/**
 * The width of each size, in pixels, as the design system specs them.
 *
 * Not `rem`: the shell pins the root font size (`HTML, BODY { font-size: 14px }`
 * in `shell/assets/styles/base/_typography.scss`), so a rem in dashboard is a
 * fixed 14px and tracks nothing the user has set. It would buy no scaling here,
 * and it would put these three off the spec, at 34.29rem, 45.71rem and 68.57rem.
 * Browser zoom, which is what actually scales a modal, scales px as it is.
 */
export const RC_MODAL_WIDTHS: Record<RcModalSize, number> = {
  small:  480,
  medium: 640,
  large:  960,
};

/**
 * The CSS width for a modal size, falling back to `medium` for anything that is
 * not one of the three.
 */
export const widthFor = (size?: RcModalSize | null): string => {
  const width = RC_MODAL_WIDTHS[size as RcModalSize] ?? RC_MODAL_WIDTHS.medium;

  return `${ width }px`;
};
