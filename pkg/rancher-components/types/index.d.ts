import { DefineComponent } from 'vue';

export const BadgeState: DefineComponent;
export const Banner: DefineComponent;
export const Card: DefineComponent;
export const Checkbox: DefineComponent;
export const LabeledInput: DefineComponent;
export const LabeledTooltip: DefineComponent;
export const RadioButton: DefineComponent;
export const RadioGroup: DefineComponent;
export const StringList: DefineComponent;
export const TextAreaAutoGrow: DefineComponent;
export const ToggleSwitch: DefineComponent;
export const RcButton: DefineComponent;
export const RcDropdown: DefineComponent;
export const RcDropdownItem: DefineComponent;
export const RcDropdownSeparator: DefineComponent;
export const RcDropdownTrigger: DefineComponent;
export const RcItemCard: DefineComponent;
export const RcModal: DefineComponent;
export const RcSeparator: DefineComponent;

export type RcModalSize = 'small' | 'medium' | 'large';

type ArrayListRow = {
    value: string;
}

export type ArrayListData = {
    lastUpdateWasFromValue: boolean;
    rows: Array<ArrayListRow>,
}
