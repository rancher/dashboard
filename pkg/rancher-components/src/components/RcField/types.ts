import type { _EDIT, _VIEW } from '@shell/config/query-params';
import type { IconTooltipContent } from '@components/RcIconTooltip/types';

export type RcFieldSize = 'small' | 'medium' | 'large';

export type RcFieldMode = typeof _EDIT | typeof _VIEW;

export type RcFieldValidationStatus = 'error' | 'warning' | 'success' | 'info';

export type RcFieldStateProps = {
  mode?: RcFieldMode;
  disabled?: boolean;
};

export type RcFieldState = {
  mode: RcFieldMode;
  disabled: boolean;
};

export type RcFieldProps = RcFieldStateProps & {
  size?: RcFieldSize;
  label?: string;
  required?: boolean;
  tooltip?: IconTooltipContent;
  helperText?: string;
  validationMessage?: string;
  validationStatus?: RcFieldValidationStatus;
  /**
   * Shows the Reset link in the header. The field emits `reset` when it is
   * activated.
   */
  resettable?: boolean;
  /**
   * The id of the control. One is generated when this is omitted.
   */
  id?: string;
};

export type RcFieldSlotProps = {
  id: string;
  describedby: string | undefined;
  invalid: boolean;
  required: boolean;
  disabled: boolean;
  isView: boolean;
};
