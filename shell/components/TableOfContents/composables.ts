import debounce from 'lodash/debounce';
import { randomStr } from 'utils/string';
import {
  getCurrentInstance, onMounted, onUnmounted, provide, ref, inject
} from 'vue';

/**
 * useFormSummary composable works in tandem with inFormSummary and TableOfContents vue component
 * inFormSummary component is used by form elements to register with tableOfContents
 * I need to update useFormSummary to only work with accordions?
 * What if in addition to ToC there is a summary component that registers DIFFERENT components entirely?
 *
 *
 */
// targetComponents is name of components to include in summary
// if undefined, any component using the inFormSummary composable can register itself
export function useFormSummary(targetComponents = [] as string[], excludedComponents?: string[]) {
  const root = getCurrentInstance();

  const registeredComponents = ref({} as any);
  const locatedComponents = ref([] as any[]);

  // TODO nb allow labelKey as well
  const getComponentLabel = (component: any) => {
    return component?.displayTitle || component?.title || component?.label || component?.name || '';
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

    if (component && registeredComponents.value[component.summaryID] && !found.has(component.summaryID)) {
      found.add(component.summaryID);
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
    } else {
      component?.vnode?.el?.scrollIntoView(true);
    }
  };

  const registerComponent = (component: any) => {
    if (!component) {
      return;
    }
    const componentName = component?.$options?.name;

    if (targetComponents && targetComponents.length > 0 && !targetComponents.includes(componentName)) {
      return;
    }

    if (excludedComponents && excludedComponents.length > 0 && excludedComponents.includes(componentName)) {
      return;
    }

    registeredComponents.value[component.summaryID] = component;

    debouncedLocateRegisteredComponents();
  };

  provide('updateSummary', debouncedLocateRegisteredComponents);
  provide('registerComponent', registerComponent);

  return {
    registerComponent,
    locateRegisteredComponents,
    locatedComponents,
    registeredComponents
  };
}

export function useInSummary() {
  const registerComponent = inject('registerComponent') as any || (() => {});
  const updateSummary = inject('updateSummary') as any || (() => {});
  const instance = getCurrentInstance();
  const component = instance?.proxy;

  const summaryID = randomStr();

  onMounted(() => {
    registerComponent(component);
  });

  onUnmounted(() => {
    updateSummary();
  });

  return { summaryID };
}
