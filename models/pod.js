import { findBy, insertAt } from '@/utils/array';
import { colorForState, stateDisplay } from '@/plugins/steve/resource-instance';
import { NODE, WORKLOAD_TYPES } from '@/config/types';

export const WORKLOAD_PRIORITY = {
  [WORKLOAD_TYPES.DEPLOYMENT]:             1,
  [WORKLOAD_TYPES.CRON_JOB]:               2,
  [WORKLOAD_TYPES.DAEMON_SET]:             3,
  [WORKLOAD_TYPES.STATEFUL_SET]:           4,
  [WORKLOAD_TYPES.JOB]:                    5,
  [WORKLOAD_TYPES.REPLICA_SET]:            6,
  [WORKLOAD_TYPES.REPLICATION_CONTROLLER]: 7,
};

export default {
  availableActions() {
    const out = this._standardActions;

    const removeAction = findBy(out, 'altAction', ' remove');
    let idx = out.length - 1;

    if ( removeAction ) {
      idx = out.indexOf(removeAction);
    }

    const openShell = {
      action:     'openShell',
      enabled:    true,
      icon:       'icon icon-fw icon-chevron-right',
      label:      'Execute Shell',
      total:      1,
    };
    const openLogs = {
      action:     'openLogs',
      enabled:    true,
      icon:       'icon icon-fw icon-chevron-right',
      label:      'View Logs',
      total:      1,
    };

    insertAt(out, idx, openShell);
    insertAt(out, idx + 1, openLogs);
    insertAt(out, idx + 2, { divider: true });

    return out;
  },

  defaultContainerName() {
    const containers = this.spec.containers;
    const desirable = containers.filter(c => c.name !== 'istio-proxy');

    if ( desirable.length ) {
      return desirable[0].name;
    }

    return containers[0]?.name;
  },

  openShell() {
    return () => {
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
    };
  },

  openLogs() {
    return () => {
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
    };
  },

  containerStateDisplay() {
    return (container) => {
      const state = Object.keys(container.state || {})[0];

      return stateDisplay(state);
    };
  },

  containerStateColor() {
    return (container) => {
      const state = Object.keys(container.state || {})[0];

      return colorForState(state);
    };
  },

  imageNames() {
    return this.spec.containers.reduce((all, container) => {
      all.push(container.image);

      return all;
    }, []);
  },

  workloadRef() {
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
  },

  details() {
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
  },

  isRunning() {
    return this.status.phase === 'Running';
  }
};
