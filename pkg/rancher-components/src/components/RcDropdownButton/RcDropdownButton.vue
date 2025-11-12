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
import { computed, ref } from 'vue';
import { RcButton } from '@components/RcButton';
import {
  RcDropdown,
  RcDropdownItem,
  RcDropdownSeparator,
  RcDropdownTrigger
} from '@components/RcDropdown';
import { RcDropdownButtonProps, DropdownButtonOption } from './types';
import IconOrSvg from '@shell/components/IconOrSvg';

const props = withDefaults(defineProps<RcDropdownButtonProps>(), {
  role:    'primary',
  size:    'medium',
  options: () => [],
});

const emit = defineEmits(['click', 'select', 'update:open']);

const dropdownTriggerRef = ref<InstanceType<typeof RcDropdownTrigger> | null>(null);

const hasOptions = computed(() => {
  return props.options && props.options.length > 0;
});

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

    <rc-dropdown
      class="dropdown-section"
      :aria-label="props.dropdownAriaLabel || 'Dropdown Menu'"
      @update:open="handleDropdownOpen"
    >
      <rc-dropdown-trigger
        ref="dropdownTriggerRef"
        :role="props.role"
        :size="props.size"
        :disabled="props.disabled"
        class="dropdown-trigger"
        :aria-label="props.dropdownButtonAriaLabel || 'Open menu'"
      >
        <i class="icon icon-chevron-down" />
      </rc-dropdown-trigger>
      <template #dropdownCollection>
        <template
          v-for="(option, index) in props.options"
          :key="option.label || index"
        >
          <rc-dropdown-item
            v-if="!option.divider"
            :disabled="option.disabled"
            @click="(e: MouseEvent) => handleDropdownSelect(e, option)"
          >
            <template #before>
              <IconOrSvg
                v-if="option.icon || option.svg"
                :icon="option.icon"
                :src="option.svg"
                class="icon"
                color="header"
              />
            </template>
            {{ option.label }}
          </rc-dropdown-item>
          <rc-dropdown-separator
            v-else
          />
        </template>
        <rc-dropdown-item
          v-if="!hasOptions"
          disabled
        >
          No actions available
        </rc-dropdown-item>
      </template>
    </rc-dropdown>
  </div>
</template>

<style lang="scss" scoped>
.rc-dropdown-button {
  display: inline-flex;
  position: relative;

  .primary-button {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    border-right: 1px solid rgba(0, 0, 0, 0.1);
  }

  .dropdown-section {
    display: inline-flex;

    :deep(.dropdown-trigger) {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      padding: 0 8px;
      min-width: unset;

      .icon {
        margin: 0;
      }
    }
  }

  // Adjust spacing for small size
  &:has(.btn-small) {
    .dropdown-section :deep(.dropdown-trigger) {
      padding: 0 6px;
    }
  }

  // Adjust spacing for large size
  &:has(.btn-large) {
    .dropdown-section :deep(.dropdown-trigger) {
      padding: 0 10px;
    }
  }
}
</style>
