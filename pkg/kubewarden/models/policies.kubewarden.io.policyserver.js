import { POD } from '@shell/config/types';
import KubewardenModel from '../plugins/kubewarden/policy-class';
import { ADMISSION_POLICY_STATE } from '../config/kubewarden';
import { KUBEWARDEN } from '../types';

export const RELATED_HEADERS = [
  ADMISSION_POLICY_STATE,
  {
    name:   'name',
    value:  'metadata.name',
    label:  'Name',
    sort:   'name:desc'
  },
  {
    name:   'module',
    value:  'spec.module',
    label:  'Module',
    sort:   'module'
  },
  {
    name:   'mode',
    value:  'spec.mode',
    label:  'Mode',
    sort:   'mode'
  },
  {
    name:      'psCreated',
    label:     'Created',
    value:     'metadata.creationTimestamp',
    formatter: 'LiveDate'
  }
];

export const VALUES_STATE = {
  FORM: 'FORM',
  YAML: 'YAML',
};

export const YAML_OPTIONS = [
  {
    labelKey: 'catalog.install.section.chartOptions',
    value:    VALUES_STATE.FORM,
  },
  {
    labelKey: 'catalog.install.section.valuesYaml',
    value:    VALUES_STATE.YAML,
  }
];

export default class PolicyServer extends KubewardenModel {
  get _availableActions() {
    const out = super._availableActions;

    const logs = {
      action:  'openLogs',
      enabled: true,
      icon:    'icon icon-fw icon-chevron-right',
      label:   'View Logs',
    };

    out.unshift(logs);

    return out;
  }

  get allRelatedPolicies() {
    return async() => {
      const inStore = this.$rootGetters['currentProduct'].inStore;
      const types = [KUBEWARDEN.ADMISSION_POLICY, KUBEWARDEN.CLUSTER_ADMISSION_POLICY];
      const promises = types.map(type => this.$dispatch(`${ inStore }/findAll`, { type, opt: { force: true } }, { root: true }));

      try {
        const out = await Promise.all(promises);

        if ( out ) {
          return out.flatMap(o => o).filter(f => f.spec?.policyServer === this.metadata?.name);
        }
      } catch (e) {
        console.error(`Error fetching related policies: ${ e }`); // eslint-disable-line no-console
      }
    };
  }

  get jaegerProxies() {
    return async() => {
      const jaeger = await this.jaegerService();

      if ( jaeger ) {
        const policies = await this.allRelatedPolicies();
        const traceTypes = ['monitor', 'protect'];

        const promises = policies?.flatMap((p) => {
          const name = this.jaegerPolicyNameByPolicy(p);
          const paths = [];

          traceTypes.map((t) => {
            let traceTags; let proxyPath = null;

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

            paths.push(`${ jaeger.proxyUrl('http', 16686) + proxyPath }`);
          });

          return paths.map(p => this.$dispatch('request', { url: p }));
        });

        return await Promise.all(promises);
      }

      return null;
    };
  }

  jaegerPolicyNameByPolicy(policy) {
    let out = null;

    switch (policy.type) {
    case KUBEWARDEN.CLUSTER_ADMISSION_POLICY:
      out = `clusterwide-${ policy.metadata?.name }`;
      break;

    case KUBEWARDEN.ADMISSION_POLICY:
      out = `namespaced-${ policy.metadata?.namespace }-${ policy.metadata?.name }`;
      break;

    default:
      break;
    }

    return out;
  }

  async openLogs() {
    try {
      const inStore = this.$rootGetters['currentProduct'].inStore;

      const pod = await this.$dispatch(`${ inStore }/findMatching`, {
        type:     POD,
        selector: `app=kubewarden-policy-server-${ this.metadata?.name }` // kubewarden-policy-server is hardcoded from the kubewarden-controller
      }, { root: true });

      if ( pod ) {
        this.$dispatch('wm/open', {
          id:        `${ this.id }-logs`,
          label:     this.nameDisplay,
          icon:      'file',
          component: 'ContainerLogs',
          attrs:     { pod: pod[0] }
        }, { root: true });
      }
    } catch (e) {
      console.error('Error dispatching console for pod', e); // eslint-disable-line no-console
    }
  }
}
