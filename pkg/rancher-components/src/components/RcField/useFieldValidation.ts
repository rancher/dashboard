import {
  computed, inject, ref, toValue, watch, type MaybeRefOrGetter, type Ref
} from 'vue';
import { useField } from 'vee-validate';
import type { RcFieldValidationStatus } from './types';

export const VEE_SHOW_ALL_ERRORS_KEY = 'vee-show-all-errors';

/**
 * Registers a named field with the enclosing vee-validate form, so the form's
 * schema validates it and its error shows on the field.
 *
 * Example:
 *
 * const { message, status, onBlur } = useFieldValidation({
 *   name:              () => props.name,
 *   value:             model,
 *   validationMessage: () => props.validationMessage,
 *   validationStatus:  () => props.validationStatus,
 * });
 *
 * @param options.name - The field's path in the form's values. A field is
 * registered only when it has a name on setup, and then follows changes to
 * the path, such as a row's index in a `useFieldArray`.
 */
export const useFieldValidation = (options: {
  name: MaybeRefOrGetter<string | undefined>;
  value: MaybeRefOrGetter<unknown>;
  validationMessage: MaybeRefOrGetter<string | undefined>;
  validationStatus: MaybeRefOrGetter<RcFieldValidationStatus>;
}) => {
  if (!toValue(options.name)) {
    return {
      message: computed(() => toValue(options.validationMessage)),
      status:  computed(() => toValue(options.validationStatus)),
      onBlur:  () => {},
    };
  }

  const showAllErrors = inject<Ref<boolean>>(VEE_SHOW_ALL_ERRORS_KEY, ref(false));

  const {
    value: fieldValue, errorMessage, meta, handleBlur
  } = useField(() => toValue(options.name) as string, undefined, {
    initialValue:    toValue(options.value),
    syncVModel:      false,
    validateOnMount: true,
  });

  watch(() => toValue(options.value), (value) => {
    if (fieldValue.value !== value) {
      fieldValue.value = value;
    }
  });

  const showsFieldError = computed(() => !!errorMessage.value && (meta.touched || showAllErrors.value));

  return {
    message: computed(() => (showsFieldError.value ? errorMessage.value : toValue(options.validationMessage))),
    status:  computed<RcFieldValidationStatus>(() => (showsFieldError.value ? 'error' : toValue(options.validationStatus))),
    onBlur:  (event: Event) => handleBlur(event, true),
  };
};
