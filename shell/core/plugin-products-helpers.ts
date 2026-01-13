import { ProductChildPage, ProductChildResource } from '@shell/core/types';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';

export function gatherChildrenOrdering(children: any[]) {
  let minWeight = children.reduce((min, item) => {
    if (typeof item.weight !== 'number') return min;

    return item.weight < min ? item.weight : min;
  }, Infinity);

  if (minWeight === Infinity) {
    // 1000 is Root level default weight minus some space
    minWeight = 999;
  }

  children.forEach((child, index) => {
    if (child.weight === undefined || child.weight === null) {
      child.weight = minWeight - (index + 1);
    }

    if ((child as any).children) {
      // groups should be below regular items
      // until we are able to assign weights to groups
      // and render them all under the "Root" group properly
      child.weight = minWeight - (index + 1) - 500;
      gatherChildrenOrdering((child as any).children);
    }
  });

  return children.sort((a, b) => b.weight - a.weight);
}

export function generateTopLevelExtensionSimpleBaseRoute(parentName: string, options = {} as any) {
  const { component, omitPath } = options;

  const route = {
    name:   `${ parentName }`,
    path:   `${ parentName }`,
    params: { product: parentName },
    // meta:   { pkg: parentName, product: parentName },
    meta:   { product: parentName },
  } as any;

  if (component) {
    route.component = component;
  }

  if (omitPath) {
    delete route.path;
  }

  return route;
}

export function generateTopLevelExtensionVirtualTypeRoute(parentName: string, pageChild: ProductChildPage | undefined, options = {} as any) {
  const { component, omitPath } = options;
  const name = pageChild ? `${ parentName }-c-cluster-${ pageChild.name }` : `${ parentName }-c-cluster`;
  const path = pageChild ? `${ parentName }/c/:cluster/${ pageChild.name }` : `${ parentName }/c/:cluster`;

  const route = {
    name,
    path,
    params: { product: parentName, cluster: BLANK_CLUSTER },
    meta:   {
      // pkg: parentName, product: parentName, cluster: BLANK_CLUSTER
      product: parentName, cluster: BLANK_CLUSTER
    },
  } as any;

  if (component) {
    route.component = component;
  }

  if (omitPath) {
    delete route.path;
  }

  return route;
}

export function generateTopLevelExtensionConfigureTypeRoute(parentName: string, pageChild: ProductChildPage, options = {} as any) {
  const { component, omitPath } = options;

  const route = {
    name:   `${ parentName }-c-cluster-resource`,
    path:   `${ parentName }/c/:cluster/:resource`,
    params: {
      product: parentName, cluster: BLANK_CLUSTER, resource: pageChild.type
    },
    meta: {
      // pkg: parentName, product: parentName, cluster: BLANK_CLUSTER, resource: pageChild.type
      product: parentName, cluster: BLANK_CLUSTER, resource: pageChild.type
    },
  } as any;

  if (component) {
    route.component = component;
  }

  if (omitPath) {
    delete route.path;
  }

  return route;
}

export function generateTopLevelExtensionResourceRoutes(parentName: string, pageChild: ProductChildPage) {
  const interopDefault = (promise: Promise<any>) => promise.then((page) => page.default || page);

  return [
    {
      name:      `${ parentName }-c-cluster-resource`,
      path:      `${ parentName }/c/:cluster/:resource`,
      component: () => interopDefault(import('@shell/pages/c/_cluster/_product/_resource/index.vue')),
      meta:      {
        // pkg: parentName, product: parentName, cluster: BLANK_CLUSTER, resource: (pageChild as ProductChildResource).type
        product: parentName, cluster: BLANK_CLUSTER, resource: (pageChild as ProductChildResource).type
      }
    },
    {
      name:      `${ parentName }-c-cluster-resource-create`,
      path:      `${ parentName }/c/:cluster/:resource/create`,
      component: () => interopDefault(import('@shell/pages/c/_cluster/_product/_resource/create.vue')),
      meta:      {
        // pkg: parentName, product: parentName, cluster: BLANK_CLUSTER, resource: (pageChild as ProductChildResource).type
        product: parentName, cluster: BLANK_CLUSTER, resource: (pageChild as ProductChildResource).type
      }
    },
    {
      name:      `${ parentName }-c-cluster-resource-id`,
      path:      `${ parentName }/c/:cluster/:resource/:id`,
      component: () => interopDefault(import('@shell/pages/c/_cluster/_product/_resource/_id.vue')),
      meta:      {
        // pkg: parentName, product: parentName, cluster: BLANK_CLUSTER, resource: (pageChild as ProductChildResource).type, asyncSetup: true
        product: parentName, cluster: BLANK_CLUSTER, resource: (pageChild as ProductChildResource).type, asyncSetup: true
      }
    },
    {
      name:      `${ parentName }-c-cluster-resource-namespace-id`,
      path:      `${ parentName }/c/:cluster/:resource/:namespace/:id`,
      component: () => interopDefault(import('@shell/pages/c/_cluster/_product/_resource/_namespace/_id.vue')),
      meta:      {
        // pkg: parentName, product: parentName, cluster: BLANK_CLUSTER, resource: (pageChild as ProductChildResource).type, asyncSetup: true
        product: parentName, cluster: BLANK_CLUSTER, resource: (pageChild as ProductChildResource).type, asyncSetup: true
      }
    }
  ];
}
