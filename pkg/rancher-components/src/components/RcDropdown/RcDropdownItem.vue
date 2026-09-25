<script setup lang="ts">
/**
 * An item for a dropdown menu. Used in conjunction with RcDropdown.
 */
import { useDropdownItem } from '@components/RcDropdown/useDropdownItem';

const props = defineProps({
  disabled:     Boolean,
  /**
   * Whether picking this item closes the menu. Off for items that are settings rather than
   * commands - a column toggle is one of several the user is likely to want in a row, and a menu
   * that shuts after each one has to be reopened to make the next change.
   */
  closeOnClick: { type: Boolean, default: true },
});
const emits = defineEmits(['click']);

const {
  handleKeydown,
  close,
  handleActivate,
  scrollIntoView,
} = useDropdownItem();

const handleClick = (e: MouseEvent) => {
  if (props.disabled) {
    return;
  }

  emits('click', e);

  if (props.closeOnClick) {
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
    @keydown.up.down.prevent.stop="handleKeydown"
    @mousedown.prevent="() => {/*We use this to prevent clicks from triggering the @focusin below. When we scroll on a click it prevents the action from occurring on the first click.*/}"
    @focusin="scrollIntoView"
  >
    <slot name="before">
      <!--Empty slot content-->
    </slot>
    <slot name="default">
      <!--Empty slot content-->
    </slot>
    <!-- Trailing content - a tick on the chosen item, a keyboard shortcut - pushed to the far
         end of the row. Matches the before/after pair RcDropdownTrigger already takes. -->
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
    // Only when the keyboard put the focus here. Clicking an item focuses it too, and a ring
    // drawn then is the menu answering a mouse with something only a keyboard needs.
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
