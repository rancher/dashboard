export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type HeadingSize = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export interface RcHeadingProps {
  /**
   * Outline level of the heading, rendered as the matching `h1`-`h6` tag.
   *
   * Omit it to take the level from the enclosing section: `2` at the top of a page, one deeper
   * inside each `RcSection` that renders a header. Pass it only where the surrounding structure
   * cannot say, such as a dialog, which opens over the page rather than inside it.
   */
  level?: HeadingLevel;

  /**
   * Which heading's size to render at.
   *
   * This is what lets a heading sit at the level the outline needs while keeping the size the
   * layout needs: `<RcHeading :level="2" size="h4" />` is an `h2` that looks like an `h4`.
   *
   * Omit it where the surrounding markup already styles the text and the heading is there only to
   * put it in the outline. The element then imparts nothing of its own.
   */
  size?: HeadingSize;
}
