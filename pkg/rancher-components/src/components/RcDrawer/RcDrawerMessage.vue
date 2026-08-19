<script setup lang="ts">
/**
 * A centred icon and message for a drawer body that has nothing to show:
 * an error, an empty result, or a prompt to pick something.
 *
 * ```html
 * <RcDrawerMessage icon="icon-warning">
 *   Could not load the data
 * </RcDrawerMessage>
 * ```
 *
 * The icon is decorative and hidden from assistive technology: the message
 * itself has to carry the meaning.
 */
import type { RcDrawerMessageProps } from './types';

defineProps<RcDrawerMessageProps>();
</script>

<template>
  <div class="rc-drawer-message">
    <i
      v-if="icon"
      class="icon"
      :class="icon"
      aria-hidden="true"
    />
    <div>
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.rc-drawer-message {
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  font-size: 16px;
  margin: 40px;
  text-align: center;

  > .icon {
    font-size: 64px;
    margin-bottom: 20px;
    opacity: 0.5;
  }
}
</style>
