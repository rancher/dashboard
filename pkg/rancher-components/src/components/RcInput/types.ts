import type { RcFieldProps } from '@components/RcField/types';

export type RcInputValue = string | number | null | undefined;

export type RcInputNativeType = 'text' | 'email' | 'number' | 'password' | 'search' | 'tel' | 'url';

export type RcInputProps = Omit<RcFieldProps, 'resettable'> & {
  type?: RcInputNativeType;
  /**
   * The native input's name. Registers the input for validation with
   * vee-validate.
   */
  name?: string;
  placeholder?: string;
  /**
   * Shows a button to clear the input when it has a value
   */
  clearable?: boolean;
  /**
   * The value Reset restores. The Reset link shows while the value differs
   * from it.
   */
  resetValue?: RcInputValue;
};

export type RcInputPasswordProps = Omit<RcInputProps, 'type'>;

export type RcInputSearchProps = Omit<RcInputProps, 'type' | 'mode'>;

export type RcInputUnitProps = RcInputProps & {
  /**
   * The unit of measurement shown after the value, such as `MiB` or `cores`.
   */
  unit: string;
};

/**
 * The scoped slot props RcInput passes to its `prefix` and `suffix` slots.
 */
export type RcInputAffixSlotProps = {
  disabled: boolean;
  isView: boolean;
};

/**
 * The methods RcInput and its variants expose on a template ref.
 */
export type RcInputExpose = {
  focus: () => void;
  blur: () => void;
  select: () => void;
};
