import { Ref, ref, VNode } from 'vue';
import type { RcButtonType } from '@components/RcButton';
import { ButtonVariant, ButtonSize } from '@components/RcButton/types';

/** A nested menu, as RcDropdownSubmenu hands it to the menu it sits in */
export type DropdownSubmenu = {
  /** Which side of the menu it opens on */
  side: 'left' | 'right';
  /** The item that opens it, which takes the focus back when it closes */
  row: () => HTMLElement | null;
  /** The id of the item's label, which names the submenu */
  labelId: string;
  render: () => VNode[] | undefined;
};

export type DropdownContext = {
  handleKeydown: () => void;
  showMenu: (show: boolean) => void;
  registerTrigger: (triggerRef: RcButtonType | null) => void;
  dropdownItems: Ref<Element[]>;
  focusFirstElement: () => void;
  isMenuOpen: Ref<boolean>;
  close: () => void;
  /** The id of the element the open submenu is drawn in */
  submenuId: string;
  activeSubmenu: Ref<DropdownSubmenu | null>;
  /** Returns the unregister. The menu only draws submenus while it has some */
  registerSubmenu: (submenu: DropdownSubmenu) => () => void;
  /** `focusFirst` for one opened from the keyboard */
  openSubmenu: (submenu: DropdownSubmenu, focusFirst: boolean) => void;
  /** The pointer is over an item: a submenu's, or null for any other */
  hoverSubmenu: (submenu: DropdownSubmenu | null) => void;
  cancelSubmenuSwitch: () => void;
  /** Set for the items of a submenu, where a submenu of their own isn't drawn: one level is supported */
  inSubmenu?: boolean;
}

export const defaultContext: DropdownContext = {
  handleKeydown:       () => null,
  showMenu:            (_show: boolean | null) => null,
  registerTrigger:     (_triggerRef: RcButtonType | null) => null,
  dropdownItems:       ref([]),
  focusFirstElement:   () => null,
  isMenuOpen:          ref(false),
  close:               () => null,
  submenuId:           '',
  activeSubmenu:       ref(null),
  registerSubmenu:     () => () => null,
  openSubmenu:         () => null,
  hoverSubmenu:        () => null,
  cancelSubmenuSwitch: () => null,
  inSubmenu:           false,
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
  buttonVariant?: ButtonVariant;
  buttonSize?: ButtonSize;
  buttonAriaLabel?: string;
  dropdownAriaLabel?: string;
  dataTestid?: string;
}
