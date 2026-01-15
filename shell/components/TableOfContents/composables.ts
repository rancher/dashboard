import { getCurrentInstance } from 'vue';

export function useFormSummary() {
  const root = getCurrentInstance();

  const hasClass = (vNode: any, searchClass: string) => {
    const className = vNode?.el?.className || '';

    // // TODO nb better way of doing this that doesn't rely on a class
    // className could be an SVGAnimatedString object
    return typeof className === 'string' && className.includes(searchClass);
  };

  const findChildComponents = (components = [] as any[], node: any, searchClass: string) => {
    let nextInput = components;

    if (hasClass(node, searchClass)) {
      const out = {
        node,
        children: [],
        title:    getComponentTitle(node),
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
        return findChildComponents(nextInput, c.__vnode, searchClass );
      }
    });

    return components;
  };

  const findComponents = (searchClass: string) => {
    const parent = root?.parent || {} as any;

    // accordions.value = findChildComponents([], parent.vnode, searchClass) || [];
    return findChildComponents([], parent.vnode, searchClass);
  };

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

  const getComponentTitle = (vnode : any) => {
    const fallback = vnode?.el?.id;

    const componentContext = getComponentFromVNode(vnode)?.ctx;

    return componentContext?.displayTitle || componentContext?.title || fallback;
  };

  const getComponentFromVNode = (vnode: any) => {
    return vnode?.component ? vnode.component : vnode?.ctx?.vnode?.component;
  };

  return {
    findComponents,
    scrollToComponent,
    getComponentTitle
  };
}
