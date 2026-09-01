import { ref } from 'vue';

/**
 * Manages a collection of dropdown items. Includes methods for registering
 * dropdown items and providing the collection to descendant components.
 *
 * @returns Dropdown collection methods and state.
 */
export const useDropdownCollection = () => {
  const dropdownItems = ref<Element[]>([]);
  const dropdownContainer = ref<HTMLElement | null>(null);
  const firstDropdownItem = ref<HTMLElement | null>(null);
  const lastDropdownItem = ref<HTMLElement | null>(null);

  /**
   * Registers the dropdown container and initializes dropdown items.
   * @param target - The dropdown container element.
   */
  const registerDropdownCollection = (target: HTMLElement | null) => {
    dropdownContainer.value = target;
    if (dropdownContainer.value?.firstElementChild instanceof HTMLElement) {
      registerDropdownItems();
      if (dropdownItems.value[0] instanceof HTMLElement) {
        firstDropdownItem.value = dropdownItems.value[0];
      }

      const lastItem = dropdownItems.value[dropdownItems.value.length - 1];

      if (lastItem instanceof HTMLElement) {
        lastDropdownItem.value = lastItem;
      }
    }
  };

  /**
   * Registers dropdown items by querying the dropdown container for elements.
   */
  const registerDropdownItems = () => {
    dropdownItems.value = [];
    const dropdownNodeList = dropdownContainer.value?.querySelectorAll('[dropdown-menu-item]');

    dropdownNodeList?.forEach((element) => {
      dropdownItems.value.push(element);
    });
  };

  return {
    dropdownItems,
    firstDropdownItem,
    lastDropdownItem,
    dropdownContainer,
    registerDropdownCollection,
  };
};
