import SteveModel from '@/plugins/steve/steve-class';
import { KUBEWARDEN, POD } from '@/config/types';

export default class PolicyServer extends SteveModel {
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

  get allPolicies() {
    return async() => {
      try {
        return await this.$store.dispatch('cluster/findAll', { type: KUBEWARDEN.POLICY_SERVER }, { root: true });
      } catch (e) {
        console.error(`Error fetching policies: ${ e }`); // eslint-disable-line no-console
      }
    };
  }

  async openLogs() {
    const pods = await this.$dispatch('cluster/findAll', { type: POD }, { root: true });

    if ( pods ) {
      const policyPod = pods.find(p => p.spec?.serviceAccountName === this.spec?.serviceAccountName);

      if ( policyPod ) {
        this.$dispatch('wm/open', {
          id:        `${ this.id }-logs`,
          label:     this.nameDisplay,
          icon:      'file',
          component: 'ContainerLogs',
          attrs:     { pod: policyPod }
        }, { root: true });
      } else {
        console.error(`Error dispatching console for pod: ${ policyPod }`); // eslint-disable-line no-console
      }
    } else {
      console.error('Error fetching pods'); // eslint-disable-line no-console
    }
  }
}
