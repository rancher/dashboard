import { AGE, NAME as NAME_COL, STATE } from '@shell/config/table-headers';
import {
  CAPI,
  CATALOG,
  NORMAN,
  HCI,
  MANAGEMENT,
  SNAPSHOT,
  VIRTUAL_TYPES
} from '@shell/config/types';
import { MULTI_CLUSTER, RKE1_UI } from '@shell/store/features';
import { DSL } from '@shell/store/type-map';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';

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
    weight:              -1, // Place at the top
    to:                  {
      name:   'c-cluster-product-resource',
      params: {
        cluster:  BLANK_CLUSTER,
        product:  NAME,
        resource: CAPI.RANCHER_CLUSTER
      }
    },
    typeStoreMap: {
      [NORMAN.CLOUD_CREDENTIAL]:          'rancher',
      cloudCredential:                    'rancher',
      [NORMAN.KONTAINER_DRIVER]:          'rancher',
      [NORMAN.NODE_DRIVER]:               'rancher',
      [VIRTUAL_TYPES.JWT_AUTHENTICATION]: 'management',
    }
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

  basicType([
    CAPI.RANCHER_CLUSTER,
    'cloud-credentials',
    'drivers',
  ]);

  configureType(SNAPSHOT, { depaginate: true });
  configureType(NORMAN.ETCD_BACKUP, { depaginate: true });

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
    labelKey:   'drivers.kontainer.title',
    name:       'rke-kontainer-drivers',
    group:      'Root',
    namespaced: false,
    icon:       'globe',
    route:      { name: 'c-cluster-manager-driver-kontainerdriver' },
    exact:      true
  });
  virtualType({
    labelKey:   'drivers.node.title',
    name:       'rke-node-drivers',
    group:      'Root',
    namespaced: false,
    icon:       'globe',
    route:      { name: 'c-cluster-manager-driver-nodedriver' },
    exact:      true
  });

  virtualType({
    ifFeature:  RKE1_UI,
    labelKey:   'manager.rkeTemplates.label',
    name:       'rke-templates',
    group:      'Root',
    namespaced: false,
    icon:       'globe',
    route:      { name: 'c-cluster-manager-pages-page', params: { cluster: 'local', page: 'rke-templates' } },
    exact:      true
  });

  virtualType({
    ifFeature:  RKE1_UI,
    labelKey:   'manager.nodeTemplates.label',
    name:       'rke-node-templates',
    group:      'Root',
    namespaced: false,
    icon:       'globe',
    route:      { name: 'c-cluster-manager-pages-page', params: { cluster: 'local', page: 'node-templates' } },
    exact:      true
  });

  virtualType({
    ifHaveType: MANAGEMENT.CLUSTER_PROXY_CONFIG,
    labelKey:   'manager.jwtAuthentication.label',
    name:       VIRTUAL_TYPES.JWT_AUTHENTICATION,
    group:      'Root',
    namespaced: false,
    icon:       'globe',
    route:      { name: 'c-cluster-manager-jwt-authentication' },
    exact:      true
  });

  basicType([
    'rke-kontainer-drivers',
    'rke-node-drivers',
  ], 'drivers');

  basicType([
    'rke-templates',
    'rke-node-templates'
  ], 'RKE1Configuration');

  weightType(CAPI.MACHINE_DEPLOYMENT, 4, true);
  weightType(CAPI.MACHINE_SET, 3, true);
  weightType(CAPI.MACHINE, 2, true);
  weightType(CATALOG.CLUSTER_REPO, 1, true);
  weightType(MANAGEMENT.PSA, 5, true);
  weightType(VIRTUAL_TYPES.JWT_AUTHENTICATION, 0, true);

  basicType([
    CAPI.MACHINE_DEPLOYMENT,
    CAPI.MACHINE_SET,
    CAPI.MACHINE,
    CATALOG.CLUSTER_REPO,
    MANAGEMENT.PSA,
    VIRTUAL_TYPES.JWT_AUTHENTICATION
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
      subLabel: 'Architecture',
      value:    'kubernetesVersion',
      sort:     'kubernetesVersion',
      search:   'kubernetesVersion',
    },
    {
      name:      'provider',
      labelKey:  'tableHeaders.provider',
      subLabel:  'Distro',
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
