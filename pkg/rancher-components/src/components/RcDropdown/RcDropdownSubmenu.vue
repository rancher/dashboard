<script setup lang="ts">
/**
 * An item that opens a submenu beside its menu. Used in conjunction with RcDropdown, one level deep.
 *
 * It opens on click, hover, Enter, Space or the arrow toward its side, and the submenu closes with
 * Escape or the arrow back, returning the focus to this item.
 *
 * Example:
 *
 *  <rc-dropdown-submenu side="left">
 *    Group By
 *    <template #after>
 *      {{ groupLabel }}
 *    </template>
 *    <template #submenu>
 *      <rc-dropdown-item-radio
 *        v-for="option in options"
 *        :key="option.id"
 *        :checked="option.id === groupBy"
 *        @click="groupBy = option.id"
 *      >
 *        {{ option.label }}
 *      </rc-dropdown-item-radio>
 *    </template>
 *  </rc-dropdown-submenu>
 */
import {
  computed, inject, onBeforeUnmount, ref, useId, useSlots
} from 'vue';
import { useDropdownItem } from '@components/RcDropdown/useDropdownItem';
import { RcIcon } from '@components/RcIcon';
import { DropdownContext, DropdownSubmenu, defaultContext } from './types';

const props = withDefaults(defineProps<{
  /** Which side of the menu the submenu opens on */
  side?: 'left' | 'right';
  disabled?: boolean;
}>(), { side: 'right', disabled: false });

const {
  submenuId, activeSubmenu, registerSubmenu, openSubmenu, hoverSubmenu, cancelSubmenuSwitch
} = inject<DropdownContext>('dropdownContext') || defaultContext;

const { handleKeydown, scrollIntoView } = useDropdownItem();

const slots = useSlots();

const rowId = `rc-dropdown-submenu-item-${ useId() }`;

const labelId = `${ rowId }-label`;

const row = ref<HTMLElement | null>(null);

const submenu: DropdownSubmenu = {
  get side() {
    return props.side;
  },
  row:    () => row.value,
  labelId,
  render: () => slots.submenu?.(),
};

onBeforeUnmount(registerSubmenu(submenu));

const expanded = computed(() => activeSubmenu.value === submenu);

const open = (focusFirst: boolean) => {
  if (!props.disabled) {
    openSubmenu(submenu, focusFirst);
  }
};

const onKeydown = (e: KeyboardEvent) => {
  if (e.altKey || e.ctrlKey || e.metaKey) {
    return;
  }

  const opens = e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight' || (props.side === 'left' && e.key === 'ArrowLeft');

  if (opens) {
    e.preventDefault();
    e.stopPropagation();
    open(true);
  }
};
</script>

<template>
  <div
    :id="rowId"
    ref="row"
    dropdown-menu-item
    tabindex="-1"
    role="menuitem"
    aria-haspopup="menu"
    :aria-expanded="expanded"
    :aria-controls="expanded ? submenuId : undefined"
    :class="{ expanded }"
    :disabled="disabled || null"
    :aria-disabled="disabled || false"
    @click.stop="open(false)"
    @keydown="onKeydown"
    @keydown.up.down.prevent.stop="handleKeydown"
    @mousedown.prevent="() => {/* As RcDropdownItem: a click doesn't take the focus */}"
    @mouseenter="!disabled && hoverSubmenu(submenu)"
    @mouseleave="cancelSubmenuSwitch()"
    @focusin="scrollIntoView"
  >
    <slot name="before">
      <!--Empty slot content-->
    </slot>
    <!-- Names the submenu; the value in `after` only describes this item -->
    <span :id="labelId">
      <slot name="default">
        <!--Empty slot content-->
      </slot>
    </span>
    <span class="dropdown-item-after">
      <slot name="after" />
      <RcIcon
        type="chevron-right"
        size="inherit"
      />
    </span>
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

    // Stays lit while the pointer is in its submenu
    &:hover, &.expanded {
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
      gap: 8px;
      margin-left: auto;
      padding-left: 16px;
    }
  }
</style>
