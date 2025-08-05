<script setup lang="ts">
/**
 * Offers a list of choices to the user, such as a set of actions or functions.
 * Opened by activating RcDropdownTrigger.
 *
 * Example:
 *
 *  <rc-dropdown :aria-label="t('nav.actionMenu.label')">
 *    <rc-dropdown-trigger tertiary>
 *      <i class="icon icon-actions" />
 *    </rc-dropdown-trigger>
 *    <template #dropdownCollection>
 *      <rc-dropdown-item @click="performAction()">
 *        Action 1
 *      </rc-dropdown-item>
 *      <rc-dropdown-separator />
 *      <rc-dropdown-item @click="performAction()">
 *        Action 2
 *      </rc-dropdown-item>
 *    </template>
 *  </rc-dropdown>
 */
import { ref } from 'vue';
import { useClickOutside } from '@shell/composables/useClickOutside';
import { useDropdownContext } from '@components/RcDropdown/useDropdownContext';

import type { Placement } from 'floating-vue';

withDefaults(
  defineProps<{
    // eslint-disable-next-line vue/require-default-prop
    ariaLabel?: string;
    // eslint-disable-next-line vue/require-default-prop
    distance?: number;
    placement?: Placement;
  }>(),
  { placement: 'bottom-end' }
);

const emit = defineEmits(['update:open']);

const {
  isMenuOpen,
  showMenu,
  returnFocus,
  setFocus,
  provideDropdownContext,
  registerDropdownCollection,
  handleKeydown,
  setDropdownDimensions
} = useDropdownContext(emit);

provideDropdownContext();

const popperContainer = ref(null);
const dropdownTarget = ref(null);

useClickOutside(dropdownTarget, () => showMenu(false));

const applyShow = () => {
  setDropdownDimensions(dropdownTarget.value);
  registerDropdownCollection(dropdownTarget.value);
  setFocus('down');
};

</script>

<template>
  <v-dropdown
    no-auto-focus
    :triggers="[]"
    :shown="isMenuOpen"
    :auto-hide="false"
    :container="popperContainer"
    :placement="placement"
    :distance="distance"
    @apply-show="applyShow"
  >
    <slot name="default">
      <!--Empty slot content Trigger-->
    </slot>

    <template #popper>
      <div
        ref="dropdownTarget"
        class="dropdownTarget"
        tabindex="-1"
        role="menu"
        aria-orientation="vertical"
        dropdown-menu-collection
        :aria-label="ariaLabel || 'Dropdown Menu'"
        @keydown="handleKeydown"
        @keydown.down.prevent="setFocus('down')"
        @keydown.up.prevent="setFocus('up')"
      >
        <slot name="dropdownCollection">
          <!--Empty slot content-->
        </slot>
      </div>
    </template>
  </v-dropdown>
  <div
    ref="popperContainer"
    class="popperContainer"
    @keydown.tab="showMenu(false)"
    @keydown.escape="returnFocus"
  >
    <!--Empty container for mounting popper content-->
  </div>
</template>

<style lang="scss" scoped>
  .popperContainer {
    display: contents;
    &:deep(.v-popper__popper) {

      .v-popper__wrapper {
        box-shadow: 0px 6px 18px 0px rgba(0, 0, 0, 0.25), 0px 4px 10px 0px rgba(0, 0, 0, 0.15);
        border-radius: var(--border-radius-lg);

        .v-popper__arrow-container {
          display: none;
        }

        .v-popper__inner {
          overflow: unset;
          padding: 10px 0 10px 0;
        }
      }
    }
  }

  .dropdownTarget {
    overflow: auto;
    padding: 3px 0; // Need padding at top and bottom in order to show the focus border for the notification

    &:focus-visible, &:focus {
      outline: none;
    }
  }
</style>
