import {
  IPlugin, ProductChild, ProductChildGroup, ProductMetadata, ProductChildMetadata, ProductChildPage, ProductSinglePage, ProductChildResource
} from '@shell/core/types';
import { RouteRecordRaw, Router } from 'vue-router';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import EmptyProductPage from '@shell/components/EmptyProductPage.vue';
import cluster from 'cluster';

function routeForChild(parentName: string, pageChild: ProductChildPage) {
  // if (pageChild.path) {
  //   let name = pageChild.path.replaceAll(':', '').replaceAll('/', '-');

  //   if (name.startsWith('-')) {
  //     name = name.substring(1);
  //   }

  //   return {
  //     name,
  //     path: pageChild.path,
  //   };
  // }

  console.error('routeForChild parentName', parentName);
  console.error('routeForChild pageChild', pageChild);

  // it's a resource page!
  if (pageChild.type) {
    return {
      name:   `${ parentName }-c-cluster-resource`,
      params: {
        product: parentName, cluster: BLANK_CLUSTER, resource: pageChild.type
      },
      meta: {
        product: parentName, cluster: BLANK_CLUSTER, resource: pageChild.type
      },
    };
  }

  return {
    name:   `${ parentName }-c-cluster-${ pageChild.name }`,
    // path:   `${ parentName.replace('-', '/') }/c/:cluster/${ pageChild.name }`,
    // path:   `${ parentName }/c/:cluster/${ pageChild.name }`,
    params: { product: parentName, cluster: BLANK_CLUSTER },
    meta:   { product: parentName, cluster: BLANK_CLUSTER },
  };
}

export class PluginProduct {
  private name: string;

  private product?: ProductMetadata;

  public newProduct = false;

  private singlePage = false;

  private config: ProductChild[];

  private addedResourceRoutes = false;

  private addRoutes(plugin: IPlugin, parentName: string, item: ProductChild[]) {
    // Add routes for any items that need them
    item.forEach((child: any) => {
      // Just create routes for pages
      if ((child as any).component) {
        const pageChild = child as ProductChildPage;

        // TODO: Support non-explorer (where parent is not c-cluster) routes

        // Check if the route has a path override

        // TODO: Check it has a name
        const r = {
          ...routeForChild(parentName, pageChild),
          component: pageChild.component,
          // meta:      { product: this.name },
          // params: { cluster: '_' } // Not sure about this
        };

        plugin.addRoute(r);

        // // Check child routes
        // if (pageChild.extraRoutes) {
        //   pageChild.extraRoutes.forEach((cr) => {
        //     const name = `${ r.name }-${ cr.name }`;
        //     const path = `${ r.path }/${ cr.name }`;
        //     const childRoute = {
        //       name,
        //       path,
        //       component: cr.component,
        //       meta:      { product: this.name },
        //     };

        //     this.plugin.addRoute(childRoute);
        //     // console.error('Adding child route', childRoute);
        //   });
        // }
      } else if ((child as any).type) {
        const interopDefault = (promise) => promise.then((page) => page.default || page);

        if (!this.addedResourceRoutes) {
          this.addedResourceRoutes = true;

          plugin.addRoute({
            path:      `${ this.name }/c/:cluster/:resource`,
            component: () => interopDefault(import('@shell/pages/c/_cluster/_product/_resource/index.vue')),
            name:      'product-c-cluster-resource',
            meta:      {
              product: this.name, cluster: BLANK_CLUSTER, resource: (child as ProductChildResource).type
            }
          });

          plugin.addRoute({
            path:      `${ this.name }/c/:cluster/:resource/create`,
            component: () => interopDefault(import('@shell/pages/c/_cluster/_product/_resource/create.vue')),
            name:      'product-c-cluster-resource-create',
            meta:      {
              product: this.name, cluster: BLANK_CLUSTER, resource: (child as ProductChildResource).type
            }
          });

          plugin.addRoute({
            path:      `${ this.name }/c/:cluster/:resource/:id`,
            component: () => interopDefault(import('@shell/pages/c/_cluster/_product/_resource/_id.vue')),
            name:      'product-c-cluster-resource-id',
            meta:      {
              product: this.name, cluster: BLANK_CLUSTER, resource: (child as ProductChildResource).type, asyncSetup: true
            }
          });

          plugin.addRoute({
            path:      `${ this.name }/c/:cluster/:resource/:namespace/:id`,
            component: () => interopDefault(import('@shell/pages/c/_cluster/_product/_resource/_namespace/_id.vue')),
            name:      'product-c-cluster-resource-namespace-id',
            meta:      {
              product: this.name, cluster: BLANK_CLUSTER, resource: (child as ProductChildResource).type, asyncSetup: true
            }
          });
        }
      } else if ((child as any).children) {
        // TODO: Route for top-level?
        this.addRoutes(plugin, `${ parentName }-${ child.name }`, (child as any).children);
      }
    });
  }

  private getNames(parent: string, data: any): string[] {
    return data.map((item:any) => {
      if (typeof item === 'string') {
        return item;
      } else if (item.name) {
        return `${ parent }-${ item.name }` as string;
      } else if (item.type) {
        return item.type;
      }

      return '';
    }).filter((name: string) => !!name);
  }

