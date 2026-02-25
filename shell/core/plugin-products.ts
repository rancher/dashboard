import { IExtension } from '@shell/core/types';
import {
  StandardProductName, StandardProductNames, ProductChild, ProductChildGroup,
  ProductMetadata, ProductSinglePage,
  ConfigureTypeConfiguration, VirtualTypeConfiguration,
  ProductChildCustomPage, ProductChildResourcePage
} from '@shell/core/plugin-types';
import EmptyProductPage from '@shell/components/EmptyProductPage.vue';
import pluginProductsHelpers from '@shell/core/plugin-products-helpers';

// Type guard functions for discriminating union types
function isProductSinglePage(product: ProductMetadata | ProductSinglePage): product is ProductSinglePage {
  return 'component' in product && product.component !== undefined;
}

function isProductChildGroup(child: ProductChild): child is ProductChildGroup {
  return 'children' in child;
}

function isProductChildWithComponent(child: ProductChild): child is ProductChildCustomPage {
  return 'component' in child && child.component !== undefined && !isProductChildGroup(child);
}

function isProductChildWithType(child: ProductChild): child is ProductChildResourcePage {
  return 'type' in child && typeof child.type === 'string' && !isProductChildGroup(child);
}

function hasNameProperty(child: ProductChild): child is ProductChild & { name: string } {
  return 'name' in child && typeof child.name === 'string';
}

function hasTypeProperty(child: ProductChild): child is ProductChild & { type: string } {
  return 'type' in child && typeof child.type === 'string';
}

/**
 * Represents the new flow for product registration for extensions
 * @internal
 */
export class PluginProduct {
  private name!: string;

  private product?: ProductMetadata;

  public newProduct = false;

  private addedResourceRoutes = false;

  private DSLMethods: any;

