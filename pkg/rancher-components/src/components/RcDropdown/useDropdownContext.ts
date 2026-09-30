import { ref, provide, nextTick, EmitFn } from 'vue';
import { useDropdownCollection } from './useDropdownCollection';
import { useDropdownSubmenus } from './useDropdownSubmenus';
import { RcButtonType } from '@components/RcButton';
import { DropdownContext } from './types';

/**
 * Whether the focus got where it is from the keyboard rather than the pointer, as the browser judges
 * it for focus rings. A menu opened through `open` has no trigger of its own to tell it
 */
export const focusedFromKeyboard = (): boolean => {
  const focused = document.activeElement;

  try {
    return !!focused && focused !== document.body && focused.matches(':focus-visible');
  } catch {
    // A browser without `:focus-visible` falls back to the pointer's behaviour: the menu takes the focus
    return false;
  }
};

/**
 * Composable that provides the context for a dropdown menu. Includes methods
 * and state for managing the dropdown's visibility, focus, and keyboard
 * interactions.
 *
 * @param firstDropdownItem - First item in the dropdown menu.
 * @returns Dropdown context methods and state. Used for programmatic
 * interactions and setting focus.
 */
export const useDropdownContext = (emit: EmitFn<['update:open']>) => {
  const {
    dropdownItems,
    firstDropdownItem,
    lastDropdownItem,
    dropdownContainer,
    registerDropdownCollection,
  } = useDropdownCollection();

  const isMenuOpen = ref(false);

  /** What had the focus when the menu opened, for a menu without a trigger to give it back to */
  let focusedBeforeOpen: HTMLElement | null = null;

  /**
   * Controls the visibility of the dropdown menu.
   * @param show - Whether to show or hide the dropdown menu.
   */
  const showMenu = (show: boolean) => {
    if (!show) {
      didKeydown.value = false;
    } else if (!isMenuOpen.value) {
      const focused = document.activeElement;

      focusedBeforeOpen = focused instanceof HTMLElement && focused !== document.body ? focused : null;
    }
    isMenuOpen.value = show;
    emit('update:open', show);
  };

  /**
  * A ref for the dropdown trigger element. Used for programmatic
  * interactions and setting focus.
  */
  const dropdownTrigger = ref<RcButtonType | null>(null);

  /**
   * Registers the dropdown trigger element.
   * @param triggerRef - The dropdown trigger element.
   */
  const registerTrigger = (triggerRef: RcButtonType | null) => {
    dropdownTrigger.value = triggerRef;
  };

  /**
   * Closes the menu and returns focus to the dropdown trigger, or without one to whatever had it
   * when the menu opened.
   */
  const returnFocus = () => {
    showMenu(false);

    if (dropdownTrigger.value) {
      dropdownTrigger.value.focus();
    } else {
      focusedBeforeOpen?.focus();
    }
  };

  /**
     * Tracks if a keydown event has occurred. Important for distinguishing keyboard
     * events from mouse events.
     */
  const didKeydown = ref(false);

  const handleKeydown = () => {
    didKeydown.value = true;
  };

  /**
   * Sets focus to the first dropdown item if a keydown event has occurred.
   */
  const setFocus = (direction: 'down' | 'up') => {
    nextTick(() => {
      if (!didKeydown.value) {
        dropdownContainer.value?.focus();

        return;
      }

      if (direction === 'down') {
        firstDropdownItem.value?.focus();
      } else if (direction === 'up') {
        lastDropdownItem.value?.focus();
      }

      didKeydown.value = false;
    });
  };

  const setDropdownDimensions = (target: HTMLElement | null) => {
    if (!target) {
      return;
    }

    const { top, bottom } = target.getBoundingClientRect();
    const padding = 32;

    // The dropdown exceeds the top or bottom edge of the screen (or both).
    if (top - padding < 0 || bottom + padding > window.innerHeight) {
      const height = Math.min(
        bottom,
        window.innerHeight - top,
        window.innerHeight
      );

      target.style.height = `${ height - padding }px`;
      // Only a menu cut to the screen scrolls, so content may otherwise reach over its padding
      target.style.overflowY = 'auto';
    }
  };

  const submenus = useDropdownSubmenus(isMenuOpen, () => showMenu(false));

  const context: DropdownContext = {
    showMenu,
    registerTrigger,
    isMenuOpen,
    dropdownItems,
    close:             () => returnFocus(),
    focusFirstElement: () => {
      setFocus('down');
    },
    handleKeydown,
    submenuId:           submenus.submenuId,
    activeSubmenu:       submenus.activeSubmenu,
    registerSubmenu:     submenus.registerSubmenu,
    openSubmenu:         submenus.openSubmenu,
    hoverSubmenu:        submenus.hoverSubmenu,
    cancelSubmenuSwitch: submenus.cancelSubmenuSwitch,
  };

  /**
  * Provides Dropdown Context data and methods to descendants of RcDropdown.
  * Accessed in descendents with the `inject()` function.
  */
  const provideDropdownContext = () => {
    provide('dropdownContext', context);
  };

  /** Draws the open submenu's items, see useDropdownSubmenus */
  const SubmenuContent = submenus.makeSubmenuContent(context);

  return {
    submenus,
    SubmenuContent,
    isMenuOpen,
    showMenu,
    returnFocus,
    setFocus,
    provideDropdownContext,
    registerDropdownCollection,
    handleKeydown,
    setDropdownDimensions,
  };
};
