import { DSL } from '@/store/type-map';

export const NAME = 'monitoring';
export const CHART_NAME = 'rancher-monitoring';

export function init(store) {
  const {
    product,
    basicType,
    mapGroup,
    virtualType
  } = DSL(store, NAME);

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
    'monitoring.coreos.com.servicemonitor',
    'monitoring.coreos.com.podmonitor',
    'monitoring.coreos.com.prometheusrule',
  ]);
}
