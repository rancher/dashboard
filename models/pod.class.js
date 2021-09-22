import { insertAt } from '@/utils/array';
import { NODE, WORKLOAD_TYPES } from '@/config/types';
import SteveModel from '@/plugins/steve/steve-class';
import { colorForState, stateDisplay } from '@/plugins/core-store/resource-class';

export const WORKLOAD_PRIORITY = {
  [WORKLOAD_TYPES.DEPLOYMENT]:             1,
  [WORKLOAD_TYPES.CRON_JOB]:               2,
  [WORKLOAD_TYPES.DAEMON_SET]:             3,
  [WORKLOAD_TYPES.STATEFUL_SET]:           4,
  [WORKLOAD_TYPES.JOB]:                    5,
  [WORKLOAD_TYPES.REPLICA_SET]:            6,
  [WORKLOAD_TYPES.REPLICATION_CONTROLLER]: 7,
};

export default class Pod extends SteveModel {
  get _availableActions() {
    const out = this._standardActions;

    const openShell = {
      action:     'openShell',
      enabled:    !!this.links.view && this.isRunning,
      icon:       'icon icon-fw icon-chevron-right',
      label:      'Execute Shell',
      total:      1,
    };
    const openLogs = {
      action:     'openLogs',
      enabled:    !!this.links.view,
      icon:       'icon icon-fw icon-chevron-right',
      label:      'View Logs',
      total:      1,
    };

    // Add backwards, each one to the top
    insertAt(out, 0, { divider: true });
    insertAt(out, 0, openLogs);
    insertAt(out, 0, openShell);

    return out;
  }

  get defaultContainerName() {
    const containers = this.spec.containers;
    const desirable = containers.filter(c => c.name !== 'istio-proxy');

    if ( desirable.length ) {
      return desirable[0].name;
    }

    return containers[0]?.name;
  }

  openShell() {
    this.$dispatch('wm/open', {
      id:        `${ this.id }-shell`,
      label:     this.nameDisplay,
      icon:      'terminal',
      component: 'ContainerShell',
      attrs:     {
        pod:       this,
        container: this.defaultContainerName
      }
    }, { root: true });
  }

  openLogs() {
    this.$dispatch('wm/open', {
      id:        `${ this.id }-logs`,
      label:     this.nameDisplay,
      icon:      'file',
      component: 'ContainerLogs',
      attrs:     {
        pod:       this,
        container: this.defaultContainerName
      }
    }, { root: true });
  }

  containerStateDisplay(container) {
    const state = Object.keys(container.state || {})[0];

    return stateDisplay(state);
  }

  containerStateColor(container) {
    const state = Object.keys(container.state || {})[0];

    return colorForState(state);
  }

  get imageNames() {
    return this.spec.containers.map(container => container.image).map((image) => {
      return image.replace(/^(index\.)?docker.io\/(library\/)?/, '').replace(/:latest$/, '');
    });
  }

  get workloadRef() {
    const owners = this.getOwners() || [];
    const workloads = owners.filter((owner) => {
      return Object.values(WORKLOAD_TYPES).includes(owner.type);
    }).sort((a, b) => {
      // Prioritize types so that deployments come before replicasets and such.
      const ia = WORKLOAD_PRIORITY[a.type];
      const ib = WORKLOAD_PRIORITY[b.type];

      return ia - ib;
    });

    return workloads[0];
  }

  get details() {
    const out = [
      {
        label:   this.t('workload.detailTop.podIP'),
        content: this.status.podIP
      },
    ];

    if ( this.workloadRef ) {
      out.push({
        label:         'Workload',
        formatter:     'LinkName',
        formatterOpts: {
          value:     this.workloadRef.name,
          type:      this.workloadRef.type,
          namespace: this.workloadRef.namespace
        },
        content: this.workloadRef.name
      });
    }

    if ( this.spec.nodeName ) {
      out.push({
        label:         'Node',
        formatter:     'LinkName',
        formatterOpts: { type: NODE, value: this.spec.nodeName },
        content:       this.spec.nodeName,
      });
    }

    return out;
  }

  get isRunning() {
    return this.status.phase === 'Running';
  }
}
