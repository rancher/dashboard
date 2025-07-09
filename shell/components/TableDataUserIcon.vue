<script setup lang="ts">
import { computed } from 'vue';

import { ucFirst } from '@shell/utils/string';

const props = defineProps<{
  userState: string,
  isActive: boolean
}>();

const iconClass = computed(() => {
  const userIcon = `icon-user-${ props.isActive ? 'check' : 'xmark' }`;
  const iconColor = `icon-color-${ props.isActive ? 'green' : 'red' }`;

  return {
    icon:        true,
    'icon-lg':   true,
    [userIcon]:  true,
    [iconColor]: true,
  };
});
</script>

<template>
  <div class="icon-center">
    <i
      v-clean-tooltip="ucFirst(userState)"
      :class="iconClass"
    />
  </div>
</template>

<style lang="scss" scoped>
  .icon-center {
    display: flex;
    flex-direction: row;
    justify-content: center;
  }

  .icon-color-green {
    color: var(--success);
  }

  .icon-color-red {
    color: var(--error);
  }
</style>
