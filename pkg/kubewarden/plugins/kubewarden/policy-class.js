import filter from 'lodash/filter';
import flatMap from 'lodash/flatMap';
import matches from 'lodash/matches';

import SteveModel from '@shell/plugins/steve/steve-class';
import { KUBEWARDEN } from '../../types';
import { SERVICE } from '@shell/config/types';
import { proxyUrlFromParts } from '@shell/models/service';
import { findBy, isArray } from '@shell/utils/array';
import { isEmpty } from '@shell/utils/object';

export const TRACE_HEADERS = [
  {
    name:  'operation',
    value: 'operation',
    label: 'Operation',
    sort:  'operation'
  },
  {
    name:  'mode',
    value: 'mode',
    label: 'Mode',
    sort:  'mode'
  },
  {
    name:  'kind',
    value: 'kind',
    label: 'Kind',
    sort:  'kind'
  },
  {
    name:  'name',
    value: 'name',
    label: 'Name',
    sort:  'name'
  },
  {
    name:  'namespace',
    value: 'namespace',
    label: 'Namespace',
    sort:  'namespace'
  },
  {
    name:  'startTime',
    value: 'startTime',
    label: 'Start Time',
    sort:  'startTime:desc'
  },
  {
    name:  'duration',
    value: 'duration',
    label: 'Duration (ms)',
    sort:  'duration'
  }
];

export const CATEGORY_MAP = [
  {
    label: 'All',
    value: ''
  },
  {
    label: '*',
    value: 'Global'
  },
  {
    label: 'Ingress',
    value: 'Ingress'
  },
  {
    label: 'Pod',
    value: 'Pod'
  },
  {
    label: 'Service',
    value: 'Service'
  }
];

export const MODE_MAP = {
  monitor: 'bg-success',
  protect: 'bg-warning'
};

export const OPERATION_MAP = {
  CREATE: 'bg-info',
  UPDATE: 'bg-warning',
  DELETE: 'bg-error'
};

export const RESOURCE_MAP = {
  pod:     'var(--info)',
  ingress: 'var(--success)',
  global:  'var(--warning)',
  service: 'var(--error)'
};

export const RANCHER_NAMESPACES = [
  'calico-system',
  'cattle-alerting',
  'cattle-fleet-local-system',
  'cattle-fleet-system',
  'cattle-global-data',
  'cattle-global-nt',
  'cattle-impersonation-system',
  'cattle-istio',
  'cattle-logging',
  'cattle-pipeline',
  'cattle-prometheus',
  'cattle-system',
  'cert-manager',
  'ingress-nginx',
  'kube-node-lease',
  'kube-public',
  'kube-system',
  'rancher-operator-system',
  'security-scan',
  'tigera-operator'
];

export const NAMESPACE_SELECTOR = {
  key:      'kubernetes.io/metadata.name',
  operator: 'NotIn',
  values:   RANCHER_NAMESPACES
};

export default class KubewardenModel extends SteveModel {
  async allServices() {
    const inStore = this.$rootGetters['currentProduct'].inStore;

    return await this.$dispatch(`${ inStore }/findAll`, { type: SERVICE }, { root: true });
  }

  get detailPageHeaderBadgeOverride() {
    return this.status?.policyStatus;
  }

  get componentForBadge() {
    if ( this.detailPageHeaderBadgeOverride ) {
      return require(`../../components/formatter/PolicyStatus.vue`).default;
    }

    return null;
  }

  get link() {
    if ( this.spec?.toURL ) {
      return this.spec.toURL;
    } else if ( this.spec?.toService ) {
      const s = this.spec.toService;

      return proxyUrlFromParts(this.$rootGetters['clusterId'], s.namespace, s.name, s.scheme, s.port, s.path);
    } else {
      return null;
    }
  }

  get grafanaProxy() {
    return async() => {
      try {
        const services = await this.allServices();

        if ( services ) {
          const grafana = findBy(services, 'id', 'cattle-monitoring-system/rancher-monitoring-grafana');

          if ( grafana ) {
            // The uid in the proxy `r3Pw-107z` is setup in the configmap for the kubewarden dashboard
            // It's the generic uid from the json here: https://grafana.com/grafana/dashboards/15314
            return `${ grafana.proxyUrl('http', 80) }d/r3Pw-1O7z/kubewarden?orgId=1`;
          }
        }
      } catch (e) {
        console.error(`Error fetching metrics service: ${ e }`); // eslint-disable-line no-console
      }

      return null;
    };
  }

  get jaegerService() {
    return async() => {
      try {
        const services = await this.allServices();

        if ( services ) {
          return services.find((s) => {
            const found = s.metadata?.labels?.['app'] === 'jaeger' && s.metadata?.labels?.['app.kubernetes.io/component'] === 'service-query';

            if ( found ) {
              return s;
            }
          });
        }
      } catch (e) {
        console.error(`Error fetching services: ${ e }`); // eslint-disable-line no-console
      }

      return null;
    };
  }

