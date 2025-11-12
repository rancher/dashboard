<script setup lang="ts">
import {
  RcDropdown,
  RcDropdownItem,
  RcDropdownSeparator,
  RcDropdownTrigger
} from '@components/RcDropdown';
import { RcDropdownMenuComponentProps, DropdownOption } from './types';
import IconOrSvg from '@shell/components/IconOrSvg';
import { computed, useSlots } from 'vue';

withDefaults(defineProps<RcDropdownMenuComponentProps>(), {
  buttonRole: 'primary',
  buttonSize: undefined,
});

const emit = defineEmits(['update:open', 'select']);

const slots = useSlots();

const hasCustomTrigger = computed(() => !!slots.trigger);

const hasOptions = (options: DropdownOption[]) => {
  return options.length !== undefined ? options.length : Object.keys(options).length > 0;
};
</script>

<template>
  <rc-dropdown
    :aria-label="dropdownAriaLabel"
    @update:open="(e: boolean) => emit('update:open', e)"
  >
    <!-- Custom trigger slot for specialized use cases like split buttons -->
    <slot
      v-if="hasCustomTrigger"
      name="trigger"
    />
    <!-- Default trigger for standard action menu usage -->
    <rc-dropdown-trigger
      v-else
      :[buttonRole]="true"
      :[buttonSize]="true"
      :data-testid="dataTestid"
      :aria-label="buttonAriaLabel"
    >
      <i class="icon icon-actions" />
    </rc-dropdown-trigger>
    <template #dropdownCollection>
      <template
        v-for="(a) in options"
        :key="a.label"
      >
        <rc-dropdown-item
          v-if="!a.divider"
          :disabled="a.disabled"
          @click="(e: MouseEvent) => emit('select', e, a)"
        >
          <template #before>
            <!-- Use IconOrSvg for all icons to maintain backward compatibility -->
            <IconOrSvg
              v-if="a.icon || a.svg"
              :icon="a.icon"
              :src="a.svg"
              class="icon"
              color="header"
            />
          </template>
          {{ a.label }}
        </rc-dropdown-item>
        <rc-dropdown-separator
          v-else
        />
      </template>
      <rc-dropdown-item
        v-if="!hasOptions(options)"
        disabled
      >
        No actions available
      </rc-dropdown-item>
    </template>
  </rc-dropdown>
</template>
