<script setup lang="ts">
/**
 * A heading whose outline level and visual size are chosen separately, so a level is only ever
 * picked for structure.
 *
 * The element carries no style of its own, because an `h1`-`h6` tag imparts none: wrapping content
 * in a heading cannot restyle it. `size` is the opt-in, and takes the scale from the
 * `text-h1`-`text-h6` classes in the shell's `_typography.scss`.
 *
 * Example:
 *
 * <RcHeading size="h4">Language</RcHeading>        <!-- an h2 that looks like an h4 -->
 * <RcHeading :level="2" size="h4">Change Password</RcHeading>   <!-- a dialog title -->
 * <RcHeading>{{ title }}</RcHeading>              <!-- an h2 that looks like its surroundings -->
 */
import { computed } from 'vue';
import { useHeadingLevel } from './useHeadingLevel';
import type { RcHeadingProps } from './types';

const props = defineProps<RcHeadingProps>();

const sectionLevel = useHeadingLevel();

const tag = computed(() => `h${ props.level ?? sectionLevel.value }`);

</script>

<template>
  <component
    :is="tag"
    :class="props.size ? `text-${ props.size }` : null"
  >
    <slot />
  </component>
</template>
