<script setup lang="ts">
/**
 * A section heading: an `h2`, one level below the page title's `h1`, with a look set by `size`
 * rather than by the level. Use it for a section of a page or the title of a dialog.
 *
 * Example:
 *
 * <RcHeading :size="4">Language</RcHeading>
 */
import type { RcHeadingProps } from './types';

defineProps<RcHeadingProps>();
</script>

<template>
  <h2 :class="`size-${ size }`">
    <slot />
  </h2>
</template>

<style lang="scss" scoped>
h2 {
  margin: 0 0 10px 0;
  color: var(--body-text);
  font-family: var(--title-font-family, unset);
  font-style: normal;
  font-weight: 400;
  text-transform: none;
}

.size-1 {
  font-size: 24px;
}

.size-2 {
  font-size: $font-size-h2;
}

.size-3 {
  font-size: 18px;
}

.size-4 {
  font-size: 16px;
}

.size-5 {
  font-size: 14px;
}

.size-6 {
  font-size: 12px;
  text-transform: uppercase;
}
</style>
