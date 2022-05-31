import { ELEMENTAL_SCHEMA_IDS, ELEMENTAL_PRODUCT_GROUP, ELEMENTAL_TYPES } from './types';
import { createElementalRoute, rootElementalRoute } from './utils/custom-routing';

export function init($plugin, store) {
  const {
    product, virtualType, basicType, configureType, weightType
  } = $plugin.DSL(store, $plugin.name);

  // app in sidebar
  product({
    ifHaveGroup:         ELEMENTAL_PRODUCT_GROUP,
    icon:                'gear',
    inStore:             'management',
    removable:           false,
    showClusterSwitcher: false,
    to:                  rootElementalRoute()
  });

  // dashboard menu entry in Elemental
  virtualType({
    label:        store.getters['i18n/t']('elemental.menuLabels.dashboard'),
    icon:         'folder',
    group:        'Root',
    namespaced:   false,
    name:         ELEMENTAL_TYPES.DASHBOARD,
    weight:      10,
    route:        rootElementalRoute()
  });

  // registering Elemental resources
  weightType(ELEMENTAL_SCHEMA_IDS.MACHINE_REGISTRATIONS, 9, true);
  configureType(ELEMENTAL_SCHEMA_IDS.MACHINE_REGISTRATIONS, {
    isCreatable: true,
    isEditable:  true,
    isRemovable: true,
    customRoute: createElementalRoute('resource', { resource: ELEMENTAL_SCHEMA_IDS.MACHINE_REGISTRATIONS })
  });

  weightType(ELEMENTAL_SCHEMA_IDS.MACHINE_INVENTORIES, 8, true);
  configureType(ELEMENTAL_SCHEMA_IDS.MACHINE_INVENTORIES, {
    isCreatable: true,
    isEditable:  true,
    isRemovable: true,
    customRoute: createElementalRoute('resource', { resource: ELEMENTAL_SCHEMA_IDS.MACHINE_INVENTORIES })
  });

  weightType(ELEMENTAL_SCHEMA_IDS.MANAGED_OS_IMAGES, 7, true);
  configureType(ELEMENTAL_SCHEMA_IDS.MANAGED_OS_IMAGES, {
    isCreatable: true,
    isEditable:  true,
    isRemovable: true,
    customRoute: createElementalRoute('resource', { resource: ELEMENTAL_SCHEMA_IDS.MANAGED_OS_IMAGES })
  });
  // weightType(ELEMENTAL_SCHEMA_IDS.MANAGED_OS_VERSIONS, 6, true);
  // configureType(ELEMENTAL_SCHEMA_IDS.MANAGED_OS_VERSIONS, {
  //   isCreatable: true,
  //   isEditable:  true,
  //   isRemovable: true,
  //   customRoute: createElementalRoute('resource', { resource: ELEMENTAL_SCHEMA_IDS.MANAGED_OS_VERSIONS })
  // });

  // weightType(ELEMENTAL_SCHEMA_IDS.MANAGED_OS_VERSION_CHANNELS, 5, true);
  // configureType(ELEMENTAL_SCHEMA_IDS.MANAGED_OS_VERSION_CHANNELS, {
  //   isCreatable: true,
  //   isEditable:  true,
  //   isRemovable: true,
  //   customRoute: createElementalRoute('resource', { resource: ELEMENTAL_SCHEMA_IDS.MANAGED_OS_VERSION_CHANNELS })
  // });

  basicType([
    ELEMENTAL_TYPES.DASHBOARD,
    ELEMENTAL_TYPES.OPERATIONS,
    ELEMENTAL_SCHEMA_IDS.MANAGED_OS_IMAGES,
    ELEMENTAL_SCHEMA_IDS.MACHINE_REGISTRATIONS,
    ELEMENTAL_SCHEMA_IDS.MACHINE_INVENTORIES,
    // ELEMENTAL_SCHEMA_IDS.MANAGED_OS_VERSIONS,
    // ELEMENTAL_SCHEMA_IDS.MANAGED_OS_VERSION_CHANNELS,
  ]);
}
