<script setup lang="ts">
/**
 * An item for a dropdown menu that is turned on and off, and stays open for the next one. Used in
 * conjunction with RcDropdown.
 *
 * `indicator="checkmark"` marks it checked with a checkmark at its end rather than a checkbox, for a
 * list of things shown and hidden; `#before` then holds anything leading the label.
 */
import { Checkbox as RcCheckbox } from '@components/Form/Checkbox';
import { useDropdownItem } from '@components/RcDropdown/useDropdownItem';

const props = withDefaults(defineProps<{
  modelValue?: boolean;
  disabled?: boolean;
  indicator?: 'checkbox' | 'checkmark';
}>(), {
  modelValue: false, disabled: false, indicator: 'checkbox'
});
const emits = defineEmits(['click', 'update:modelValue']);

const {
  handleKeydown, handleActivate, scrollIntoView, handleMouseenter
} = useDropdownItem();

const handleClick = () => {
  if (props.disabled) {
    return;
  }

  emits('click', !props.modelValue);
  emits('update:modelValue', !props.modelValue);
};
</script>

<template>
  <div
    ref="dropdownMenuItem"
    dropdown-menu-item
    tabindex="-1"
    role="menuitemcheckbox"
    :aria-checked="modelValue"
    :disabled="disabled || null"
    :aria-disabled="disabled || false"
    @click.stop="handleClick"
    @keydown.enter.space="handleActivate"
    @keydown.up.down.exact.prevent.stop="handleKeydown"
    @mousedown.prevent="() => {/* As RcDropdownItem: a click doesn't take the focus */}"
    @focusin="scrollIntoView"
    @mouseenter="handleMouseenter"
  >
    <template v-if="indicator === 'checkmark'">
      <slot name="before">
        <!--Empty slot content-->
      </slot>
      <slot name="default">
        <!--Empty slot content-->
      </slot>
      <span class="dropdown-item-after">
        <i
          v-if="modelValue"
          class="icon icon-checkmark"
        />
      </span>
    </template>
    <rc-checkbox
      v-else
      :value="modelValue"
    >
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
