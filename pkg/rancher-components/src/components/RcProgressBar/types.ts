import type { BarColor, BarCustomColor } from '@components/utils/barColors';

export const RC_PROGRESS_BAR_SIZES = ['small', 'medium'] as const;

export type RcProgressBarSize = typeof RC_PROGRESS_BAR_SIZES[number];

export type RcProgressBarColor = BarColor | BarCustomColor;

export interface RcProgressBarProps {
  /**
   * The current progress. Values outside `min` and `max`, including infinite values, are clamped
   * to that range, and `NaN` is treated as `min`.
   */
  value: number;

  /**
   * The value at which the bar is empty. `NaN` and infinite values are treated as `0`.
   */
  min?: number;

  /**
   * The value at which the bar is full. When it is not greater than `min`, or is `NaN` or
   * infinite, the bar shows as empty.
   */
  max?: number;

  /**
   * Height of the bar: `small` is 4px and `medium` is 7px.
   */
  size?: RcProgressBarSize;

  /**
   * Color of the fill. Defaults to `info` (blue). One of:
   *
   * - Status: `error`, `warning`, `unknown`, `info`, `success`
   * - Severity: `critical`, `high`, `medium`, `low`, `none`
   * - The name of a CSS custom property, such as `--primary`
   */
  color?: RcProgressBarColor;

  /**
   * Sweeps a highlight across the fill, from the start of the bar to the end, to show that work is
   * still running while the value isn't changing. The bar is also marked `aria-busy`. The sweep
   * isn't shown when reduced motion is preferred.
   */
  active?: boolean;

  /**
   * Accessible name for the progress bar, describing what is progressing. Every progress bar
   * needs a name: provide either this prop or an `aria-labelledby` attribute that points at a
   * visible label.
   */
  ariaLabel?: string;

  /**
   * Human readable text for the current value, read by assistive technology in place of the
   * number, for example `3 of 8 nodes ready`.
   */
  ariaValuetext?: string;
}
