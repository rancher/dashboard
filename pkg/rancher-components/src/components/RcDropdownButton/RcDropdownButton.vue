<script setup lang="ts">
/**
 * A split button component that combines a primary action button with a dropdown menu.
 * The left button performs the primary action, while the right button toggles a dropdown menu.
 *
 * Example:
 *
 * <rc-dropdown-button
 *   role="primary"
 *   :options="dropdownOptions"
 *   @click="performPrimaryAction"
 *   @select="handleDropdownSelection"
 * >
 *   Primary Action
 * </rc-dropdown-button>
 */
import { ref } from 'vue';
import { RcButton } from '@components/RcButton';
import { RcDropdownMenu, RcDropdownTrigger } from '@components/RcDropdown';
import { RcIcon } from '@components/RcIcon';
import { RcDropdownButtonProps, DropdownButtonOption } from './types';

const props = withDefaults(defineProps<RcDropdownButtonProps>(), {
  role:    'primary',
  size:    'medium',
  options: () => [],
});

const emit = defineEmits(['click', 'select', 'update:open']);

const dropdownTriggerRef = ref<InstanceType<typeof RcDropdownTrigger> | null>(null);

const handlePrimaryClick = (e: MouseEvent) => {
  emit('click', e);
};

const handleDropdownSelect = (e: MouseEvent, option: DropdownButtonOption) => {
  emit('select', e, option);
};

const handleDropdownOpen = (isOpen: boolean) => {
  emit('update:open', isOpen);
};
</script>

<template>
  <div class="rc-dropdown-button">
    <RcButton
      :role="props.role"
      :size="props.size"
      :left-icon="props.leftIcon"
      :disabled="props.disabled"
      class="primary-button"
      @click="handlePrimaryClick"
    >
      <slot>
        <!-- Button content -->
      </slot>
    </RcButton>

    <RcDropdownMenu
      class="dropdown-section"
      :options="props.options"
      :dropdown-aria-label="props.dropdownAriaLabel || 'Dropdown Menu'"
      @update:open="handleDropdownOpen"
      @select="handleDropdownSelect"
    >
      <template #trigger>
        <RcDropdownTrigger
          ref="dropdownTriggerRef"
          :role="props.role"
          :size="props.size"
          :disabled="props.disabled"
          class="dropdown-trigger"
          :aria-label="props.dropdownButtonAriaLabel || 'Open menu'"
        >
          <RcIcon
            type="chevron-down"
            size="none"
          />
        </RcDropdownTrigger>
      </template>
    </RcDropdownMenu>
  </div>
</template>

<style lang="scss" scoped>
.rc-dropdown-button {
  display: inline-flex;
  position: relative;

  .primary-button {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    border-right: none;
  }

  .dropdown-trigger {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    border-left: 1px solid rgba(255, 255, 255, 0.5);
  }

  // Adjust spacing for small size
  & .dropdown-trigger.btn.btn-small {
    padding: 0 4px;

    .dropdown-section :deep(.dropdown-trigger) {
      padding: 0 6px;
    }
  }

  // Adjust spacing for large size
  & .dropdown-trigger.btn.btn-large {
    padding: 0 8px;
    .dropdown-section :deep(.dropdown-trigger) {
      padding: 0 10px;
    }
  }
}
</style>
