import { ref, computed } from 'vue';
import type { ComputedRef } from 'vue';
import { _VIEW } from '@shell/config/query-params';

interface LabeledFormElementProps {
  mode: string;
  value: string | number | Record<string, any>
  required: boolean;
  disabled: boolean;
  rules: Array<any>;
}

interface UseLabeledFormElement {
  requiredField: ComputedRef<any>;
  isDisabled: ComputedRef<any>;
  validationMessage: ComputedRef<any>;
  onFocusLabeled: () => void;
  onBlurLabeled: () => void;
}

export const useLabeledFormElement = (props: LabeledFormElementProps, emit: (event: string, ...args: any[]) => void): UseLabeledFormElement => {
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
        return message;
      }
    }

    for (const rule of props.rules) {
      const message = rule(value);

      if (!!message && rule.name !== 'required') {
        ruleMessages.push(message);
      }
    }

    if (ruleMessages.length > 0 && (blurred.value || focused.value)) {
      return ruleMessages.join(', ');
    } else {
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
    onFocusLabeled,
    onBlurLabeled,
    isDisabled,
    validationMessage,
    requiredField
  };
};
