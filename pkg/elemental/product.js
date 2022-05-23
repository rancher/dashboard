import { ELEMENTAL_PRODUCT_NAME, ELEMENTAL_PRODUCT_GROUP, ELEMENTAL_TYPES } from './types';
import { createElementalRoute, rootElementalRoute } from './utils/custom-routing';

export function init($plugin, store) {
  const { product, virtualType, basicType } = $plugin.DSL(store, $plugin.name);

  // app in sidebar
  product({
    ifHaveGroup:         ELEMENTAL_PRODUCT_GROUP,
    icon:                'gear',
    inStore:             'management',
    removable:           false,
    showClusterSwitcher: false,
    to:                  rootElementalRoute()
  });

  virtualType({
    label:        store.getters['i18n/t']('elemental.menuLabels.dashboard'),
    icon:         'folder',
    group:        'Root',
    namespaced:   false,
    name:         ELEMENTAL_TYPES.DASHBOARD,
    weight:       3,
    route:        rootElementalRoute()
  });

  virtualType({
    label:        store.getters['i18n/t']('elemental.menuLabels.operations'),
    icon:         'folder',
    group:        'Root',
    namespaced:   false,
    name:         ELEMENTAL_TYPES.OPERATIONS,
    weight:       2,
    route:        createElementalRoute(ELEMENTAL_TYPES.OPERATIONS, { product: ELEMENTAL_PRODUCT_NAME })
  });

  virtualType({
    label:        store.getters['i18n/t']('elemental.menuLabels.machineInventories'),
    icon:         'folder',
    group:        'Root',
    namespaced:   false,
    name:         ELEMENTAL_TYPES.MACHINE_INVENTORIES,
    weight:       1,
    route:        createElementalRoute(ELEMENTAL_TYPES.MACHINE_INVENTORIES, { product: ELEMENTAL_PRODUCT_NAME })
  });

  basicType([
    ELEMENTAL_TYPES.DASHBOARD,
    ELEMENTAL_TYPES.OPERATIONS,
    ELEMENTAL_TYPES.MACHINE_INVENTORIES,
  ]);
}
