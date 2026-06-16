<script setup lang="ts">
/**
 * An item for a dropdown menu. Used in conjunction with RcDropdown.
 */
import { Checkbox as RcCheckbox } from '@components/Form/Checkbox';
import { useDropdownItem } from '@components/RcDropdown/useDropdownItem';

const props = defineProps({ modelValue: Boolean, disabled: Boolean });
const emits = defineEmits(['click']);

const { handleKeydown, handleActivate, scrollIntoView } = useDropdownItem();

const handleClick = () => {
  if (props.disabled) {
    return;
  }

  emits('click', !props.modelValue);
};
</script>

<template>
  <div
    ref="dropdownMenuItem"
    dropdown-menu-item
    tabindex="-1"
    role="menuitemcheckbox"
    :disabled="disabled || null"
    :aria-disabled="disabled || false"
    @click.stop="handleClick"
    @keydown.enter.space="handleActivate"
    @keydown.up.down.prevent.stop="handleKeydown"
    @focusin="scrollIntoView"
  >
    <rc-checkbox :value="modelValue">
      <template #label>
        <slot name="default">
          <!--Empty slot content-->
        </slot>
      </template>
    </rc-checkbox>
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
    &:focus-visible, &:focus {
      @include focus-outline;
      outline-offset: 0;
    }
    &[disabled] {
      color: var(--disabled-text);
      &:hover {
        cursor: not-allowed;
      }
    }
  }
</style>
