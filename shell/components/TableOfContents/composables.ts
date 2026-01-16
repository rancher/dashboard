import debounce from 'lodash/debounce';
import { getCurrentInstance, provide, ref } from 'vue';

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
        label:    getComponentLabel(node),
        scrollTo: () => scrollToComponent(node)
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

  const scrollToComponent = (vnode: any) => {
    const comp = getComponentFromVNode(vnode);

    if (!comp) {
      return;
    }

    if (comp.ctx.scrollTo) {
      comp.ctx.scrollTo();
    } else {
      vnode.el.scrollIntoView(true);
    }
  };

  const getComponentLabel = (vnode : any) => {
    const fallback = vnode?.el?.id;

    const componentContext = getComponentFromVNode(vnode)?.ctx;

    return componentContext?.displayTitle || componentContext?.title || fallback;
  };

  const getComponentFromVNode = (vnode: any) => {
    return vnode?.component ? vnode.component : vnode?.ctx?.vnode?.component;
  };

  provide('updateSummary', debouncedFindComponents);

  return { matchingComponents };
}
