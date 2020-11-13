import {
  AGE,
  STATE,
  CHART,
  CHART_UPGRADE,
  NAMESPACE,
  NAME as NAME_COL,
  APP_SUMMARY,
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
    immutableType,
  } = DSL(store, NAME);

  product({
    removable:   false,
    weight:      2,
    ifHaveGroup: 'catalog.cattle.io',
    icon:        'marketplace',
  });

  virtualType({
    label:       'Charts',
    icon:       'compass',
    namespaced:  false,
    name:        'charts',
    weight:      100,
    route:       { name: 'c-cluster-apps-charts' },
  });

  weightType(CATALOG.APP, 99, true);

  basicType([
    'charts',
    CATALOG.APP,
    CATALOG.OPERATION,
    CATALOG.CLUSTER_REPO,
    CATALOG.REPO,
  ]);

  uncreatableType(CATALOG.APP);
  uncreatableType(CATALOG.OPERATION);
  immutableType(CATALOG.APP);
  immutableType(CATALOG.OPERATION);

  const repoType = {
    name:     'type',
    labelKey: 'tableHeaders.type',
    sort:     'typeDisplay',
    value:    'typeDisplay'
  };

  const repoUrl = {
    name:     'url',
    labelKey: 'tableHeaders.url',
    sort:     'urlDisplay',
    value:    'urlDisplay'
  };

  const repoBranch = {
    name:        'branch',
    labelKey:    'tableHeaders.branch',
    sort:        'spec.gitBranch',
    value:       'spec.gitBranch',
    dashIfEmpty: true,
  };

  headers(CATALOG.APP, [STATE, NAME_COL, NAMESPACE, CHART, CHART_UPGRADE, APP_SUMMARY, AGE]);
  headers(CATALOG.REPO, [STATE, NAME_COL, NAMESPACE, repoType, repoUrl, repoBranch, AGE]);
  headers(CATALOG.CLUSTER_REPO, [STATE, NAME_COL, repoType, repoUrl, repoBranch, AGE]);
  headers(CATALOG.OPERATION, [
    STATE,
    NAME_COL,
    NAMESPACE,
    {
      name:     'action',
      label:    'Action',
      sort:     'status.action',
      value:    'status.action',
      labelKey: 'catalog.operation.tableHeaders.action',
    },
    {
      name:     'releaseNamespace',
      label:    'Tgt Namepsace',
      sort:     'status.namespace',
      value:    'status.namespace',
      labelKey: 'catalog.operation.tableHeaders.releaseNamespace',
    },
    {
      name:     'releaseName',
      label:    'Tgt Release',
      sort:     'status.releaseName',
      value:    'status.releaseName',
      labelKey: 'catalog.operation.tableHeaders.releaseName',
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
