<script setup lang="ts">
import { computed } from 'vue';

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
    role="button"
    :class="buttonClass"
    @click="(e: Event) => $emit('click', e)"
  >
    <i
      class="icon icon-actions"
      :alt="t('sortableTable.tableActionsImgAlt')"
    />
  </button>
</template>

<style lang="scss" scoped>
.borderless {
  background-color: transparent;
  border: none;

  &:focus-visible {
    @include focus-outline;
    outline-offset: -2px;
  }

  &:hover, &:focus {
    background-color: var(--accent-btn);
    box-shadow: none;
  }
}
</style>
