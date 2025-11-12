import { RcIconType } from '@components/RcIcon/types';
import { ButtonSize } from '@components/RcButton/types';

export type DropdownButtonRole = 'primary' | 'secondary';

/**
 * Represents an option in the dropdown menu portion of a split button.
 * Similar to DropdownOption from RcDropdownMenu, but simplified for split button use cases.
 */
export type DropdownButtonOption = {
  /** Display text for the menu item */
  label?: string;
  /** Icon to display before the label */
  icon?: RcIconType;
  /** Whether the menu item is disabled and not clickable */
  disabled?: boolean;
  /** If true, renders a separator instead of a menu item */
  divider?: boolean;
  /** Optional action identifier for the menu item */
  action?: string;
  /** Allow additional custom properties */
  [key: string]: any;
}

/**
 * Props for the RcDropdownButton component.
 * A split button combines a primary action button with a dropdown menu.
 */
export type RcDropdownButtonProps = {
  /** Visual style of the button ('primary' or 'secondary') */
  role?: DropdownButtonRole;
  /** Size of the button ('small', 'medium', or 'large') */
  size?: ButtonSize;
  /** Icon to display on the left side of the primary button */
  leftIcon?: RcIconType;
  /** Whether both the primary button and dropdown are disabled */
  disabled?: boolean;
  /** Array of options to display in the dropdown menu */
  options?: DropdownButtonOption[];
  /** Accessibility label for the dropdown menu */
  dropdownAriaLabel?: string;
  /** Accessibility label for the dropdown toggle button */
  dropdownButtonAriaLabel?: string;
}
