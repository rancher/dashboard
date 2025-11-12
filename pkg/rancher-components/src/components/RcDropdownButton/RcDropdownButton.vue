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

    <RcDropdown
      class="dropdown-section"
      :aria-label="props.dropdownAriaLabel || 'Dropdown Menu'"
      @update:open="handleDropdownOpen"
    >
      <RcDropdownTrigger
        ref="dropdownTriggerRef"
        :role="props.role"
        :size="props.size"
        :disabled="props.disabled"
        class="dropdown-trigger"
        :aria-label="props.dropdownButtonAriaLabel || 'Open menu'"
      >
        <i class="icon icon-chevron-down" />
      </RcDropdownTrigger>
      <template #dropdownCollection>
        <template
          v-for="(option, index) in props.options"
          :key="option.label || index"
        >
          <RcDropdownItem
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
          </RcDropdownItem>
          <RcDropdownSeparator
            v-else
          />
        </template>
        <RcDropdownItem
          v-if="!hasOptions"
          disabled
        >
          No actions available
        </RcDropdownItem>
      </template>
    </RcDropdown>
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
