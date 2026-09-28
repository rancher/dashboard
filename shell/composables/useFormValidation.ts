import { computed, provide, ref } from 'vue';
import { useForm } from 'vee-validate';
import formRulesGenerator from '@shell/utils/validators/formRules/index';
import type { Validator } from '@shell/utils/validators/formRules/index';
import type { Translation } from '@shell/types/t';

export interface RuleSet {
  path: string;
  rules: string[];
  translationKey?: string;
}

const nullValidator: Validator = () => undefined;

function createRuleResolver(
  t: Translation,
  ruleSets: RuleSet[],
  extraRules: Record<string, Validator>
) {
  return (path: string): Validator[] => {
    const set = ruleSets.find((s) => s.path === path);

    if (!set) return [];

    const key = set.translationKey ? t(set.translationKey) : 'Value';
    const allRules = {
      ...formRulesGenerator(t, { key }),
      ...extraRules,
    };

    return set.rules.map((r) => {
      const rule = allRules[r] as Validator | undefined;

      if (rule) {
        return rule;
      }

      if (process.env.NODE_ENV !== 'production') {
        throw new Error(`[useFormValidation] Unknown validation rule: "${ r }". Check for a typo in your ruleSets.`);
      }

      return nullValidator;
    });
  };
}

/**
 * For root/parent form components. Creates a vee-validate form context and
 * resolves fvFormRuleSets-style rule string arrays into validator functions.
 * Child components rendered within this form should use useFormRules instead.
 */
export function useFormValidation(
  t: Translation,
  ruleSets: RuleSet[],
  extraRules: Record<string, Validator> = {}
) {
  const { errors, validate } = useForm();
  const showAllErrors = ref(false);

  provide('vee-show-all-errors', showAllErrors);

  const getRules = createRuleResolver(t, ruleSets, extraRules);
  const isFormValid = computed(() => Object.keys(errors.value).length === 0);

  const validateForm: typeof validate = async(...args) => {
    const result = await validate(...args);

    showAllErrors.value = true;

    return result;
  };

  return {
    getRules,
    isFormValid,
    validateForm,
    veeErrors: errors,
    showAllErrors,
  };
}

/**
 * For child components that render inside a parent useFormValidation() form.
 * Resolves rule strings into validator functions without creating a new form
 * context — fields register with the nearest ancestor's useFormValidation() context.
 */
export function useFormRules(
  t: Translation,
  ruleSets: RuleSet[],
  extraRules: Record<string, Validator> = {}
) {
  return { getRules: createRuleResolver(t, ruleSets, extraRules) };
}
