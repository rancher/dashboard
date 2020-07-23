import { DSL } from '@/store/type-map';
import { CATALOG } from '@/config/types';
import {
  STATE, NAMESPACE_NAME, CHART, RESOURCES, URL, AGE
} from '@/config/table-headers';

export const NAME = 'apps';

export function init(store) {
  const {
    product,
    basicType,
    headers,
    formOnlyType
  } = DSL(store, NAME);

  product({
    removable:   false,
    ifHaveGroup: 'catalog.cattle.io',
    weight:      1000,
  });

  basicType([
    CATALOG.REPO,
    CATALOG.CLUSTER_REPO,
    CATALOG.RELEASE,
    CATALOG.OPERATION,
  ]);

  formOnlyType(CATALOG.RELEASE);

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
