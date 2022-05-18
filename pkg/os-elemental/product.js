import { ELEMENTAL_PRODUCT_NAME, ELEMENTAL_TYPES } from './types';
import { createElementalRoute, rootElementalRoute } from './utils/custom-routing';

export function init($plugin, store) {
  const {
    product, virtualType, basicType, spoofedType, configureType
  } = $plugin.DSL(store, $plugin.name);

  // app in sidebar
  product({
    icon:                  'gear',
    inStore:               'management',
    removable:             false,
    showClusterSwitcher:   false,
    to:                  rootElementalRoute()
  });

  virtualType({
    // label:        store.getters['i18n/t']('fleet.dashboard.menuLabel'),
    label:        ELEMENTAL_TYPES.OPERATIONS,
    icon:         'folder',
    group:        'Root',
    namespaced:   false,
    name:         ELEMENTAL_TYPES.OPERATIONS,
    weight:       2,
    route:        createElementalRoute('area', { product: ELEMENTAL_PRODUCT_NAME, area: ELEMENTAL_TYPES.OPERATIONS })
  });

  virtualType({
    // label:        store.getters['i18n/t']('fleet.dashboard.menuLabel'),
    label:        ELEMENTAL_TYPES.MACHINE_INVENTORIES,
    icon:         'folder',
    group:        'Root',
    namespaced:   false,
    name:         ELEMENTAL_TYPES.MACHINE_INVENTORIES,
    weight:       1,
    route:        createElementalRoute('area', { product: ELEMENTAL_PRODUCT_NAME, area: ELEMENTAL_TYPES.MACHINE_INVENTORIES })
  });

  basicType([
    ELEMENTAL_TYPES.DASHBOARD,
    ELEMENTAL_TYPES.OPERATIONS,
    ELEMENTAL_TYPES.MACHINE_INVENTORIES,
  ]);
}
