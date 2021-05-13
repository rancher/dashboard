import { MULTI_CLUSTER } from '@/store/features';
import { AGE, NAME as NAME_COL, STATE } from '@/config/table-headers';
import { CAPI } from '@/config/types';
import { DSL } from '@/store/type-map';

export const NAME = 'manager';

export function init(store) {
  const {
    product,
    basicType,
    headers,
    configureType,
    virtualType,
    weightType
  } = DSL(store, NAME);

  product({
    ifHaveType:          CAPI.RANCHER_CLUSTER,
    ifFeature:           MULTI_CLUSTER,
    inStore:             'management',
    icon:                'cluster-management',
    removable:           false,
    showClusterSwitcher: false,
  });

  configureType(CAPI.RANCHER_CLUSTER, { showListMasthead: false, namespaced: false });
  weightType(CAPI.RANCHER_CLUSTER, 100, true);

  virtualType({
    label:      'Drivers',
    name:       'drivers',
    group:      'Root',
    namespaced: false,
    icon:       'globe',
    route:      { name: 'c-cluster-manager-pages-page', params: { cluser: 'local', page: 'rke-drivers' } },
    exact:      true
  });

  virtualType({
    label:      'RKE Templates',
    name:       'rke-templates',
    group:      'Root',
    namespaced: false,
    icon:       'globe',
    route:      { name: 'c-cluster-manager-pages-page', params: { cluser: 'local', page: 'rke-templates' } },
    exact:      true
  });

  virtualType({
    label:      'Cloud Credentials',
    name:       'rke-cloud-credentials',
    group:      'Root',
    namespaced: false,
    icon:       'globe',
    route:      { name: 'c-cluster-manager-pages-page', params: { cluser: 'local', page: 'cloud-credentials' } },
    exact:      true
  });

  virtualType({
    label:      'Node Templates',
    name:       'rke-node-templates',
    group:      'Root',
    namespaced: false,
    icon:       'globe',
    route:      { name: 'c-cluster-manager-pages-page', params: { cluser: 'local', page: 'node-templates' } },
    exact:      true
  });

  basicType([
    'rke-templates',
    'rke-cloud-credentials',
    'rke-node-templates'
  ], 'RKE1 Configuration');

  weightType(CAPI.MACHINE_DEPLOYMENT, 3, true);
  weightType(CAPI.MACHINE_SET, 2, true);
  weightType(CAPI.MACHINE, 1, true);

  virtualType({
    label:       'Cloud Credentials',
    group:      'Root',
    namespaced:  false,
    icon:       'globe',
    name:        'secret',
    weight:      99,
    route:       { name: 'c-cluster-manager-secret' },
  });

  basicType([
    CAPI.RANCHER_CLUSTER,
    'secret',
    'drivers',
  ]);

  basicType([
    CAPI.MACHINE_DEPLOYMENT,
    CAPI.MACHINE_SET,
    CAPI.MACHINE,
  ], 'Advanced');

  const MACHINE_SUMMARY = {
    name:      'summary',
    labelKey:  'tableHeaders.machines',
    value:     'status',
    sort:      false,
    search:    false,
    formatter: 'MachineSummaryGraph',
    align:     'center',
    width:     100,
  };

  headers(CAPI.RANCHER_CLUSTER, [
    STATE,
    NAME_COL,
    {
      name:   'kubernetesVesion',
      label:  'Version',
      value:  'kubernetesVersion',
      sort:   'kubernetesVersion',
      search: 'kubernetesVersion',
    },
    {
      name:   'provider',
      label:  'Provider',
      value:  'nodeProvider',
      sort:   ['nodeProvider', 'provisioner'],
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

  headers('cluster.x-k8s.io.machinedeployment', [
    STATE,
    NAME_COL,
    MACHINE_SUMMARY,
    AGE
  ]);
}
