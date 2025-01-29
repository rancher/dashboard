import { ref, provide, Ref, nextTick } from 'vue';
import { RcButtonType } from '@components/RcButton';

export const useDropdownContext = (firstDropdownItem: Ref<HTMLElement | null>) => {
  const didKeydown = ref(false);

  const handleKeydown = () => {
    didKeydown.value = true;
  };

  const isMenuOpen = ref(false);

  const showMenu = (show: boolean) => {
    isMenuOpen.value = show;
  };

  const dropdownTrigger = ref<RcButtonType | null>(null);

  const registerTrigger = (triggerRef: RcButtonType) => {
    dropdownTrigger.value = triggerRef;
  };

  const returnFocus = () => {
    showMenu(false);
    dropdownTrigger?.value?.focus();
  };

  const setFocus = () => {
    nextTick(() => {
      if (!didKeydown.value) {
        return;
      }

      firstDropdownItem.value?.focus();

      didKeydown.value = false;
    });
  };

  const provideDropdownContext = () => {
    provide('dropdownContext', {
      close:             () => returnFocus(),
      handleKeydown,
      showMenu,
      registerTrigger,
      focusFirstElement: () => {
        handleKeydown();
        setFocus();
      },
      isMenuOpen,
    });
  };

  return {
    didKeydown,
    isMenuOpen,
    showMenu,
    returnFocus,
    setFocus,
    provideDropdownContext,
  };
};
