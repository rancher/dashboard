import { wrapIfVar } from '@components/utils/status';

export const BarStatusColors = {
  error:   '--rc-bar-status-error',
  warning: '--rc-bar-status-warning',
  unknown: '--rc-bar-status-unknown',
  info:    '--rc-bar-status-info',
  success: '--rc-bar-status-success',
} as const;

export const BarSeverityColors = {
  critical: '--rc-bar-severity-critical',
  high:     '--rc-bar-severity-high',
  medium:   '--rc-bar-severity-medium',
  low:      '--rc-bar-severity-low',
  none:     '--rc-bar-severity-none',
} as const;

export const BarColors = { ...BarStatusColors, ...BarSeverityColors };

export type BarStatusColor = keyof typeof BarStatusColors;
export type BarSeverityColor = keyof typeof BarSeverityColors;
export type BarColor = BarStatusColor | BarSeverityColor;
export type BarCustomColor = `--${ string }`;

/**
 * Resolve a named bar color, or the name of a CSS custom property, to a CSS color value.
 */
export function barColorValue(color: BarColor | BarCustomColor): string {
  const colorVar = Object.prototype.hasOwnProperty.call(BarColors, color) ? BarColors[color as BarColor] : color;

  return wrapIfVar(colorVar);
}
