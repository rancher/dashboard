import { IExtension } from '@shell/core/types';
import {
  ProductChild, ProductMetadata,
  ConfigureTypeConfiguration, VirtualTypeConfiguration,
  ProductChildCustomPage, ProductChildSpoofedType
} from '@shell/core/plugin-types';
import EmptyProductPage from '@shell/components/EmptyProductPage.vue';
import pluginProductsHelpers from '@shell/core/plugin-products-helpers';
import {
  isProductChildGroup,
  isProductChildWithComponent,
  isProductChildWithType,
  hasNameProperty,
  hasTypeProperty,
  isProductChildSpoofed
} from '@shell/core/plugin-products-type-guards';
import { DSLRegistrationsPerProduct, registeredRoutes } from '@shell/core/productDebugger';

/**
 * Base class for product registration in extensions
 * @internal
 */
export abstract class BasePluginProduct {
  protected name!: string;

  protected product?: ProductMetadata;

  protected addedResourceRoutes = false;

  protected DSLMethods: any;

  protected config: ProductChild[];

  constructor(config: ProductChild[]) {
    this.config = config;
  }

  /**
   * Indicates whether this is a new product or extending an existing one
   */
  abstract get isNewProduct(): boolean;

  /**
   * Validates and reorders config children by weight
   */
  protected processConfigChildren(): void {
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
  }

  /**
   * This is where we register the product and its children via the DSL
   */
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

      basicType(names);
      this.configurePageItem(this.name, item);

      if (isProductChildGroup(item)) {
        const itemGroup = item;
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

    // debugger prods
    DSLRegistrationsPerProduct(store, this.name);
    registeredRoutes(store, this.name);
  }

