import { ProductChild, ProductChildCustomPage, ProductChildResourcePage } from '@shell/core/plugin-products-external';
import { ProductRegistrationRouteGenerationOptions } from '@shell/core/plugin-products-internal';
import { isProductChildGroup } from '@shell/core/plugin-products-type-guards';
import { RouteRecordRawWithParams } from '@shell/core/plugin-types';
import { BLANK_CLUSTER } from '@shell/store/store-types';

class PluginProductsHelpers {
  private weightFromProductChild(item: ProductChild): number | undefined {
    return (item as ProductChildCustomPage).sideMenu?.weight || (item as ProductChildResourcePage).sideMenu?.weight;
  }

  gatherChildrenOrdering(children: ProductChild[]): ProductChild[] {
    let minWeight = children.reduce((min, item) => {
      const weight = this.weightFromProductChild(item);

      if (typeof weight !== 'number') return min;

      return weight < min ? weight : min;
    }, Infinity);

    if (minWeight === Infinity) {
      // 1000 is Root level default weight minus some space
      minWeight = 999;
    }

    const processedChildren: ProductChild[] = [];

    children.forEach((child: ProductChild, index) => {
      const processedChild = { ...child };

      if (processedChild.sideMenu?.weight === undefined || processedChild.sideMenu?.weight === null) {
        if (!processedChild.sideMenu) {
          processedChild.sideMenu = {};
        }
        processedChild.sideMenu.weight = minWeight - (index + 1);
      }

      if (isProductChildGroup(processedChild)) {
        processedChild.sideMenu.children = this.gatherChildrenOrdering(processedChild.sideMenu.children);
      }

      processedChildren.push(processedChild);
    });

    return processedChildren.sort((a, b) => (b.sideMenu?.weight ?? 0) - (a.sideMenu?.weight ?? 0));
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
  generateVirtualTypeRoute(parentName: string, childName: string | undefined, options: ProductRegistrationRouteGenerationOptions = {}): RouteRecordRawWithParams {
    if (options.extendProduct) {
      return this.generateVirtualTypeRouteForExistingProduct(parentName, childName, options);
    } else {
      return this.generateVirtualTypeRouteForNewProduct(parentName, childName, options);
    }
  }

  // VIRTUAL TYPE ROUTES - CLUSTER LEVEL EXTENSION
  private generateVirtualTypeRouteForExistingProduct(parentName: string, childName: string | undefined, options: ProductRegistrationRouteGenerationOptions = {}): RouteRecordRawWithParams {
    const { component, omitPath } = options;
    const name = childName ? `c-cluster-${ parentName }-${ childName }` : `c-cluster-${ parentName }`;
    const path = childName ? `c/:cluster/${ parentName }/${ childName }` : `c/:cluster/${ parentName }`;

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
  private generateVirtualTypeRouteForNewProduct(parentName: string, childName: string | undefined, options: ProductRegistrationRouteGenerationOptions = {}): RouteRecordRawWithParams {
    const { component, omitPath } = options;
    const name = childName ? `${ parentName }-c-cluster-${ childName }` : `${ parentName }-c-cluster`;
    const path = childName ? `${ parentName }/c/:cluster/${ childName }` : `${ parentName }/c/:cluster`;

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
  generateConfigureTypeRoute(parentName: string, pageChild: ProductChildResourcePage | undefined, options: ProductRegistrationRouteGenerationOptions = {}): RouteRecordRawWithParams {
    if (options.extendProduct) {
      return this.generateConfigureTypeRouteForExistingProduct(parentName, pageChild, options);
    } else {
      return this.generateConfigureTypeRouteForNewProduct(parentName, pageChild, options);
    }
  }

  // CONFIGURE TYPE ROUTES - CLUSTER LEVEL EXTENSION
  private generateConfigureTypeRouteForExistingProduct(parentName: string, pageChild: ProductChildResourcePage | undefined, options: ProductRegistrationRouteGenerationOptions = {}): RouteRecordRawWithParams {
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
  private generateConfigureTypeRouteForNewProduct(parentName: string, pageChild: ProductChildResourcePage | undefined, options: ProductRegistrationRouteGenerationOptions = {}): RouteRecordRawWithParams {
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
}

const pluginProductsHelpers = new PluginProductsHelpers();

export default pluginProductsHelpers;
