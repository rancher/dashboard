import debounce from 'lodash/debounce';
import { randomStr } from 'utils/string';
import {
  computed, getCurrentInstance, onMounted, onUnmounted, ref
} from 'vue';

const summarySingleton = {
  registerComponent: (_component: any) => {},
  updateSummary:     () => {}
};

/**
 * useFormSummary composable works in tandem with inFormSummary and TableOfContents vue component
 * inFormSummary component is used by form elements to register with tableOfContents
 * I need to update useFormSummary to only work with accordions?
 * What if in addition to ToC there is a summary component that registers DIFFERENT components entirely?
 *
 *
 */

export function useFormSummary() {
  const root = getCurrentInstance();

  const registeredComponents = ref({} as any);
  const locatedComponents = ref([] as any[]);

  // TODO nb allow labelKey as well
  const getComponentLabel = (component: any) => {
    return component?.displayTitle || component?.title || component?.label || component?.name || component?.summaryID || '';
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

  const scrollToComponent = (component: any) => {
    if (component.scrollTo) {
      component.scrollTo();
    } else if (component?.summary?.scrollTo) {
      component.summary.scrollTo();
    } else {
      component?.vnode?.el?.scrollIntoView(true);
    }
  };

  const registerComponent = (component: any) => {
    if (!component) {
      return;
    }

    registeredComponents.value[component.summaryID] = component;

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
  summarySingleton.updateSummary = debouncedLocateRegisteredComponents;

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
  const updateSummary = summarySingleton.updateSummary;
  const instance = getCurrentInstance();
  const component = instance?.proxy;

  const scrollTo = () => {
    const el = (component as any)?.$el || (component as any)?.vnode?.el;

    el?.scrollIntoView(true);
  };

  const summaryID = randomStr();

  onMounted(() => {
    if (component) {
      (component as any).summaryID = summaryID; // TODO nb why is this still required??
    }
    registerComponent(component);
  });

  onUnmounted(() => {
    updateSummary();
  });

  return { summary: { id: summaryID, scrollTo } };
}