  get jaegerProxy() {
    return async() => {
      try {
        const service = await this.jaegerService();

        const traceTypes = ['monitor', 'protect'];

        const promises = traceTypes.map((t) => {
          let traceTags; let proxyPath = null;
          const name = this.jaegerPolicyName;

          switch (t) {
          case 'monitor':
            traceTags = `"policy_id"%3A"${ name }"`;
            proxyPath = `api/traces?service=kubewarden-policy-server&operation=policy_eval&tags={${ traceTags }}`;

            break;
          case 'protect':
            traceTags = `"allowed"%3A"false"%2C"policy_id"%3A"${ name }"`;
            proxyPath = `api/traces?service=kubewarden-policy-server&operation=validation&tags={${ traceTags }}`;

            break;
          default:
            break;
          }

          const JAEGER_PATH = `${ service.proxyUrl('http', 16686) + proxyPath }`;

          return this.$dispatch('request', { url: JAEGER_PATH });
        });

        let out = await Promise.all(promises);

        if ( out.length > 1 ) {
          out = flatMap(out);
        }

        return out;
      } catch (e) {
        console.error(`Error fetching Jaeger service: ${ e }`); // eslint-disable-line no-console
      }

      return null;
    };
  }

  get jaegerPolicyName() {
    let out = null;

    switch (this.kind) {
    case 'ClusterAdmissionPolicy':
      out = `clusterwide-${ this.metadata?.name }`;
      break;

    case 'AdmissionPolicy':
      out = `namespaced-${ this.metadata?.namespace }-${ this.metadata?.name }`;
      break;

    default:
      break;
    }

    return out;
  }

  // Determines if a policy is targeting rancher specific namespaces (which happens by default)
  get namespaceSelector() {
    const out = filter(this.spec?.namespaceSelector?.matchExpressions, matches(NAMESPACE_SELECTOR));

    if ( !isEmpty(out) ) {
      return true;
    }

    return false;
  }

  get policyTypes() {
    const out = Object.values(KUBEWARDEN.SPOOFED);

    return out;
  }

  get policyQuestions() {
    return async() => {
      const module = this.spec.module;

      const found = this.policyTypes.find((t) => {
        if ( module.includes( t.replace(`${ KUBEWARDEN.SPOOFED.POLICIES }.`, '') ) ) {
          return t;
        }
      });

      // Spoofing the questions object from hard-typed questions json for each policy
      if ( found ) {
        const short = found.replace(`${ KUBEWARDEN.SPOOFED.POLICIES }.`, '');
        const json = (await import(/* webpackChunkName: "policy-questions" */`../../questions/policy-questions/${ short }.json`)).default;

        return json;
      }

      return null;
    };
  }

  traceTableRows(traces) {
    const traceArray = [];

    // If a policy is in monitor mode it will pass multiple trace objects
    if ( isArray(traces) ) {
      traces?.map(t => traceArray.push(t.data));
    } else {
      Object.assign(traceArray, traces.data);
    }

    const out = traceArray.flatMap(trace => trace.map((t) => {
      const eSpan = t.spans?.find(s => s.operationName === 'policy_eval'); // span needed for Monitor mode
      const vSpan = t.spans?.find(s => s.operationName === 'validation'); // main validation span

      if ( vSpan ) {
        const date = new Date(vSpan.startTime / 1000);
        const duration = vSpan.duration / 1000;

        vSpan.startTime = date.toUTCString();
        vSpan.duration = duration.toFixed(2);

        const vKeys = ['kind', 'mutated', 'name', 'namespace', 'operation', 'policy_id', 'response_message', 'response_code'];
        const logs = {};
        let mode = 'protect'; // defaults to Protect mode for "Mode" trace header

        // 'policy_eval' logs will only exist when a policy is in monitor mode
        if ( eSpan.logs.length > 0 ) {
          mode = 'monitor';

          const fields = eSpan.logs.flatMap(log => log.fields);

          fields.map((f) => {
            if ( f.key === 'response' ) {
              Object.assign(logs, { [f.key]: f.value });
            }
          });
        }

        const tags = vKeys.map(vKey => vSpan.tags.find(tag => tag.key === vKey));

        return tags?.reduce((tag, item) => ({
          ...vSpan, ...tag, [item?.key]: item?.value, mode, logs
        }), {});
      }

      return null;
    }));

    return out;
  }
}

export function colorForStatus(status) {
  switch ( status ) {
  case 'unschedulable':
    return 'text-error';
  case 'pending':
    return 'text-info';
  case 'active':
    return 'text-success';
  default:
    break;
  }

  return 'text-warning'; // 'unscheduled' is the default state
}

export function stateSort(color, display) {
  const SORT_ORDER = {
    error:    1,
    warning:  2,
    info:     3,
    success:  4,
    ready:    5,
    notready: 6,
    other:    7,
  };

  color = color.replace(/^(text|bg)-/, '');

  return `${ SORT_ORDER[color] || SORT_ORDER['other'] } ${ display }`;
}
