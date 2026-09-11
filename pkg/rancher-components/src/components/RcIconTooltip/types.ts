import type { TooltipOptions } from '@shell/directives/clean-tooltip';

/**
 * The tooltip text, or a floating-vue options object carrying it alongside
 * options such as popperClass.
 */
export type IconTooltipContent = string | TooltipOptions | null;
