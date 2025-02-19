import { Ref, ref } from 'vue';
import type { RcButtonType } from '@components/RcButton';
import { ButtonRoleProps, ButtonSizeProps } from '@components/RcButton/types';

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

export type DropdownOption = {
  action?: string;
  divider?: boolean;
  enabled: boolean;
  icon?: string;
  svg?: string;
  label?: string;
  total: number;
  allEnabled: boolean;
  anyEnabled: boolean;
  available: number;
  bulkable?: boolean;
  bulkAction?: string;
  altAction?: string;
  weight?: number;
}

export type RcDropdownMenuComponentProps = {
  options: DropdownOption[];
  buttonRole?: keyof ButtonRoleProps;
  buttonSize?: keyof ButtonSizeProps;
  buttonAriaLabel?: string;
  dropdownAriaLabel?: string;
  dataTestid?: string;
}
