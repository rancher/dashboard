import {
  IPlugin, StandardProductName, ProductChild, ProductChildGroup,
  ProductMetadata, ProductChildPage, ProductSinglePage, ProductChildResource,
  VirtualTypeConfiguration, ConfigureTypeConfiguration
} from '@shell/core/types';
import { Router } from 'vue-router';
import EmptyProductPage from '@shell/components/EmptyProductPage.vue';
// import { DSLRegistrationsPerProduct, registeredRoutes } from '@shell/core/productDebugger';
import {
  gatherChildrenOrdering,
  generateTopLevelExtensionSimpleBaseRoute,
  generateVirtualTypeRoute,
  generateConfigureTypeRoute,
  generateResourceRoutes
} from '@shell/core/plugin-products-helpers';

export class PluginProduct {
  private name!: string;

  private product?: ProductMetadata;

  public newProduct = false;

  private singlePage = false;

  private addedResourceRoutes = false;

  private DSLMethods: any;

  private newProductConstructor(plugin: IPlugin, product: string | ProductMetadata | ProductSinglePage, config: ProductChild[]) {
    let prodName = (product as ProductMetadata).name;

    // the goal here is not to interfere with vue-router route names, which use dashes
    if (prodName.includes('-')) {
      prodName = prodName.replaceAll('-', '');
    }

    this.name = prodName;
    this.product = product as ProductMetadata;
    this.newProduct = true;

    plugin.registerTopLevelProduct();

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
    }

