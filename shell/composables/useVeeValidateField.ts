import { computed, inject, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { useField } from 'vee-validate';
import { generateRandomAlphaString } from '@shell/utils/string';

interface UseVeeValidateFieldOptions {
  name: Ref<string | null | undefined>;
  rules: Ref<Array<any>>;
  value: Ref<unknown>;
  validationMessage: Ref<unknown>;
}

export function useVeeValidateField({
  name,
  rules,
  value,
  validationMessage,
}: UseVeeValidateFieldOptions) {
  const showAllErrors = inject<Ref<boolean>>('vee-show-all-errors', ref(false));
  const standaloneFieldId = `__field__${ generateRandomAlphaString(12) }`;
  const veeFieldName = computed(() => name.value || standaloneFieldId);

  const veeValidator = (v: unknown): boolean | string => {
    if (!name.value) return true;
    for (const rule of rules.value as Array<(v: unknown) => string | undefined>) {
      const msg = rule(v);

      if (msg) return msg;
    }

    return true;
  };

  const {
    errorMessage: veeError,
    handleBlur:   veeHandleBlur,
    validate:     veeValidate,
    value:        veeValue,
    meta:         veeMeta,
  } = useField<unknown>(veeFieldName, veeValidator, {
    initialValue:          value.value,
    validateOnValueUpdate: true,
    validateOnMount:       true,
  });

  // Keep vee-validate's internal value in sync with the controlled prop value.
  watch(value, (v) => {
    if (veeValue.value !== v) {
      veeValue.value = v;
    }
  });

  const effectiveValidationMessage = computed(() => {
    if (name.value && veeError.value && (veeMeta.touched || showAllErrors.value)) {
      return veeError.value;
    }

    return validationMessage.value;
  });

  return {
    effectiveValidationMessage,
    veeHandleBlur,
    veeValidate,
    showAllErrors,
  };
}
