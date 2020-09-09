import { DSL } from '@/store/type-map';
import { MONITORING } from '@/config/types';

export const NAME = 'monitoring';
export const CHART_NAME = 'rancher-monitoring';

export function init(store) {
  const {
    product,
    basicType,
    mapGroup,
    virtualType
  } = DSL(store, NAME);
  const {
    ALERTMANAGER, PROMETHEUSE, SERVICEMONITOR, PODMONITOR, PROMETHEUSRULE
  } = MONITORING;

  product({
    ifHaveGroup: /^(.*\.)?monitoring\.coreos\.com$/,
    // icon:        'prometheus',
  });

  mapGroup(/^(.*\.)?monitoring\.coreos\.com$/, 'Monitoring');

  virtualType({
    label:       'Overview',
    namespaced:  false,
    name:       'monitoring-overview',
    route:      { name: 'c-cluster-monitoring' },
  });

  basicType(['monitoring-overview']);

  basicType([
    ALERTMANAGER, // remove
    PROMETHEUSE, // remove
    SERVICEMONITOR,
    PODMONITOR,
    PROMETHEUSRULE,
  ]);
}