  private newProductConstructor(plugin: IExtension, product: ProductMetadata | ProductSinglePage) {
    let prodName = product.name;

    // the goal here is not to interfere with vue-router route names, which use dashes
    if (prodName.includes('-')) {
      prodName = prodName.replaceAll('-', '');
    }

    // convert this to "string" to match all types moving forward
    // doesn't impact anything, fixes build problems of extensions
    // and allows extensions to use either string literal or enum value for product name
    this.name = prodName as string;
    this.product = product;
    this.newProduct = true;

    // register the product as a top-level product in the plugin object (will be needed for routes correction when on list views for top-level products)
    plugin._registerTopLevelProduct();

    if (this.config?.length > 0) {
      // consider weights of children to determine default route
      const reorderedChildren = pluginProductsHelpers.gatherChildrenOrdering(this.config);

      if (reorderedChildren.length === 0) {
        throw new Error('No children found for product with config');
      }

      const firstChild = reorderedChildren[0];

      if (!hasNameProperty(firstChild) && !hasTypeProperty(firstChild)) {
        throw new Error('Invalid child item for product default route - missing name or type');
      }

      // update config with reordered children
      this.config = reorderedChildren;
    }

    // If the product has a `component` field, then this is a single page product
    if (isProductSinglePage(product)) {
      // Add the route to vue-router (here we go with the 'plain' layout for simple single page products)
      const route = pluginProductsHelpers.generateTopLevelExtensionSimpleBaseRoute(this.name, { component: product.component });

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

  private extendExistingStandardProductConstructor(plugin: IExtension, product: StandardProductName) {
    // Check if the string exists as a VALUE in the standard products
    const isProductValid = Object.values(StandardProductNames).includes(product);

    if (isProductValid) {
      // existing standard product - no need to add routes
      this.name = product;

      if (this.config?.length > 0) {
        // consider weights of children to determine default route
        const reorderedChildren = pluginProductsHelpers.gatherChildrenOrdering(this.config);

        if (reorderedChildren.length === 0) {
          throw new Error('No children found for product with config');
        }

        const firstChild = reorderedChildren[0];

        if (!hasNameProperty(firstChild) && !hasTypeProperty(firstChild)) {
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
      const firstConfig = this.config[0];

      if (isProductChildGroup(firstConfig)) {
        // First config item is a group
        if (firstConfig.children.length > 0) {
          const entryChild = firstConfig.children[0];

          if (!firstConfig.component) {
            // Group without component - route to first child
            if (isProductChildWithType(entryChild)) {
              defaultRoute = pluginProductsHelpers.generateConfigureTypeRoute(this.name, entryChild, { omitPath: true, extendProduct: !this.newProduct });
            } else if (isProductChildWithComponent(entryChild)) {
              defaultRoute = pluginProductsHelpers.generateVirtualTypeRoute(this.name, entryChild, { omitPath: true, extendProduct: !this.newProduct });
            }
          } else {
            // Group with component - route to the group page itself
            defaultRoute = pluginProductsHelpers.generateVirtualTypeRoute(this.name, undefined, {
              omitPath: true, component: firstConfig.component, extendProduct: !this.newProduct
            });
          }
        }
      } else if (isProductChildWithType(firstConfig)) {
        // Simple configureType page (resource page)
        defaultRoute = pluginProductsHelpers.generateConfigureTypeRoute(this.name, firstConfig, { omitPath: true, extendProduct: !this.newProduct });
      } else if (isProductChildWithComponent(firstConfig)) {
        // Simple virtual type page (custom page)
        defaultRoute = pluginProductsHelpers.generateVirtualTypeRoute(this.name, firstConfig, { omitPath: true, extendProduct: !this.newProduct });
      }
    } else if (this.newProduct) {
      // this is the "to" route for a simple page product (no config items)
      defaultRoute = pluginProductsHelpers.generateTopLevelExtensionSimpleBaseRoute(this.name, { omitPath: true });
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
  constructor(plugin: IExtension, product: StandardProductName | ProductMetadata | ProductSinglePage, private config: ProductChild[]) {
    if (typeof product === 'object' && product.name) {
      // this is a new product being added
      this.newProductConstructor(plugin, product);
    } else if (typeof product === 'string') {
      // this is extending an existing standard product
      this.extendExistingStandardProductConstructor(plugin, product);
    } else {
      throw new Error('Invalid product');
    }
  }

  // This is where we register the product and its children via the DSL
  apply(plugin: IExtension, store: any): void {
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
      if (isProductChildGroup(item)) {
        const itemGroup = item;

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
          itemGroup.children.forEach((subItem: ProductChild) => this.configurePageItem(`${ this.name }`, subItem, itemGroup.name));

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
  }

  // configure virtualType (custom page) or configureType (resource page) for a page item
  private configurePageItem(parentName: string, item: ProductChild, groupNaming?: string) {
    const { configureType, virtualType, weightType } = this.DSLMethods;

    // Page with a "component" specified maps to a virtualType
    if (isProductChildWithComponent(item) || (isProductChildGroup(item) && item.component)) {
      // Extract properties we need from the narrowed item
      const name = `${ parentName }-${ item.name }`;
      const finalName = groupNaming ? `${ parentName }-${ groupNaming }-${ item.name }` : name;

      const virtualTypeConfig: VirtualTypeConfiguration = {
        label:      item.label,
        labelKey:   item.labelKey,
        namespaced: false,
        name:       finalName,
        weight:     item.weight, // ordering is done here and not via "weightType"
      };

      // if the item with COMPONENT has children then it's a GROUP virtualType, so set "exact" and "overview" to "true"
      // so that when navigating to the group page, it shows the custom page for the group
      if (isProductChildGroup(item)) {
        virtualTypeConfig.exact = true;
        virtualTypeConfig.overview = true;
        virtualTypeConfig.route = pluginProductsHelpers.generateVirtualTypeRoute(parentName, undefined, { extendProduct: !this.newProduct });
      } else {
        virtualTypeConfig.route = pluginProductsHelpers.generateVirtualTypeRoute(parentName, item, { extendProduct: !this.newProduct });
      }

      virtualType({ ...virtualTypeConfig, ...(isProductChildWithComponent(item) ? item.config || {} : {}) });
    } else if (isProductChildWithType(item)) {
      // Page with a "type" specified maps to a configureType
      const typeValue = item.type;
      const route = pluginProductsHelpers.generateConfigureTypeRoute(parentName, item, { extendProduct: !this.newProduct });

      const configureTypeConfig: ConfigureTypeConfiguration = {
        isCreatable: true,
        isEditable:  true,
        isRemovable: true,
        canYaml:     true,
        customRoute: route
      };

      configureType(typeValue, { ...configureTypeConfig, ...(item.config || {}) });

      if (item.weight) {
        weightType(typeValue, item.weight, true);
      }
    }
  }

  // Add routes in Vue-router for any items that need them
  private addRoutes(plugin: IExtension, parentName: string, item: ProductChild[]) {
    item.forEach((child) => {
      // if the child has children, then it's a group
      if (isProductChildGroup(child)) {
        // Validate group doesn't have type property
        if (hasTypeProperty(child)) {
          throw new Error('Group items cannot have a "type" property - only custom pages can have groups.');
        }

        if (child.component && !this.newProduct) {
          throw new Error('When extending an existing product, group parent items cannot have a component because of route matching conflicts.');
        }

        let route;

        if (!child.component) {
          // Create minimal page object for route generation
          const pageForRoute: ProductChildCustomPage = {
            name:      child.name,
            label:     child.label || child.labelKey || child.name,
            component: EmptyProductPage
          };

          route = pluginProductsHelpers.generateVirtualTypeRoute(parentName, pageForRoute, { extendProduct: !this.newProduct });
        } else {
          route = pluginProductsHelpers.generateVirtualTypeRoute(parentName, undefined, { component: child.component, extendProduct: !this.newProduct });
        }

        // add the route for the group page/parent
        plugin.addRoute(route);

        // add children routes
        this.addRoutes(plugin, `${ parentName }`, child.children);
      } else if (isProductChildWithComponent(child)) {
        // virtualType page
        if (hasTypeProperty(child)) {
          throw new Error('Custom pages cannot have a "type" property - only resource pages can use "type".');
        }

        const route = pluginProductsHelpers.generateVirtualTypeRoute(parentName, child, { component: child.component, extendProduct: !this.newProduct });

        plugin.addRoute(route);
      } else if (isProductChildWithType(child)) {
        // Validate type-based children don't have component property
        // The type guard ensures child has 'type', so we just need to check component doesn't exist
        // Since ProductChildPage with type has component?: never, this is a runtime validation

        // configureType page (resource)
        if (!this.addedResourceRoutes) {
          this.addedResourceRoutes = true;

          const resourceRoutes = pluginProductsHelpers.generateResourceRoutes(parentName, child, { extendProduct: !this.newProduct });

          resourceRoutes.forEach((resRoute) => {
            plugin.addRoute(resRoute);
          });
        }
      }
    });
  }

  // get IDs for groups/basicTypes
  private getIDsForGroupsOrBasicTypes(parent: string, data: ProductChild[], excludeGrouping = false): string[] {
    return data.map((item) => {
      if (excludeGrouping && isProductChildGroup(item)) {
        return null;
      }

      if (typeof item === 'string') {
        return item;
      } else if (hasNameProperty(item)) {
        return `${ parent }-${ item.name }`;
      } else if (hasTypeProperty(item)) {
        return item.type;
      }

      return '';
    }).filter((name): name is string => typeof name === 'string' && name.length > 0);
  }
}
