import { IExtension } from '@shell/core/types';
import EmptyProductPage from '@shell/components/EmptyProductPage.vue';
import pluginProductsHelpers from '@shell/core/plugin-products-helpers';
import {
  isProductChildGroup,
  isProductChildWithComponent,
  isProductChildWithType,
  hasNameProperty,
  hasTypeProperty,
  isProductConfigInternal,
} from '@shell/core/plugin-products-type-guards';
import {
  ProductChild, ProductChildCustomPage, ProductChildGroup, ProductChildResourcePage, ProductMetadata, ProductMetadataSinglePage
} from '@shell/core/plugin-products-external';
import { TypeMapConfigureType, TypeMapProduct, TypeMapVirtualType } from '@shell/types/store/type-map';
import { ProductChildCustomPageInternal, ProductChildResourcePageInternal, ProductMetadataInternal } from '@shell/core/plugin-products-internal';
import { RouteRecordRaw } from 'vue-router';
import { RouteRecordRawWithParams } from '@shell/core/plugin-types';

/**
 * What's the point of this?
 *
 * Example
 * `applyIfDefined(this.product?.label, () => typeMapProduct.label = this.product?.label); `
 *
 * If the property is defined we apply it to the object
 * - this avoids verbose objects filled with `: undefined` (which fail unit tests)
 *   - { a: undefined, b: undefined, c: true} vs { c: true}
 *
 * Caller supplied direct object.property values
 * - this ensure any further refactoring can happen automatically
 * - type failures are very visible
 * - both above would be lost if we had this as a cleaner but generic function(obj, targetPathString, targetValue)
 */
const applyIfDefined = function(value: any, apply: () => void) {
  if (value !== undefined) {
    apply();
  }
};

/**
 * Base class for product registration in extensions
 * @internal
 */
export abstract class BasePluginProduct {
  protected name!: string;

  protected product?: ProductMetadata | ProductMetadataSinglePage;

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

    const itemGroup = item as ProductChildGroup;
    const groupName = parentGroupName ? `${ productName }-${ parentGroupName }-${ itemGroup.name }` : `${ productName }-${ itemGroup.name }`;

    // Map the user's friendly group name to the resolved internal name
    // so that moveToGroup can translate friendly names automatically
    this.groupNameMap.set(itemGroup.name, groupName);

    if (!Array.isArray(itemGroup.sideMenu.children)) {
      this.surfaceError('Children defined for group are not in an array format');
    }

