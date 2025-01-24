import { provide, ref } from 'vue';

export const useDropdownCollection = () => {
  const dropdownItems = ref<Element[]>([]);
  const dropdownContainer = ref<HTMLElement | null>(null);
  const firstDropdownItem = ref<HTMLElement | null>(null);

  const registerDropdownItems = () => {
    dropdownItems.value = [];
    const dropdownNodeList = dropdownContainer.value?.querySelectorAll('[dropdown-menu-item]');

    dropdownNodeList?.forEach((element) => {
      dropdownItems.value.push(element);
    });
  };

  const registerDropdownCollection = (target: HTMLElement | null) => {
    dropdownContainer.value = target;
    if (dropdownContainer.value?.firstElementChild instanceof HTMLElement) {
      registerDropdownItems();
      if (dropdownItems.value[0] instanceof HTMLElement) {
        firstDropdownItem.value = dropdownItems.value[0];
      }
    }
  };

  const provideDropdownCollection = () => {
    provide('dropdownCollection', { dropdownItems });
  };

  return {
    firstDropdownItem,
    provideDropdownCollection,
    registerDropdownCollection,
  };
};
