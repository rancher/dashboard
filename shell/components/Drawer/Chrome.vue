<script setup lang="ts">
/**
 * Deprecated: use `RcDrawer` from `@components/RcDrawer`. It takes `title`
 * where this takes `ariaTarget`, and the body in its default slot.
 */
import { RcDrawer } from '@components/RcDrawer';
import { Props } from './types';

defineProps<Props>();
defineEmits(['close']);
</script>

<template>
  <RcDrawer
    :title="ariaTarget"
    :close-label="closeLabel"
    @close="$emit('close')"
  >
    <template
      v-if="$slots.title"
      #title
    >
      <slot name="title" />
    </template>
    <slot name="body" />
    <template
      v-if="$slots['additional-actions']"
      #additional-actions
    >
      <slot name="additional-actions" />
    </template>
  </RcDrawer>
</template>
