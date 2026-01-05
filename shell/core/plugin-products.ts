import {
  IPlugin, ProductChild, ProductChildGroup, ProductMetadata, ProductChildMetadata, ProductChildPage, ProductSinglePage, ProductChildResource
} from '@shell/core/types';
import { RouteRecordRaw, Router } from 'vue-router';
import EmptyProductPage from '@shell/components/EmptyProductPage.vue';

function routeForChild(parentName: string, pageChild: ProductChildPage) {
  if (pageChild.path) {
    let name = pageChild.path.replaceAll(':', '').replaceAll('/', '-');

    if (name.startsWith('-')) {
      name = name.substring(1);
    }

    return {
      name,
      path: pageChild.path,
    };
  }

  return {
    name: `c-cluster-${ parentName }-${ pageChild.name }`,
    path: `/c/:cluster/${ parentName.replace('-', '/') }/${ pageChild.name }`,
  };
}

export class PluginProduct {
  private name: string;

  private product?: ProductMetadata;

  public newProduct = false;

  private singlePage = false;

  constructor(private plugin: IPlugin, product: string | ProductMetadata | ProductSinglePage, private config: ProductChild[]) {
    // console.error(`Adding product ${ product } with config`, config);
    // console.log(product);

    if (typeof product === 'string') {
      this.name = product;
      this.newProduct = false;
      this.addRoutes(this.name, config);
    } else if (typeof product === 'object' && product.name) {
      this.name = product.name;
      this.product = product;
      this.newProduct = true;

      // If the product has a `component` field, then this is a single page product
      if ((product as any).component) {
        const singlePageProduct = product as ProductSinglePage;

        // console.error('Product Single Page');

        this.singlePage = true;

        // this.addDefaultRoute();
        const r = {
          name:      `${ this.name }`,
          path:      `/${ this.name }`,
          component: singlePageProduct.component,
          meta:      { product: this.name }, // Needed to ensure the correct product is loaded, since 'product' is not a route param
        };

        plugin.addRoute('plain', r);
      }

      this.addRoutes(this.name, config);
    } else {
      throw new Error('Invalid product');
    }
  }

  private addRoutes(parentName: string, item: ProductChild[]) {
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
          meta:      { product: this.name },
          // params: { cluster: '_' } // Not sure about this
        };

        this.plugin.addRoute(r);

        // Check child routes
        if (pageChild.extraRoutes) {
          pageChild.extraRoutes.forEach((cr) => {
            const name = `${ r.name }-${ cr.name }`;
            const path = `${ r.path }/${ cr.name }`;
            const childRoute = {
              name,
              path,
              component: cr.component,
              meta:      { product: this.name },
            };

            this.plugin.addRoute(childRoute);
            // console.error('Adding child route', childRoute);
          });
        }
      } else if ((child as any).children) {
        // TODO: Route for top-level?
        this.addRoutes(`${ parentName }-${ child.name }`, (child as any).children);
      }
    });
  }

  apply(plugin: IPlugin, store: any, router: Router, pluginRoutes: any): void {
    const {
      basicType, configureType, labelGroup, setGroupDefaultType, virtualType, weightGroup, weightType, product
    } = plugin.DSL(store, this.name);

    // If this is a new product, intialise it
    if (this.product) {
      const names = this.getNames(this.name, this.config);

      const defaultResource = names[0] || '';

      let defaultRoute;

      if (defaultResource) {
        defaultRoute = {
          name:   `c-cluster-${ defaultResource }`,
          params: {
            // product: this.name,
            cluster: '_',
          }
        };

        // defaultRoute = {
        //   name: 'c-cluster-product-resource',
        //   params: {
        //     product: this.name,
        //     cluster: '_',
        //     resource: defaultResource
        //   }
        // };
      } else {
        defaultRoute = {
          name:   `${ this.name }`,
          params: { cluster: '_' }
        };
      }

      product({
        ...this.product,
        name:                this.name,
        icon:                this.product.icon || 'extension',
        inStore:             'management',
        showClusterSwitcher: false,
        category:            'global',
        version:             2,
        to:                  defaultRoute
        // to: {
        //   name: this.name,
        //   params: {
        //     cluster: 'local',
        //     product: this.name
        //   }
        // }
      });
    }

    function configureItem(parentName: string, item: ProductChild, order?: number) {
      if ((item as any).component) {
        const pageChild = item as ProductChildPage;

        const route = routeForChild(parentName, pageChild);

        // Page with a component specified maps to a virtual type
        virtualType({
          label:      pageChild.label,
          // labelKey:   'catalog.charts.header',
          namespaced: false,
          name:       `${ parentName }-${ pageChild.name }`,
          route:      { name: route.name },
          weight:     pageChild.weight || order,
        });
      } else if (typeof item === 'string') {
        if (order) {
          weightType(item as string, order, true);
        }
      } else if ((item as any).type) {
        const typeItem = item as ProductChildResource;
        const itemOrder = typeItem.weight || order;

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

      // Add the second-level child navigation items
      if (typeof item === 'object' && (item as any).name && (item as any).children) {
        const itemGroup = item as ProductChildGroup;

        if (Array.isArray(itemGroup.children)) {
          const navNames = this.getNames(`${ this.name }-${ itemGroup.name }`, itemGroup.children);

          basicType(navNames, itemGroup.name);

          // Items are ordered from highest number to lowest
          // We add weights to child items, so that they show up in the order they are defined in, we pick a high number of 500 to start
          let order = 500;

          // Generate the virtual type (if needed) and configure weight etc for each child item
          itemGroup.children.forEach((subItem: any) => configureItem(`${ this.name }-${ itemGroup.name }`, subItem, order--));

          if (itemGroup.default) {
            setGroupDefaultType(itemGroup.name, itemGroup.default);
          }

          if (item.weight) {
            weightGroup(itemGroup.name, item.weight, true);
          }

          if (itemGroup.label || itemGroup.labelKey) {
            labelGroup(itemGroup.name, itemGroup.label, itemGroup.labelKey);
          }
        }
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
}
