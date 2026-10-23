import {
  computed, hasInjectionContext, inject, onBeforeUnmount, provide, shallowReactive, type ComputedRef, type InjectionKey, type Ref
} from 'vue';

interface SectionValidity {
  report(invalid: Readonly<Ref<boolean>>): () => void;
}

const SECTION_VALIDITY_KEY: InjectionKey<SectionValidity> = Symbol('rc-section-validity');

/**
 * Reports whether a form field is invalid to the RcSection it is in, so a collapsed section can show that
 * it holds invalid fields. Does nothing outside an RcSection, or outside setup().
 */
export function useReportInvalidToSection(invalid: Readonly<Ref<boolean>>): void {
  const section = hasInjectionContext() ? inject(SECTION_VALIDITY_KEY, null) : null;

  if (!section) {
    return;
  }

  onBeforeUnmount(section.report(invalid));
}

/**
 * Collects the reports of the fields inside an RcSection, and passes the result on to the section around it,
 * so a collapsed parent also shows invalid fields in its nested sections. Call from setup().
 */
export function provideSectionValidity(): ComputedRef<boolean> {
  const reports = shallowReactive(new Set<Readonly<Ref<boolean>>>());
  const hasInvalid = computed(() => [...reports].some((invalid) => invalid.value));

  // inject() resolves from the parent, so this reports to the enclosing section, not to this one
  useReportInvalidToSection(hasInvalid);

  provide(SECTION_VALIDITY_KEY, {
    report(invalid) {
      reports.add(invalid);

      return () => reports.delete(invalid);
    }
  });

  return hasInvalid;
}
