import { DSL } from '@/store/type-map';
import { MONITORING } from '@/config/types';
import { STATE, NAME as NAME_COL, AGE } from '@/config/table-headers';

export const NAME = 'monitoring';
export const CHART_NAME = 'rancher-monitoring';

export function init(store) {
  const {
    basicType,
    headers,
    mapType,
    product,
    virtualType,
    weightType,
  } = DSL(store, NAME);
  const {
    ALERTMANAGER,
    SERVICEMONITOR,
    PODMONITOR,
    PROMETHEUSRULE,
    PROMETHEUS
  } = MONITORING;

  product({
    ifHaveType: PODMONITOR, // possible RBAC issue here if mon turned on but user doesn't have view/read roles on pod monitors
    // icon:       'prometheus'
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

  basicType([
    SERVICEMONITOR,
    PODMONITOR,
    PROMETHEUSRULE,
    ALERTMANAGER,
    PROMETHEUS
  ]);

  mapType(SERVICEMONITOR, store.getters['i18n/t'](`typeLabel.${ SERVICEMONITOR }`, { count: 2 }));
  mapType(PODMONITOR, store.getters['i18n/t'](`typeLabel.${ PODMONITOR }`, { count: 2 }));
  mapType(PROMETHEUSRULE, store.getters['i18n/t'](`typeLabel.${ PROMETHEUSRULE }`, { count: 2 }));
  mapType(ALERTMANAGER, store.getters['i18n/t'](`typeLabel.${ ALERTMANAGER }`, { count: 2 }));

  weightType(SERVICEMONITOR, 104, true);
  weightType(PODMONITOR, 103, true);
  weightType(PROMETHEUSRULE, 102, true);

  headers(ALERTMANAGER, [
    STATE,
    NAME_COL,
    {
      name:     'version',
      labelKey: 'tableHeaders.version',
      sort:     'spec.version',
      value:    'spec.version'
    },
    {
      name:      'replicas',
      labelKey:  'tableHeaders.replicas',
      value:     'spec.replicas',
      sort:      'spec.replicas',
      formatter: 'Number',
    },
    AGE
  ]);

  headers(PROMETHEUS, [
    STATE,
    NAME_COL,
    {
      name:     'version',
      labelKey: 'tableHeaders.version',
      sort:     'spec.version',
      value:    'spec.version'
    },
    {
      name:      'replicas',
      labelKey:  'tableHeaders.replicas',
      value:     'spec.replicas',
      sort:      'spec.replicas',
      formatter: 'Number',
    },
    AGE
  ]);
}
