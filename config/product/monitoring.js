import { DSL } from '@/store/type-map';
import { MONITORING, SECRET } from '@/config/types';
import { STATE, NAME as NAME_COL, AGE } from '@/config/table-headers';
import { base64Decode } from '@/utils/crypto';
import jsyaml from 'js-yaml';
import { FILENAME, getSecretId } from '@/models/monitoring.coreos.com.receiver';

export const NAME = 'monitoring';
export const CHART_NAME = 'rancher-monitoring';

export function init(store) {
  const {
    basicType,
    headers,
    mapType,
    product,
    spoofedType,
    virtualType,
    weightType,
  } = DSL(store, NAME);
  const {
    ALERTMANAGER,
    SERVICEMONITOR,
    PODMONITOR,
    PROMETHEUSRULE,
    PROMETHEUS,
    SPOOFED: {
      RECEIVER, RECEIVER_SPEC, RECEIVER_EMAIL, RECEIVER_SLACK, RECEIVER_WEBHOOK, RECEIVER_HTTP_CONFIG
    }
  } = MONITORING;

  async function getSecretFile() {
    const secretId = await getSecretId(store.dispatch);
    const fileName = FILENAME;
    const secret = await store.dispatch('cluster/find', {
      type: SECRET, id: secretId, opt: { force: true }
    });
    const file = secret?.data?.[fileName];
    const decodedFile = file ? base64Decode(file) : '{receivers: []}';

    return jsyaml.safeLoad(decodedFile);
  }

  async function getAllReceivers() {
    try {
      const file = await getSecretFile();
      const receivers = file.receivers || [];
      const receiversWithName = receivers.filter(receiver => receiver.name);
      const mapped = receiversWithName.map(receiver => store.dispatch('cluster/create', {
        id:    receiver.name,
        spec:  receiver,
        type:  'monitoring.coreos.com.receiver'
      }));

      return Promise.all(mapped);
    } catch (ex) {
      return [];
    }
  }

  product({
    ifHaveType: PODMONITOR, // possible RBAC issue here if mon turned on but user doesn't have view/read roles on pod monitors
    icon:       'monitoring'
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

  spoofedType(
    {
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
            name:            { type: 'string' },
            email_configs:   { type: `array[${ RECEIVER_EMAIL }]` },
            slack_configs:   { type: `array[${ RECEIVER_SLACK }]` },
            webhook_configs: { type: `array[${ RECEIVER_WEBHOOK }]` }
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
            api_url:       { type: 'string' },
            channel:       { type: 'string' },
            http_config:   { type: RECEIVER_HTTP_CONFIG },
            send_resolved: { type: 'boolean' }
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

      ],
      getInstances: getAllReceivers
    });

  basicType([
    'monitoring-overview',
    RECEIVER,
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
  mapType(RECEIVER, store.getters['i18n/t'](`typeLabel.${ RECEIVER }`, { count: 2 }));

  weightType(SERVICEMONITOR, 104, true);
  weightType(PODMONITOR, 103, true);
  weightType(PROMETHEUSRULE, 102, true);

  headers(RECEIVER, [
    NAME_COL,
    {
      name:      'receiver-types',
      label:     'Configured Receivers',
      value:     'receiverTypes',
      sort:      'receiverTypes',
      formatter: 'List',
      width:     '85%'
    }
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
