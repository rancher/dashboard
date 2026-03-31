/* eslint-disable no-console */
import debounce from 'lodash/debounce';
import { randomStr } from '@shell/utils/string';
import {
  computed, getCurrentInstance, inject, onMounted, onUnmounted, provide, ref
} from 'vue';
import type {
  ComponentInternalInstance,
  ComponentPublicInstance,
  ComputedRef,
  VNode
} from 'vue';

type SummaryInfo = {
  id: string;
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
  vnode?: VNode;
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
};

type ChildWithVNode = {
  // eslint-disable-next-line no-use-before-define
  __vnode?: VNodeWithComponent;
};

type ElementWithVNodeChildren = {
  children?: ArrayLike<ChildWithVNode>;
};

type ElementWithSummaryID = HTMLElement & {
  summaryID?: string;
};

type VNodeWithComponent = VNode & {
  component?: ComponentInternalInstance | null;
  ctx?: { vnode?: VNodeWithComponent } | null;
  el?: ElementWithVNodeChildren | null;
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
  const t = root?.proxy?.$store?.getters?.['i18n/t'] as ((key: string) => string) | undefined;

  const registeredComponents = ref<Record<string, SummaryComponent>>({});
  const locatedComponents = ref<SummaryEntry[]>([]);

  const getComponentLabel = (component: SummaryComponent) => {
    if (component?.displayTitle) {
      return component.displayTitle;
    }

    if (component?.title) {
      return component.title;
    }

    if (component?.label) {
      return component.label;
    }

    if (component?.labelKey) {
      return typeof t === 'function' ? t(component.labelKey) : component.labelKey;
    }

    if (component?.name) {
      return component.name;
    }

    return component?.summary?.id || '';
  };

  // const getComponentFromVNode = (vnode?: VNodeWithComponent | null): ComponentInternalInstance | null => {
  //   console.log('*** attemping to find component from vnode ', vnode);

  //   return vnode?.component ?? vnode?.ctx?.vnode?.component ?? null;
  // };

  // const getComponentInstance = (node?: VNodeWithComponent | null): SummaryComponent | undefined | null => {
  //   console.log('*** attempting to find component from node ', node);
  //   const internal = node?.component ?? getComponentFromVNode(node);

  //   if (!internal) {
  //     return null;
  //   }

  //   const proxy = internal.proxy as SummaryComponent | null | undefined;
  //   const exposed = internal.exposed as Record<string, unknown> | null | undefined;

  //   if (!exposed || Object.keys(exposed).length === 0) {
  //     return proxy;
  //   }

  //   // Merge proxy and exposed so that properties set via defineExpose() in
  //   // <script setup> components are visible alongside standard proxy properties.
  //   // Exposed values may be computed refs, so unwrap them automatically.
  //   return new Proxy({} as SummaryComponent, {
  //     get(_target, key: string) {
  //       if (key in (exposed ?? {})) {
  //         const val = exposed?.[key];

  //         return val && typeof val === 'object' && 'value' in val ? (val as { value: unknown }).value : val;
  //       }

  //       return (proxy as Record<string, unknown> | null | undefined)?.[key];
  //     }
  //   });
  // };

  const buildTree = (
    components: SummaryEntry[] = [],
    node?: any,
    found = new Set<string>()
  ) => {
    let nextInput = components;

    // const component = getComponentInstance(node);
    // const summary = component?.summary;

    const summaryID = node?.el ? (node?.el as ElementWithSummaryID | null | undefined)?.summaryID || '' : node?.summaryID || '';
    const component = registeredComponents.value[summaryID];
    const summary = component?.summary;

    if (component && summary && registeredComponents.value[summary.id] && !found.has(summary.id)) {
      found.add(summary.id);
      const out: SummaryEntry = {
        node:     node as VNode,
        children: [],
        label:    getComponentLabel(component),
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
      // TODO nb __vnode NOT DEFINED IN PROD
      // const vnodeChild = child.__vnode;

      // if (vnodeChild) {
      //   buildTree(nextInput, vnodeChild, found);
      // }
      buildTree(nextInput, child, found);
    });

    return components;
  };

  const locateRegisteredComponents = () => {
    const parent = root?.parent as ComponentInternalInstance | null | undefined;

    locatedComponents.value = buildTree([], parent?.vnode) || [];
  };

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

  const scrollToComponent = (component: SummaryComponent) => {
    const parent = findParent(component);

    if (parent?.component) {
      scrollToComponent(parent.component);
    }
    if (component.scrollTo) {
      component.scrollTo();
    } else if (component?.summary?.scrollTo) {
      component.summary.scrollTo();
    } else {
      component?.vnode?.el?.scrollIntoView(true);
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
 */
export function useInSummary() {
  const context = inject<FormSummaryContext>(FORM_SUMMARY_KEY);
  const instance = getCurrentInstance();

  const scrollTo = () => {
    const el = instance?.proxy?.$el ?? (instance?.proxy as SummaryComponent | null | undefined)?.vnode?.el;

    (el as HTMLElement | undefined)?.scrollIntoView(true);
  };

  const summaryID = randomStr();
  const summary: SummaryInfo = { id: summaryID, scrollTo };

  onMounted(() => {
    const exposed = instance?.exposed as Record<string, unknown> | null | undefined;
    const proxy = instance?.proxy as SummaryComponent | null | undefined;
    const rootEl = (proxy?.$el ?? proxy?.vnode?.el) as ElementWithSummaryID | null | undefined;

    if (rootEl) {
      rootEl.summaryID = summaryID;
      rootEl.setAttribute('data-summary-id', summaryID);
    }

    if (proxy) {
      (proxy as SummaryComponent & { summaryID?: string }).summaryID = summaryID;
    }

    // Build a merged view of proxy + exposed (unwrapping computed refs from exposed)
    // so that registerComponent can read displayTitle, name etc. from <script setup>
    // components that use defineExpose()
    const component = new Proxy({} as SummaryComponent, {
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

    context?.registerComponent(component);
  });

  onUnmounted(() => {
    // Unregister by summary ID — only the ID is needed for deletion
    const stub = { summary } as SummaryComponent;

    context?.unRegisterComponent(stub);
  });

  return { summary };
}
