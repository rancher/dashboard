import { insertAt } from '@shell/utils/array';
import { colorForState, stateDisplay } from '@shell/plugins/dashboard-store/resource-class';
import { NODE, WORKLOAD_TYPES } from '@shell/config/types';
import { escapeHtml, shortenedImage } from '@shell/utils/string';
import WorkloadService from '@shell/models/workload.service';

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

    insertAt(out, 0, this.downloadFileMenuItem);
    insertAt(out, 0, { divider: true });
    insertAt(out, 0, this.openLogsMenuItem);
    insertAt(out, 0, this.openShellMenuItem);

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

  get downloadFileMenuItem() {
    return {
      action:  'downloadFile',
      enabled: !!this.actions?.download,
      icon:    'icon icon-download',
      label:   this.t('action.downloadFile'),
    };
  }

  async openShell(containerName = this.defaultContainerName) {
    if (this.$rootGetters['auth/isReadOnlyAdmin']) {
      try {
        const clusterId = this.$rootGetters['clusterId'];
        const { namespace, name } = this.metadata;
        const endpoint = `/k8s/clusters/${ clusterId }`;
        const resp = await this.hasExecShellPermission(endpoint, namespace, name);

        if (resp?.status?.allowed === false) {
          this.$dispatch('growl/error', {
            title:   this.t('wm.containerShell.permissionDenied.title'),
            message: this.t('wm.containerShell.permissionDenied.message')
          }, { root: true });

          return;
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        this.$dispatch('growl/error', {
          title:   this.t('wm.containerShell.permissionDenied.title'),
          message: error
        }, { root: true });

        return;
      }
    }

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

  downloadFile() {
    const resources = this;

    this.$dispatch('promptModal', {
      resources,
      component: 'DownloadFileDialog'
    });
  }

  async hasExecShellPermission(endpoint, namespace, name) {
    const url = `${ endpoint }/apis/authorization.k8s.io/v1/selfsubjectaccessreviews`;
    const params = {
      spec: {
        resourceAttributes: {
          namespace,
          resource:    'pods',
          verb:        'create',
          name,
          subresource: 'exec',
        }
      }
    };
    const resp = await this.$dispatch('cluster/request', {
      url,
      method: 'POST',
      data:   params,
    }, { root: true });

    return resp;
  }

  get imageNames() {
    return this.spec.containers.map(container => shortenedImage(container.image));
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

    out.push({
      label:   'Macvlan IP',
      content: this.displayMacvlanIp,
    });

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
      const hasPsaWarnings = warnings.filter(warning => warning.includes('violate PodSecurity')).length;

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

  get macvlanIpv6() {
    const annotations = this.metadata?.annotations || {};
    const networkStatusStr = annotations?.['k8s.v1.cni.cncf.io/networks-status'];

    if (!networkStatusStr) {
      return '';
    }
    let networkStatus;

    try {
      networkStatus = JSON.parse(networkStatusStr);
    } catch (err) {
      return '';
    }
    if (networkStatus) {
      const macvlan = networkStatus.find(n => n.interface === 'eth1');

      return `${ (macvlan && macvlan.ips && macvlan.ips[1]) || '' }`;
    }

    return '';
  }

  get displayMacvlanIp() {
    const macvlanIpWithoutType = this.macvlanIpWithoutType;
    const macvlanIpv6 = this.macvlanIpv6;
    let divide = '';

    if (macvlanIpWithoutType && macvlanIpv6) {
      divide = ` / `;
    }

    return `${ macvlanIpWithoutType }${ divide }${ macvlanIpv6 }`;
  }

  get macvlanIpWithoutType() {
    const annotations = this.metadata?.annotations || {};
    const networkStatusStr = annotations && annotations['k8s.v1.cni.cncf.io/networks-status'];

    if (!networkStatusStr) {
      return '';
    }
    let networkStatus;

    try {
      networkStatus = JSON.parse(networkStatusStr);
    } catch (err) {
      return '';
    }
    if (networkStatus) {
      const macvlan = networkStatus.find(n => n.interface === 'eth1');

      return `${ (macvlan && macvlan.ips && macvlan.ips[0]) || '' }`;
    }

    return '';
  }
}
