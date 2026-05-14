import debounce from 'lodash/debounce';
import { randomStr } from '@shell/utils/string';
import {
  computed, inject, onMounted, onUnmounted, provide, ref, useTemplateRef, watch
} from 'vue';
import type {
  ComputedRef,
  Ref,
  VNode
} from 'vue';

type SummaryInfo = {
  id: string;
  label?: ComputedRef<string> | string;
  scrollTo?: () => void;
};

type SummaryComponent = {
  summary: SummaryInfo;
  summaryID: String;
  $options?: { name?: string };
  $?: { type?: { name?: string } };
};

type SummaryEntry = {
  node: VNode;
  children: SummaryEntry[];
  label?: string | ComputedRef<string>;
  scrollTo?: () => void;
  component?: SummaryComponent;
};

type RegisterComponent = (component?: SummaryComponent | null) => void;

type FormSummaryContext = {
  registerComponent: RegisterComponent;
  unRegisterComponent: RegisterComponent;
  refreshComponents: () => void;
  updateComponentLabel: (summaryID: string, label: string) => boolean;
};

type ElementWithVNodeChildren = {
  children?: ArrayLike<Element>;
};

type ElementWithSummaryID = HTMLElement & {
  summaryID?: string;
};

// Unique key used by provide/inject so each form subtree gets its own
// summary registration context
const FORM_SUMMARY_KEY = Symbol('formSummary');

/**
 * useFormSummary will determine the relative position of all descendant components
 * that are using the useInSummary composable. It is used to build summaries of elaborate form components
 * that may have interactable elements deeply nested in child components. The list of located components
 * returned by locateComponentsByNamePattern includes access to the component instance and a scrollTo method.
 */
export function useFormSummary(rootComponentRefKey: string) {
  let rootComponentRef: Readonly<Ref<HTMLElement | null>> | undefined;

  const registeredComponents = ref<Record<string, SummaryComponent>>({});
  const locatedComponents = ref<SummaryEntry[]>([]);
  const buildTree = (
    components: SummaryEntry[] = [],
    node?: any,
    found = new Set<string>()
  ) => {
    let nextInput = components;

    const summaryID = node?.el ? (node?.el as ElementWithSummaryID | null | undefined)?.summaryID || '' : node?.summaryID || '';
    const component = registeredComponents.value[summaryID];
    const summary = component?.summary;

    if (component && summary && registeredComponents.value[summary.id] && !found.has(summary.id)) {
      found.add(summary.id);

      const out: SummaryEntry = {
        node:     node as VNode,
        children: [],
        ...summary,
        scrollTo: component ? () => scrollToComponent(component) : undefined
      };

      out.component = component;

      components.push(out);
      nextInput = out.children;
    }

    if (!node) {
      return;
    }

    const children = node.el ? Array.from((node.el as ElementWithVNodeChildren | null | undefined)?.children ?? []) : Array.from(node.children ?? []);

    children.forEach((child: any) => {
      buildTree(nextInput, child, found);
    });

    return components;
  };

  const locateRegisteredComponents = () => {
    if (rootComponentRef?.value) {
      locatedComponents.value = buildTree([], rootComponentRef.value) || [];
    } else {
      locatedComponents.value = [];
    }
  };

  // when forms initially this is called synchonously by every component using the summary composable
  // debounce without a delay reduces that to one call on initial page load
  const debouncedLocateRegisteredComponents = debounce(locateRegisteredComponents);

  // onMounted fires on the calling component (CruResource) after its template refs are
  // populated and after all children have run their own onMounted hooks. This guarantees
  // rootComponentRef is available and all child registrations have arrived.
  onMounted(() => {
    rootComponentRef = useTemplateRef(rootComponentRefKey);
    debouncedLocateRegisteredComponents();
  });

  const findParent = (component: SummaryComponent) => {
    const walk = (entries: SummaryEntry[] = [], parent: SummaryEntry | null = null): SummaryEntry | null => {
      for (const entry of entries) {
        if (entry?.component?.summary?.id === component?.summary?.id) {
          return parent;
        }

        if (entry?.children?.length) {
          const found = walk(entry.children, entry);

          if (found) {
            return found;
          }
        }
      }

      return null;
    };

    return walk(locatedComponents.value);
  };

  const updateComponentLabel = (summaryID: string, label: string) => {
    const walk = (entries: SummaryEntry[] = []): boolean => {
      for (const entry of entries) {
        if (entry?.component?.summary?.id === summaryID) {
          entry.label = label;

          return true;
        }

        if (entry?.children?.length && walk(entry.children)) {
          return true;
        }
      }

      return false;
    };

    return walk(locatedComponents.value);
  };

  const scrollToComponent = (component: SummaryComponent) => {
    const parent = findParent(component);

    if (parent?.component) {
      scrollToComponent(parent.component);
    }
    if (component?.summary?.scrollTo) {
      component.summary.scrollTo();
    }
  };

  const registerComponent: RegisterComponent = (component) => {
    if (!component || !component.summary?.id) {
      return;
    }
    registeredComponents.value[component.summary?.id] = component;
    debouncedLocateRegisteredComponents();
  };

  const unRegisterComponent: RegisterComponent = (component) => {
    if (!component || !component.summary?.id) {
      return;
    }

    delete registeredComponents.value[component.summary?.id];
    debouncedLocateRegisteredComponents();
  };

  // Provide the register/unregister functions to all descendants
  provide<FormSummaryContext>(FORM_SUMMARY_KEY, {
    registerComponent,
    unRegisterComponent,
    refreshComponents: debouncedLocateRegisteredComponents,
    updateComponentLabel,
  });

  const locateComponentsByNamePattern = (pattern?: string): ComputedRef<SummaryEntry[]> => {
    if (!pattern) {
      return computed(() => locatedComponents.value);
    }

    const matcher = new RegExp(pattern);

    const matches = (entry: SummaryEntry) => {
      const componentName = entry.component?.$options?.name || (entry.component?.$?.type as { name?: string } | undefined)?.name || '';

      return matcher.test(componentName);
    };

    const filterTree = (entries: SummaryEntry[] = []) => {
      return entries.reduce((acc: SummaryEntry[], entry) => {
        const filteredChildren = filterTree(entry?.children || []);
        const isMatch = matches(entry);

        if (isMatch) {
          acc.push({
            ...entry,
            children: filteredChildren
          });
        } else if (filteredChildren.length) {
          acc.push(...filteredChildren);
        }

        return acc;
      }, []);
    };

    return computed(() => filterTree(locatedComponents.value));
  };

  return { locateComponentsByNamePattern };
}

