<script setup lang="ts">
import { computed } from 'vue';
import type { RcSeparatorProps } from './types';

const props = withDefaults(defineProps<RcSeparatorProps>(), {
  decorative:  true,
  orientation: 'horizontal',
});

/**
 * Decorative separators are removed from the accessibility tree so that screen
 * readers skip over them. Meaningful separators keep the `separator` role and
 * expose their orientation.
 */
const role = computed(() => (props.decorative ? 'none' : 'separator'));

const ariaOrientation = computed(() => (props.decorative ? undefined : props.orientation));
</script>

<template>
  <hr
    :role="role"
    :aria-orientation="ariaOrientation"
    :class="{ vertical: props.orientation === 'vertical' }"
  >
</template>

<style lang="scss" scoped>
hr.vertical {
  align-self: stretch;
  height: auto;
  margin: 0;
  border-top: none;
  border-left: 1px solid var(--border);
}
</style>
