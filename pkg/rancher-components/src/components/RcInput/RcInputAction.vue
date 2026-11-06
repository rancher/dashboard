<script setup lang="ts">
/**
 * An icon button that sits inside an input's box.
 *
 * Example:
 *
 * <rc-input-action icon="close" :label="t('component.rcInput.clear')" size="medium" @click="clear" />
 */
import RcButton from '@components/RcButton/RcButton.vue';
import RcIcon from '@components/RcIcon/RcIcon.vue';
import type { RcIconType } from '@components/RcIcon/types';
import type { RcFieldSize } from '@components/RcField/types';

const props = withDefaults(defineProps<{
  /**
   * The icon to draw.
   */
  icon: RcIconType;

  /**
   * The accessible name of the button.
   */
  label: string;

  /**
   * The size of the field the button sits in.
   */
  size?: RcFieldSize;
}>(), { size: 'medium' });
</script>

<template>
  <rc-button
    type="button"
    variant="ghost"
    size="inherit"
    :class="['rc-input-action', `rc-input-action-${ props.size }`]"
    :aria-label="props.label"
  >
    <rc-icon
      :type="props.icon"
      size="inherit"
    />
  </rc-button>
</template>

<style lang="scss" scoped>
// RcIcon has no 12px size, so the icon takes the button's font size
.rc-input-action {
  &.rc-input-action-small {
    font-size: 12px;
  }

  &.rc-input-action-medium {
    font-size: 14px;
  }

  &.rc-input-action-large {
    font-size: 16px;
  }
}
</style>
