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
import { useDropdownContext } from '@components/RcDropdown/useDropdownContext';

import type { Placement } from 'floating-vue';

type ReferenceNode = () => Element | undefined | null;

const props = withDefaults(
  defineProps<{
    // eslint-disable-next-line vue/require-default-prop
    ariaLabel?: string;
    // eslint-disable-next-line vue/require-default-prop
    distance?: number;
    // eslint-disable-next-line vue/require-default-prop
    skidding?: number;
    /** Positions the menu against this element instead of the trigger */
    // eslint-disable-next-line vue/require-default-prop
    referenceNode?: ReferenceNode;
    /** Off keeps a sub menu in line with the row that opened it rather than sliding it into view */
    /** Opens and closes the menu from outside, for a menu opened by an item rather than a trigger */
    open?: boolean;
    shift?: boolean;
    /** Off keeps a sub menu in line with its row rather than flipping it to the other side */
    flip?: boolean;
    placement?: Placement;
    /** What the menu has to stay inside, instead of the window - eg below a fixed masthead */
    // eslint-disable-next-line vue/require-default-prop
    boundary?: Element;
    // eslint-disable-next-line vue/require-default-prop
    overflowPadding?: number;
    /** A class for the popper, which is mounted outside the component where scoped styles can't reach */
    // eslint-disable-next-line vue/require-default-prop
    popperClass?: string;
    /** Leaves scrolling and padding to the menu's content, for content that scrolls itself */
    flush?: boolean;
  }>(),
  // `shift` keeps floating-vue's default: an omitted boolean prop would arrive as false
  {
    placement: 'bottom-end', shift: true, flip: true, open: false
  }
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

watch(() => props.open, (open) => {
  if (open !== isMenuOpen.value) {
    showMenu(open);
  }
});

const popperContainer = ref<HTMLElement | null>(null);
const dropdownTarget = ref<HTMLElement | null>(null);

useClickOutside(dropdownTarget, () => showMenu(false));

/** A nested menu's key presses bubble up here too; only the innermost menu answers them */
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
  // A menu with a `boundary` is already sized to it, and this fixed measure would shrink it
  if (!props.boundary) {
    setDropdownDimensions(dropdownTarget.value);
  }

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
    :skidding="skidding"
    :reference-node="referenceNode"
    :shift="shift"
    :flip="flip"
    :boundary="boundary"
    :overflow-padding="overflowPadding"
    :popper-class="popperClass"
    @apply-show="applyShow"
  >
    <slot name="default">
      <!--Empty slot content Trigger-->
    </slot>

    <template #popper>
      <div
        ref="dropdownTarget"
        class="dropdownTarget"
        :class="{ flush }"
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
  }

  .dropdownTarget {
    overflow: auto;
    padding: 3px 0; // Need padding at top and bottom in order to show the focus border for the notification

    &:focus-visible, &:focus {
      outline: none;
    }

    &.flush {
      overflow: visible;
      padding: 0;
    }
  }
</style>
