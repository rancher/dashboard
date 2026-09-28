<script setup lang="ts">
/**
 * An item for a dropdown menu. Used in conjunction with RcDropdown.
 */
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { useDropdownItem } from '@components/RcDropdown/useDropdownItem';
import { ref } from 'vue';

type LabeledSelectComponent = {
  focusSearch: () => void;
};

defineProps({
  modelValue: {
    type:    String,
    default: ''
  },
  disabled: Boolean,
  options:  {
    type: Array,
    default() {
      return [];
    }
  },
  label: {
    type:    String,
    default: ''
  }
});
const emits = defineEmits(['click', 'select']);

const { handleKeydown, handleActivate, scrollIntoView } = useDropdownItem();

const dropdownMenuItem = ref<HTMLDivElement | null>(null);
const menuItemSelect = ref<LabeledSelectComponent | null>(null);

const handleClick = () => {
  menuItemSelect?.value?.focusSearch();
};

const focusMenuItem = () => {
  dropdownMenuItem?.value?.focus();
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
    @focusin="scrollIntoView"
  >
    <LabeledSelect
      ref="menuItemSelect"
      :value="modelValue"
      :label="label"
      :options="options"
      :clearable="false"
      placement="top"
      @keydown.enter.stop
      @update:value="emits('select', $event)"
      @on-close="focusMenuItem"
    />
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
