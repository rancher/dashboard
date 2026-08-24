/**
 * A button in the drawer footer, beside the built-in Close.
 *
 * Shaped after `ActionConfig` in RcSection. The one difference is `icon`,
 * which is an icon-font class here rather than an `RcIconType`, because that
 * is what the drawers' existing icons are.
 */
export interface RcDrawerAction {
  /** Button label. */
  label: string;

  /** Callback invoked when the action is clicked. */
  action: () => void;

  /** Visual weight. Defaults to `'primary'`, the usual role for a drawer's action. */
  variant?: 'primary' | 'secondary';

  /** Accessible label, when the visible label needs more context for a screen reader. */
  ariaLabel?: string;

  /** Icon class rendered before the label, e.g. `'icon-plus'`. */
  icon?: string;

  /** `data-testid` for the button. */
  testid?: string;
}

export interface RcDrawerProps {
  /**
   * The drawer's title. Rendered in the header, and used to give the close
   * controls an accessible name. Use the `title` slot when the header needs
   * richer content than a string; the prop still names the close controls.
   */
  title: string;

  /**
   * Buttons for the footer, rendered after the built-in Close. Use the
   * `footer` slot instead when the footer needs something that is not a row of
   * buttons.
   */
  actions?: RcDrawerAction[];

  /**
   * Render a spinner in place of the body, so every drawer waits the same way.
   *
   * Only for a drawer that has *nothing* to show until a fetch lands. A drawer
   * that can already render part of itself should show that and let the
   * pending part fill in, rather than hiding what it has behind a spinner.
   */
  loading?: boolean;

  /**
   * Hide the footer entirely. Use for drawers that are purely informational
   * and have no actions to offer.
   */
  hideFooter?: boolean;

  /**
   * Whether the drawer is modal, i.e. whether the rest of the page is
   * unavailable while it is open. Defaults to `true`, which is what a drawer
   * opened through the slide-in API is: it has a glass overlay and a focus
   * trap. Set `false` for a drawer that sits alongside live content, so that
   * assistive technology is not told the page behind it has gone away.
   */
  modal?: boolean;
}

export interface RcDrawerMessageProps {
  /**
   * Icon class for the decorative graphic above the message, e.g.
   * `'icon-warning'`. It is hidden from assistive technology, so the message
   * itself has to carry the meaning.
   */
  icon?: string;
}
