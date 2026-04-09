<script setup lang="ts">
/**
 * A split button that combines a primary action button with a dropdown trigger
 * for secondary actions.
 *
 * Example:
 *
 *  <rc-button-split variant="primary" @click="doAction" @update:open="onOpen">
 *    Save
 *    <template #dropdownCollection>
 *      <rc-dropdown-item @click="doOtherAction">Save as Draft</rc-dropdown-item>
 *    </template>
 *  </rc-button-split>
 */
import { RcButton } from '@components/RcButton';
import { RcDropdown, RcDropdownItem, RcDropdownTrigger } from '@components/RcDropdown';
import RcIcon from '@components/RcIcon/RcIcon.vue';
import { ButtonVariant, ButtonSize, IconProps } from '@components/RcButton/types';
import type { Placement } from 'floating-vue';

type RcButtonSplitVariant = Exclude<ButtonVariant, 'link' | 'ghost' | 'multiAction'>;

type RcButtonSplitItem = {
  id: string;
  label: string;
};

type RcButtonSplitProps = {
  disabled?: boolean;
  variant?: RcButtonSplitVariant;
  size?: ButtonSize;
  ariaLabel?: string;
  ariaLabelTrigger?: string;
  ariaLabelDropdown?: string;
  placement?: Placement;
  distance?: number;
  items?: RcButtonSplitItem[];
} & IconProps;

withDefaults(
  defineProps<RcButtonSplitProps>(),
  {
    disabled:          false,
    variant:           'primary',
    size:              'medium',
    ariaLabel:         undefined,
    ariaLabelTrigger:  undefined,
    ariaLabelDropdown: undefined,
    placement:         'bottom-end',
    distance:          undefined,
    items:             undefined,
  });

const emit = defineEmits<{
  click: [event: MouseEvent];
  'update:open': [open: boolean];
  select: [id: string];
}>();
</script>

<template>
  <RcDropdown
    :aria-label="ariaLabelDropdown"
    :placement="placement"
    :distance="distance"
    @update:open="emit('update:open', $event)"
  >
    <div class="rc-button-split">
      <RcButton
        class="rc-button-split-action"
        :aria-label="ariaLabel"
        :disabled="disabled"
        :variant="variant"
        :size="size"
        :left-icon="leftIcon"
        :right-icon="rightIcon"
        @click="emit('click', $event)"
      >
        <template
          v-if="$slots.before"
          #before
        >
          <slot name="before" />
        </template>
        <slot />
        <template
          v-if="$slots.after"
          #after
        >
          <slot name="after" />
        </template>
      </RcButton>

      <RcDropdownTrigger
        class="rc-button-split-trigger"
        :aria-label="ariaLabelTrigger"
        :disabled="disabled"
        :variant="variant"
        :size="size"
      >
        <RcIcon
          type="chevron-down"
          size="inherit"
        />
      </RcDropdownTrigger>
    </div>

    <template #dropdownCollection>
      <RcDropdownItem
        v-for="item in items"
        :key="item.id"
        @click="emit('select', item.id)"
      >
        {{ item.label }}
      </RcDropdownItem>
      <slot name="dropdownCollection" />
    </template>
  </RcDropdown>
</template>

<style lang="scss" scoped>
.rc-button-split {
  display: inline-flex;

  // Round only the outer left edge of the main button
  :deep(.rc-button-split-action) {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }

  // Round only the outer right edge of the trigger button; narrow padding
  :deep(button.rc-button-split-trigger) {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    padding-left: 8px;
    padding-right: 8px;
    min-width: unset;
  }

  :deep(button.btn-small.rc-button-split-trigger) {
    padding-left: 4px;
    padding-right: 4px;
  }

  // Primary: semi-transparent right border as separator
  :deep(.rc-button-split-trigger.variant-primary),
  :deep(.rc-button-split-trigger.variant-secondary),
  :deep(.rc-button-split-trigger.variant-tertiary) {
    border-left: 1px solid rgba(255, 255, 255, 0.3);
  }

  // Link/Ghost: subtle separator
  :deep(.rc-button-split-action.variant-link),
  :deep(.rc-button-split-action.variant-ghost) {
    border-right: 1px solid var(--border);
  }
}
</style>
