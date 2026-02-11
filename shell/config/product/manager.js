import { AGE, NAME as NAME_COL, STATE } from '@shell/config/table-headers';
import {
  CAPI,
  CATALOG,
  EXT,
  NORMAN,
  HCI,
  MANAGEMENT,
  SNAPSHOT,
  VIRTUAL_TYPES,
  HOSTED_PROVIDER
} from '@shell/config/types';
import { MULTI_CLUSTER } from '@shell/store/features';
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
    'providers',
  ]);

  configureType(SNAPSHOT, { depaginate: true });

  configureType(CAPI.RANCHER_CLUSTER, {
    showListMasthead: false, namespaced: false, alias: [HCI.CLUSTER]
  });
  weightType(CAPI.RANCHER_CLUSTER, 100, true);
  weightType('cloud-credentials', 99, true);
  weightType('providers', 98, true);
  weightType(CATALOG.CLUSTER_REPO, 97, true);
  virtualType({
    labelKey:   'providers.hosted.title',
    name:       HOSTED_PROVIDER,
    group:      'Root',
    weight:     1,
    namespaced: false,
    icon:       'globe',
    route:      { name: 'c-cluster-manager-hostedprovider' },
    exact:      true
  });

  virtualType({
    labelKey:   'drivers.kontainer.title',
    name:       'rke-kontainer-providers',
    group:      'Root',
    namespaced: false,
    icon:       'globe',
    route:      { name: 'c-cluster-manager-driver-kontainerdriver' },
    exact:      true
  });
  virtualType({
    labelKey:   'drivers.node.title',
    name:       'rke-node-providers',
    group:      'Root',
    namespaced: false,
    icon:       'globe',
    route:      { name: 'c-cluster-manager-driver-nodedriver' },
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
    HOSTED_PROVIDER,
    'rke-kontainer-providers',
    'rke-node-providers',
  ], 'providers');

  weightType(CAPI.MACHINE_DEPLOYMENT, 4, true);
  weightType(CAPI.MACHINE_SET, 3, true);
  weightType(CAPI.MACHINE, 2, true);
  configureType(EXT.KUBECONFIG, { canYaml: false });
  weightType(EXT.KUBECONFIG, 1, true);
  weightType(CATALOG.CLUSTER_REPO, 0, true);
  weightType(MANAGEMENT.PSA, 5, true);
  weightType(VIRTUAL_TYPES.JWT_AUTHENTICATION, -1, true);

  basicType([
    CAPI.MACHINE_DEPLOYMENT,
    CAPI.MACHINE_SET,
    CAPI.MACHINE,
    EXT.KUBECONFIG,
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

  headers(EXT.KUBECONFIG, [
    STATE,
    {
      name:      'clusters',
      labelKey:  'tableHeaders.clusters',
      value:     'spec.clusters',
      sort:      ['referencedClustersSortable'],
      search:    ['referencedClustersSortable'],
      formatter: 'KubeconfigClusters',
    },
    {
      name:          'ttl',
      labelKey:      'tableHeaders.ttl',
      value:         'expiresAt',
      formatter:     'LiveDate',
      formatterOpts: { isCountdown: true },
    },
    {
      ...AGE,
      defaultSort: true,
    },
  ]);
}
