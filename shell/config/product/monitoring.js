import { DSL, IF_HAVE } from '@shell/store/type-map';
import { MONITORING } from '@shell/config/types';
import {
  STATE, NAME as NAME_COL, AGE, RECEIVER_PROVIDERS, CONFIGURED_RECEIVER
} from '@shell/config/table-headers';
import { getAllReceivers, getAllRoutes } from '@shell/utils/alertmanagerconfig';

export const NAME = 'monitoring';
export const CHART_NAME = 'rancher-monitoring';

export function init(store) {
  const {
    product,
    basicType,
    headers,
    mapType,
    spoofedType,
    virtualType,
    weightType,
    configureType,
  } = DSL(store, NAME);
  const {
    ALERTMANAGER,
    SERVICEMONITOR,
    PODMONITOR,
    PROMETHEUSRULE,
    PROMETHEUS,
    SPOOFED: {
      RECEIVER, RECEIVER_SPEC, RECEIVER_EMAIL, RECEIVER_SLACK, RECEIVER_WEBHOOK, RECEIVER_PAGERDUTY, RECEIVER_OPSGENIE, RECEIVER_HTTP_CONFIG, RESPONDER,
      ROUTE, ROUTE_SPEC
    }
  } = MONITORING;

  product({
    ifHave:              IF_HAVE.V2_MONITORING, // possible RBAC issue here if mon turned on but user doesn't have view/read roles on pod monitors
    icon:                'monitoring',
    showNamespaceFilter: true,
    weight:              90,
  });

  virtualType({
    label:      'Monitoring',
    namespaced: false,
    name:       'monitoring-overview',
    weight:     105,
    route:      { name: 'c-cluster-monitoring' },
    exact:      true,
    overview:   true,
  });

  spoofedType({
    label:      'Receivers',
    type:       RECEIVER,
    schemas:     [
      {
        id:                RECEIVER,
        type:              'schema',
        collectionMethods: ['POST'],
        resourceFields:    { spec: { type: RECEIVER_SPEC } }
      },
      {
        id:                RECEIVER_SPEC,
        type:              'schema',
        resourceFields:    {
          name:              { type: 'string' },
          email_configs:     { type: `array[${ RECEIVER_EMAIL }]` },
          slack_configs:     { type: `array[${ RECEIVER_SLACK }]` },
          pagerduty_configs: { type: `array[${ RECEIVER_PAGERDUTY }]` },
          opsgenie_configs:  { type: `array[${ RECEIVER_OPSGENIE }]` },
          webhook_configs:   { type: `array[${ RECEIVER_WEBHOOK }]` }
        }
      },
      {
        id:               RECEIVER_EMAIL,
        type:            'schema',
        resourceFields:  {
          to:            { type: 'string' },
          send_resolved: { type: 'boolean' },
          from:          { type: 'string' },
          smarthost:     { type: 'string' },
          require_tls:   { type: 'boolean' },
          auth_username: { type: 'string' },
          auth_password: { type: 'string' }
        }
      },
      {
        id:              RECEIVER_SLACK,
        type:            'schema',
        resourceFields:  {
          text:          { type: 'string' },
          api_url:       { type: 'string' },
          channel:       { type: 'string' },
          http_config:   { type: RECEIVER_HTTP_CONFIG },
          send_resolved: { type: 'boolean' }
        }
      },
      {
        id:              RECEIVER_PAGERDUTY,
        type:            'schema',
        resourceFields:  {
          routing_key:   { type: 'string' },
          service_key:   { type: 'string' },
          http_config:   { type: RECEIVER_HTTP_CONFIG },
          send_resolved: { type: 'boolean' }
        }
      },
      {
        id:              RECEIVER_OPSGENIE,
        type:            'schema',
        resourceFields:  {
          api_key:       { type: 'string' },
          http_config:   { type: RECEIVER_HTTP_CONFIG },
          send_resolved: { type: 'boolean' },
          responders:    { type: `array[${ RESPONDER }]` }
        }
      },
      {
        id:              RECEIVER_WEBHOOK,
        type:            'schema',
        resourceFields:  {
          url:           { type: 'string' },
          http_config:   { type: RECEIVER_HTTP_CONFIG },
          send_resolved: { type: 'boolean' }
        }
      },
      {
        id:             RECEIVER_HTTP_CONFIG,
        type:           'schema',
        resourceFields: { proxy_url: { type: 'string' } }
      },
      {
        id:             RESPONDER,
        type:           'schema',
        resourceFields: {
          type:     { type: 'string' },
          id:       { type: 'string' },
          name:     { type: 'string' },
          username: { type: 'string' },

        }
      }
    ],
    getInstances: () => getAllReceivers(store.dispatch)
  });

  spoofedType({
    label:      'Routes',
    type:       ROUTE,
    schemas:     [
      {
        id:                ROUTE,
        type:              'schema',
        collectionMethods: ['POST'],
        resourceFields:    { spec: { type: ROUTE_SPEC } }
      },
      {
        id:                ROUTE_SPEC,
        type:              'schema',
        resourceFields:    {
          receiver:        { type: 'string' },
          group_by:        { type: 'array[string]' },
          group_wait:      { type: 'string' },
          group_interval:  { type: 'string' },
          repeat_interval: { type: 'string' },
          match:           { type: 'map[string]' },
          match_re:        { type: 'map[string]' },
        }
      },
    ],
    getInstances: () => getAllRoutes(store.dispatch)
  });

  virtualType({
    label:         'Routes and Receivers',
    group:         'monitoring',
    name:     'route-receiver',
    icon:     'globe',
    route: { name: 'c-cluster-monitoring-route-receiver' }
  });

  virtualType({
    label:         'Monitors',
    group:         'monitoring',
    name:     'monitor',
    icon:     'globe',
    route: { name: 'c-cluster-monitoring-monitor' }
  });

  configureType('route-receiver', { showListMasthead: false });
  configureType('monitor', { showListMasthead: false });

  basicType([
    'monitoring-overview',
    'monitor',
    'route-receiver',
  ]);

  basicType([
    PROMETHEUSRULE,
    ALERTMANAGER,
    PROMETHEUS
  ], 'Advanced');

  mapType(SERVICEMONITOR, store.getters['i18n/t'](`typeLabel.${ SERVICEMONITOR }`, { count: 2 }));
  mapType(PODMONITOR, store.getters['i18n/t'](`typeLabel.${ PODMONITOR }`, { count: 2 }));
  mapType(PROMETHEUSRULE, store.getters['i18n/t'](`typeLabel.${ PROMETHEUSRULE }`, { count: 2 }));
  mapType(ALERTMANAGER, store.getters['i18n/t'](`typeLabel.${ ALERTMANAGER }`, { count: 2 }));
  mapType(RECEIVER, store.getters['i18n/t'](`typeLabel.${ RECEIVER }`, { count: 2 }));
  mapType(ROUTE, store.getters['i18n/t'](`typeLabel.${ ROUTE }`, { count: 2 }));

  weightType(SERVICEMONITOR, 104, true);
  weightType(PODMONITOR, 103, true);
  weightType(PROMETHEUSRULE, 102, true);

  headers(RECEIVER, [
    NAME_COL,
    RECEIVER_PROVIDERS
  ]);

  headers(ROUTE, [
    NAME_COL,
    CONFIGURED_RECEIVER
  ]);

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
