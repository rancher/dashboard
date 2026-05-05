import { IExtension } from '@shell/core/types';
import {
  ProductChild, ProductMetadata,
  ConfigureTypeConfiguration, VirtualTypeConfiguration,
  ProductChildCustomPage, VueRouteComponent,
  OverviewPageRoutingMetadata
} from '@shell/core/plugin-types';
import EmptyProductPage from '@shell/components/EmptyProductPage.vue';
import pluginProductsHelpers from '@shell/core/plugin-products-helpers';
import {
  isProductChildGroup,
  isProductChildWithComponent,
  isProductChildWithType,
  hasNameProperty,
  hasTypeProperty,
} from '@shell/core/plugin-products-type-guards';

/**
 * Base class for product registration in extensions
 * @internal
 */
export abstract class BasePluginProduct {
  protected name!: string;

  protected product?: ProductMetadata;

  protected addedResourceRoutes = false;

  protected registeredPageNames: Set<string> = new Set();

  // Maps user-friendly group name → internal resolved name (e.g. 'monitoring' → 'myapp-monitoring')
  // Populated during processGroupRecursively, consumed by moveToGroup resolution in processProductLevelDSLOptions
  protected groupNameMap: Map<string, string> = new Map();

  // Maps user-facing page identifier → internal basicType key
  // Resource pages: type → type (identity, e.g. 'pod' → 'pod')
  // Custom pages: name → prefixed name (e.g. 'myPage' → 'product1-myPage')
  // Populated during configurePageItem, consumed by moveToGroup resolution in processProductLevelDSLOptions
  protected pageIdMap: Map<string, string> = new Map();

  protected DSLMethods: any;

  protected config: ProductChild[];

  constructor(config: ProductChild[]) {
    this.config = config;
  }

  /**
   * Indicates whether this is a new product or extending an existing one
   */
  abstract get isNewProduct(): boolean;

  get productName(): string {
    return this.name;
  }

  /**
   * Helper to throw errors during product registration
   */
  protected surfaceError(message: string, e?: any): never {
    console.error(`Extensions - product "${ this.name }" registration error ::: ${ message }`); // eslint-disable-line no-console
    throw new Error(`Extensions - product "${ this.name }" registration error ::: ${ message }`, { cause: e });
  }

  /**
   * Validates and reorders config children by weight
   */
  protected processConfigChildren(): void {
    if (this.config?.length > 0) {
      // consider weights of children to determine default route
      const reorderedChildren = pluginProductsHelpers.gatherChildrenOrdering(this.config);

      if (reorderedChildren.length === 0) {
        this.surfaceError('No children found for product with config');
      }

      const firstChild = reorderedChildren[0];

      if (!hasNameProperty(firstChild) && !hasTypeProperty(firstChild)) {
        this.surfaceError('Invalid child item for product default route - missing name or type');
      }

      // update config with reordered children
      this.config = reorderedChildren;
    }
  }

  /**
   * Generates data for group overview page routing
   */
  protected generateMetadataForGroupOverviewPageRouting(name: string, component: VueRouteComponent): OverviewPageRoutingMetadata {
    return { name, component };
  }

