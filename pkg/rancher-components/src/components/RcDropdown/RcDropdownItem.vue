<script setup lang="ts">
/**
 * An item for a dropdown menu. Used in conjunction with RcDropdown.
 */
import { useDropdownItem } from '@components/RcDropdown/useDropdownItem';

const props = defineProps({
  disabled:             Boolean,
  /**
   * For a command that changes the checkbox or radio items beside it, eg Select All or Reset: the
   * menu stays open, as it does for those items, so their new state shows. The focus stays on the
   * command, so a screen reader hears nothing of that: say what changed in a live region
   */
  actsOnCheckableItems: Boolean,
});
const emits = defineEmits(['click']);

const {
  handleKeydown,
  close,
  handleActivate,
  scrollIntoView,
  handleMouseenter,
} = useDropdownItem();

const handleClick = (e: MouseEvent) => {
  if (props.disabled) {
    return;
  }

  emits('click', e);

  if (!props.actsOnCheckableItems) {
    close();
  }
};

</script>

<template>
  <div
    ref="dropdownMenuItem"
    dropdown-menu-item
    tabindex="-1"
    role="menuitem"
    :disabled="disabled || null"
    :aria-disabled="disabled || false"
    @click.stop="handleClick"
    @keydown.enter.space="handleActivate"
    @keydown.up.down.exact.prevent.stop="handleKeydown"
    @mousedown.prevent="() => {/*We use this to prevent clicks from triggering the @focusin below. When we scroll on a click it prevents the action from occurring on the first click.*/}"
    @focusin="scrollIntoView"
    @mouseenter="handleMouseenter"
  >
    <slot name="before">
      <!--Empty slot content-->
    </slot>
    <slot name="default">
      <!--Empty slot content-->
    </slot>
    <span
      v-if="$slots.after"
      class="dropdown-item-after"
    >
      <slot name="after" />
    </span>
  </div>
</template>

<style lang="scss" scoped>
  [dropdown-menu-item] {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 9px 8px;
    margin: 0 9px;
    border-radius: 4px;

    &:hover {
      cursor: pointer;
      background-color: var(--dropdown-hover-bg);
    }
    &:focus-visible {
      @include focus-outline;
      outline-offset: 0;
    }
    &[disabled] {
      color: var(--disabled-text);
      &:hover {
        cursor: not-allowed;
      }
    }

    .dropdown-item-after {
      display: flex;
      align-items: center;
      margin-left: auto;
      padding-left: 16px;
    }
  }
</style>
