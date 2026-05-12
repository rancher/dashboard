import debounce from 'lodash/debounce';
import { randomStr } from '@shell/utils/string';
import {
  computed, getCurrentInstance, inject, onMounted, onUnmounted, provide, ref, watch
} from 'vue';
import type {
  ComponentInternalInstance,
  ComponentPublicInstance,
  ComputedRef,
  VNode
} from 'vue';

type SummaryInfo = {
  id: string;
  label?: ComputedRef<string>;
  scrollTo?: () => void;
};

type SummaryComponent = ComponentPublicInstance & {
  summary?: SummaryInfo;
  displayTitle?: string;
  title?: string;
  label?: string;
  labelKey?: string;
  name?: string;
  scrollTo?: () => void;
  getComponentLabel?: () => string;
};

type SummaryEntry = {
  node: VNode;
  children: SummaryEntry[];
  label: string;
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
export function useFormSummary() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const root = getCurrentInstance() as any; // get around issue typing root.proxy.$store

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
        label:    summary.label?.value || summary.id,
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
    const parent = root?.parent as ComponentInternalInstance | null | undefined;

    locatedComponents.value = buildTree([], parent?.vnode) || [];
  };

  // when forms initially this is called synchonously by every component using the summary composable
  // debounce without a delay reduces that to one call on initial page load
  const debouncedLocateRegisteredComponents = debounce(locateRegisteredComponents);

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
    if (component.scrollTo) {
      component.scrollTo();
    } else if (component?.summary?.scrollTo) {
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
 * @param options.scrollTo - Optional scroll handler. When provided, the ToC system calls
 *   this function instead of the default `element.scrollIntoView` behaviour when the user
 *   navigates to this component via the Table of Contents. Use this to perform any
 *   additional work before scrolling (e.g. expanding an accordion, revealing a tab).
 * @param options.label - Optional label for this component's ToC entry. Accepts a plain
 *   string or a `ComputedRef<string>`. When provided it takes precedence over the
 *   automatic label derived from `displayTitle`, `title`, `labelKey`, etc.
 */
export function useInSummary(options?: { scrollTo?: () => void; label?: ComputedRef<string> | string }) {
  const {
    registerComponent = () => {},
    unRegisterComponent = () => {},
    refreshComponents = () => {},
    updateComponentLabel = () => false
  } = inject<FormSummaryContext>(FORM_SUMMARY_KEY) || {};
  const instance = getCurrentInstance() as any; // avoid TS error TS2339
  const t = instance?.proxy?.$store?.getters?.['i18n/t'] as ((key: string) => string) | undefined;
  const component = ref<SummaryComponent | null>(null);

  // Use the caller-supplied scrollTo if provided; otherwise fall back to a plain scrollIntoView.
  const scrollTo = options?.scrollTo ?? (() => {
    const el = instance?.proxy?.$el as ElementWithSummaryID | null | undefined;

    (el as HTMLElement | undefined)?.scrollIntoView(true);
  });

  // options.label will take precedence if defined
  const getComponentLabel = () => {
    const currentComponent = component.value;

    if (currentComponent?.displayTitle) {
      return currentComponent.displayTitle;
    }

    if (currentComponent?.title) {
      return currentComponent.title;
    }

    if (currentComponent?.label) {
      return currentComponent.label;
    }

    if (currentComponent?.labelKey) {
      return typeof t === 'function' ? t(currentComponent.labelKey) : currentComponent.labelKey;
    }

    if (currentComponent?.name) {
      return currentComponent.name;
    }

    return summaryID;
  };

  const summaryID = randomStr();
  const summary: SummaryInfo = { id: summaryID, scrollTo };

  if (options?.label !== undefined) {
    // Caller supplied an explicit label — wrap a plain string in a computed so the
    // type is always ComputedRef<string>, and skip the component-field heuristics.
    summary.label = typeof options.label === 'string' ? computed(() => options.label as string) : options.label;
  } else {
    summary.label = computed(getComponentLabel);
  }

  watch(summary.label, (label) => {
    const updated = updateComponentLabel(summaryID, label);

    if (!updated) {
      refreshComponents();
    }
  });

  onMounted(() => {
    const exposed = instance?.exposed as Record<string, unknown> | null | undefined;
    const proxy = instance?.proxy as SummaryComponent | null | undefined;
    const rootEl = proxy?.$el as ElementWithSummaryID | null | undefined;

    if (rootEl) {
      rootEl.summaryID = summaryID;
    }

    if (proxy) {
      (proxy as SummaryComponent & { summaryID?: string }).summaryID = summaryID;
    }

    // Build a merged view of proxy + exposed (unwrapping computed refs from exposed)
    // so that registerComponent can read displayTitle, name etc. from <script setup>
    // components that use defineExpose()
    component.value = new Proxy({} as SummaryComponent, {
      get(_target, key: string) {
        if (key === 'summary') {
          return summary;
        }
        if (key === 'summaryID') {
          return summaryID;
        }
        if (exposed && key in exposed) {
          const val = exposed[key];

          return val && typeof val === 'object' && 'value' in val ? (val as { value: unknown }).value : val;
        }

        return (proxy as Record<string, unknown> | null | undefined)?.[key];
      }
    });

    if (component.value) {
      registerComponent(component.value);
    }
  });

  onUnmounted(() => {
    // Unregister by summary ID — only the ID is needed for deletion
    const stub = { summary } as SummaryComponent;

    unRegisterComponent(stub);
  });

  return { summary };
}
