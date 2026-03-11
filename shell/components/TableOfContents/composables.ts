import debounce from 'lodash/debounce';
import {
  getCurrentInstance, onMounted, onUnmounted, provide, ref, inject
} from 'vue';

export function useFormSummary(searchClass: string) {
  const root = getCurrentInstance();

  const matchingComponents = ref([] as any[]);

  const hasClass = (vNode: any) => {
    const className = vNode?.el?.className || '';

    // // TODO nb better way of doing this that doesn't rely on a class
    // className could be an SVGAnimatedString object
    return typeof className === 'string' && className.includes(searchClass);
  };

  const findChildComponents = (components = [] as any[], node: any ) => {
    let nextInput = components;

    if (hasClass(node)) {
      const out = {
        node,
        children: [],
        label:    getComponentLabel(getComponentFromVNode(node)?.ctx), // TODO nb add fallback for no label
        scrollTo: node?.component?.ctx ? () => scrollToComponent(node?.component?.ctx) : undefined // TODO nb no link if scrollTo undefined?
      };

      components.push(out);
      nextInput = out.children;
    }

    if (!node) {
      return;
    }

    // TODO nb refactor eyesore
    const children = node?.component?.subTree?.children || node?.el?.children ? Array.from(node?.el?.children) : [];

    children.map((c) => {
      if (c.__vnode) {
        return findChildComponents(nextInput, c.__vnode );
      }
    });

    return components;
  };

  const findComponents = () => {
    const parent = root?.parent || {} as any;

    matchingComponents.value = findChildComponents([], parent.vnode) || [];
  };

  const debouncedFindComponents = debounce(findComponents);

  const scrollToComponent = (component: any) => {
    if (component.scrollTo) {
      component.scrollTo();
    } else {
      component.vnode.el.scrollIntoView(true);
    }
  };

  const getComponentLabel = (component: any) => {
    return component?.displayTitle || component?.title || component?.label || '';
  };

  const getComponentFromVNode = (vnode: any) => {
    return vnode?.component ? vnode.component : vnode?.ctx?.vnode?.component;
  };

  const findEntryByLabel = (entries: any[], label: string): any => {
    for (const entry of entries) {
      if (entry?.label === label) {
        return entry;
      }

      if (entry?.children?.length) {
        const childMatch = findEntryByLabel(entry.children, label);

        if (childMatch) {
          return childMatch;
        }
      }
    }

    return null;
  };

  const registerComponent = (component: any) => {
    if (!component) {
      return;
    }

    debouncedFindComponents();

    const label = getComponentLabel(component);

    if (!label) {
      return;
    }

    const entry = findEntryByLabel(matchingComponents.value, label);

    if (entry) {
      entry.component = component;
    }
  };

  provide('updateSummary', debouncedFindComponents);
  provide('registerComponent', registerComponent);

  return { matchingComponents, registerComponent };
}

export function useInSummary() {
  const registerComponent = inject('registerComponent') as any || (() => {});
  const updateSummary = inject('updateSummary') as any || (() => {});
  const instance = getCurrentInstance();
  const component = instance?.proxy;

  onMounted(() => {
    console.log('*** registering component: ', component);
    registerComponent(component);
  });

  onUnmounted(() => {
    updateSummary();
  });
}
