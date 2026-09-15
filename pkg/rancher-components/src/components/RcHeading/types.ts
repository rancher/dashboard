export type HeadingSize = 1 | 2 | 3 | 4 | 5 | 6;

export interface RcHeadingProps {
  /**
   * Which heading's look to render with, from `1` (the largest) to `6`. It does not affect the
   * outline level, so `<RcHeading :size="4" />` is a section heading that looks like an `h4`.
   */
  size: HeadingSize;
}