  constructor(plugin: IPlugin, product: string | ProductMetadata | ProductSinglePage, private config: ProductChild[]) {
    console.error(`Adding product ${ product.name } with config`, config);
    console.error('product', product);

    // if (typeof product === 'string') {
    //   this.name = product;
    //   this.newProduct = false;
    //   this.addRoutes(this.name, config);
    // } else

    // IMPORTANT NOTE: ROUTES MUST BE ADDED TO VUE-ROUTER BEFORE THE PRODUCT IS REGISTERED VIA DSL!!!!
    if (typeof product === 'object' && product.name) {
      let prodName = product.name;

      if (prodName.includes('-')) {
        prodName = prodName.replaceAll('-', '');
      }

      this.name = prodName;
      this.product = product;
      this.newProduct = true;

      // If the product has a `component` field, then this is a single page product
      if ((product as any).component) {
        const singlePageProduct = product as ProductSinglePage;

        this.singlePage = true;

        const r = {
          name:      `${ this.name }`,
          path:      `/${ this.name }`,
          component: singlePageProduct.component,
          params:    { product: this.name },
          meta:      { product: this.name },
        };

        // Add the route to vue-router
        plugin.addRoute('plain', r);
      } else if (config.length === 0) {
        // If no config is provided, add a default empty page
        this.config = [{
          name:      'main',
          label:     'Main',
          component: EmptyProductPage,
        }];

        this.addRoutes(plugin, this.name, this.config);
      } else {
        this.config = config;

        // Add routes for the product config
        this.addRoutes(plugin, this.name, this.config);
      }
    } else {
      throw new Error('Invalid product');
    }
  }

  apply(plugin: IPlugin, store: any, router: Router, pluginRoutes: any): void {
    const {
      basicType, configureType, labelGroup, setGroupDefaultType, virtualType, weightGroup, weightType, product
    } = plugin.DSL(store, this.name);

    // If this is a new product, intialise it
    if (this.product) {
      const names = this.getNames(this.name, this.config);

      const defaultResource = names[0] || '';

      console.error('plugin-products apply defaultResource', defaultResource);
      console.error('plugin-products apply this.config', this.config);
      console.error('plugin-products applythis.config[0].name', this.config[0].name);
      console.error('plugin-products apply this.name', this.name);

      let defaultRoute;

      if (defaultResource) {
        console.error(' WITH DEFAULT RESOURCE!!!');
        // this is the default "to" route for a product with config (1st item on config)
        // TODO: first route should be by weight if specified
        defaultRoute = {
          name:   `${ this.name }-c-cluster-${ this.config[0].name }`,
          params: { product: this.name, cluster: BLANK_CLUSTER },
          meta:   {
            product: this.name, cluster: BLANK_CLUSTER, pkg: this.name
          }
        };
      } else {
        console.error(' WITHOUT any default resource...');
        // this is the "to" route for a simple page product
        defaultRoute = {
          name:   `${ this.name }`,
          params: { product: this.name },
          meta:   { product: this.name, pkg: this.name }
        };
      }

      const prodObj = {
        ...this.product,
        name:                this.name,
        icon:                this.product.icon || 'extension',
        inStore:             'management',
        showClusterSwitcher: false,
        category:            'global',
        version:             2,
        to:                  defaultRoute
      };

      // console.log('plugin-products apply prodObj', JSON.stringify(prodObj, null, 2));

      // register the new product via DSL
      product(prodObj);
    }

    function configureItem(parentName: string, item: ProductChild, order?: number) {
      console.error('---- configureItem', parentName, item, order);

      if ((item as any).component) {
        console.error('---- configureItem ---- IT HAS COMPONENT!');
        const pageChild = item as ProductChildPage;

        const route = routeForChild(parentName, pageChild);

        // console.log('---- configureItem route ---- ', JSON.stringify(route, null, 2));

        // Page with a component specified maps to a virtual type
        virtualType({
          label:      pageChild.label,
          // labelKey:   'catalog.charts.header',
          namespaced: false,
          name:       `${ parentName }-${ pageChild.name }`,
          route:      { name: route.name },
          weight:     pageChild.weight || order,
        });
      }
      // else if (typeof item === 'string') {
      //   if (order) {
      //     weightType(item as string, order, true);
      //   }
      // this is where we handle "type" which we will deem as a resource (configureType)
      else if ((item as any).type) {
        const typeItem = item as ProductChildResource;
        const itemOrder = typeItem.weight || order;

        const pageChild = item as ProductChildPage;
        const route = routeForChild(parentName, pageChild);

        console.error('---- configureItem ---- IT HAS TYPE! route', typeItem.type, route);

        configureType(typeItem.type, {
          isCreatable: true,
          isEditable:  true,
          isRemovable: true,
          canYaml:     true,
          customRoute: route
        });

        if (itemOrder) {
          weightType(typeItem.type, itemOrder, true);
        }
      }
    }

    const names = this.getNames(this.name, this.config);

    // Add the first-level child navigation items
    basicType(names);

    this.config.forEach((item) => {
      configureItem(this.name, item);

      // // Add the second-level child navigation items
      // if (typeof item === 'object' && (item as any).name && (item as any).children) {
      //   console.error('******* !!!!!** ******* Processing group item', item);
      //   const itemGroup = item as ProductChildGroup;

      //   if (Array.isArray(itemGroup.children)) {
      //     const navNames = this.getNames(`${ this.name }-${ itemGroup.name }`, itemGroup.children);

      //     basicType(navNames, itemGroup.name);

      //     // Items are ordered from highest number to lowest
      //     // We add weights to child items, so that they show up in the order they are defined in, we pick a high number of 500 to start
      //     let order = 500;

      //     // Generate the virtual type (if needed) and configure weight etc for each child item
      //     itemGroup.children.forEach((subItem: any) => configureItem(`${ this.name }-${ itemGroup.name }`, subItem, order--));

      //     if (itemGroup.default) {
      //       setGroupDefaultType(itemGroup.name, itemGroup.default);
      //     }

      //     if (item.weight) {
      //       weightGroup(itemGroup.name, item.weight, true);
      //     }

      //     if (itemGroup.label || itemGroup.labelKey) {
      //       labelGroup(itemGroup.name, itemGroup.label, itemGroup.labelKey);
      //     }
      //   }
      // }
    });
  }
}
