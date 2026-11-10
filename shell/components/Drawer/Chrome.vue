<script setup lang="ts">
/**
 * @deprecated Use `RcDrawer` with `RcDrawerHeader` and `RcDrawerFooter` from
 * `@components/RcDrawer`, which this is now built on. Kept for extensions that
 * still import it.
 */
import { RcDrawer, RcDrawerFooter, RcDrawerHeader } from '@components/RcDrawer';
import { Props } from './types';

defineProps<Props>();
const emit = defineEmits(['close']);
</script>

<template>
  <RcDrawer @close="emit('close')">
    <template #header>
      <slot name="header">
        <RcDrawerHeader :title="ariaTarget">
          <slot name="title" />
        </RcDrawerHeader>
      </slot>
    </template>
    <slot name="body" />
    <template
      v-if="!removeFooter"
      #footer
    >
      <slot name="footer">
        <RcDrawerFooter :secondary-label="closeLabel">
          <template #primary>
            <slot name="additional-actions" />
          </template>
        </RcDrawerFooter>
      </slot>
    </template>
  </RcDrawer>
</template>
