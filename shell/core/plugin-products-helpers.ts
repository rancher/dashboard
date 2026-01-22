import { ProductChildPage, ProductRegistrationRouteGenerationOptions } from '@shell/core/types';
import { BLANK_CLUSTER } from '@shell/store/store-types';

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
      gatherChildrenOrdering((child as any).children);
    }
  });

  return children.sort((a, b) => b.weight - a.weight);
}

export function generateTopLevelExtensionSimpleBaseRoute(parentName: string, options = {} as ProductRegistrationRouteGenerationOptions) {
  const { component, omitPath } = options;

  const route = {
    name:   `${ parentName }`,
    path:   `${ parentName }`,
    params: { product: parentName },
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

// VIRTUAL TYPE ROUTES
export function generateVirtualTypeRoute(parentName: string, pageChild: ProductChildPage | undefined, options = {} as ProductRegistrationRouteGenerationOptions) {
  if (options.extendProduct) {
    return generateVirtualTypeRouteForExistingProduct(parentName, pageChild, options);
  } else {
    return generateTopLevelExtensionVirtualTypeRoute(parentName, pageChild, options);
  }
}

// VIRTUAL TYPE ROUTES - CLUSTER LEVEL EXTENSION
function generateVirtualTypeRouteForExistingProduct(parentName: string, pageChild: ProductChildPage | undefined, options = {} as ProductRegistrationRouteGenerationOptions) {
  const { component, omitPath } = options;
  const name = pageChild ? `c-cluster-${ parentName }-${ pageChild.name }` : `c-cluster-${ parentName }`;
  const path = pageChild ? `c/:cluster/${ parentName }/${ pageChild.name }` : `c/:cluster/${ parentName }`;

  const route = {
    name,
    path,
    params: { product: parentName },
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

// VIRTUAL TYPE ROUTES - TOP LEVEL EXTENSION
function generateTopLevelExtensionVirtualTypeRoute(parentName: string, pageChild: ProductChildPage | undefined, options = {} as ProductRegistrationRouteGenerationOptions) {
  const { component, omitPath } = options;
  const name = pageChild ? `${ parentName }-c-cluster-${ pageChild.name }` : `${ parentName }-c-cluster`;
  const path = pageChild ? `${ parentName }/c/:cluster/${ pageChild.name }` : `${ parentName }/c/:cluster`;

  const route = {
    name,
    path,
    params: { product: parentName, cluster: BLANK_CLUSTER },
    meta:   { product: parentName, cluster: BLANK_CLUSTER },
  } as any;

  if (component) {
    route.component = component;
  }

  if (omitPath) {
    delete route.path;
  }

  return route;
}

// CONFIGURE TYPE ROUTES
export function generateConfigureTypeRoute(parentName: string, pageChild: ProductChildPage | undefined, options = {} as ProductRegistrationRouteGenerationOptions) {
  if (options.extendProduct) {
    return generateConfigureTypeRouteForExistingProduct(parentName, pageChild, options);
  } else {
    return generateTopLevelExtensionConfigureTypeRoute(parentName, pageChild, options);
  }
}

// CONFIGURE TYPE ROUTES - CLUSTER LEVEL EXTENSION
function generateConfigureTypeRouteForExistingProduct(parentName: string, pageChild: ProductChildPage | undefined, options = {} as ProductRegistrationRouteGenerationOptions) {
  const { component, omitPath } = options;

  const route = {
    name:   `c-cluster-${ parentName }-resource`,
    path:   `c/:cluster/${ parentName }/:resource`,
    params: { product: parentName, resource: pageChild?.type },
    meta:   { product: parentName, resource: pageChild?.type },
  } as any;

  if (component) {
    route.component = component;
  }

  if (omitPath) {
    delete route.path;
  }

  return route;
}

// CONFIGURE TYPE ROUTES - TOP LEVEL EXTENSION
function generateTopLevelExtensionConfigureTypeRoute(parentName: string, pageChild: ProductChildPage | undefined, options = {} as ProductRegistrationRouteGenerationOptions) {
  const { component, omitPath } = options;

  const route = {
    name:   `${ parentName }-c-cluster-resource`,
    path:   `${ parentName }/c/:cluster/:resource`,
    params: {
      product: parentName, cluster: BLANK_CLUSTER, resource: pageChild?.type
    },
    meta: {
      product: parentName, cluster: BLANK_CLUSTER, resource: pageChild?.type
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

// RESOURCE ROUTES
export function generateResourceRoutes(parentName: string, pageChild: ProductChildPage, options = {} as ProductRegistrationRouteGenerationOptions) {
  if (options.extendProduct) {
    return generateResourceRoutesForExistingProduct(parentName, pageChild, options);
  } else {
    return generateTopLevelExtensionResourceRoutes(parentName, pageChild, options);
  }
}

// RESOURCE ROUTES - CLUSTER LEVEL EXTENSION
function generateResourceRoutesForExistingProduct(parentName: string, pageChild: ProductChildPage, options = {} as ProductRegistrationRouteGenerationOptions) {
  const interopDefault = (promise: Promise<any>) => promise.then((page) => page.default || page);

  return [
    {
      name:      `c-cluster-${ parentName }-resource`,
      path:      `c/:cluster/${ parentName }/:resource`,
      component: options.resourceListComponent || (() => interopDefault(import('@shell/pages/c/_cluster/_product/_resource/index.vue'))),
      meta:      { product: parentName, resource: pageChild.type }
    },
    {
      name:      `c-cluster-${ parentName }-resource-create`,
      path:      `c/:cluster/${ parentName }/:resource/create`,
      component: options.resourceCreateComponent || (() => interopDefault(import('@shell/pages/c/_cluster/_product/_resource/create.vue'))),
      meta:      { product: parentName, resource: pageChild.type }
    },
    {
      name:      `c-cluster-${ parentName }-resource-id`,
      path:      `c/:cluster/${ parentName }/:resource/:id`,
      component: options.resourceItemComponent || (() => interopDefault(import('@shell/pages/c/_cluster/_product/_resource/_id.vue'))),
      meta:      {
        product: parentName, resource: pageChild.type, asyncSetup: true
      }
    },
    {
      name:      `c-cluster-${ parentName }-resource-namespace-id`,
      path:      `c/:cluster/${ parentName }/:resource/:namespace/:id`,
      component: options.resourceItemNamespacedComponent || (() => interopDefault(import('@shell/pages/c/_cluster/_product/_resource/_namespace/_id.vue'))),
      meta:      {
        product: parentName, resource: pageChild.type, asyncSetup: true
      }
    }
  ];
}

// RESOURCE ROUTES - TOP LEVEL EXTENSION
function generateTopLevelExtensionResourceRoutes(parentName: string, pageChild: ProductChildPage, options = {} as ProductRegistrationRouteGenerationOptions) {
  const interopDefault = (promise: Promise<any>) => promise.then((page) => page.default || page);

  return [
    {
      name:      `${ parentName }-c-cluster-resource`,
      path:      `${ parentName }/c/:cluster/:resource`,
      component: options.resourceListComponent || (() => interopDefault(import('@shell/pages/c/_cluster/_product/_resource/index.vue'))),
      meta:      { product: parentName, cluster: BLANK_CLUSTER }
    },
    {
      name:      `${ parentName }-c-cluster-resource-create`,
      path:      `${ parentName }/c/:cluster/:resource/create`,
      component: options.resourceCreateComponent || (() => interopDefault(import('@shell/pages/c/_cluster/_product/_resource/create.vue'))),
      meta:      { product: parentName, cluster: BLANK_CLUSTER }
    },
    {
      name:      `${ parentName }-c-cluster-resource-id`,
      path:      `${ parentName }/c/:cluster/:resource/:id`,
      component: options.resourceItemComponent || (() => interopDefault(import('@shell/pages/c/_cluster/_product/_resource/_id.vue'))),
      meta:      {
        product: parentName, cluster: BLANK_CLUSTER, asyncSetup: true
      }
    },
    {
      name:      `${ parentName }-c-cluster-resource-namespace-id`,
      path:      `${ parentName }/c/:cluster/:resource/:namespace/:id`,
      component: options.resourceItemNamespacedComponent || (() => interopDefault(import('@shell/pages/c/_cluster/_product/_resource/_namespace/_id.vue'))),
      meta:      {
        product: parentName, cluster: BLANK_CLUSTER, asyncSetup: true
      }
    }
  ];
}
