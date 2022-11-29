import { AGE, NAME as NAME_COL, STATE } from '@shell/config/table-headers';
import {
  CAPI,
  CATALOG,
  NORMAN,
  HCI
} from '@shell/config/types';
import { MULTI_CLUSTER } from '@shell/store/features';
import { DSL } from '@shell/store/type-map';
import { BLANK_CLUSTER } from '@shell/store';

export const NAME = 'manager';

export function init(store) {
  const {
    product,
    basicType,
    headers,
    configureType,
    virtualType,
    weightType,
    weightGroup
  } = DSL(store, NAME);

  product({
    ifHaveType:          CAPI.RANCHER_CLUSTER,
    ifFeature:           MULTI_CLUSTER,
    inStore:             'management',
    icon:                'cluster-management',
    removable:           false,
    showClusterSwitcher: false,
    to:                  {
      name:   'c-cluster-product-resource',
      params: {
        cluster:  BLANK_CLUSTER,
        product:  NAME,
        resource: CAPI.RANCHER_CLUSTER
      }
    },
  });

  virtualType({
    name:       'cloud-credentials',
    labelKey:   'manager.cloudCredentials.label',
    group:      'Root',
    namespaced: false,
    icon:       'globe',
    weight:     99,
    route:      { name: 'c-cluster-manager-cloudCredential' },
  });

  virtualType({
    labelKey:   'legacy.psps',
    name:       'pod-security-policies',
    group:      'Root',
    namespaced: false,
    weight:     0,
    icon:       'folder',
    route:      { name: 'c-cluster-manager-pages-page', params: { cluster: 'local', page: 'pod-security-policies' } },
    exact:      true
  });

  basicType([
    CAPI.RANCHER_CLUSTER,
    'cloud-credentials',
    'drivers',
    'pod-security-policies',
  ]);

  configureType(CAPI.RANCHER_CLUSTER, {
    showListMasthead: false, namespaced: false, alias: [HCI.CLUSTER]
  });
  // configureType(NORMAN.CLOUD_CREDENTIAL, { showListMasthead: false, namespaced: false });
  weightType(CAPI.RANCHER_CLUSTER, 100, true);
  weightType('cloud-credentials', 99, true);
  weightType('drivers', 98, true);
  weightType(CATALOG.CLUSTER_REPO, 97, true);

  configureType(NORMAN.CLOUD_CREDENTIAL, {
    showState: false, showAge: false, canYaml: false
  });

  virtualType({
    labelKey:   'manager.drivers.label',
    name:       'drivers',
    group:      'Root',
    namespaced: false,
    icon:       'globe',
    route:      { name: 'c-cluster-manager-pages-page', params: { cluster: 'local', page: 'rke-drivers' } },
    exact:      true
  });

  virtualType({
    labelKey:   'manager.rkeTemplates.label',
    name:       'rke-templates',
    group:      'Root',
    namespaced: false,
    icon:       'globe',
    route:      { name: 'c-cluster-manager-pages-page', params: { cluster: 'local', page: 'rke-templates' } },
    exact:      true
  });

  virtualType({
    labelKey:   'manager.nodeTemplates.label',
    name:       'rke-node-templates',
    group:      'Root',
    namespaced: false,
    icon:       'globe',
    route:      { name: 'c-cluster-manager-pages-page', params: { cluster: 'local', page: 'node-templates' } },
    exact:      true
  });

  basicType([
    'rke-templates',
    'rke-node-templates'
  ], 'RKE1Configuration');

  weightType(CAPI.MACHINE_DEPLOYMENT, 3, true);
  weightType(CAPI.MACHINE_SET, 2, true);
  weightType(CAPI.MACHINE, 1, true);
  weightType(CATALOG.CLUSTER_REPO, 0, true);

  basicType([
    CAPI.MACHINE_DEPLOYMENT,
    CAPI.MACHINE_SET,
    CAPI.MACHINE,
    CATALOG.CLUSTER_REPO,
  ], 'advanced');

  weightGroup('advanced', -1, true);

  const MACHINE_SUMMARY = {
    name:      'summary',
    labelKey:  'tableHeaders.machines',
    sort:      false,
    search:    false,
    formatter: 'MachineSummaryGraph',
    align:     'center',
    width:     100,
  };

  headers(CAPI.RANCHER_CLUSTER, [
    STATE,
    {
      name:          'name',
      labelKey:      'tableHeaders.name',
      value:         'nameDisplay',
      sort:          ['nameSort'],
      formatter:     'ClusterLink',
      canBeVariable: true,
    },
    {
      name:     'kubernetesVersion',
      labelKey: 'tableHeaders.version',
      value:    'kubernetesVersion',
      sort:     'kubernetesVersion',
      search:   'kubernetesVersion',
    },
    {
      name:      'provider',
      labelKey:  'tableHeaders.provider',
      value:     'machineProvider',
      sort:      ['machineProvider', 'provisioner'],
      formatter: 'ClusterProvider',
    },
    MACHINE_SUMMARY,
    AGE,
    {
      name:  'explorer',
      label: ' ',
      align: 'right',
      width: 65,
    },
  ]);

  headers(CAPI.MACHINE_DEPLOYMENT, [
    STATE,
    NAME_COL,
    MACHINE_SUMMARY,
    AGE
  ]);
}
