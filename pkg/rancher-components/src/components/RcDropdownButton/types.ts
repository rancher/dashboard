import { RcIconType } from '@components/RcIcon/types';
import { ButtonSize } from '@components/RcButton/types';

export type DropdownButtonRole = 'primary' | 'secondary';

/**
 * Represents an option in the dropdown menu portion of a split button.
 * Similar to DropdownOption from RcDropdownMenu, but simplified for split button use cases.
 */
export type DropdownButtonOption = {
  label?: string;
  icon?: RcIconType;
  disabled?: boolean;
  divider?: boolean;
  action?: string;
}

/**
 * Props for the RcDropdownButton component.
 * A split button combines a primary action button with a dropdown menu.
 */
export type RcDropdownButtonProps = {
  role?: DropdownButtonRole;
  size?: ButtonSize;
  leftIcon?: RcIconType;
  disabled?: boolean;
  options?: DropdownButtonOption[];
  dropdownAriaLabel?: string;
  dropdownButtonAriaLabel?: string;
}
