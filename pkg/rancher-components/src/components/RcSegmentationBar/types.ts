import type { BarColor, BarSeverityColor, BarStatusColor } from '@components/utils/barColors';

export const RC_SEGMENTATION_BAR_SIZES = ['small', 'medium'] as const;

export type RcSegmentationBarSize = typeof RC_SEGMENTATION_BAR_SIZES[number];

export type RcSegmentColor = BarColor;
export type RcSegmentStatusColor = BarStatusColor;
export type RcSegmentSeverityColor = BarSeverityColor;

export interface RcSegment {
  /**
   * The amount this segment represents. Its share of the bar is its value over the sum of the
   * values of every visible segment, so the visible segments always fill the bar whatever their
   * scale. Segments with a value of zero, a negative value, `NaN` or an infinite value take no
   * space, and a segment changing to or from such a value grows or shrinks into place.
   */
  value: number;

  /**
   * Which color from the status (`error`, `warning`, `unknown`, `info`, `success`) or the
   * severity (`critical`, `high`, `medium`, `low`, `none`) palette fills the segment.
   */
  color: RcSegmentColor;

  /**
   * The translated name of what the segment counts, for example `Error`. It is used to build the
   * bar's accessible name.
   */
  label: string;
}

export interface RcSegmentationBarProps {
  /**
   * The segments to show, from left to right. Visible segments always stretch to cover the full
   * width of the bar.
   */
  segments: RcSegment[];

  /**
   * Height of the bar: `small` is 4px and `medium` is 7px.
   */
  size?: RcSegmentationBarSize;

  /**
   * Accessible name for the bar. Defaults to a summary of the visible segments, such as
   * `Error: 2, Warning: 5`.
   */
  ariaLabel?: string;
}
