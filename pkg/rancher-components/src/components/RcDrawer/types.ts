export interface RcDrawerProps {
  /**
   * The drawer title. Renders in the header and names the drawer for assistive
   * technology. The `title` slot replaces what the header shows, but this
   * still names the drawer, so keep it to the plain text of that slot.
   */
  title: string;

  /**
   * The footer close button's text, such as Cancel when the drawer has an
   * action to save. Defaults to Close. When set, the button is named by this
   * text rather than by the drawer it closes.
   */
  closeLabel?: string;
}
