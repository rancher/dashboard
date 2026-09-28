import { Type } from '../types';

export interface RcTagProps {
  type: Type;
  disabled?: boolean;
  showClose?: boolean;
  closeAriaLabel?: string;
  highlight?: boolean;
}
