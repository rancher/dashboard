import { DSL } from '@/store/type-map';

export const NAME = 'clusterManagement';

export function init(store) {
  const {
    product,
    basicType,
    virtualType,
  } = DSL(store, NAME);

  product({
    inStore:             'management',
    icon:                'globe',
    weight:              -10,
    removable:           false,
    showClusterSwitcher: false,
  });

  virtualType({
    label:          'Clusters',
    name:           'cluster-mgmt',
    group:          'Root',
    namespaced:     false,
    weight:         99,
    icon:           'folder',
    route:          { name: 'clusterMgmt-clusters' },
    exact:          true
  });

  virtualType({
    label:          'RKE Templates',
    name:           'rke-templates',
    group:          'Root',
    namespaced:     false,
    weight:         99,
    icon:           'folder',
    route:          { name: 'clusterMgmt-rkeTemplates' },
    exact:          true
  });

  basicType([
    'cluster-mgmt',
    'rke-templates',
  ]);
}