    const navNames = this.getIDsForGroupsOrBasicTypes(groupName, itemGroup.sideMenu.children);

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
    itemGroup.sideMenu.children.forEach((subItem: ProductChild) => {
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
    if (itemGroup.sideMenu?.weight) {
      weightGroup(groupName, itemGroup.sideMenu?.weight, true);
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
        const config = firstConfig as ProductChildGroup;

        // First config item is a group
        if (config.sideMenu.children.length > 0) {
          const entryChild = config.sideMenu.children[0];

          if (!config.component) {
            // Group without component - route to first child
            if (isProductChildWithType(entryChild)) {
              const entry = entryChild as ProductChildResourcePage;

              defaultRoute = pluginProductsHelpers.generateConfigureTypeRoute(this.name, entry, { omitPath: true, extendProduct: !this.isNewProduct });
            } else if (isProductChildWithComponent(entryChild)) {
              const entry = entryChild as ProductChildCustomPage;

              defaultRoute = pluginProductsHelpers.generateVirtualTypeRoute(this.name, entry.name, {
                omitPath: true, extendProduct: !this.isNewProduct, component: entry.component
              });
            }
          } else {
            // generateMetadataForGroupOverviewPageRouting
            // Group with component - route to the group overview page (which will render the group's component and side-menu)
            defaultRoute = pluginProductsHelpers.generateVirtualTypeRoute(this.name, firstConfig.name, {
              omitPath: true, extendProduct: !this.isNewProduct, component: firstConfig.component
            });
          }
        } else if (firstConfig.component) {
          // Group with component but no children - route to the group page itself
          defaultRoute = pluginProductsHelpers.generateVirtualTypeRoute(this.name, firstConfig.name, {
            omitPath: true, extendProduct: !this.isNewProduct, component: firstConfig.component
          });
        }
      } else if (isProductChildWithType(firstConfig)) {
        // Simple configureType page (resource page)
        const config = firstConfig as ProductChildResourcePage;

        defaultRoute = pluginProductsHelpers.generateConfigureTypeRoute(this.name, config, { omitPath: true, extendProduct: !this.isNewProduct });
      } else if (isProductChildWithComponent(firstConfig)) {
        // Simple virtual type page (custom page)
        const config = firstConfig as ProductChildCustomPage;

        defaultRoute = pluginProductsHelpers.generateVirtualTypeRoute(this.name, config.name, {
          omitPath: true, extendProduct: !this.isNewProduct, component: config.component
        });
      }
    } else if (this.isNewProduct) {
      // this is the "to" route for a simple page product (no config items)
      defaultRoute = pluginProductsHelpers.generateTopLevelExtensionSimpleBaseRoute(this.name, { omitPath: true });
      basicType(names);
    }

    const typeMapProduct: TypeMapProduct = {
      showClusterSwitcher: false,
      extendable:          false,
      // ...this.product,
      category:            'global',
      to:                  defaultRoute,
      icon:                'extension',
      version:             2,
      inStore:             'management',
      name:                this.name,
    };

    if (this.product) {
      // ProductMetadata

      applyIfDefined(this.product?.label, () => typeMapProduct.label = this.product?.label); // eslint-disable-line no-return-assign
      applyIfDefined(this.product?.labelKey, () => typeMapProduct.labelKey = this.product?.labelKey); // eslint-disable-line no-return-assign

      applyIfDefined(this.product?.enable?.ifFeature, () => typeMapProduct.ifFeature = this.product?.enable?.ifFeature); // eslint-disable-line no-return-assign
      applyIfDefined(this.product?.enable?.ifHave, () => typeMapProduct.ifHave = this.product?.enable?.ifHave); // eslint-disable-line no-return-assign
      applyIfDefined(this.product?.enable?.ifHaveGroup, () => typeMapProduct.ifHaveGroup = this.product?.enable?.ifHaveGroup); // eslint-disable-line no-return-assign
      applyIfDefined(this.product?.enable?.ifHaveType, () => typeMapProduct.ifHaveType = this.product?.enable?.ifHaveType); // eslint-disable-line no-return-assign
      applyIfDefined(this.product?.enable?.ifNotHaveType, () => typeMapProduct.ifNotHaveType = this.product?.enable?.ifNotHaveType); // eslint-disable-line no-return-assign

      applyIfDefined(this.product?.resources?.hideSystemResources, () => typeMapProduct.hideSystemResources = this.product?.resources?.hideSystemResources); // eslint-disable-line no-return-assign
      typeMapProduct.inStore = this.product.resources?.store ?? 'management';

      applyIfDefined(this.product?.extendable, () => typeMapProduct.extendable = this.product?.extendable); // eslint-disable-line no-return-assign

      applyIfDefined(this.product?.appHeader?.hideCopyConfig, () => typeMapProduct.hideCopyConfig = this.product?.appHeader?.hideCopyConfig); // eslint-disable-line no-return-assign
      applyIfDefined(this.product?.appHeader?.hideKubeConfig, () => typeMapProduct.hideKubeConfig = this.product?.appHeader?.hideKubeConfig); // eslint-disable-line no-return-assign
      applyIfDefined(this.product?.appHeader?.hideKubeShell, () => typeMapProduct.hideKubeShell = this.product?.appHeader?.hideKubeShell); // eslint-disable-line no-return-assign
      applyIfDefined(this.product?.appHeader?.showClusterInfo, () => typeMapProduct.showClusterSwitcher = this.product?.appHeader?.showClusterInfo); // eslint-disable-line no-return-assign
      applyIfDefined(this.product?.appHeader?.showNamespaceFilter, () => typeMapProduct.showNamespaceFilter = this.product?.appHeader?.showNamespaceFilter); // eslint-disable-line no-return-assign
      applyIfDefined(this.product?.appHeader?.icon, () => typeMapProduct.iconHeader = this.product?.appHeader?.icon); // eslint-disable-line no-return-assign

      applyIfDefined(this.product?.sideBar?.weight, () => typeMapProduct.weight = this.product?.sideBar?.weight); // eslint-disable-line no-return-assign
      typeMapProduct.icon = this.product?.sideBar?.icon?.name ?? 'extension';
      applyIfDefined(this.product?.sideBar?.icon?.svg, () => typeMapProduct.svg = this.product?.sideBar?.icon?.svg); // eslint-disable-line no-return-assign

      // ProductMetadataAddInternal
      if (isProductConfigInternal(this.product)) {
        const poI = this.product as ProductMetadataInternal;

        applyIfDefined(poI.category, () => typeMapProduct.category = poI.category); // eslint-disable-line no-return-assign
        applyIfDefined(poI?.appHeader?.hideNamespaceLocation, () => typeMapProduct.hideNamespaceLocation = poI?.appHeader?.hideNamespaceLocation); // eslint-disable-line no-return-assign
        applyIfDefined(poI?.sideMenu?.renameGroups, () => typeMapProduct.renameGroups = poI?.sideMenu?.renameGroups); // eslint-disable-line no-return-assign
        applyIfDefined(poI?.sideMenu?.ignoreGroups, () => typeMapProduct.ignoreGroups = poI?.sideMenu?.ignoreGroups); // eslint-disable-line no-return-assign
        applyIfDefined(poI?.sideMenu?.moveToGroup, () => typeMapProduct.moveToGroup = poI?.sideMenu?.moveToGroup); // eslint-disable-line no-return-assign

        applyIfDefined(poI?.appHeader?.showWorkspaceSwitcher, () => typeMapProduct.showWorkspaceSwitcher = poI?.appHeader?.showWorkspaceSwitcher); // eslint-disable-line no-return-assign
        applyIfDefined(poI?.removable, () => typeMapProduct.removable = poI?.removable); // eslint-disable-line no-return-assign
      }
    }

    // register the product via DSL
    product(typeMapProduct);
  }

