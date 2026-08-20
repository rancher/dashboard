/**
 * The three modal widths defined by the design system.
 */
export type RcModalSize = 'small' | 'medium' | 'large';

export interface RcModalProps {
  /**
   * Whether the modal is open. The modal animates in and out as this changes,
   * so it stays rendered while closed rather than being removed with `v-if`.
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
   * The modal width.
   * - `small` (480px): confirmations and single-field prompts.
   * - `medium` (640px): the default, short forms.
   * - `large` (960px): long forms, tables and side-by-side content.
   */
  size?: RcModalSize;

  /**
   * When false, clicking the background or pressing `Esc` will not close the
   * modal. Use for modals whose work must not be abandoned half-done.
   */
  clickToClose?: boolean;
}
