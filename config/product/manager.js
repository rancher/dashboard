import { MULTI_CLUSTER } from '@/config/feature-flags';
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
    icon:                'globe',
    removable:           false,
    showClusterSwitcher: false,
  });

  configureType(CAPI.RANCHER_CLUSTER, { showListMasthead: false, namespaced: false });
  weightType(CAPI.RANCHER_CLUSTER, 100, true);

  // TODO: RKE
  virtualType({
    label:          'RKE Templates',
    name:           'rke-templates',
    group:          'Root',
    namespaced:     false,
    weight:         111,
    icon:           'folder',
    route:          { name: 'manager-page', params: { page: 'rke-templates' } },
    exact:          true
  });

  virtualType({
    label:          'RKE Drivers',
    name:           'rke-drivers',
    group:          'Root',
    namespaced:     false,
    weight:         112,
    icon:           'folder',
    route:          { name: 'manager-page', params: { page: 'rke-drivers' } },
    exact:          true
  });

  virtualType({
    label:          'Global DNS Entries',
    name:           'global-dns-entries',
    group:          'Root',
    namespaced:     false,
    weight:         112,
    icon:           'folder',
    route:          { name: 'manager-page', params: { page: 'global-dns-entries' } },
    exact:          true
  });

  virtualType({
    label:          'Global DNS Providers',
    name:           'global-dns-providers',
    group:          'Root',
    namespaced:     false,
    weight:         112,
    icon:           'folder',
    route:          { name: 'manager-page', params: { page: 'global-dns-providers' } },
    exact:          true
  });

  virtualType({
    label:          'Cluster App Catalogs',
    name:           'catalogs',
    group:          'Root',
    namespaced:     false,
    weight:         112,
    icon:           'folder',
    route:          { name: 'manager-page', params: { page: 'catalogs' } },
    exact:          true
  });

  basicType([
    'rke-templates',
    'rke-drivers',
  ], 'RKE');

  basicType([
    'global-dns-entries',
    'global-dns-providers',
    'catalogs',
  ], 'Legacy Configuration');

  // TODO: RKE
  virtualType({
    label:          'RKE Templates',
    name:           'rke-templates',
    group:          'Root',
    namespaced:     false,
    weight:         111,
    icon:           'folder',
    route:          { name: 'c-cluster-manager-pages-page', params: { cluser: 'local', page: 'rke-templates' } },
    exact:          true
  });

  virtualType({
    label:          'RKE Drivers',
    name:           'rke-drivers',
    group:          'Root',
    namespaced:     false,
    weight:         112,
    icon:           'folder',
    route:          { name: 'c-cluster-manager-pages-page', params: { cluser: 'local', page: 'rke-drivers' } },
    exact:          true
  });

  virtualType({
    label:          'Global DNS Entries',
    name:           'global-dns-entries',
    group:          'Root',
    namespaced:     false,
    weight:         112,
    icon:           'folder',
    route:          { name: 'c-cluster-manager-pages-page', params: { cluser: 'local', page: 'global-dns-entries' } },
    exact:          true
  });

  virtualType({
    label:          'Global DNS Providers',
    name:           'global-dns-providers',
    group:          'Root',
    namespaced:     false,
    weight:         112,
    icon:           'folder',
    route:          { name: 'c-cluster-manager-pages-page', params: { cluser: 'local', page: 'global-dns-providers' } },
    exact:          true
  });

  virtualType({
    label:          'Cluster App Catalogs',
    name:           'catalogs',
    group:          'Root',
    namespaced:     false,
    weight:         112,
    icon:           'folder',
    route:          { name: 'c-cluster-manager-pages-page', params: { cluser: 'local', page: 'catalogs' } },
    exact:          true
  });

  basicType([
    'rke-templates',
    'rke-drivers',
  ], 'RKE Configuration');

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
