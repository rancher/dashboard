export type Type = 'active' | 'inactive';

export interface RcTagProps {
  type: Type;
  disabled?: boolean;
  showClose?: boolean;
  closeAriaLabel?: string;
}