/**
 * Hook to register a component in the summary system.
 * Injects register/unregister from the nearest ancestor that called useFormSummary().
 * When the component is mounted (including after v-if re-reveals it), it re-registers
 * into the correct scoped context. Components using inFormSummary will register themselves
 *  with the nearest ancestor containing useFormSummary
 *
 * @param options.scrollTo - Scroll handler. The ToC system calls this function when the
 *   user navigates to this component via the Table of Contents. Use this to perform any
 *   additional work before scrolling (e.g. expanding an accordion, revealing a tab).
 * @param options.label - Label for this component's ToC entry. Accepts a plain string or
 *   a `ComputedRef<string>`.
 * @param options.elementRef - A template ref pointing to the component's root element.
 *   Used by the ToC system to locate this component during DOM tree traversal.
 */
export function useInSummary(options: { scrollTo: () => void; label: ComputedRef<string> | string; elementRef: Readonly<Ref<HTMLElement | null>> }) {
  const {
    registerComponent = () => {},
    unRegisterComponent = () => {},
    refreshComponents = () => {},
    updateComponentLabel = () => false
  } = inject<FormSummaryContext>(FORM_SUMMARY_KEY) || {};

  const { scrollTo, label, elementRef } = options;

  const summaryID = randomStr();
  const summary: SummaryInfo = { id: summaryID, scrollTo };

  // Wrap a plain string in a computed so the type is always ComputedRef<string>.
  summary.label = typeof label === 'string' ? computed(() => label) : label;

  watch(summary.label, (label) => {
    const updated = updateComponentLabel(summaryID, label);

    if (!updated) {
      refreshComponents();
    }
  });

  onMounted(() => {
    if (elementRef.value) {
      (elementRef.value as ElementWithSummaryID).summaryID = summaryID;
    }

    registerComponent({ summary, summaryID } as SummaryComponent);
  });

  onUnmounted(() => {
    // Unregister by summary ID — only the ID is needed for deletion
    const stub = { summary } as SummaryComponent;

    unRegisterComponent(stub);
  });

  return { summary };
}
