import { insertAt } from '@shell/utils/array';
import { colorForState, stateDisplay } from '@shell/plugins/dashboard-store/resource-class';
import { NODE, WORKLOAD_TYPES } from '@shell/config/types';
import { escapeHtml, shortenedImage } from '@shell/utils/string';
import WorkloadService from '@shell/models/workload.service';
import { deleteProperty } from '@shell/utils/object';

export const WORKLOAD_PRIORITY = {
  [WORKLOAD_TYPES.DEPLOYMENT]:             1,
  [WORKLOAD_TYPES.CRON_JOB]:               2,
  [WORKLOAD_TYPES.DAEMON_SET]:             3,
  [WORKLOAD_TYPES.STATEFUL_SET]:           4,
  [WORKLOAD_TYPES.JOB]:                    5,
  [WORKLOAD_TYPES.REPLICA_SET]:            6,
  [WORKLOAD_TYPES.REPLICATION_CONTROLLER]: 7,
};

export default class Pod extends WorkloadService {
  _os = undefined;

  get inStore() {
    return this.$rootGetters['currentProduct'].inStore;
  }

  set os(operatingSystem) {
    this._os = operatingSystem;
  }

  get os() {
    if (this._os) {
      return this._os;
    }

    return this?.node?.status?.nodeInfo?.operatingSystem;
  }

  get node() {
    try {
      const schema = this.$store.getters[`cluster/schemaFor`](NODE);

      if (schema) {
        this.$dispatch(`find`, { type: NODE, id: this.spec.nodeName });
      }
    } catch {}

    return this.$getters['byId'](NODE, this.spec.nodeName);
  }

  get _availableActions() {
    const out = super._availableActions;

    // Add backwards, each one to the top
    insertAt(out, 0, { divider: true });
    insertAt(out, 0, this.openLogsMenuItem);
    insertAt(out, 0, this.openShellMenuItem);

    return out;
  }

  get openShellMenuItem() {
    return {
      action:  'openShell',
      enabled: !!this.links.view && this.isRunning,
      icon:    'icon icon-fw icon-chevron-right',
      label:   'Execute Shell',
      total:   1,
    };
  }

  get openLogsMenuItem() {
    return {
      action:  'openLogs',
      enabled: !!this.links.view,
      icon:    'icon icon-fw icon-chevron-right',
      label:   'View Logs',
      total:   1,
    };
  }

  get containerActions() {
    const out = [];

    insertAt(out, 0, this.openLogsMenuItem);
    insertAt(out, 0, this.openShellMenuItem);

    return out;
  }

  get defaultContainerName() {
    const containers = this.spec.containers;
    const desirable = containers.filter((c) => c.name !== 'istio-proxy');

    if ( desirable.length ) {
      return desirable[0].name;
    }

    return containers[0]?.name;
  }

  openShell(containerName = this.defaultContainerName) {
    this.$dispatch('wm/open', {
      id:        `${ this.id }-shell`,
      label:     this.nameDisplay,
      icon:      'terminal',
      component: 'ContainerShell',
      attrs:     {
        pod:              this,
        initialContainer: containerName
      }
    }, { root: true });
  }

  openLogs(containerName = this.defaultContainerName) {
    this.$dispatch('wm/open', {
      id:        `${ this.id }-logs`,
      label:     this.nameDisplay,
      icon:      'file',
      component: 'ContainerLogs',
      attrs:     {
        pod:              this,
        initialContainer: containerName
      }
    }, { root: true });
  }

  containerStateDisplay(status) {
    const state = Object.keys(status.state || {})[0];

    return stateDisplay(state);
  }

  containerStateColor(status) {
    const state = Object.keys(status.state || {})[0];

    return colorForState(state);
  }

  containerIsInit(container) {
    const { initContainers = [] } = this.spec;

    return initContainers.includes(container);
  }

  get imageNames() {
    return this.spec.containers.map((container) => shortenedImage(container.image));
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

  get ownedByWorkload() {
    return !!this.workloadRef;
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

  // Use by pod list to group the pods by node
  get groupByNode() {
    const name = this.spec?.nodeName || this.$rootGetters['i18n/t']('generic.none');

    return this.$rootGetters['i18n/t']('resourceTable.groupLabel.node', { name: escapeHtml(name) });
  }

  get restartCount() {
    if (this.status.containerStatuses) {
      return this.status?.containerStatuses[0].restartCount || 0;
    }

    return 0;
  }

  processSaveResponse(res) {
    if (res._headers && res._headers.warning) {
      const warnings = res._headers.warning.split('299') || [];
      const hasPsaWarnings = warnings.filter((warning) => warning.includes('violate PodSecurity')).length;

      if (hasPsaWarnings) {
        this.$dispatch('growl/warning', {
          title:   this.$rootGetters['i18n/t']('growl.podSecurity.title'),
          message: this.$rootGetters['i18n/t']('growl.podSecurity.message'),
          timeout: 5000,
        }, { root: true });
      }
    }
  }

  save() {
    const prev = { ...this };

    const { metadata, spec } = this.spec.template;

    this.spec = {
      ...this.spec,
      ...spec
    };

    this.metadata = {
      ...this.metadata,
      ...metadata
    };

    delete this.spec.template;

    // IF there is an error POD world model get overwritten
    // For the workloads this need be reset back
    return this._save(...arguments).catch((e) => {
      this.spec = prev.spec;
      this.metadata = prev.metadata;

      return Promise.reject(e);
    });
  }

  cleanForSave(data) {
    const val = super.cleanForSave(data);

    // remove fields from containers
    val.spec?.containers?.forEach((container) => {
      this.cleanContainerForSave(container);
    });

    // remove fields from initContainers
    val.spec?.initContainers?.forEach((container) => {
      this.cleanContainerForSave(container);
    });

    // This is probably added by generic workload components that shouldn't be added to pods
    deleteProperty(val, 'spec.selector');

    return val;
  }
}
