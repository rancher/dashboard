import { DSL } from '@/store/type-map';
import { MONITORING } from '@/config/types';

export const NAME = 'monitoring';
export const CHART_NAME = 'rancher-monitoring';

export function init(store) {
  const {
    product, basicType, virtualType, weightType
  } = DSL(store, NAME);
  const { SERVICEMONITOR, PODMONITOR, PROMETHEUSRULE } = MONITORING;

  product({
    ifHaveType: PODMONITOR,
    icon:        'prometheus'
  });

  virtualType({
    label:      'Overview',
    group:      'Root',
    namespaced: false,
    name:       'monitoring-overview',
    weight:     105,
    route:      { name: 'c-cluster-monitoring' },
    exact:      true
  });

  basicType('monitoring-overview');

  basicType([SERVICEMONITOR, PODMONITOR, PROMETHEUSRULE]);

  weightType(SERVICEMONITOR, 104, true);
  weightType(PODMONITOR, 103, true);
  weightType(PROMETHEUSRULE, 102, true);
}
