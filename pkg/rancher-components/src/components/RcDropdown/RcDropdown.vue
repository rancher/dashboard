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

/** Hands the popper the element to position against */
type ReferenceNode = () => Element | undefined | null;

const props = withDefaults(
  defineProps<{
    // eslint-disable-next-line vue/require-default-prop
    ariaLabel?: string;
    // eslint-disable-next-line vue/require-default-prop
    distance?: number;
    // eslint-disable-next-line vue/require-default-prop
    skidding?: number;
    /**
     * Positions the menu against this element instead of the trigger, for a trigger that is only
     * part of what the menu belongs to - an icon at the end of a tab, say.
     */
    // eslint-disable-next-line vue/require-default-prop
    referenceNode?: ReferenceNode;
    /**
     * Off keeps the menu where its placement puts it rather than sliding it back into view. For a
     * sub menu that has to stay lined up with the row that opened it, being in line matters more
     * than the tail of a long list being on screen - the menu scrolls for that.
     */
    /**
     * Opens and closes the menu from outside, completing the `update:open` this already emits.
     * A row of one menu that opens another is a menu item, and an item has no way to open
     * anything itself - this is what lets it, without a trigger of its own.
     */
    open?: boolean;
    shift?: boolean;
    /**
     * Off holds the menu to its placement rather than turning it over when it runs out of room.
     * Flipping re-anchors a sub menu by its other end, which takes it out of line with the row
     * that opened it.
     */
    flip?: boolean;
    placement?: Placement;
    /**
     * What the menu has to stay inside, instead of the window.
     *
     * A menu opened low on the page is slid back up to stay on screen, and "on screen" is not
     * always the right edge to stop at - a page with a fixed masthead has the menu run underneath
     * it. Naming the element the menu belongs in gives `shift` the right box to work against.
     */
    // eslint-disable-next-line vue/require-default-prop
    boundary?: Element;
    /** How close to an edge of that boundary the menu may come */
    // eslint-disable-next-line vue/require-default-prop
    overflowPadding?: number;
    /**
     * Open and close outright, with none of the fade a menu is otherwise given.
     *
     * For a menu that appears under the pointer rather than on a click - a sub menu opened by
     * hovering a row - where the fade is time spent between two states rather than a transition
     * anyone reads as one.
     */
    skipTransition?: boolean;
  }>(),
  // `shift` carries floating-vue's own default: a boolean prop left alone would come through as
  // false and stop every menu in the product being nudged back into view. `open` false is the
  // state every menu starts in, so a caller that never passes it is left to open itself.
  {
    placement: 'bottom-end', shift: true, flip: true, open: false, skipTransition: false
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

/**
 * Whether this menu is the one a key press belongs to.
 *
 * A menu opened from a row of this one is mounted inside this one, so its key presses bubble up
 * to these handlers as well as its own. Only the innermost menu holding the event answers it,
 * or the arrows walk the rows of every menu the pointer happens to be inside at once.
 */
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
  // `setDropdownDimensions` measures against the window and keeps a fixed 32 off each edge. A
  // menu given a `boundary` has already said what it must stay inside and how far off its edges
  // to stop, and the popper has been positioned to match - so the blunt measure would only fight
  // it, pinning a height that leaves the menu short of the room it was placed in.
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
    :skip-transition="skipTransition"
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
  }
</style>
