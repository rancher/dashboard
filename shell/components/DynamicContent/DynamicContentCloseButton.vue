<script setup lang="ts">
/**
 * Common close button for dynamic component banners and panels
 */

import { useStore } from 'vuex';

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
  <i
    class="dc-close-button icon icon-close"
    @click="markRead()"
  />
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
      color: var(--primary);
      border-color: var(--primary);
    }
  }
</style>
