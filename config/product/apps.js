import {
  AGE,
  CHART,
  NAMESPACE_NAME,
  RESOURCES,
  STATE,
  URL
} from '@/config/table-headers';

import { CATALOG } from '@/config/types';
import { DSL } from '@/store/type-map';

export const NAME = 'apps';

export function init(store) {
  const {
    product,
    basicType,
    headers,
    virtualType,
    weightType,
    uncreatableType,
  } = DSL(store, NAME);

  product({
    removable:   false,
    ifHaveGroup: 'catalog.cattle.io',
    icon:        'marketplace',
    weight:      1000,
  });

  virtualType({
    label:       'Charts',
    icon:       'compass',
    group:      'Root',
    namespaced:  false,
    name:        'launch',
    weight:      100,
    route:       { name: 'c-cluster-apps' },
    exact:       true,
  });

  weightType(CATALOG.RELEASE, 200);

  basicType([
    'launch',
    CATALOG.RELEASE,
    CATALOG.OPERATION,
  ]);

  basicType([
    CATALOG.REPO,
    CATALOG.CLUSTER_REPO,
  ], 'Repostories');

  uncreatableType(CATALOG.RELEASE);
  uncreatableType(CATALOG.OPERATION);

  headers(CATALOG.RELEASE, [STATE, NAMESPACE_NAME, CHART, RESOURCES, AGE]);
  headers(CATALOG.REPO, [NAMESPACE_NAME, URL, AGE]);
  headers(CATALOG.CLUSTER_REPO, [NAMESPACE_NAME, URL, AGE]);
  headers(CATALOG.OPERATION, [
    STATE,
    NAMESPACE_NAME,
    {
      name:  'action',
      label: 'Action',
      sort:  'status.action',
      value: 'status.action',
    },
    {
      name:  'releaseNamespace',
      label: 'Tgt Namepsace',
      sort:  'status.namespace',
      value: 'status.namespace',
    },
    {
      name:  'releaseName',
      label: 'Tgt Release',
      sort:  'status.releaseName',
      value: 'status.releaseName',
    },
    AGE
  ]);
}

//   name:      'cpu',
//   labelKey:  'tableHeaders.cpu',
//   sort:      'cpu',
//   value:     'cpuUsagePercentage',
//   formatter: 'PercentageBar'
// };
