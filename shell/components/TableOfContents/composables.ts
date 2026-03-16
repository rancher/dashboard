import debounce from 'lodash/debounce';
import { randomStr } from 'utils/string';
import {
  computed, getCurrentInstance, onMounted, onUnmounted, ref
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
  summaryID?: string;
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

const summarySingleton = {
  registerComponent:   (_component?: SummaryComponent | null) => {},
  unRegisterComponent: () => {}
};

export function useFormSummary() {
  const root = getCurrentInstance();
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

  // components not attached to virtual dom?
  const getComponentFromVNode = (vnode: any) => {
    return vnode?.component ? vnode.component : vnode?.ctx?.vnode?.component;
  };

  const getComponentInstance = (node: any) => {
    return node?.component?.proxy || node?.component?.ctx || node?.component?.instance?.proxy || getComponentFromVNode(node)?.ctx;
  };

  const buildTree = (components: SummaryEntry[] = [], node?: VNode | null, found = new Set<string>()) => {
    let nextInput = components;

    const component = getComponentInstance(node);
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

    const children = node?.component?.subTree?.children || node?.el?.children ? Array.from(node?.el?.children) as any[] : [];

    children.forEach((child) => {
      const vnodeChild = (child as { __vnode?: VNode }).__vnode;

      if (vnodeChild) {
        buildTree(nextInput, vnodeChild, found);
      }
    });

    return components;
  };

  const locateRegisteredComponents = () => {
    const parent = root?.parent as ComponentInternalInstance | null | undefined;

    locatedComponents.value = buildTree([], parent?.vnode) || [];
  };

  const debouncedLocateRegisteredComponents = debounce(locateRegisteredComponents);

  /**
   * scrollToComponent will also 'scroll to' the top-level parent component to ensure that any logic in the parent to make its children visible is triggered
   * (eg open the accordion containing the component being targeted)
   * @param component instance of a component in registeredComponents
   * @returns the entry in locatedComponents that contains the provided component either at the top level or within its children (or children's children, etc.)
   */
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

  /**
   * Return a reactive subset of locatedComponents matching a name pattern.
   * If no pattern is provided, all located components will be returned.
   */
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

  summarySingleton.registerComponent = registerComponent;
  summarySingleton.unRegisterComponent = debouncedLocateRegisteredComponents;

  return {
    registerComponent,
    locateRegisteredComponents,
    locateComponentsByNamePattern,
    locatedComponents,
    registeredComponents
  };
}

/**
 * Hook to register a component in the summary system.
 * This hook should be used inside a Vue component to automatically register it with the summary system when mounted and unregister it when unmounted.
 * returns a 'summary' object containing a unique ID used to locate the component in the virtual dom and determine its position relative to other registered components
 */
export function useInSummary() {
  const registerComponent = summarySingleton.registerComponent;
  const unRegisterComponent = summarySingleton.unRegisterComponent;
  const instance = getCurrentInstance();
  const component = instance?.proxy as SummaryComponent | null | undefined;

  const scrollTo = () => {
    const el = component?.$el || component?.vnode?.el;

    el?.scrollIntoView(true);
  };

  const summaryID = randomStr();

  onMounted(() => {
    registerComponent(component);
  });

  onUnmounted(() => {
    unRegisterComponent();
  });

  return { summary: { id: summaryID, scrollTo } };
}
