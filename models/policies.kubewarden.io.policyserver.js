import SteveModel from '@/plugins/steve/steve-class';
import { POD } from '@/config/types';

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
