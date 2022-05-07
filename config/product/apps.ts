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
import { SideNavProductConfig, HeaderDetails } from './configTypeDefs';

export const NAME = 'apps';

const repoType: HeaderDetails = {
  name:     'type',
  labelKey: 'tableHeaders.type',
  sort:     'typeDisplay',
  value:    'typeDisplay'
};

const repoUrl: HeaderDetails = {
  name:     'url',
  labelKey: 'tableHeaders.url',
  sort:     'urlDisplay',
  value:    'urlDisplay'
};

const repoBranch: HeaderDetails = {
  name:        'branch',
  labelKey:    'tableHeaders.branch',
  sort:        'spec.gitBranch',
  value:       'spec.gitBranch',
  dashIfEmpty: true,
};

export const config: SideNavProductConfig = {
  product: {
    removable:           false,
    weight:              97,
    ifHaveGroup:         'catalog.cattle.io',
    icon:                'marketplace',
    showNamespaceFilter: true
  },
  virtualTypes: {
    charts: {
      label:       'Charts',
      icon:       'compass',
      namespaced:  false,
      name:        'charts',
      weight:      100,
      route:       { name: 'c-cluster-apps-charts' },
    }
  },
  weights: {
    // weightType(                Set the weight (sorting) order of one or more types
    //   typeOrArrayOfTypes,
    //   weight,                  -- Higher numbers are shown first/higher up on the nav tree
    //   forBasic                 -- Apply to basic type instead of regular type tree
    // )
    [CATALOG.APP]: 99
  },
  basicTypes: [
    'charts',
    CATALOG.APP,
    CATALOG.OPERATION,
    CATALOG.CLUSTER_REPO,
    CATALOG.REPO,
  ],
  typeConfigurations: {
    [CATALOG.APP]:       { isCreatable: false, isEditable: false },
    [CATALOG.OPERATION]: { isCreatable: false, isEditable: false }
  },
  headers: {
    [CATALOG.APP]:          [STATE, NAME_COL, NAMESPACE, CHART, CHART_UPGRADE, APP_SUMMARY, AGE],
    [CATALOG.REPO]:         [STATE, NAME_COL, NAMESPACE, repoType, repoUrl, repoBranch, AGE],
    [CATALOG.CLUSTER_REPO]: [STATE, NAME_COL, repoType, repoUrl, repoBranch, AGE],
    [CATALOG.OPERATION]:    [
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
        label:    'Tgt Namespace',
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
    ]
  }
};
console.log({ config });
// {
//   name:      'cpu',
//   labelKey:  'tableHeaders.cpu',
//   sort:      'cpu',
//   value:     'cpuUsagePercentage',
//   formatter: 'PercentageBar'
// }
