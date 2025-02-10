<script setup lang="ts">
import {
  RcDropdown,
  RcDropdownItem,
  RcDropdownSeparator,
  RcDropdownTrigger
} from '@components/RcDropdown';
import { ButtonRoleProps, ButtonSizeProps } from '@components/RcButton/types';
import IconOrSvg from '@shell/components/IconOrSvg';

type DropdownOption = {
  action?: string;
  divider?: boolean;
  enabled: boolean;
  icon?: string;
  svg?: string;
  label?: string;
  total: number;
  allEnabled: boolean;
  anyEnabled: boolean;
  available: number;
  bulkable?: boolean;
  bulkAction?: string;
  altAction?: string;
  weight?: number;
}

type ComponentProps = {
  options: DropdownOption[];
  buttonRole?: keyof ButtonRoleProps;
  buttonSize?: keyof ButtonSizeProps;
  buttonAriaLabel?: string;
  dropdownAriaLabel?: string;
}

const { buttonRole = 'primary' } = defineProps<ComponentProps>();

const emit = defineEmits(['update:open', 'select']);
</script>

<template>
  <rc-dropdown
    :aria-label="dropdownAriaLabel"
    @update:open="(e: boolean) => emit('update:open', e)"
  >
    <rc-dropdown-trigger
      :[buttonRole]="true"
      :[buttonSize]="true"
      data-testid="page-actions-menu"
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
    </template>
  </rc-dropdown>
</template>
