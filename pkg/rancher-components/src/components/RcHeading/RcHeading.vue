<script setup lang="ts">
/**
 * A section title, with a look set by `size` rather than by a heading tag. It renders a `div`, so
 * it carries no outline level and adds nothing to the page's heading structure.
 *
 * Example:
 *
 * <RcHeading :size="4">Language</RcHeading>
 */
import type { RcHeadingProps } from './types';

defineProps<RcHeadingProps>();
</script>

<template>
  <div :class="`size-${ size }`">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
div {
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
  font-size: 21px;
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
