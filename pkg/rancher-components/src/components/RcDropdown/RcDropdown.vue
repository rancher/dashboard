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
import { useTemplateRef } from 'vue';
import { useClickOutside } from '@shell/composables/useClickOutside';
import { useDropdownContext } from '@components/RcDropdown/useDropdownContext';

defineProps<{
  ariaLabel?: string
}>();

const emit = defineEmits(['update:open']);

const {
  isMenuOpen,
  showMenu,
  returnFocus,
  setFocus,
  provideDropdownContext,
  registerDropdownCollection,
  handleKeydown,
} = useDropdownContext(emit);

provideDropdownContext();

const popperContainer = useTemplateRef<HTMLElement>('popperContainer');
const dropdownTarget = useTemplateRef<HTMLElement>('dropdownTarget');

useClickOutside(dropdownTarget, () => showMenu(false));

const applyShow = () => {
  registerDropdownCollection(dropdownTarget.value);
  setFocus();
};

</script>

<template>
  <v-dropdown
    no-auto-focus
    :triggers="[]"
    :shown="isMenuOpen"
    :auto-hide="false"
    :container="popperContainer"
    :placement="'bottom-end'"
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
        @keydown.down="setFocus()"
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
          padding: 10px 0 10px 0;
        }
      }
    }
  }

  .dropdownTarget {
    &:focus-visible, &:focus {
      outline: none;
    }
  }
</style>