    // If the product has a `component` field, then this is a single page product
    if ((product as any).component) {
      const singlePageProduct = product as ProductSinglePage;

      this.singlePage = true;

      // Add the route to vue-router (here we go with the 'plain' layout for simple single page products)
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
      // This is the general case - product with config items and no single page component
      this.addRoutes(plugin, this.name, this.config);
    }
  }

  private extendExistingStandardProductConstructor(plugin: IPlugin, product: string, config: ProductChild[]) {
    // Check if the string exists as a VALUE in the enum
    const isProductValid = Object.values(StandardProductName).includes(product as StandardProductName);

    if (isProductValid) {
      // existing standard product - no need to add routes
      this.name = product;

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
      } else {
        // If no config is provided, add a default empty page
        this.config = [{
          name:      'main',
          label:     'Main',
          component: EmptyProductPage,
        }];
      }

      this.addRoutes(plugin, this.name, this.config);
    } else {
      throw new Error('Invalid product name');
    }
  }

  private handleProductRegistration() {
    const { basicType, product } = this.DSLMethods;

    let defaultRoute;
    const names = this.getIDsForGroupsOrBasicTypes(this.name, this.config);
    const defaultResource = names[0] || '';

    // this is the default "to" route for a product with config (at least 1 item on config) ordered by weight
    if (defaultResource) {
      if ((this.config[0] as any).name) {
        // IF the first page is a group AND doesn't have a component, then route to the first child of the group
        if ((this.config[0] as any).children && (this.config[0] as any).children.length && !(this.config[0] as any).component) {
          defaultRoute = generateVirtualTypeRoute(this.name, (this.config[0] as ProductChildGroup).children[0] as ProductChildPage, { omitPath: true, extendProduct: !this.newProduct });
        } else if ((this.config[0] as any).children && (this.config[0] as any).children.length && (this.config[0] as any).component) {
          // IF the first page is a group AND HAS a component, then route to the group page itself
          defaultRoute = generateVirtualTypeRoute(this.name, undefined, {
            omitPath: true, component: (this.config[0] as any).component, extendProduct: !this.newProduct
          });
        } else {
          // it's a simple virtual type page, without being a group
          defaultRoute = generateVirtualTypeRoute(this.name, this.config[0] as ProductChildPage, { omitPath: true, extendProduct: !this.newProduct });
        }
      } else if ((this.config[0] as any).type) {
        // it's a simple configureType page (resource), without being a group
        defaultRoute = generateConfigureTypeRoute(this.name, this.config[0] as ProductChildPage, { omitPath: true, extendProduct: !this.newProduct });
      }
    } else if (this.newProduct) {
      // this is the "to" route for a simple page product (no config items)
      defaultRoute = generateTopLevelExtensionSimpleBaseRoute(this.name, { omitPath: true });
      basicType(names);
    }

    // register the product via DSL
    product({
      inStore:             'management',
      version:             2,
      icon:                this.product?.icon || 'extension',
      showClusterSwitcher: false,
      category:            'global',
      to:                  defaultRoute,
      ...this.product,
      name:                this.name,
    });
  }

  // the constructor is where we add routes to vue-router for the product being added
  // hence why we deal with them in the constructor
  constructor(plugin: IPlugin, product: string | ProductMetadata | ProductSinglePage, private config: ProductChild[]) {
    if (typeof product === 'object' && product.name) {
      // this is a new product being added
      this.newProductConstructor(plugin, product, config);
    } else if (typeof product === 'string') {
      // this is extending an existing standard product
      this.extendExistingStandardProductConstructor(plugin, product, config);
    } else {
      throw new Error('Invalid product');
    }
  }

  // This is where we register the product and its children via the DSL
  apply(plugin: IPlugin, store: any, router: Router, pluginRoutes: any): void {
    // store the DSL methods for easier access
    this.DSLMethods = plugin.DSL(store, this.name);

    const {
      basicType, labelGroup, setGroupDefaultType, weightGroup
    } = this.DSLMethods;

    // execute the product registration
    // this.product is NOT set when extending existing standard products
    // this is deliberate as we don't need to re-register existing products
    // we just leverage the DSL to add routes and configure types/virtual types with the correct product context
    if (this.product) {
      this.handleProductRegistration();
    }

    // Now deal with each config item
    this.config.forEach((item) => {
      // needs to be "true" so that group base pages are registered correctly (when group parent has component)
      const names = this.getIDsForGroupsOrBasicTypes(this.name, this.config, true);

      // Add the first-level child navigation items
      basicType(names);

      // register virtualTypes/configureTypes
      this.configurePageItem(this.name, item);

      // Add the second-level child navigation items
      if (typeof item === 'object' && (item as any).name && (item as any).children) {
        const itemGroup = item as ProductChildGroup;

        // we'll concatenate the group name to the parent product name to create unique group basicType IDs
        const groupName = `${ this.name }-${ itemGroup.name }`;

        if (Array.isArray(itemGroup.children)) {
          const navNames = this.getIDsForGroupsOrBasicTypes(groupName, itemGroup.children);

          // looking at current records of registered products,
          // the parent group item is also added to the group
          navNames.push(groupName);

          // Register the group items under the same basic type
          basicType(navNames, groupName);

          // register virtualTypes/configureTypes for each child item
          itemGroup.children.forEach((subItem: any) => this.configurePageItem(`${ this.name }`, subItem, itemGroup.name));

          // set the group indication IF there's no component page for the actual group item
          if (!itemGroup.component) {
            setGroupDefaultType(groupName, navNames[0]);
          }

          // group weight
          if (itemGroup.weight) {
            weightGroup(groupName, itemGroup.weight, true);
          }

          // group label
          if (itemGroup.label || itemGroup.labelKey) {
            labelGroup(groupName, itemGroup.label, itemGroup.labelKey);
          }
        } else {
          throw new Error('Children defined for group are not in an array format');
        }
      }
    });

    // DEBUGGING HELPERS!!!!!!
    // DSLRegistrationsPerProduct(store, this.name);
    // registeredRoutes(store, this.name);
  }

  // configure virtualType or configureType for a page item
  private configurePageItem(parentName: string, item: ProductChild, groupNaming?: string) {
    const { configureType, virtualType, weightType } = this.DSLMethods;

    // Page with a "component" specified maps to a virtualType
    if ((item as any).component) {
      const pageChild = item as ProductChildPage;

      let name = `${ parentName }-${ pageChild.name }`;

      // routes names for group children must follow the group naming
      if (groupNaming) {
        name = `${ parentName }-${ groupNaming }-${ pageChild.name }`;
      }

      const virtualTypeConfig: VirtualTypeConfiguration = {
        label:      pageChild.label,
        labelKey:   pageChild.labelKey,
        namespaced: false,
        name,
        weight:     pageChild.weight, // ordering is done here and not via "weightType"
        config:     pageChild.config
      } as any;

      // if the item with COMPONENT has children then it's a GROUP virtualType, so set "exact" and "overview" to "true"
      // so that when navigating to the group page, it shows the custom page for the group
      if ((item as any).children) {
        virtualTypeConfig.exact = true;
        virtualTypeConfig.overview = true;
        virtualTypeConfig.route = generateVirtualTypeRoute(parentName, undefined, { extendProduct: !this.newProduct });
      } else {
        virtualTypeConfig.route = generateVirtualTypeRoute(parentName, pageChild, { extendProduct: !this.newProduct });
      }

      virtualType({ ...virtualTypeConfig, ...(pageChild.config || {}) });
    } else if ((item as any).type) {
      // Page with a "type" specified maps to a configureType
      const typeItem = item as ProductChildResource;

      const pageChild = item as ProductChildPage;
      const route = generateConfigureTypeRoute(parentName, pageChild, { extendProduct: !this.newProduct });

      const configureTypeConfig: ConfigureTypeConfiguration = {
        isCreatable: true,
        isEditable:  true,
        isRemovable: true,
        canYaml:     true,
        customRoute: route
      };

      configureType(typeItem.type, { ...configureTypeConfig, ...(pageChild.config || {}) });

      if (typeItem.weight) {
        weightType(typeItem.type, typeItem.weight, true);
      }
    }
  }

  // Add routes in Vue-router for any items that need them
  private addRoutes(plugin: IPlugin, parentName: string, item: ProductChild[]) {
    item.forEach((child: any) => {
      // if the child has children, then it's a group
      if ((child as any).children) {
        let route = {} as any;
        const pageChild = child as ProductChildPage;

        if (pageChild.type) {
          throw new Error('Group items cannot have a "type" property - only custom pages can have groups.');
        }

        if (pageChild.component && !this.newProduct) {
          throw new Error('When extending an existing product, group parent items cannot have a component because of route matching conflicts.');
        }

        if (!pageChild.component) {
          route = generateVirtualTypeRoute(parentName, pageChild, { extendProduct: !this.newProduct });
        } else {
          route = generateVirtualTypeRoute(parentName, undefined, { component: pageChild.component, extendProduct: !this.newProduct });
        }

        // add the route for the group page/parent
        plugin.addRoute(route);

        // add children routes
        this.addRoutes(plugin, `${ parentName }`, (child as any).children);
      } else if ((child as any).component) {
        // virtualType page
        const pageChild = child as ProductChildPage;
        const route = generateVirtualTypeRoute(parentName, pageChild, { component: pageChild.component, extendProduct: !this.newProduct });

        plugin.addRoute(route);
      } else if ((child as any).type) {
        // configureType page (resource)
        if (!this.addedResourceRoutes) {
          this.addedResourceRoutes = true;

          const resourceRoutes = generateResourceRoutes(parentName, child, { extendProduct: !this.newProduct });

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
