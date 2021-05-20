import { LEGACY } from '@/store/features';
import { DSL } from '@/store/type-map';

export const NAME = 'mcapps';

export function init(store) {
  const {
    product,
    basicType,
    virtualType,
  } = DSL(store, NAME);

  product({
    icon:                  'marketplace',
    category:              'legacy',
    inStore:               'management',
    ifFeature:             LEGACY,
    removable:             false,
    showClusterSwitcher:   false,
    showWorkspaceSwitcher: false,
  });

  virtualType({
    label:          'Apps',
    name:           'mc-apps',
    group:          'Root',
    namespaced:     false,
    weight:         111,
    icon:           'folder',
    route:          { name: 'c-cluster-mcapps-pages-page', params: { cluster: 'local', page: 'apps' } },
    exact:          true
  });

  virtualType({
    label:          'Catalogs',
    name:           'mc-catalogs',
    group:          'Root',
    namespaced:     false,
    weight:         111,
    icon:           'folder',
    route:          { name: 'c-cluster-mcapps-pages-page', params: { cluster: 'local', page: 'catalogs' } },
    exact:          true
  });

  basicType([
    'mc-apps',
    'mc-catalogs'
  ]);
}
