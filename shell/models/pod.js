import { defineAsyncComponent, markRaw } from 'vue';
import { insertAt } from '@shell/utils/array';
import { colorForState, simpleColorForState, stateDisplay } from '@shell/plugins/dashboard-store/resource-class';
import { NODE, WORKLOAD_TYPES } from '@shell/config/types';
import { escapeHtml, shortenedImage } from '@shell/utils/string';
import WorkloadService from '@shell/models/workload.service';
import { deleteProperty } from '@shell/utils/object';
import { POD_RESTARTS_REG_EX } from '@shell/types/resources/pod';
import { useResourceCardRow } from '@shell/components/Resource/Detail/Card/StateCard/composables';
import { POD_SHELL } from '@shell/store/features';

// Defined once so the component identity is stable; creating it in `details` remounts the popover, and closes its card, on every pod update
const WorkloadResourcePopover = markRaw(defineAsyncComponent(() => import('@shell/components/Resource/Detail/ResourcePopover/index.vue')));

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

  get customValidationRules() {
    const out = [
      {
        nullable:       false,
        path:           'metadata.name',
        required:       true,
        translationKey: 'generic.name',
        type:           'subDomain',
      },
    ];

    return out;
  }

  get _availableActions() {
    const out = super._availableActions;
    const podShellFeatureEnabled = !!this.$rootGetters['features/get'](POD_SHELL);

    // Add backwards, each one to the top
    insertAt(out, 0, { divider: true });
    insertAt(out, 0, this.openLogsMenuItem);

    // Only add the menu item for the pod shell if the feature flag is enabled
    if (podShellFeatureEnabled) {
      insertAt(out, 0, this.openShellMenuItem);
    }

    return out;
  }

  get openShellMenuItem() {
    return {
      action:  'openShell',
      enabled: !!this.links.view && this.isRunning,
      icon:    'icon-chevron-right',
      label:   'Execute Shell',
      total:   1,
    };
  }

  get openLogsMenuItem() {
    return {
      action:  'openLogs',
      enabled: !!this.links.view,
      icon:    'icon icon-chevron-right',
      label:   'View Logs',
      total:   1,
    };
  }

  get containerActions() {
    const out = [];
    const podShellFeatureEnabled = !!this.$rootGetters['features/get'](POD_SHELL);

    insertAt(out, 0, this.openLogsMenuItem);

    // Only add the menu item for the container shell if the feature flag is enabled
    if (podShellFeatureEnabled) {
      insertAt(out, 0, this.openShellMenuItem);
    }

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

  get resourceContainers() {
    const statuses = [...(this.status?.containerStatuses || []), ...(this.status?.initContainerStatuses || [])];

    return statuses.map((s) => {
      const state = Object.keys(s.state || {})[0] || 'unknown';

      return {
        stateDisplay:     stateDisplay(state),
        stateSimpleColor: simpleColorForState(state),
      };
    });
  }

  get resourcesCardRows() {
    const rows = [...this._resourcesCardRows];

    if (this.resourceContainers.length) {
      rows.unshift(useResourceCardRow(this.t('workload.container.titles.containers'), this.resourceContainers, 'stateSimpleColor', 'stateDisplay', '#containers'));
    }

    return rows;
  }

  get cards() {
    return [
      this.resourcesCard,
      this.insightCard,
      ...this._cards
    ].filter((c) => c);
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

  /**
   * Display label of the type of workload that owns this pod, e.g. `ReplicaSet`
   */
  get workloadTypeLabel() {
    const schema = this.workloadRef ? this.$getters['schemaFor'](this.workloadRef.type) : null;

    return schema ? this.$rootGetters['type-map/labelFor'](schema) : this.t('component.resource.detail.glance.workload');
  }

  get details() {
    const out = [
      {
        label:   this.t('workload.detailTop.podIP'),
        content: this.status.podIP
      },
    ];

    if ( this.workloadRef ) {
      const isReplicaSet = this.workloadRef.type === WORKLOAD_TYPES.REPLICA_SET && !!this.$getters['schemaFor'](WORKLOAD_TYPES.REPLICA_SET);

      out.push({
        label:         this.workloadTypeLabel,
        formatter:     'LinkName',
        formatterOpts: {
          value:     this.workloadRef.name,
          type:      this.workloadRef.type,
          namespace: this.workloadRef.namespace
        },
        content:       this.workloadRef.name,
        // The masthead shows a card with the key facts of a ReplicaSet. Other owners keep the plain link
        valueOverride: isReplicaSet ? {
          component: WorkloadResourcePopover,
          props:     {
            type:           this.workloadRef.type,
            id:             this.workloadRef.id,
            name:           this.workloadRef.name,
            // Like the design, only the namespace row of the masthead has a state dot
            showStatus:     false,
            detailLocation: {
              name:   'c-cluster-product-resource-namespace-id',
              params: {
                product:   this.$rootGetters['productId'],
                cluster:   this.$rootGetters['clusterId'],
                resource:  this.workloadRef.type,
                namespace: this.workloadRef.namespace,
                id:        this.workloadRef.name,
              }
            }
          }
        } : undefined
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

  /**
   * How many times has the first container restarted
   */
  get restartCount() {
    if (this.status.containerStatuses) {
      return this.status?.containerStatuses[0].restartCount || 0;
    }

    return 0;
  }

  /**
   * Counts ready containers and restarts the same way `kubectl get pods` does in its READY and RESTARTS columns.
   *
   * Sidecars (init containers with `restartPolicy: Always`) keep running alongside the app containers, so they count too.
   * While the pod is still initialising only the init containers are counted
   */
  get kubectlContainerCounts() {
    const sidecars = (this.spec?.initContainers || [])
      .filter((container) => container.restartPolicy === 'Always')
      .map((container) => container.name);
    let ready = 0;
    let initRestarts = 0;
    let sidecarRestarts = 0;
    let initializing = false;

    for (const status of this.status?.initContainerStatuses || []) {
      const isSidecar = sidecars.includes(status.name);

      initRestarts += status.restartCount || 0;

      if (isSidecar) {
        sidecarRestarts += status.restartCount || 0;
      }

      if (status.state?.terminated?.exitCode === 0) {
        continue;
      }

      if (isSidecar && status.started) {
        ready += status.ready ? 1 : 0;
        continue;
      }

      initializing = true;
      break;
    }

    const initialized = (this.status?.conditions || []).some((condition) => condition.type === 'Initialized' && condition.status === 'True');
    let restarts = initRestarts;

    if (!initializing || initialized) {
      restarts = sidecarRestarts;

      for (const status of this.status?.containerStatuses || []) {
        restarts += status.restartCount || 0;
        ready += status.ready && status.state?.running ? 1 : 0;
      }
    }

    return {
      ready,
      total: (this.spec?.containers?.length || 0) + sidecars.length,
      restarts,
    };
  }

  /**
   * How many containers are ready out of how many there are, as `kubectl get pods` shows in its READY column
   */
  get containerReadiness() {
    const { ready, total } = this.kubectlContainerCounts;

    return { ready, total };
  }

  /**
   * How many times the containers have restarted, as `kubectl get pods` shows in its RESTARTS column
   */
  get totalRestartCount() {
    return this.kubectlContainerCounts.restarts;
  }

  /**
   * How many times does native kube report this pod has restarted
   */
  get restartsCount() {
    return this.metadata?.fields?.[3]?.match(POD_RESTARTS_REG_EX)?.[1] || '';
  }

  /**
   * When does native kube think the last pod restart happen?
   */
  get restartsLaster() {
    return this.metadata?.fields?.[3]?.match(POD_RESTARTS_REG_EX)?.[2] || '';
  }

  get glance() {
    const glance = [...this._glance];
    const { ready, total } = this.containerReadiness;
    const podIP = this.status?.podIP;
    // Once a pod has completed or failed its containers are no longer expected to be ready
    const hasFinished = ['Succeeded', 'Failed'].includes(this.status?.phase);
    const rows = [
      {
        name:          'ready',
        label:         this.t('component.resource.detail.glance.ready'),
        formatter:     'ReadyIndicator',
        formatterOpts: {
          ready, total, status: hasFinished ? 'none' : undefined
        },
        content: `${ ready }/${ total }`
      },
      {
        name:    'restarts',
        label:   this.t('component.resource.detail.glance.restarts'),
        content: this.totalRestartCount
      },
      {
        name:          'podIp',
        label:         this.t('component.resource.detail.glance.podIp'),
        formatter:     podIP ? 'CopyToClipboard' : undefined,
        formatterOpts: { plain: true },
        content:       podIP || '—'
      },
    ];

    if (this.workloadRef) {
      rows.push({
        name:          'workload',
        label:         this.workloadTypeLabel,
        formatter:     'LinkName',
        formatterOpts: {
          value:     this.workloadRef.name,
          type:      this.workloadRef.type,
          namespace: this.workloadRef.namespace
        },
        content: this.workloadRef.name
      });
    }

    if (this.spec?.nodeName) {
      rows.push({
        name:          'node',
        label:         this.t('component.resource.detail.glance.node'),
        formatter:     'LinkName',
        formatterOpts: { type: NODE, value: this.spec.nodeName },
        content:       this.spec.nodeName
      });
    }

    const ageIndex = glance.findIndex((item) => item.name === 'age');

    glance.splice(ageIndex > -1 ? ageIndex : glance.length, 0, ...rows);

    return glance;
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

    if (this.spec?.template) {
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
    }

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
