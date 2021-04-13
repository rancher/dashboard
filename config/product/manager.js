import { DSL } from '@/store/type-map';
import { STATE, NAME as NAME_COL, AGE } from '@/config/table-headers';
import { CAPI, MANAGEMENT } from '@/config/types';

export const NAME = 'manager';
export const CHART_NAME = 'cluster-api';

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
    removable:           false,
    public:              false, // Hide from regular view during development
    showClusterSwitcher: false,
  });

  configureType(CAPI.RANCHER_CLUSTER, { showListMasthead: false });

  basicType([
    CAPI.RANCHER_CLUSTER,
    CAPI.CAPI_CLUSTER,
    MANAGEMENT.CLUSTER,
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
      label:  'K8s Version',
      value:  'spec.kubernetesVersion',
      sort:   'spec.kubernetesVersion',
      search: 'spec.kubernetesVersion',
    },
    MACHINE_SUMMARY,
    AGE,
  ]);

  headers('cluster.x-k8s.io.machinedeployment', [
    STATE,
    NAME_COL,
    MACHINE_SUMMARY,
    AGE
  ]);
}
