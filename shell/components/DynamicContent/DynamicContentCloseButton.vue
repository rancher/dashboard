<script setup lang="ts">
/**
 * Common close button for dynamic component banners and panels
 */

import { useStore } from 'vuex';
import { RcButton } from '@components/RcButton';

const props = defineProps<{id: string}>();
const store = useStore();

/*
 * Marks the notification as read when the close button is clicked
 */
const markRead = () => {
  store.dispatch('notifications/markRead', props.id);
};
</script>
<template>
  <RcButton
    variant="ghost"
    size="small"
    :aria-label="t('dynamicContent.action.close')"
    tabindex="0"
    @click="markRead()"
  >
    <i class="dc-close-button icon icon-close" />
  </RcButton>
</template>
<style lang="scss" scoped>
  .dc-close-button {
    opacity: 0.5;
    cursor: pointer;
    border: 1px solid transparent;
    padding: 4px;
    border-radius: 4px;

    &:hover {
      opacity: 1;
    }
  }
</style>
