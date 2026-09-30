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
import { ref, watch } from 'vue';
import { useClickOutside } from '@shell/composables/useClickOutside';
import { lastInputWasKeyPress, useDropdownContext } from '@components/RcDropdown/useDropdownContext';

import type { Placement } from 'floating-vue';

type ReferenceNode = () => Element | undefined | null;

/** How far a submenu's popper keeps from the edges of the page */
const SUBMENU_EDGE_GAP = 16;

const props = withDefaults(
  defineProps<{
    // eslint-disable-next-line vue/require-default-prop
    ariaLabel?: string;
    // eslint-disable-next-line vue/require-default-prop
    distance?: number;
    /** Positions the menu against this element instead of the trigger */
    // eslint-disable-next-line vue/require-default-prop
    referenceNode?: ReferenceNode;
    /**
     * Opens and closes the menu from outside (`v-model:open`), eg for a menu without a trigger. From
     * the keyboard the first item takes the focus, and on closing it goes back to whatever had it
     */
    open?: boolean;
    placement?: Placement;
  }>(),
  { placement: 'bottom-end', open: false }
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
  setDropdownDimensions,
  submenus,
  SubmenuContent,
} = useDropdownContext(emit);

const {
  submenuId,
  submenus: registeredSubmenus,
  activeSubmenu,
  shownSubmenu,
  submenuTarget,
  cancelSubmenuSwitch,
  refreshSubmenuItems,
  onSubmenuShown,
  onSubmenuKeydown,
} = submenus;

provideDropdownContext();

const popperContainer = ref<HTMLElement | null>(null);
const dropdownTarget = ref<HTMLElement | null>(null);
const submenuContainer = ref<HTMLElement | null>(null);

watch(() => props.open, (open) => {
  if (open === isMenuOpen.value) {
    return;
  }

  if (!open) {
    // The focus would otherwise stay in the hidden popper
    if (popperContainer.value?.contains(document.activeElement)) {
      returnFocus();
    } else {
      showMenu(false);
    }

    return;
  }

  if (lastInputWasKeyPress()) {
    handleKeydown();
  }

  showMenu(true);
}, { immediate: true });

// A submenu is drawn beside the menu, but a click in it is still inside
useClickOutside(dropdownTarget, () => showMenu(false), { ignore: ['.rc-dropdown-submenu'] });

/** A submenu's key presses bubble up here too; only the menu they're in answers them */
const ownsEvent = (e: Event) => {
  const target = e.target as HTMLElement | null;

  return !!dropdownTarget.value && target?.closest?.('[dropdown-menu-collection]') === dropdownTarget.value;
};

const onKeydown = (e: KeyboardEvent) => {
  if (ownsEvent(e)) {
    handleKeydown();
  }
};

const onArrow = (e: KeyboardEvent, direction: 'down' | 'up') => {
  if (!ownsEvent(e)) {
    return;
  }

  e.preventDefault();
  setFocus(direction);
};

const onTab = (e: KeyboardEvent) => {
  if (ownsEvent(e)) {
    showMenu(false);
  }
};

const onEscape = (e: KeyboardEvent) => {
  if (ownsEvent(e)) {
    returnFocus();
  }
};

const applyShow = () => {
  setDropdownDimensions(dropdownTarget.value);
  registerDropdownCollection(dropdownTarget.value);
  setFocus('down');
};

/** The menu's box, so a submenu lines up with its top and meets its edge */
const menuBox = () => dropdownTarget.value?.closest('.v-popper__wrapper') || dropdownTarget.value;

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
    :reference-node="referenceNode"
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
        @keydown="onKeydown"
        @keydown.down="onArrow($event, 'down')"
        @keydown.up="onArrow($event, 'up')"
      >
        <slot name="dropdownCollection">
          <!--Empty slot content-->
        </slot>
      </div>

      <!-- Beside the menu, never over it: flipping would cover the items the pointer came from -->
      <v-dropdown
        v-if="registeredSubmenus.length"
        no-auto-focus
        auto-boundary-max-size
        :triggers="[]"
        :shown="!!activeSubmenu"
        :auto-hide="false"
        :container="submenuContainer"
        :placement="shownSubmenu?.side === 'left' ? 'left-start' : 'right-start'"
        :distance="0"
        :flip="false"
        :overflow-padding="SUBMENU_EDGE_GAP"
        popper-class="rc-dropdown-submenu"
        :reference-node="menuBox"
        @apply-show="onSubmenuShown"
      >
        <template #popper>
          <div
            :id="submenuId"
            ref="submenuTarget"
            class="dropdownTarget"
            tabindex="-1"
            role="menu"
            aria-orientation="vertical"
            dropdown-menu-collection
            :aria-labelledby="shownSubmenu?.labelId"
            @keydown.capture="refreshSubmenuItems"
            @keydown="onSubmenuKeydown"
            @mouseenter="cancelSubmenuSwitch"
          >
            <SubmenuContent
              v-if="shownSubmenu"
              :key="shownSubmenu.labelId"
              :submenu="shownSubmenu"
            />
          </div>
        </template>
      </v-dropdown>
      <div
        ref="submenuContainer"
        class="submenuContainer"
      >
        <!--Empty container for mounting the submenu-->
      </div>
    </template>
  </v-dropdown>
  <div
    ref="popperContainer"
    class="popperContainer"
    @keydown.tab="onTab"
    @keydown.escape="onEscape"
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

    // Opened by hovering an item, where a fade reads as lag
    &:deep(.rc-dropdown-submenu), &:deep(.rc-dropdown-submenu > .v-popper__wrapper) {
      transition: none !important;
    }

    // Sized to the page, and each box down to the items gives way to that, so they scroll (or
    // content that scrolls itself does) rather than the page
    &:deep(.rc-dropdown-submenu .v-popper__inner) {
      display: flex;
      flex-direction: column;

      > div, .dropdownTarget {
        display: flex;
        flex-direction: column;
        min-height: 0;
      }

      .dropdownTarget {
        overflow-y: auto;
      }
    }
  }

  .submenuContainer {
    display: contents;
  }

  .dropdownTarget {
    padding: 3px 0; // Need padding at top and bottom in order to show the focus border for the notification

    &:focus-visible, &:focus {
      outline: none;
    }
  }
</style>
