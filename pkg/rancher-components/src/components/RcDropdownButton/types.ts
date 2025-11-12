import { RcIconType } from '@components/RcIcon/types';
import { ButtonSize } from '@components/RcButton/types';

export type DropdownButtonRole = 'primary' | 'secondary';

export type DropdownButtonOption = {
  label?: string;
  icon?: RcIconType;
  disabled?: boolean;
  divider?: boolean;
  action?: string;
  [key: string]: any;
}

export type RcDropdownButtonProps = {
  role?: DropdownButtonRole;
  size?: ButtonSize;
  leftIcon?: RcIconType;
  disabled?: boolean;
  options?: DropdownButtonOption[];
  dropdownAriaLabel?: string;
  dropdownButtonAriaLabel?: string;
}
