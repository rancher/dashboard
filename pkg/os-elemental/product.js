export function init($plugin, store) {
  const {
    product, virtualType, basicType, spoofedType, configureType
  } = $plugin.DSL(store, $plugin.name);

  const OS_ELEMENTAL = {
    DASHBOARD:           'Dashboard',
    OPERATIONS:          'Operations',
    MACHINE_INVENTORIES: 'Machine Inventories',
  };

  product({
    icon:                  'gear',
    inStore:               'management',
    removable:             false,
    showClusterSwitcher:   false,
    to:                  {
      name:    'os-elemental',
      params: { product: 'os-elemental' }
    }
  });

  virtualType({
    // label:        store.getters['i18n/t']('fleet.dashboard.menuLabel'),
    label:        OS_ELEMENTAL.DASHBOARD,
    icon:         'folder',
    group:        'Root',
    namespaced:   false,
    name:         OS_ELEMENTAL.DASHBOARD,
    weight:       3,
    customRoute:        {
      name:   $plugin.name,
      params: { product: $plugin.name }
    }
  });

  virtualType({
    // label:        store.getters['i18n/t']('fleet.dashboard.menuLabel'),
    label:        OS_ELEMENTAL.OPERATIONS,
    icon:         'folder',
    group:        'Root',
    namespaced:   false,
    name:         OS_ELEMENTAL.OPERATIONS,
    weight:       2,
    route:        {
      name:   'c-cluster-product',
      params: { product: $plugin.name, resource: 'operations' }
    }
  });

  virtualType({
    // label:        store.getters['i18n/t']('fleet.dashboard.menuLabel'),
    label:        OS_ELEMENTAL.MACHINE_INVENTORIES,
    icon:         'folder',
    group:        'Root',
    namespaced:   false,
    name:         OS_ELEMENTAL.MACHINE_INVENTORIES,
    weight:       1,
    route:        {
      name:   'c-cluster-product',
      params: { product: $plugin.name, resource: 'machines' }
    }
  });

  basicType([
    OS_ELEMENTAL.DASHBOARD,
    OS_ELEMENTAL.OPERATIONS,
    OS_ELEMENTAL.MACHINE_INVENTORIES,
  ]);

  // configureType(OS_ELEMENTAL.OPERATIONS, { isCreatable: false });
  // configureType(OS_ELEMENTAL.MACHINE_INVENTORIES, { showListMasthead: false });
}
