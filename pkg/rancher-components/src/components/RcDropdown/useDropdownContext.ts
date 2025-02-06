import { ref, provide, nextTick, defineEmits } from 'vue';
import { useDropdownCollection } from './useDropdownCollection';
import { RcButtonType } from '@components/RcButton';

const rcDropdownEmits = defineEmits(['update:open']);

/**
 * Composable that provides the context for a dropdown menu. Includes methods
 * and state for managing the dropdown's visibility, focus, and keyboard
 * interactions.
 *
 * @param firstDropdownItem - First item in the dropdown menu.
 * @returns Dropdown context methods and state. Used for programmatic
 * interactions and setting focus.
 */
export const useDropdownContext = (emit: typeof rcDropdownEmits) => {
  const {
    dropdownItems,
    firstDropdownItem,
    dropdownContainer,
    registerDropdownCollection,
  } = useDropdownCollection();

  const isMenuOpen = ref(false);

  /**
   * Controls the visibility of the dropdown menu.
   * @param show - Whether to show or hide the dropdown menu.
   */
  const showMenu = (show: boolean) => {
    if (!show) {
      didKeydown.value = false;
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
  const registerTrigger = (triggerRef: RcButtonType) => {
    dropdownTrigger.value = triggerRef;
  };

  /**
   * Returns focus to the dropdown trigger and closes the menu.
   */
  const returnFocus = () => {
    showMenu(false);
    dropdownTrigger?.value?.focus();
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
  const setFocus = () => {
    nextTick(() => {
      if (!didKeydown.value) {
        dropdownContainer.value?.focus();

        return;
      }

      firstDropdownItem.value?.focus();
      didKeydown.value = false;
    });
  };

  /**
  * Provides Dropdown Context data and methods to descendants of RcDropdown.
  * Accessed in descendents with the `inject()` function.
  */
  const provideDropdownContext = () => {
    provide('dropdownContext', {
      showMenu,
      registerTrigger,
      isMenuOpen,
      dropdownItems,
      close:             () => returnFocus(),
      focusFirstElement: () => {
        setFocus();
      },
      handleKeydown,
    });
  };

  return {
    isMenuOpen,
    showMenu,
    returnFocus,
    setFocus,
    provideDropdownContext,
    registerDropdownCollection,
    handleKeydown,
  };
};
