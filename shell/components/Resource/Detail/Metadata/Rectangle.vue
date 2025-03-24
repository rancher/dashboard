<script setup lang="ts">
import { withDefaults } from 'vue';

export interface RectangleProps {
    outline?: boolean;
}

const { outline } = withDefaults(
  defineProps<RectangleProps>(),
  { outline: false }
);

</script>

<template>
  <div
    class="rectangle"
    :class="{outline}"
  >
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.rectangle {
    border: 1px solid var(--tag-bg);
    border-radius: 4px;
    padding: 4px;

    &:not(.outline) {
        background-color: var(--tag-bg);
    }
}
</style>
