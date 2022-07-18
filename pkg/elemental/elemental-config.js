import { ELEMENTAL_PRODUCT_GROUP, ELEMENTAL_TYPES } from './types';
import { ELEMENTAL_SCHEMA_IDS } from '@shell/config/elemental-types';
import { createElementalRoute, rootElementalRoute } from './utils/custom-routing';
import { STATE, NAME as NAME_COL, AGE, NAMESPACE as NAMESPACE_COL } from '@shell/config/table-headers';

export function init($plugin, store) {
  const {
    product, virtualType, basicType, configureType, weightType, headers
  } = $plugin.DSL(store, $plugin.name);

  // app in sidebar
  product({
    ifHaveGroup:         ELEMENTAL_PRODUCT_GROUP,
    icon:                'os-management',
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
    canYaml:     true,
    customRoute: createElementalRoute('resource', { resource: ELEMENTAL_SCHEMA_IDS.MACHINE_REGISTRATIONS })
  });

  weightType(ELEMENTAL_SCHEMA_IDS.MACHINE_INVENTORIES, 8, true);
  configureType(ELEMENTAL_SCHEMA_IDS.MACHINE_INVENTORIES, {
    isCreatable: true,
    isEditable:  true,
    isRemovable: true,
    canYaml:     true,
    customRoute: createElementalRoute('resource', { resource: ELEMENTAL_SCHEMA_IDS.MACHINE_INVENTORIES }),
    listGroups:  [
      {
        icon:       'icon-cluster',
        value:      'clusterName',
        field:      'groupByCluster',
        hideColumn: 'clusterName',
        tooltipKey: 'resourceTable.groupBy.cluster'
      }
    ]
  });

  headers(ELEMENTAL_SCHEMA_IDS.MACHINE_INVENTORIES, [
    STATE,
    NAME_COL,
    {
      name:          'Cluster',
      labelKey:      'tableHeaders.cluster',
      value:         'clusterName',
      getValue:      row => row.clusterName,
      sort:          ['clusterName']
    },
    NAMESPACE_COL,
    AGE
  ]);

  weightType(ELEMENTAL_SCHEMA_IDS.MANAGED_OS_IMAGES, 7, true);
  configureType(ELEMENTAL_SCHEMA_IDS.MANAGED_OS_IMAGES, {
    isCreatable: true,
    isEditable:  true,
    isRemovable: true,
    canYaml:     true,
    customRoute: createElementalRoute('resource', { resource: ELEMENTAL_SCHEMA_IDS.MANAGED_OS_IMAGES })
  });

  // advanced tab
  weightType(ELEMENTAL_SCHEMA_IDS.MACHINE_INV_SELECTOR, 10, true);
  configureType(ELEMENTAL_SCHEMA_IDS.MACHINE_INV_SELECTOR, {
    isCreatable: true,
    isEditable:  true,
    isRemovable: true,
    canYaml:     true,
    customRoute: createElementalRoute('resource', { resource: ELEMENTAL_SCHEMA_IDS.MACHINE_INV_SELECTOR })
  });

  weightType(ELEMENTAL_SCHEMA_IDS.MACHINE_INV_SELECTOR_TEMPLATES, 9, true);
  configureType(ELEMENTAL_SCHEMA_IDS.MACHINE_INV_SELECTOR_TEMPLATES, {
    isCreatable: true,
    isEditable:  true,
    isRemovable: true,
    canYaml:     true,
    customRoute: createElementalRoute('resource', { resource: ELEMENTAL_SCHEMA_IDS.MACHINE_INV_SELECTOR_TEMPLATES })
  });

  weightType(ELEMENTAL_SCHEMA_IDS.MANAGED_OS_VERSIONS, 8, true);
  configureType(ELEMENTAL_SCHEMA_IDS.MANAGED_OS_VERSIONS, {
    isCreatable: true,
    isEditable:  true,
    isRemovable: true,
    customRoute: createElementalRoute('resource', { resource: ELEMENTAL_SCHEMA_IDS.MANAGED_OS_VERSIONS })
  });

  weightType(ELEMENTAL_SCHEMA_IDS.MANAGED_OS_VERSION_CHANNELS, 7, true);
  configureType(ELEMENTAL_SCHEMA_IDS.MANAGED_OS_VERSION_CHANNELS, {
    isCreatable: true,
    isEditable:  true,
    isRemovable: true,
    customRoute: createElementalRoute('resource', { resource: ELEMENTAL_SCHEMA_IDS.MANAGED_OS_VERSION_CHANNELS })
  });

  basicType([
    ELEMENTAL_TYPES.DASHBOARD,
    ELEMENTAL_SCHEMA_IDS.MACHINE_REGISTRATIONS,
    ELEMENTAL_SCHEMA_IDS.MACHINE_INVENTORIES,
  ]);

  basicType([
    ELEMENTAL_SCHEMA_IDS.MANAGED_OS_IMAGES,
    ELEMENTAL_SCHEMA_IDS.MACHINE_INV_SELECTOR,
    ELEMENTAL_SCHEMA_IDS.MACHINE_INV_SELECTOR_TEMPLATES,
    ELEMENTAL_SCHEMA_IDS.MANAGED_OS_VERSIONS,
    ELEMENTAL_SCHEMA_IDS.MANAGED_OS_VERSION_CHANNELS,
  ], 'advanced');
}
