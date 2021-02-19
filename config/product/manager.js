import { DSL } from '@/store/type-map';
import { STATE, NAME as NAME_COL, AGE } from '@/config/table-headers';
import { CAPI, MANAGEMENT } from '@/config/types';

export const NAME = 'manager';

export function init(store) {
  const {
    product,
    basicType,
    headers,
    configureType,
  } = DSL(store, NAME);

  product({
    ifHaveType:          CAPI.CAPI_CLUSTER,
    inStore:             'management',
    icon:                'globe',
    weight:              -1,
    removable:           false,
    public:              false, // Hide from regular view during development
    showClusterSwitcher: false,
  });

  configureType(CAPI.RANCHER_CLUSTER, { showListMasthead: false });

  basicType([
    CAPI.RANCHER_CLUSTER,
  ]);

  basicType([
    CAPI.CAPI_CLUSTER,
    MANAGEMENT.CLUSTER,
    'cluster.x-k8s.io.machinedeployments',
    'cluster.x-k8s.io.machinehealthchecks',
    'cluster.x-k8s.io.machines',
    'cluster.x-k8s.io.machinesets',
    'cluster.x-k8s.io.clusterctl'
  ], 'Other things for debugging');

  basicType([
    /^rancher\.cattle\.io\..*configs?$/,
  ], 'Node Configs');

  headers(CAPI.RANCHER_CLUSTER, [
    STATE,
    NAME_COL,
    {
      name:   'kubernetesVesion',
      label:  'K8s Version',
      value:  'spec.kubernetesVersion',
      sort:   'spec.kubernetesVersion',
      search: 'spec.kubernetesVersion',
    },
    AGE,
  ]);
}
