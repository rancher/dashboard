<script setup lang="ts">
import { computed, defineEmits } from 'vue';

defineEmits(['click']);

type Props = {
  borderless?: boolean;
  invisible?: boolean;
}

const props = defineProps<Props>();

const buttonClass = computed(() => {
  return {
    borderless: props?.borderless,
    invisible:  props?.invisible,
  };
});
</script>

<template>
  <button
    type="button"
    class="btn btn-sm role-multi-action actions"
    :class="buttonClass"
    @click="(e: Event) => $emit('click', e)"
  >
    <i class="icon icon-actions" />
  </button>
</template>

<style lang="scss" scoped>
.borderless {
  background-color: transparent;
  border: none;
  &:hover, &:focus {
    background-color: var(--accent-btn);
    box-shadow: none;
  }
}
</style>
