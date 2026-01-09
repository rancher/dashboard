import {
  IPlugin, ProductChild, ProductChildGroup, ProductMetadata, ProductChildMetadata, ProductChildPage, ProductSinglePage, ProductChildResource
} from '@shell/core/types';
import { RouteRecordRaw, Router } from 'vue-router';
import EmptyProductPage from '@shell/components/EmptyProductPage.vue';
import { DSLRegistrationsPerProduct, registeredRoutes } from '@shell/core/productDebugger';
import {
  gatherChildrenOrdering,
  generateTopLevelExtensionSimpleBaseRoute,
  generateTopLevelExtensionVirtualTypeRoute,
  generateTopLevelExtensionConfigureTypeRoute,
  generateTopLevelExtensionResourceRoutes
} from '@shell/core/plugin-products-helpers';

export class PluginProduct {
  private name: string;

  private product?: ProductMetadata;

  public newProduct = false;

  private singlePage = false;

  private addedResourceRoutes = false;

  constructor(plugin: IPlugin, product: string | ProductMetadata | ProductSinglePage, private config: ProductChild[]) {
    console.error(`Adding product ${ product.name } with config`, config);
    console.log('product', product);

    // IMPORTANT NOTE: ROUTES MUST BE ADDED TO VUE-ROUTER BEFORE THE PRODUCT IS REGISTERED VIA DSL!!!!
    // hence why we deal with them in the constructor
    if (typeof product === 'object' && product.name) {
      let prodName = product.name;

      if (prodName.includes('-')) {
        prodName = prodName.replaceAll('-', '');
      }

      this.name = prodName;
      this.product = product;
      this.newProduct = true;

      if (this.config?.length > 0) {
        // consider weights of children to determine default route
        const reorderedChildren = gatherChildrenOrdering(this.config);

        if (reorderedChildren.length === 0) {
          throw new Error('No children found for product with config');
        }

        if (!reorderedChildren[0].name && !(reorderedChildren[0] as any).type) {
          throw new Error('Invalid child item for product default route - missing name or type');
        }

        // update config with reordered children
        this.config = reorderedChildren;

        console.error('******* plugin-products ---- Reordered children for product default route', this.config);
      }

      // If the product has a `component` field, then this is a single page product
      if ((product as any).component) {
        const singlePageProduct = product as ProductSinglePage;

        this.singlePage = true;

        // Add the route to vue-router (here we go with the ''plain'' layout for simple single page products)
        const route = generateTopLevelExtensionSimpleBaseRoute(this.name, { component: singlePageProduct.component });

        plugin.addRoute('plain', route);
      } else if (this.config.length === 0) {
        // If no config is provided, add a default empty page
        this.config = [{
          name:      'main',
          label:     'Main',
          component: EmptyProductPage,
        }];

        this.addRoutes(plugin, this.name, this.config);
      } else {
        console.log('******* plugin-products ---- hitting else....', this.config);
        // This is the general case - product with config items and no single page component
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
      const names = this.getIDsForGroupsOrBasicTypes(this.name, this.config);

      console.log('******* plugin-products ---- plugin-products basicType names', names);

      const defaultResource = names[0] || '';

      console.log('******* plugin-products ---- defaultResource', defaultResource);

      let defaultRoute;

      // this is the default "to" route for a product with config (1st item on config) ordered by weight
      if (defaultResource) {
        if ((this.config[0] as any).name) {
          // IF the first page is a group AND doesn't have a component, then route to the first child of the group
          if ((this.config[0] as any).children && (this.config[0] as any).children.length && !(this.config[0] as any).component) {
            defaultRoute = generateTopLevelExtensionVirtualTypeRoute(this.name, this.config[0].children[0] as ProductChildPage, { omitPath: true });
          } else if ((this.config[0] as any).children && (this.config[0] as any).children.length && (this.config[0] as any).component) {
            // IF the first page is a group AND HAS a component, then route to the group page itself
            defaultRoute = generateTopLevelExtensionVirtualTypeRoute(this.name, undefined, { omitPath: true, component: (this.config[0] as any).component });
          } else {
            // it's a simple virtual type page, without being a group
            defaultRoute = generateTopLevelExtensionVirtualTypeRoute(this.name, this.config[0] as ProductChildPage, { omitPath: true });
          }
        } else if ((this.config[0] as any).type) {
          // it's a simple configureType page (resource), without being a group
          defaultRoute = generateTopLevelExtensionConfigureTypeRoute(this.name, this.config[0] as ProductChildPage, { omitPath: true });
        }
      } else {
        // this is the "to" route for a simple page product (no config items)
        defaultRoute = generateTopLevelExtensionSimpleBaseRoute(this.name, { omitPath: true });
        console.log('******* plugin-products ---- SHOULD NOT BE HITTING THIS!!!!');
        basicType(names);
      }

      console.log('******* plugin-products ---- defaultRoute', defaultRoute);

      // register the new product via DSL
      product({
        ...this.product,
        name:                this.name,
        icon:                this.product.icon || 'extension',
        inStore:             'management',
        showClusterSwitcher: false,
        category:            'global',
        version:             2,
        to:                  defaultRoute
      });
    }

    this.config.forEach((item) => {
      const names = this.getIDsForGroupsOrBasicTypes(this.name, this.config, true);

      console.log('******* plugin-products ---- names for each config item, excluding groups', names);

      // Add the first-level child navigation items IF there's no component nor children
      if (typeof item === 'object' && !(item as any).component && (!(item as any).children || (item as any).children.length === 0)) {
        basicType(names);
      }

      // register virtualTypes/configureTypes
      configureItem(this.name, item);

      // Add the second-level child navigation items
      if (typeof item === 'object' && (item as any).name && (item as any).children) {
        const itemGroup = item as ProductChildGroup;

        // TODO: GROUP CANNOT HAVE A TYPE OR COMPONENT!!
        if (Array.isArray(itemGroup.children)) {
          const navNames = this.getIDsForGroupsOrBasicTypes(`${ this.name }-${ itemGroup.name }`, itemGroup.children);

          navNames.push(`${ this.name }-${ itemGroup.name }`);
          console.log('******* plugin-products ---- navNames', navNames);
          console.log('******* plugin-products ---- itemGroup', itemGroup);
          console.log('******* plugin-products ---- itemGroup.name', itemGroup.name);

          // Register the group items under the same basic type
          basicType(navNames, `${ this.name }-${ itemGroup.name }`);

          // Generate the virtual type (if needed) and configure weight etc for each child item
          itemGroup.children.forEach((subItem: any) => configureItem(`${ this.name }`, subItem, itemGroup.name));

          // set the group indication IF there's no component page for the actual group item
          // TODO: force the group indication with a property on the group item called "default"?
          if (!itemGroup.component) {
            setGroupDefaultType(`${ this.name }-${ itemGroup.name }`, navNames[0]);
          }

          if (item.weight) {
            weightGroup(`${ this.name }-${ itemGroup.name }`, item.weight, true);
          }

          // if (itemGroup.label || itemGroup.labelKey) {
          //   labelGroup(itemGroup.name, itemGroup.label, itemGroup.labelKey);
          // }
        } else {
          throw new Error('Children defined for group are not in an array format');
        }
      }
    });

    function configureItem(parentName: string, item: ProductChild, groupNaming?: string) {
      console.log('******* plugin-products ---- configureItem', parentName, item, groupNaming);

      // Page with a "component" specified maps to a virtualType
      if ((item as any).component) {
        console.log('******* plugin-products ---- configureItem ---- IT HAS COMPONENT!', item);
        const pageChild = item as ProductChildPage;
        const itemOrder = pageChild.weight;

        let name = `${ parentName }-${ pageChild.name }`;

        // routes names for group children must follow the group naming
        if (groupNaming) {
          name = `${ parentName }-${ groupNaming }-${ pageChild.name }`;
        }

        // TODO: ALLOW TO OVERRIDE THIS CONFIGURATION VIA item.virtualTypeConfig???
        const virtualTypeConfig = {
          label:      pageChild.label,
          // labelKey:   'catalog.charts.header',
          namespaced: false,
          name,
          weight:     pageChild.weight
        };

        // if the item has children, then it's a group virtualType, so set "exact" and "overview" to "true"
        // so that when navigating to the group page, it shows the custom page for the group
        if ((item as any).children) {
          virtualTypeConfig.exact = true;
          virtualTypeConfig.overview = true;
          virtualTypeConfig.route = generateTopLevelExtensionVirtualTypeRoute(parentName, undefined);
        } else {
          virtualTypeConfig.route = generateTopLevelExtensionVirtualTypeRoute(parentName, pageChild);
        }

        virtualType(virtualTypeConfig);

        if (itemOrder) {
          weightType(name, itemOrder, true);
        }
      } else if ((item as any).type) {
        // Page with a "type" specified maps to a configureType
        const typeItem = item as ProductChildResource;
        const itemOrder = typeItem.weight;

        const pageChild = item as ProductChildPage;
        const route = generateTopLevelExtensionConfigureTypeRoute(parentName, pageChild);

        console.log('******* plugin-products ---- configureItem ---- IT HAS TYPE!', item);

        // TODO: ALLOW TO OVERRIDE THIS CONFIGURATION VIA item.configureTypeConfig???
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

    // DEBUGGING HELPERS!!!!!!
    DSLRegistrationsPerProduct(store, this.name);
    registeredRoutes(store, this.name);

    // DEBUGGING HELPERS for explorer product!!!!!!
    console.error('*** EXPLORER PRODUCT DATA DEBUGGER ****');
    DSLRegistrationsPerProduct(store, 'explorer');
    registeredRoutes(store, 'explorer');
  }

  // Add routes for any items that need them
  private addRoutes(plugin: IPlugin, parentName: string, item: ProductChild[]) {
    item.forEach((child: any) => {
      // if the child has children, then it's a group
      if ((child as any).children) {
        let route = {} as any;
        const pageChild = child as ProductChildPage;

        if (!pageChild.component) {
          route = generateTopLevelExtensionVirtualTypeRoute(parentName, pageChild);
        } else {
          route = generateTopLevelExtensionVirtualTypeRoute(parentName, undefined, { component: pageChild.component });
        }

        console.error('******* plugin-products ---- Adding group route for', parentName, child, 'route:', route);

        // add the route for the group page/parent
        plugin.addRoute(route);

        // add children routes
        this.addRoutes(plugin, `${ parentName }`, (child as any).children);
      } else if ((child as any).component) {
        // virtualType page
        const pageChild = child as ProductChildPage;
        const route = generateTopLevelExtensionVirtualTypeRoute(parentName, pageChild, { component: pageChild.component });

        plugin.addRoute(route);
      } else if ((child as any).type) {
        // configureType page (resource)
        if (!this.addedResourceRoutes) {
          this.addedResourceRoutes = true;

          const resourceRoutes = generateTopLevelExtensionResourceRoutes(parentName, child);

          resourceRoutes.forEach((resRoute) => {
            plugin.addRoute(resRoute);
          });
        }
      }
    });
  }

  // get IDs for groups/basicTypes
  private getIDsForGroupsOrBasicTypes(parent: string, data: any, excludeGrouping = false): string[] {
    return data.map((item:any) => {
      if (excludeGrouping && Array.isArray((item as any).children)) {
        return null;
      }
      // console.error('******* plugin-products ---- getIDsForGroupsOrBasicTypes item', item);

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
