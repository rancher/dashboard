import debounce from 'lodash/debounce';
import { randomStr } from 'utils/string';
import {
  computed, getCurrentInstance, onMounted, onUnmounted, ref
} from 'vue';

const summarySingleton = {
  registerComponent:   (_component: any) => {},
  unRegisterComponent: () => {}
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
  const t = root?.proxy?.$store?.getters?.['i18n/t'];

  const registeredComponents = ref({} as any);
  const locatedComponents = ref([] as any[]);

  const getComponentLabel = (component: any) => {
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
  const getComponentFromVNode = (vnode: any) => {
    return vnode?.component ? vnode.component : vnode?.ctx?.vnode?.component;
  };

  const getComponentInstance = (node: any) => {
    return node?.component?.proxy || node?.component?.ctx || node?.component?.instance?.proxy || getComponentFromVNode(node)?.ctx;
  };

  const buildTree = (components = [] as any[], node: any, found = new Set<string>()) => {
    let nextInput = components;

    const component = getComponentInstance(node);
    const summary = component?.summary;

    if (component && summary && registeredComponents.value[summary.id] && !found.has(summary.id)) {
      found.add(summary.id);
      const out: any = {
        node,
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
    const children = node?.component?.subTree?.children || node?.el?.children ? Array.from(node?.el?.children) as any[] : [];

    children.forEach((child: any) => {
      if (child?.__vnode) {
        buildTree(nextInput, child.__vnode, found);
      }
    });

    return components;
  };

  const locateRegisteredComponents = () => {
    const parent = root?.parent || {} as any;

    locatedComponents.value = buildTree([], parent.vnode) || [];
  };

  const debouncedLocateRegisteredComponents = debounce(locateRegisteredComponents);

  /**
   * scrollToComponent will also 'scroll to' the top-level parent component to ensure that any logic in the parent to make its children visible is triggered
   * (eg open the accordion containing the component being targeted)
   * @param component instance of a component in registeredComponents
   * @returns the entry in locatedComponents that contains the provided component either at the top level or within its children (or children's children, etc.)
   */
  const findParent = (component: any) => {
    const walk = (entries: any[] = [], parent: any = null): any => {
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

  const scrollToComponent = (component: any) => {
    const parent = findParent(component);

    if (parent) {
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

  const registerComponent = (component: any) => {
    if (!component || !component.summary?.id) {
      return;
    }

    registeredComponents.value[component.summary?.id] = component;

    debouncedLocateRegisteredComponents();
  };

  const locateComponentsByNamePattern = (pattern: string) => {
    const matcher = new RegExp(pattern);

    const matches = (entry: any) => {
      const componentName = entry?.component?.$options?.name || entry?.component?.type?.name || '';

      return matcher.test(componentName);
    };

    const filterTree = (entries: any[] = []) => {
      return entries.reduce((acc: any[], entry: any) => {
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

export function useInSummary() {
  const registerComponent = summarySingleton.registerComponent;
  const unRegisterComponent = summarySingleton.unRegisterComponent;
  const instance = getCurrentInstance();
  const component = instance?.proxy;

  const scrollTo = () => {
    const el = (component as any)?.$el || (component as any)?.vnode?.el;

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