  /**
   * Handles product registration via DSL (we also define entry route for the product here based on the config of the product - ordering)
   */
  protected handleProductRegistration(): void {
    const {
      basicType, product, mapGroup, ignoreGroup
    } = this.DSLMethods;

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
            if (isProductChildSpoofed(entryChild)) {
              defaultRoute = pluginProductsHelpers.generateConfigureTypeRoute(this.name, entryChild, { omitPath: true, extendProduct: !this.isNewProduct });
            } else if (isProductChildWithType(entryChild)) {
              defaultRoute = pluginProductsHelpers.generateConfigureTypeRoute(this.name, entryChild, { omitPath: true, extendProduct: !this.isNewProduct });
            } else if (isProductChildWithComponent(entryChild)) {
              defaultRoute = pluginProductsHelpers.generateVirtualTypeRoute(this.name, entryChild, { omitPath: true, extendProduct: !this.isNewProduct });
            }
          } else {
            // Group with component - route to the group page itself
            defaultRoute = pluginProductsHelpers.generateVirtualTypeRoute(this.name, undefined, {
              omitPath: true, component: firstConfig.component, extendProduct: !this.isNewProduct
            });
          }
        }
      } else if (isProductChildSpoofed(firstConfig)) {
        // Spoofed type route (fake resource page)
        defaultRoute = pluginProductsHelpers.generateConfigureTypeRoute(this.name, firstConfig, { omitPath: true, extendProduct: !this.isNewProduct });
      } else if (isProductChildWithType(firstConfig)) {
        // Simple configureType page (resource page)
        defaultRoute = pluginProductsHelpers.generateConfigureTypeRoute(this.name, firstConfig, { omitPath: true, extendProduct: !this.isNewProduct });
      } else if (isProductChildWithComponent(firstConfig)) {
        // Simple virtual type page (custom page)
        defaultRoute = pluginProductsHelpers.generateVirtualTypeRoute(this.name, firstConfig, { omitPath: true, extendProduct: !this.isNewProduct });
      }
    } else if (this.isNewProduct) {
      // this is the "to" route for a simple page product (no config items)
      defaultRoute = pluginProductsHelpers.generateTopLevelExtensionSimpleBaseRoute(this.name, { omitPath: true });
      basicType(names);
    }

    if (this.product?.mapToGroup?.length) {
      this.product.mapToGroup.forEach((mapping) => {
        mapGroup(mapping.condition, mapping.group);
      });
    }

    if (this.product?.ignoreGroups?.length) {
      this.product.ignoreGroups.forEach((ignore) => {
        ignoreGroup(ignore.groupId, ignore.fn);
      });
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

  /**
   * Configure spoofedType (fake resource page) / Configure virtualType (custom page) / configureType (resource page) for a page item
   */
  protected configurePageItem(parentName: string, item: ProductChild, groupNaming?: string): void {
    const {
      configureType, virtualType, weightType, spoofedType,
      mapType, ignoreType, hideBulkActions
    } = this.DSLMethods;

    // Spoofed type page
    if (isProductChildSpoofed(item)) {
      const spoofedTypeConfig: ProductChildSpoofedType = { ...item };

      // the "type" for the spoofed type is actually generated based on the name of the item
      spoofedTypeConfig.type = item.name;

      // entry route for the spoofed type page
      spoofedTypeConfig.route = pluginProductsHelpers.generateConfigureTypeRoute(parentName, spoofedTypeConfig, { extendProduct: !this.isNewProduct });

      // generate schema for the spoofed type if not provided - this is required to have the type show up in the UI
      if (!spoofedTypeConfig.schemas || spoofedTypeConfig.schemas.length === 0) {
        spoofedTypeConfig.schemas = [pluginProductsHelpers.generateSchemaForSpoofedType({
          type:              spoofedTypeConfig.name,
          collectionMethods: spoofedTypeConfig.collectionMethods || ['GET'],
          namespaced:        spoofedTypeConfig.namespaced || false,
          resourceFields:    spoofedTypeConfig.resourceFields || {},
          attributes:        spoofedTypeConfig.attributes || { namespaced: spoofedTypeConfig.namespaced || false },
        })];
      }

      if (spoofedTypeConfig.overrideListResourceName) {
        mapType(spoofedTypeConfig.type, spoofedTypeConfig.overrideListResourceName);
      }

      if (spoofedTypeConfig.hideBulkActions) {
        hideBulkActions(spoofedTypeConfig.type, true);
      }

      spoofedType(spoofedTypeConfig);

      // Page with a "component" specified maps to a virtualType
    } else if (isProductChildWithComponent(item) || (isProductChildGroup(item) && item.component)) {
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
        virtualTypeConfig.route = pluginProductsHelpers.generateVirtualTypeRoute(parentName, undefined, { extendProduct: !this.isNewProduct });
      } else {
        virtualTypeConfig.route = pluginProductsHelpers.generateVirtualTypeRoute(parentName, item, { extendProduct: !this.isNewProduct });
      }

      virtualType({ ...virtualTypeConfig, ...(isProductChildWithComponent(item) ? item.config || {} : {}) });
    } else if (isProductChildWithType(item)) {
      // Page with a "type" specified maps to a configureType
      const typeValue = item.type;
      const route = pluginProductsHelpers.generateConfigureTypeRoute(parentName, item, { extendProduct: !this.isNewProduct });

      const configureTypeConfig: ConfigureTypeConfiguration = {
        isCreatable: true,
        isEditable:  true,
        isRemovable: true,
        canYaml:     true,
        customRoute: route
      };

      if (item.overrideListResourceName) {
        mapType(item.type, item.overrideListResourceName);
      }

      if (item.hideFromMoreResourcesMenu) {
        ignoreType(item.type);
      }

      if (item.hideBulkActions) {
        hideBulkActions(item.type, true);
      }

      configureType(typeValue, { ...configureTypeConfig, ...(item.config || {}) });

      if (item.weight) {
        weightType(typeValue, item.weight, true);
      }
    }
  }

  /**
   * Add routes in Vue-router for any items that need them
   */
  protected addRoutes(plugin: IExtension, parentName: string, item: ProductChild[]): void {
    item.forEach((child) => {
      // if the child has children, then it's a group
      if (isProductChildGroup(child)) {
        // Validate group doesn't have type property
        if (hasTypeProperty(child)) {
          throw new Error('Group items cannot have a "type" property - only custom pages can have groups.');
        }

        if (child.component && !this.isNewProduct) {
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

          route = pluginProductsHelpers.generateVirtualTypeRoute(parentName, pageForRoute, { extendProduct: !this.isNewProduct });
        } else {
          route = pluginProductsHelpers.generateVirtualTypeRoute(parentName, undefined, { component: child.component, extendProduct: !this.isNewProduct });
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

        const route = pluginProductsHelpers.generateVirtualTypeRoute(parentName, child, { component: child.component, extendProduct: !this.isNewProduct });

        plugin.addRoute(route);
      } else if (isProductChildWithType(child)) {
        // Validate type-based children don't have component property
        // The type guard ensures child has 'type', so we just need to check component doesn't exist
        // Since ProductChildPage with type has component?: never, this is a runtime validation

        // configureType page (resource)
        if (!this.addedResourceRoutes) {
          this.addedResourceRoutes = true;

          const resourceRoutes = pluginProductsHelpers.generateResourceRoutes(parentName, child, { extendProduct: !this.isNewProduct });

          resourceRoutes.forEach((resRoute) => {
            plugin.addRoute(resRoute);
          });
        }
      }
    });
  }

  /**
   * Get IDs for groups/basicTypes
   */
  protected getIDsForGroupsOrBasicTypes(parent: string, data: ProductChild[], excludeGrouping = false): string[] {
    return data.map((item) => {
      if (excludeGrouping && isProductChildGroup(item)) {
        return null;
      }

      if (isProductChildSpoofed(item)) {
        return item.name;
      } else if (typeof item === 'string') {
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
