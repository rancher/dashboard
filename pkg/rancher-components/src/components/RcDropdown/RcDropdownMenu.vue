<script setup lang="ts">
import {
  RcDropdown,
  RcDropdownItem,
  RcDropdownSeparator,
  RcDropdownTrigger
} from '@components/RcDropdown';
import { RcDropdownMenuComponentProps, DropdownOption } from './types';
import IconOrSvg from '@shell/components/IconOrSvg';

// eslint-disable-next-line vue/no-setup-props-destructure
const { buttonRole = 'primary', buttonSize = '' } = defineProps<RcDropdownMenuComponentProps>();

const emit = defineEmits(['update:open', 'select']);

const hasOptions = (options: DropdownOption[]) => {
  return options.length !== undefined ? options.length : Object.keys(options).length > 0;
};
</script>

<template>
  <rc-dropdown
    :aria-label="dropdownAriaLabel"
    @update:open="(e: boolean) => emit('update:open', e)"
  >
    <rc-dropdown-trigger
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
          @click="(e: MouseEvent) => emit('select', e, a)"
        >
          <template #before>
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
