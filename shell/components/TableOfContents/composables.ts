import debounce from 'lodash/debounce';
import { randomStr } from 'utils/string';
import {
  computed, getCurrentInstance, onMounted, onUnmounted, ref
} from 'vue';
import type {
  ComponentInternalInstance,
  ComponentPublicInstance,
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

const summaryChildMethods = {
  registerComponent:   (_component: SummaryComponent) => {},
  unRegisterComponent: (_component: SummaryComponent) => {}
};

/**
 * useFormSummary composable works in tandem with inFormSummary and TableOfContents vue component
 * inFormSummary component is used by form elements to register with tableOfContents
 * I need to update useFormSummary to only work with accordions?
 * What if in addition to ToC there is a summary component that registers DIFFERENT components entirely?
 *
 * performance: tested with >1000 accordions on page; no discernable lag in updates to toc or scrolling
 */

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

  // this will find components not attached to virtual dom anymore? //TODO nb what it do
  const getComponentFromVNode = (vnode?: VNode | null): ComponentInternalInstance | null | undefined => {
    if (vnode?.component) {
      return vnode.component;
    }

    const vnodeWithCtx = vnode as (VNode & { ctx?: { vnode?: VNode } }) | undefined;

    return vnodeWithCtx?.ctx?.vnode?.component;
  };

  const getComponentInstance = (node?: VNode | null): SummaryComponent | undefined => {
    const internal = node?.component || getComponentFromVNode(node);

    return internal?.proxy as SummaryComponent | undefined;
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
        scrollTo: component ? () => scrollToComponent(component) : undefined // TODO nb no link if no scrollTo?
      };

      out.component = component;

      components.push(out);
      nextInput = out.children;
    }

    if (!node) {
      return;
    }

    // TODO nb refactor eyesore
    const subtreeChildren = node?.component?.subTree?.children;
    const domChildren = node?.el?.children ? Array.from(node.el.children) : [];
    const children = (Array.isArray(subtreeChildren) ? subtreeChildren : domChildren) as unknown[];

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
        if (entry.component?.summary?.id === component.summary?.id) {
          return parent;
        }

        if (entry.children.length) {
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

  const registerComponent = (component: SummaryComponent) => {
    if ( !component?.summary?.id) {
      return;
    }

    registeredComponents.value[component.summary?.id] = component;

    debouncedLocateRegisteredComponents();
  };

  const unregisterComponent = (component: SummaryComponent) => {
    if ( !component?.summary?.id) {
      return;
    }

    delete registeredComponents.value[component.summary?.id];

    debouncedLocateRegisteredComponents();
  };

  const locateComponentsByNamePattern = (pattern: string) => {
    const matcher = new RegExp(pattern);

    const matches = (entry: SummaryEntry) => {
      const componentName = entry?.component?.$options?.name || (entry?.component?.$?.type as { name?: string } | undefined)?.name || '';

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

  summaryChildMethods.registerComponent = registerComponent;
  summaryChildMethods.unRegisterComponent = unregisterComponent;

  return {
    registerComponent,
    locateRegisteredComponents,
    locateComponentsByNamePattern,
    locatedComponents,
    registeredComponents
  };
}

export function useInSummary() {
  const registerComponent = summaryChildMethods.registerComponent;
  const unRegisterComponent = summaryChildMethods.unRegisterComponent;
  const instance = getCurrentInstance();
  const component = instance?.proxy as SummaryComponent;

  const scrollTo = () => {
    const el = component?.$el || component?.vnode?.el;

    el?.scrollIntoView(true);
  };

  const summaryID = randomStr();

  onMounted(() => {
    registerComponent(component);
  });

  onUnmounted(() => {
    unRegisterComponent(component);
  });

  return { summary: { id: summaryID, scrollTo } };
}
