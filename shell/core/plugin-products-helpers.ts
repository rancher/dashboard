import {
  RouteRecordRawWithParams, ProductChildGroup, ProductChild,
  ProductChildCustomPage, ProductChildResourcePage,
  ProductRegistrationRouteGenerationOptions, SpoofedTypeSchemaOptions,
  ProductChildSpoofedType, SpoofedTypeSchema
} from '@shell/core/plugin-types';
import { BLANK_CLUSTER } from '@shell/store/store-types';

function isProductChildGroup(child: ProductChild): child is ProductChildGroup {
  return 'children' in child && Array.isArray(child.children);
}

class PluginProductsHelpers {
  gatherChildrenOrdering(children: ProductChild[]): ProductChild[] {
    let minWeight = children.reduce((min, item) => {
      if (typeof item.weight !== 'number') return min;

      return item.weight < min ? item.weight : min;
    }, Infinity);

    if (minWeight === Infinity) {
      // 1000 is Root level default weight minus some space
      minWeight = 999;
    }

    const processedChildren: ProductChild[] = [];

    children.forEach((child: ProductChild, index) => {
      const processedChild = { ...child };

      if (processedChild.weight === undefined || processedChild.weight === null) {
        processedChild.weight = minWeight - (index + 1);
      }

      if (isProductChildGroup(processedChild)) {
        processedChild.children = this.gatherChildrenOrdering(processedChild.children);
      }

      processedChildren.push(processedChild);
    });

    return processedChildren.sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0));
  }

  generateTopLevelExtensionSimpleBaseRoute(parentName: string, options: ProductRegistrationRouteGenerationOptions = {}): RouteRecordRawWithParams {
    const { component, omitPath } = options;

    const route: RouteRecordRawWithParams = {
      name:   `${ parentName }`,
      path:   `${ parentName }`,
      params: { product: parentName },
      meta:   { product: parentName },
    };

    if (component) {
      route.component = component;
    }

    if (omitPath) {
      delete route.path;
    }

    return route;
  }

  // VIRTUAL TYPE ROUTES
  generateVirtualTypeRoute(parentName: string, pageChild: ProductChildCustomPage | undefined, options: ProductRegistrationRouteGenerationOptions = {}): RouteRecordRawWithParams {
    if (options.extendProduct) {
      return this.generateVirtualTypeRouteForExistingProduct(parentName, pageChild, options);
    } else {
      return this.generateVirtualTypeRouteForNewProduct(parentName, pageChild, options);
    }
  }

  // VIRTUAL TYPE ROUTES - CLUSTER LEVEL EXTENSION
  private generateVirtualTypeRouteForExistingProduct(parentName: string, pageChild: ProductChildCustomPage | undefined, options: ProductRegistrationRouteGenerationOptions = {}): RouteRecordRawWithParams {
    const { component, omitPath } = options;
    const name = pageChild ? `c-cluster-${ parentName }-${ pageChild.name }` : `c-cluster-${ parentName }`;
    const path = pageChild ? `c/:cluster/${ parentName }/${ pageChild.name }` : `c/:cluster/${ parentName }`;

    const route: RouteRecordRawWithParams = {
      name,
      path,
      params: { product: parentName },
      meta:   { product: parentName },
    };

    if (component) {
      route.component = component;
    }

    if (omitPath) {
      delete route.path;
    }

    return route;
  }

  // VIRTUAL TYPE ROUTES - TOP LEVEL EXTENSION
  private generateVirtualTypeRouteForNewProduct(parentName: string, pageChild: ProductChildCustomPage | undefined, options: ProductRegistrationRouteGenerationOptions = {}): RouteRecordRawWithParams {
    const { component, omitPath } = options;
    const name = pageChild ? `${ parentName }-c-cluster-${ pageChild.name }` : `${ parentName }-c-cluster`;
    const path = pageChild ? `${ parentName }/c/:cluster/${ pageChild.name }` : `${ parentName }/c/:cluster`;

    const route: RouteRecordRawWithParams = {
      name,
      path,
      params: { product: parentName, cluster: BLANK_CLUSTER },
      meta:   { product: parentName, cluster: BLANK_CLUSTER },
    };

    if (component) {
      route.component = component;
    }

    if (omitPath) {
      delete route.path;
    }

    return route;
  }

  // CONFIGURE TYPE ROUTES
  generateConfigureTypeRoute(parentName: string, pageChild: ProductChildResourcePage | ProductChildSpoofedType | undefined, options: ProductRegistrationRouteGenerationOptions = {}): RouteRecordRawWithParams {
    if (options.extendProduct) {
      return this.generateConfigureTypeRouteForExistingProduct(parentName, pageChild, options);
    } else {
      return this.generateConfigureTypeRouteForNewProduct(parentName, pageChild, options);
    }
  }

  // CONFIGURE TYPE ROUTES - CLUSTER LEVEL EXTENSION
  private generateConfigureTypeRouteForExistingProduct(parentName: string, pageChild: ProductChildResourcePage | ProductChildSpoofedType | undefined, options: ProductRegistrationRouteGenerationOptions = {}): RouteRecordRawWithParams {
    const { component, omitPath } = options;

    const route: RouteRecordRawWithParams = {
      name:   `c-cluster-${ parentName }-resource`,
      path:   `c/:cluster/${ parentName }/:resource`,
      params: { product: parentName, resource: pageChild?.type },
      meta:   { product: parentName, resource: pageChild?.type },
    };

    if (component) {
      route.component = component;
    }

    if (omitPath) {
      delete route.path;
    }

    return route;
  }

  // CONFIGURE TYPE ROUTES - TOP LEVEL EXTENSION
  private generateConfigureTypeRouteForNewProduct(parentName: string, pageChild: ProductChildResourcePage | ProductChildSpoofedType | undefined, options: ProductRegistrationRouteGenerationOptions = {}): RouteRecordRawWithParams {
    const { component, omitPath } = options;

    const route: RouteRecordRawWithParams = {
      name:   `${ parentName }-c-cluster-resource`,
      path:   `${ parentName }/c/:cluster/:resource`,
      params: {
        product: parentName, cluster: BLANK_CLUSTER, resource: pageChild?.type
      },
      meta: {
        product: parentName, cluster: BLANK_CLUSTER, resource: pageChild?.type
      },
    };

    if (component) {
      route.component = component;
    }

    if (omitPath) {
      delete route.path;
    }

    return route;
  }

  // RESOURCE ROUTES
  generateResourceRoutes(parentName: string, pageChild: ProductChildResourcePage, options: ProductRegistrationRouteGenerationOptions = {}): RouteRecordRawWithParams[] {
    if (options.extendProduct) {
      return this.generateResourceRoutesForExistingProduct(parentName, pageChild);
    } else {
      return this.generateResourceRoutesForNewProduct(parentName);
    }
  }

  // RESOURCE ROUTES - CLUSTER LEVEL EXTENSION
  private generateResourceRoutesForExistingProduct(parentName: string, pageChild: ProductChildResourcePage): RouteRecordRawWithParams[] {
    const interopDefault = (promise: Promise<any>) => promise.then((page) => page.default || page);

    return [
      {
        name:      `c-cluster-${ parentName }-resource`,
        path:      `c/:cluster/${ parentName }/:resource`,
        component: () => interopDefault(import('@shell/pages/c/_cluster/_product/_resource/index.vue')),
        meta:      { product: parentName, resource: pageChild.type }
      },
      {
        name:      `c-cluster-${ parentName }-resource-create`,
        path:      `c/:cluster/${ parentName }/:resource/create`,
        component: () => interopDefault(import('@shell/pages/c/_cluster/_product/_resource/create.vue')),
        meta:      { product: parentName, resource: pageChild.type }
      },
      {
        name:      `c-cluster-${ parentName }-resource-id`,
        path:      `c/:cluster/${ parentName }/:resource/:id`,
        component: () => interopDefault(import('@shell/pages/c/_cluster/_product/_resource/_id.vue')),
        meta:      {
          product: parentName, resource: pageChild.type, asyncSetup: true
        }
      },
      {
        name:      `c-cluster-${ parentName }-resource-namespace-id`,
        path:      `c/:cluster/${ parentName }/:resource/:namespace/:id`,
        component: () => interopDefault(import('@shell/pages/c/_cluster/_product/_resource/_namespace/_id.vue')),
        meta:      {
          product: parentName, resource: pageChild.type, asyncSetup: true
        }
      }
    ];
  }

  // RESOURCE ROUTES - TOP LEVEL EXTENSION
  private generateResourceRoutesForNewProduct(parentName: string) {
    const interopDefault = (promise: Promise<any>) => promise.then((page) => page.default || page);

    return [
      {
        name:      `${ parentName }-c-cluster-resource`,
        path:      `${ parentName }/c/:cluster/:resource`,
        component: () => interopDefault(import('@shell/pages/c/_cluster/_product/_resource/index.vue')),
        meta:      { product: parentName, cluster: BLANK_CLUSTER }
      },
      {
        name:      `${ parentName }-c-cluster-resource-create`,
        path:      `${ parentName }/c/:cluster/:resource/create`,
        component: () => interopDefault(import('@shell/pages/c/_cluster/_product/_resource/create.vue')),
        meta:      { product: parentName, cluster: BLANK_CLUSTER }
      },
      {
        name:      `${ parentName }-c-cluster-resource-id`,
        path:      `${ parentName }/c/:cluster/:resource/:id`,
        component: () => interopDefault(import('@shell/pages/c/_cluster/_product/_resource/_id.vue')),
        meta:      {
          product: parentName, cluster: BLANK_CLUSTER, asyncSetup: true
        }
      },
      {
        name:      `${ parentName }-c-cluster-resource-namespace-id`,
        path:      `${ parentName }/c/:cluster/:resource/:namespace/:id`,
        component: () => interopDefault(import('@shell/pages/c/_cluster/_product/_resource/_namespace/_id.vue')),
        meta:      {
          product: parentName, cluster: BLANK_CLUSTER, asyncSetup: true
        }
      }
    ];
  }

  generateSchemaForSpoofedType({
    type, collectionMethods, resourceFields, attributes
  }: SpoofedTypeSchemaOptions): SpoofedTypeSchema {
    return {
      id:   type,
      type: 'schema',
      collectionMethods,
      resourceFields,
      attributes
    };
  }
}

const pluginProductsHelpers = new PluginProductsHelpers();

export default pluginProductsHelpers;
