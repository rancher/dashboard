import { inject } from 'vue';
import { DropdownContext, defaultContext } from './types';

export const useDropdownItem = () => {
  const { dropdownItems, close } = inject<DropdownContext>('dropdownContext') || defaultContext;

  /**
   * Handles keydown events to navigate between dropdown items.
   * @param {KeyboardEvent} e - The keydown event.
   */
  const handleKeydown = (e: KeyboardEvent) => {
    const activeItem = document.activeElement;

    const activeIndex = dropdownItems.value.indexOf(activeItem || new HTMLElement());

    if (activeIndex < 0) {
      return;
    }

    const shouldAdvance = e.key === 'ArrowDown';

    const newIndex = findNewIndex(shouldAdvance, activeIndex, dropdownItems.value);

    if (dropdownItems.value[newIndex] instanceof HTMLElement) {
      dropdownItems.value[newIndex].focus();
    }
  };

  /**
   * Finds the new index for the dropdown item based on the key pressed.
   * @param shouldAdvance - Whether to advance to the next or previous item.
   * @param activeIndex - Current active index.
   * @param itemsArr - Array of dropdown items.
   * @returns The new index.
   */
  const findNewIndex = (shouldAdvance: boolean, activeIndex: number, itemsArr: Element[]) => {
    const newIndex = shouldAdvance ? activeIndex + 1 : activeIndex - 1;

    if (newIndex > itemsArr.length - 1) {
      return 0;
    }

    if (newIndex < 0) {
      return itemsArr.length - 1;
    }

    return newIndex;
  };

  /**
   * Handles keydown events to activate the dropdown item.
   * @param e - The keydown event.
   */
  const handleActivate = (e: KeyboardEvent) => {
    if (e?.target instanceof HTMLElement) {
      e?.target?.click();
    }
  };

  return {
    handleKeydown, close, handleActivate
  };
};
