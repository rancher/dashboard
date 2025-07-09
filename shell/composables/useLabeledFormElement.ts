import {
  ref, computed, ComputedRef, Ref, defineEmits
} from 'vue';
import { _VIEW, _EDIT } from '@shell/config/query-params';

interface LabeledFormElementProps {
  mode: string;
  value: string | number | Record<string, any>
  required: boolean;
  disabled: boolean;
  rules: Array<any>;
  requireDirty?: boolean;
}

interface UseLabeledFormElement {
  raised: Ref<boolean>;
  focused: Ref<boolean>;
  blurred: Ref<number | null>;
  requiredField: ComputedRef<any>;
  isDisabled: ComputedRef<any>;
  validationMessage: ComputedRef<any>;
  onFocusLabeled: () => void;
  onBlurLabeled: () => void;
}

export const labeledFormElementProps = {
  tooltipKey: {
    type:    String,
    default: null
  },
  placeholder: {
    type:    [String, Number],
    default: ''
  },
  placeholderKey: {
    type:    String,
    default: null
  },
  label: {
    type:    String,
    default: null
  },
  labelKey: {
    type:    String,
    default: null
  },
  value: {
    type:    [String, Number, Object],
    default: ''
  },
  mode: {
    type:    String,
    default: _EDIT,
  },
  rules: {
    default:   (): Array<unknown> => [],
    type:      Array,
    // we only want functions in the rules array
    validator: (rules: Array<unknown>): boolean => rules.every((rule: unknown) => ['function'].includes(typeof rule))
  },
  required: {
    type:    Boolean,
    default: false,
  },
  disabled: {
    type:    Boolean,
    default: false,
  },
  requireDirty: {
    default: true,
    type:    Boolean
  }
};

const labeledFormElementEmits = defineEmits(['update:validation']);

export const useLabeledFormElement = (props: LabeledFormElementProps, emit: typeof labeledFormElementEmits): UseLabeledFormElement => {
  const raised = ref(props.mode === _VIEW || !!`${ props.value }`);
  const focused = ref(false);
  const blurred = ref<number | null>(null);

  const requiredField = computed(() => {
    return props.required || props.rules?.some((rule: any) => rule?.name === 'required');
  });

  const isView = computed(() => {
    return props.mode === _VIEW;
  });

  const isDisabled = computed(() => {
    return props.disabled || isView.value;
  });

  const validationMessage = computed(() => {
    const requiredRule = props.rules.find((rule: any) => rule?.name === 'required') as Function;
    const ruleMessages = [];
    const value = props.value;

    if (requiredRule && blurred.value && !focused.value) {
      const message = requiredRule(value);

      if (!!message) {
        emit('update:validation', false);

        return message;
      }
    }

    for (const rule of props.rules) {
      const message = rule(value);

      if (!!message && rule.name !== 'required') {
        ruleMessages.push(message);
      }
    }

    if (ruleMessages.length > 0 && (blurred.value || focused.value || !props.requireDirty)) {
      emit('update:validation', false);

      return ruleMessages.join(', ');
    } else {
      emit('update:validation', true);

      return undefined;
    }
  });

  const onFocusLabeled = () => {
    raised.value = true;
    focused.value = true;
  };

  const onBlurLabeled = () => {
    focused.value = false;

    if (!props.value) {
      raised.value = false;
    }

    blurred.value = Date.now();
  };

  return {
    raised,
    focused,
    blurred,
    onFocusLabeled,
    onBlurLabeled,
    isDisabled,
    validationMessage,
    requiredField
  };
};
