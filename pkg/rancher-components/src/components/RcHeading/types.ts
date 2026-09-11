export type HeadingSize = 1 | 2 | 3 | 4 | 5 | 6;

export interface RcHeadingProps {
  /**
   * Which heading's look to render with, from `1` (the largest) to `6`. It is a look only: the
   * title is a `div`, so it never appears in the page's heading outline.
   */
  size: HeadingSize;
}
