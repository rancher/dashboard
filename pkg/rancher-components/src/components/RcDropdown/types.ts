import { Ref, ref } from 'vue';
import type { RcButtonType } from '@components/RcButton';

export type DropdownContext = {
  handleKeydown: () => void;
  showMenu: (show: boolean) => void;
  registerTrigger: (triggerRef: RcButtonType | null) => void;
  dropdownItems: Ref<Element[]>;
  focusFirstElement: () => void;
  isMenuOpen: Ref<boolean>;
  close: () => void;
}

export const defaultContext: DropdownContext = {
  handleKeydown:     () => null,
  showMenu:          (_show: boolean | null) => null,
  registerTrigger:   (_triggerRef: RcButtonType | null) => null,
  dropdownItems:     ref([]),
  focusFirstElement: () => null,
  isMenuOpen:        ref(false),
  close:             () => null,
};