  /**
   * Process product-level DSL options: renameGroups, ignoreGroups, moveToGroup.
   * Called after all config items and groups are registered so that the groupNameMap is fully populated.
   */
  protected processProductLevelDSLOptions(): void {
    const {
      mapGroup, ignoreGroup, moveType, basicType
    } = this.DSLMethods;

    if (this.product && isProductConfigInternal(this.product)) {
      const productConfigInternal = this.product as ProductMetadataInternal;

      if (productConfigInternal?.sideMenu?.renameGroups?.length) {
        productConfigInternal?.sideMenu?.renameGroups.forEach((mapping) => {
          mapGroup(mapping.groupSelector, mapping.newName);
        });
      }

      if (productConfigInternal?.sideMenu?.ignoreGroups?.length) {
        productConfigInternal?.sideMenu?.ignoreGroups.forEach((ignore) => {
          if (ignore.condition) {
            ignoreGroup(ignore.groupSelector, ignore.condition);
          } else {
            ignoreGroup(ignore.groupSelector);
          }
        });
      }

      if (productConfigInternal?.sideMenu?.moveToGroup?.length) {
        productConfigInternal?.sideMenu?.moveToGroup.forEach((move) => {
          const resolvedGroup = this.groupNameMap.get(move.groupName);

          if (!resolvedGroup) {
            this.surfaceError(`moveToGroup target group "${ move.groupName }" not found. Available groups: ${ Array.from(this.groupNameMap.keys()).join(', ') }`);
          }

          const resolvedPageId = this.pageIdMap.get(move.entryId);

          if (!resolvedPageId) {
            this.surfaceError(`moveToGroup entryId "${ move.entryId }" not found. Available pages: ${ Array.from(this.pageIdMap.keys()).join(', ') }`);
          }

          // Re-register via basicType to move the page in the nav tree (basic view mode)
          basicType([resolvedPageId], resolvedGroup);

          // Also register via moveType for non-basic view modes (e.g. "in use" mode).
          // moveType uses regex matching against schema IDs, so it only works for resource types.
          const isResourceType = resolvedPageId === move.entryId;

          if (isResourceType) {
            moveType(move.entryId, resolvedGroup, move.weight);
          }
        });
      }
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

      const virtualTypeConfig: TypeMapVirtualType = {
        label:      item.label,
        labelKey:   item.labelKey,
        namespaced: false,
        name:       finalName,
        weight:     item.sideMenu?.weight, // ordering is done here and not via "weightType"
      };

      // if the item with COMPONENT has children then it's a GROUP virtualType, so set "exact" and "overview" to "true"
      // so that when navigating to the group page, it shows the custom page for the group
      if (isProductChildGroup(item)) {
        virtualTypeConfig.exact = true;
        virtualTypeConfig.overview = true;
        // Pass group metadata as pageChild so the route gets a unique path segment (e.g. /product/c/:cluster/groupName)
        virtualTypeConfig.route = pluginProductsHelpers.generateVirtualTypeRoute(parentName, item.name, { extendProduct: !this.isNewProduct, component: item.component });
      } else {
        virtualTypeConfig.route = pluginProductsHelpers.generateVirtualTypeRoute(parentName, item.name, { extendProduct: !this.isNewProduct, component: item.component });
      }

      if (isProductChildWithComponent(item)) {
        const itemCustomPage:ProductChildCustomPageInternal = item as ProductChildCustomPageInternal;

        // virtualTypeConfig.component = itemCustomPage.component;
        applyIfDefined(itemCustomPage.enable?.ifHave, () => virtualTypeConfig.ifHave = itemCustomPage.enable?.ifHave); // eslint-disable-line no-return-assign
        applyIfDefined(itemCustomPage.enable?.ifFeature, () => virtualTypeConfig.ifFeature = itemCustomPage.enable?.ifFeature); // eslint-disable-line no-return-assign
        applyIfDefined(itemCustomPage.enable?.ifHaveType, () => virtualTypeConfig.ifHaveType = itemCustomPage.enable?.ifHaveType); // eslint-disable-line no-return-assign
        applyIfDefined(itemCustomPage.enable?.ifHaveVerb, () => virtualTypeConfig.ifHaveVerb = itemCustomPage.enable?.ifHaveVerb); // eslint-disable-line no-return-assign

        applyIfDefined(itemCustomPage.resource?.namespaced, () => virtualTypeConfig.namespaced = itemCustomPage.resource?.namespaced); // eslint-disable-line no-return-assign
      }

      virtualType(virtualTypeConfig);
    } else if (isProductChildWithType(item)) {
      // Page with a "type" specified maps to a configureType
      const typeValue = item.type;

      // Check for duplicate resource type within the same product
      if (this.registeredPageNames.has(typeValue)) {
        this.surfaceError(`Duplicate resource type "${ typeValue }" - each resource type must be unique within a product`);
      }

      const itemRP: ProductChildResourcePageInternal = item as ProductChildResourcePageInternal;

      this.registeredPageNames.add(typeValue);
      this.pageIdMap.set(typeValue, typeValue);

      const route = pluginProductsHelpers.generateConfigureTypeRoute(parentName, item, { extendProduct: !this.isNewProduct });

      const configureTypeConfig: TypeMapConfigureType = {
        isCreatable: itemRP.can?.create ?? true,
        isEditable:  itemRP.can?.edit ?? true,
        isRemovable: itemRP.can?.create ?? true,
        canYaml:     itemRP.can?.yaml ?? true,
        customRoute: route
      };

      applyIfDefined(itemRP.listConfig?.listGroups, () => configureTypeConfig.listGroups = itemRP.listConfig?.listGroups); // eslint-disable-line no-return-assign
      applyIfDefined(itemRP.listConfig?.listGroupsWillOverride, () => configureTypeConfig.listGroupsWillOverride = itemRP.listConfig?.listGroupsWillOverride); // eslint-disable-line no-return-assign
      applyIfDefined(itemRP.listConfig?.subTypes, () => configureTypeConfig.subTypes = itemRP.listConfig?.subTypes); // eslint-disable-line no-return-assign

      if (itemRP.listConfig?.localHeaders || itemRP.listConfig?.headers) {
        headers(item.type, itemRP.listConfig?.localHeaders, itemRP.listConfig?.headers);
      }

      if (itemRP.label) {
        mapType(item.type, itemRP.label);
      }

      if (itemRP.sideMenu?.hideFromNav) {
        ignoreType(item.type);
      }

      if (itemRP.listConfig?.hideBulkActions) {
        hideBulkActions(item.type, true);
      }

      applyIfDefined(item.views?.list?.createLabelKey, () => configureTypeConfig.listCreateButtonLabelKey = item.views?.list?.createLabelKey); // eslint-disable-line no-return-assign
      configureTypeConfig.showState = item.display?.showState ?? true;
      configureTypeConfig.showAge = item.display?.showAge ?? true;
      configureTypeConfig.showConfigView = item.views?.detail?.showConfigView ?? true;
      configureTypeConfig.showListMasthead = item.views?.list?.showListMasthead ?? true;
      configureTypeConfig.resourceEditMasthead = item.views?.createEdit?.showMasthead ?? true;
      configureTypeConfig.localOnly = item.sideMenu?.localOnly ?? false;

      configureType(typeValue, configureTypeConfig);

      if (itemRP.sideMenu?.weight !== undefined) {
        weightType(typeValue, itemRP.sideMenu?.weight, true);
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

        let route: RouteRecordRaw | RouteRecordRawWithParams;

        if (!child.component) {
          // Create minimal page object for route generation
          const pageForRoute: ProductChildCustomPage = {
            name:      child.name,
            label:     child.label || child.labelKey || child.name,
            component: EmptyProductPage
          };

          route = pluginProductsHelpers.generateVirtualTypeRoute(parentName, pageForRoute.name, { extendProduct: !this.isNewProduct });
        } else {
          route = pluginProductsHelpers.generateVirtualTypeRoute(parentName, child.name, { component: child.component, extendProduct: !this.isNewProduct });
        }

        // add the route for the group page/parent
        plugin.addRoute(route);

        // add children routes
        this.addRoutes(plugin, `${ parentName }`, child.sideMenu.children);
      } else if (isProductChildWithComponent(child)) {
        // virtualType page
        if (hasTypeProperty(child)) {
          this.surfaceError('Custom pages cannot have a "type" property - only resource pages can use "type".');
        }

        const route = pluginProductsHelpers.generateVirtualTypeRoute(parentName, child.name, { component: child.component, extendProduct: !this.isNewProduct });

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
