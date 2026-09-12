import { computed, inject, provide, type ComputedRef } from 'vue';
import type { HeadingLevel } from './types';

const RC_HEADING_LEVEL_KEY = 'rc-heading-level';

/** Sections nested deeper than this share a level, because there is no `h7`. */
export const MAX_HEADING_LEVEL: HeadingLevel = 6;

/** The level for a heading one step inside `level`. */
export function nextHeadingLevel(level: HeadingLevel): HeadingLevel {
  return Math.min(level + 1, MAX_HEADING_LEVEL) as HeadingLevel;
}

/**
 * The level a heading rendered at this point in the component tree should use.
 *
 * `2` unless an enclosing section says otherwise, which is the level of a section heading sitting
 * directly under a page masthead's `h1`.
 */
export function useHeadingLevel(): ComputedRef<HeadingLevel> {
  const level = inject<ComputedRef<HeadingLevel> | null>(RC_HEADING_LEVEL_KEY, null);

  return computed(() => level?.value ?? 2);
}

/** Set the level `useHeadingLevel` reports for everything below this component. */
export function provideHeadingLevel(level: ComputedRef<HeadingLevel>): void {
  provide(RC_HEADING_LEVEL_KEY, level);
}