  /**
   * This is where we register the product and its children via the DSL
   */
  apply(plugin: IExtension, store: any): void {
    // store the DSL methods for easier access
    this.DSLMethods = plugin.DSL(store, this.name);

    const { basicType } = this.DSLMethods;

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
        this.processGroupRecursively(item, this.name);
      }
    });

    // Process product-level DSL options after all groups are registered
    // so that the groupNameMap is fully populated for moveToGroup resolution
    if (this.product) {
      this.processProductLevelDSLOptions();
    }
  }

  /**
   * Recursively processes a group and all its nested children/groups
   */
  protected processGroupRecursively(item: ProductChild, productName: string, parentGroupName?: string, parentHierarchicalPath?: string): void {
    const {
      basicType, labelGroup, setGroupDefaultType, weightGroup
    } = this.DSLMethods;

    // Type guard to ensure we're working with a group
    if (!isProductChildGroup(item)) {
      return;
    }

    const itemGroup = item;
    const groupName = parentGroupName ? `${ productName }-${ parentGroupName }-${ itemGroup.name }` : `${ productName }-${ itemGroup.name }`;

    // Map the user's friendly group name to the resolved internal name
    // so that moveToGroup can translate friendly names automatically
    this.groupNameMap.set(itemGroup.name, groupName);

    if (!Array.isArray(itemGroup.children)) {
      this.surfaceError('Children defined for group are not in an array format');

      return;
    }

    const navNames = this.getIDsForGroupsOrBasicTypes(groupName, itemGroup.children);

    // Build the full hierarchical path with :: separators for the store's _ensureGroup function
    // For example: "explorer-root::explorer-root-group1" tells the store to nest group1 inside root
    const hierarchicalPath = parentHierarchicalPath ? `${ parentHierarchicalPath }::${ groupName }` : groupName;

    // For root-level groups (no parent), add the group itself to establish its identity.
    // For nested groups, skip this - they're already registered in their parent's basicType.
    // Adding nested groups here would overwrite their parent registration and make them
    // appear at the wrong level in the hierarchy.
    if (!parentGroupName) {
      navNames.push(groupName);
    }

    // Register the group's children (and possibly itself if root) under this group's hierarchical path
    // This uses :: separators so the store knows to create nested group structure
    basicType(navNames, hierarchicalPath);

    // register virtualTypes/configureTypes for each child item
    itemGroup.children.forEach((subItem: ProductChild) => {
      const currentGroupName = parentGroupName ? `${ parentGroupName }-${ itemGroup.name }` : itemGroup.name;

      this.configurePageItem(productName, subItem, currentGroupName);

      // Recursively process nested groups, passing the full hierarchical path
      if (isProductChildGroup(subItem)) {
        this.processGroupRecursively(subItem, productName, currentGroupName, hierarchicalPath);
      }
    });

    // set the group indication based on whether the group has its own component page
    if (!itemGroup.component) {
      // Group without component - route to first child
      setGroupDefaultType(groupName, navNames[0]);
    } else {
      // Group with component - route to the group's own page
      setGroupDefaultType(groupName, groupName);
    }

    // group weight
    if (itemGroup.weight) {
      weightGroup(groupName, itemGroup.weight, true);
    }

    // group label
    if (itemGroup.label || itemGroup.labelKey) {
      labelGroup(groupName, itemGroup.label, itemGroup.labelKey);
    }
  }

  /**
   * Handles product registration via DSL (we also define entry route for the product here based on the config of the product - ordering)
   */
  protected handleProductRegistration(): void {
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
              defaultRoute = pluginProductsHelpers.generateConfigureTypeRoute(this.name, entryChild, { omitPath: true, extendProduct: !this.isNewProduct });
            } else if (isProductChildWithComponent(entryChild)) {
              defaultRoute = pluginProductsHelpers.generateVirtualTypeRoute(this.name, entryChild, { omitPath: true, extendProduct: !this.isNewProduct });
            }
          } else {
            // Group with component - route to the group overview page (which will render the group's component and side-menu)
            defaultRoute = pluginProductsHelpers.generateVirtualTypeRoute(this.name, this.generateMetadataForGroupOverviewPageRouting(firstConfig.name, firstConfig.component), { omitPath: true, extendProduct: !this.isNewProduct });
          }
        } else if (firstConfig.component) {
          // Group with component but no children - route to the group page itself
          defaultRoute = pluginProductsHelpers.generateVirtualTypeRoute(this.name, this.generateMetadataForGroupOverviewPageRouting(firstConfig.name, firstConfig.component), { omitPath: true, extendProduct: !this.isNewProduct });
        }
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

    // register the product via DSL
    product({
      showClusterSwitcher: false,
      extendable:          false,
      ...this.product,
      category:            'global',
      to:                  defaultRoute,
      icon:                this.product?.icon || 'extension',
      version:             2,
      inStore:             'management',
      name:                this.name,
    });
  }

  /**
   * Process product-level DSL options: renameGroups, ignoreGroups, moveToGroup.
   * Called after all config items and groups are registered so that the groupNameMap is fully populated.
   */
  protected processProductLevelDSLOptions(): void {
    const {
      mapGroup, ignoreGroup, moveType, basicType
    } = this.DSLMethods;

    if (this.product?.renameGroups?.length) {
      this.product.renameGroups.forEach((mapping) => {
        mapGroup(mapping.regexOrString, mapping.group);
      });
    }

    if (this.product?.ignoreGroups?.length) {
      this.product.ignoreGroups.forEach((ignore) => {
        if (ignore.fn) {
          ignoreGroup(ignore.regexOrString, ignore.fn);
        } else {
          ignoreGroup(ignore.regexOrString);
        }
      });
    }

    if (this.product?.moveToGroup?.length) {
      this.product.moveToGroup.forEach((move) => {
        const resolvedGroup = this.groupNameMap.get(move.group);

        if (!resolvedGroup) {
          this.surfaceError(`moveToGroup target group "${ move.group }" not found. Available groups: ${ Array.from(this.groupNameMap.keys()).join(', ') }`);
        }

        const resolvedPageId = this.pageIdMap.get(move.id);

        if (!resolvedPageId) {
          this.surfaceError(`moveToGroup id "${ move.id }" not found. Available pages: ${ Array.from(this.pageIdMap.keys()).join(', ') }`);
        }

        // Re-register via basicType to move the page in the nav tree (basic view mode)
        basicType([resolvedPageId], resolvedGroup);

        // Also register via moveType for non-basic view modes (e.g. "in use" mode).
        // moveType uses regex matching against schema IDs, so it only works for resource types.
        const isResourceType = resolvedPageId === move.id;

        if (isResourceType) {
          moveType(move.id, resolvedGroup, move.weight);
        }
      });
    }
  }

  /**
   * Configure virtualType (custom page) or configureType (resource page) for a page item
   */
  protected configurePageItem(parentName: string, item: ProductChild, groupNaming?: string): void {
    const {
      configureType, virtualType, weightType,
      mapType, ignoreType, hideBulkActions, headers
    } = this.DSLMethods;

    // Page with a "component" specified maps to a virtualType
    if (isProductChildWithComponent(item) || (isProductChildGroup(item) && item.component)) {
      // Extract properties we need from the narrowed item
      const name = `${ parentName }-${ item.name }`;
      const finalName = groupNaming ? `${ parentName }-${ groupNaming }-${ item.name }` : name;

      // Check for duplicate page names within the same product
      if (this.registeredPageNames.has(finalName)) {
        this.surfaceError(`Duplicate page name "${ item.name }" - each page must have a unique name within a product`);
      }

      this.registeredPageNames.add(finalName);
      this.pageIdMap.set(item.name, finalName);

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
        // Pass group metadata as pageChild so the route gets a unique path segment (e.g. /product/c/:cluster/groupName)
        virtualTypeConfig.route = pluginProductsHelpers.generateVirtualTypeRoute(parentName, this.generateMetadataForGroupOverviewPageRouting(item.name, item.component as ProductChildCustomPage['component']), { extendProduct: !this.isNewProduct });
      } else {
        virtualTypeConfig.route = pluginProductsHelpers.generateVirtualTypeRoute(parentName, item, { extendProduct: !this.isNewProduct });
      }

      virtualType({ ...virtualTypeConfig, ...(isProductChildWithComponent(item) ? item.config || {} : {}) });
    } else if (isProductChildWithType(item)) {
      // Page with a "type" specified maps to a configureType
      const typeValue = item.type;

      // Check for duplicate resource type within the same product
      if (this.registeredPageNames.has(typeValue)) {
        this.surfaceError(`Duplicate resource type "${ typeValue }" - each resource type must be unique within a product`);
      }

      this.registeredPageNames.add(typeValue);
      this.pageIdMap.set(typeValue, typeValue);

      const route = pluginProductsHelpers.generateConfigureTypeRoute(parentName, item, { extendProduct: !this.isNewProduct });

      const configureTypeConfig: ConfigureTypeConfiguration = {
        isCreatable: true,
        isEditable:  true,
        isRemovable: true,
        canYaml:     true,
        customRoute: route
      };

      if (item.headers || item.sspHeaders) {
        headers(item.type, item.headers, item.sspHeaders);
      }

      if (item.overrideListResourceName) {
        mapType(item.type, item.overrideListResourceName);
      }

      if (item.hideFromNav) {
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
          this.surfaceError('Group items cannot have a "type" property - only custom pages can have groups.');
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
          route = pluginProductsHelpers.generateVirtualTypeRoute(parentName, this.generateMetadataForGroupOverviewPageRouting(child.name, child.component), { component: child.component, extendProduct: !this.isNewProduct });
        }

        // add the route for the group page/parent
        plugin.addRoute(route);

        // add children routes
        this.addRoutes(plugin, `${ parentName }`, child.children);
      } else if (isProductChildWithComponent(child)) {
        // virtualType page
        if (hasTypeProperty(child)) {
          this.surfaceError('Custom pages cannot have a "type" property - only resource pages can use "type".');
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
