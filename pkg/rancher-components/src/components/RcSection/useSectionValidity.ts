import {
  computed, hasInjectionContext, inject, onBeforeUnmount, provide, ref, shallowReactive, type ComputedRef, type InjectionKey, type Ref
} from 'vue';

interface SectionValidity {
  report(invalid: Readonly<Ref<boolean>>): () => void;
  /** How many times this section, or a section around it, has been validated */
  validations: Readonly<Ref<number>>;
}

const SECTION_VALIDITY_KEY: InjectionKey<SectionValidity> = Symbol('rc-section-validity');

const injectSection = () => (hasInjectionContext() ? inject(SECTION_VALIDITY_KEY, null) : null);

/**
 * Reports whether a form field is invalid to the RcSection it is in, so the section can show that it holds
 * invalid fields. Does nothing outside an RcSection, or outside setup().
 */
export function useReportInvalidToSection(invalid: Readonly<Ref<boolean>>): void {
  const section = injectSection();

  if (!section) {
    return;
  }

  onBeforeUnmount(section.report(invalid));
}

/**
 * Whether a field should show its errors without waiting to be touched. True once the RcSection it is in, or a
 * section around it, has been validated while the field was there, so fields added later (e.g. by enabling an
 * option) don't start out showing errors. Always false outside an RcSection. Call from setup().
 */
export function useSectionShowErrors(): Readonly<Ref<boolean>> {
  const section = injectSection();

  if (!section) {
    return ref(false);
  }

  const validationsWhenAdded = section.validations.value;

  return computed(() => section.validations.value > validationsWhenAdded);
}

/**
 * Collects the reports of the fields inside an RcSection, and passes the result on to the section around it,
 * so a parent also shows invalid fields in its nested sections. `validate` makes the fields inside, including
 * ones in nested sections, show their errors from then on. Call from setup().
 */
export function provideSectionValidity(): { hasInvalid: ComputedRef<boolean>; validate: () => void } {
  const parent = injectSection();
  const reports = shallowReactive(new Set<Readonly<Ref<boolean>>>());
  const hasInvalid = computed(() => [...reports].some((invalid) => invalid.value));
  const ownValidations = ref(0);
  const validations = computed(() => ownValidations.value + (parent?.validations.value ?? 0));

  // inject() resolves from the parent, so this reports to the enclosing section, not to this one
  useReportInvalidToSection(hasInvalid);

  provide(SECTION_VALIDITY_KEY, {
    report(invalid) {
      reports.add(invalid);

      return () => reports.delete(invalid);
    },
    validations,
  });

  return {
    hasInvalid,
    validate: () => {
      ownValidations.value++;
    },
  };
}
