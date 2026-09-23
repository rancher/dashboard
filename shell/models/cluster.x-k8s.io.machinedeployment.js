import { CAPI } from '@shell/config/types';
import { escapeHtml } from '@shell/utils/string';
import { sortBy } from '@shell/utils/sort';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { handleConflict } from '@shell/plugins/dashboard-store/normalize';
import { MACHINE_ROLES } from '@shell/config/labels-annotations';
import {
  AUTOSCALER_PAUSE_FIELDS,
  isAutoscalerFeatureFlagEnabled,
  isMachinePoolAutoscaling,
  isMachinePoolAutoscalerPaused,
  machinePoolAutoscalerRange,
  pauseMachinePoolAutoscaler,
  resumeMachinePoolAutoscaler
} from '@shell/utils/autoscaler-utils';
import { notOnlyOfRole } from '@shell/models/cluster.x-k8s.io.machine';
import { KIND } from '../config/elemental-types';
import { KIND as HARVESTER_KIND } from '../config/harvester-manager-types';
import CapiMachineRoot from '@shell/models/base-cluster.x-k8s.io';

function snapshotAutoscalerFields(pool) {
  return AUTOSCALER_PAUSE_FIELDS.reduce((out, field) => {
    if (field in pool) {
      out[field] = pool[field];
    }

    return out;
  }, {});
}

function restoreAutoscalerFields(pool, snapshot) {
  if (!pool) {
    return;
  }

  AUTOSCALER_PAUSE_FIELDS.forEach((field) => {
    if (field in snapshot) {
      pool[field] = snapshot[field];
    } else {
      delete pool[field];
    }
  });
}

export default class CapiMachineDeployment extends CapiMachineRoot {
  get groupByPoolLabel() {
    return `${ this.$rootGetters['i18n/t']('resourceTable.groupLabel.machinePool', { name: escapeHtml(this.nameDisplay) }) }`;
  }

  get groupByPoolShortLabel() {
    return `${ this.$rootGetters['i18n/t']('resourceTable.groupLabel.machinePool', { name: escapeHtml(this.nameDisplay) }) }`;
  }

  get infrastructureRefKind() {
    return this.spec?.template?.spec?.infrastructureRef?.kind;
  }

  get templateType() {
    return this.infrastructureRefKind ? `rke-machine.cattle.io.${ this.infrastructureRefKind.toLowerCase() }` : null;
  }

  get template() {
    const ref = this.spec.template.spec.infrastructureRef;
    const id = `${ this.metadata.namespace }/${ ref.name }`;
    const template = this.$rootGetters['management/byId'](this.templateType, id);

    return template;
  }

  get providerName() {
    return this.template?.nameDisplay;
  }

  get providerDisplay() {
    const provider = (this.template?.provider || '').toLowerCase();

    return this.$rootGetters['i18n/withFallback'](`cluster.provider."${ provider }"`, null, 'generic.unknown', true);
  }

  get providerLocation() {
    return this.template?.providerLocation || this.t('node.list.poolDescription.noLocation');
  }

  get providerSize() {
    return this.template?.providerSize || this.t('node.list.poolDescription.noSize');
  }

  get providerSummary() {
    if (this.template) {
      switch (this.infrastructureRefKind) {
      case HARVESTER_KIND.MACHINE_TEMPLATE:
        return null;
      default:
        return `${ this.providerDisplay } \u2013  ${ this.providerLocation } / ${ this.providerSize } (${ this.providerName })`;
      }
    }

    return null;
  }

  get desired() {
    return this.spec?.replicas || 0;
  }

  get pending() {
    return Math.max(0, this.desired - (this.status?.replicas || 0));
  }

  get outdated() {
    return Math.max(0, (this.status?.replicas || 0) - (this.status?.upToDateReplicas || 0));
  }

  get ready() {
    return this.status?.availableReplicas || 0;
  }

  get unavailable() {
    return Math.max(0, (this.status?.replicas || 0) - (this.status?.availableReplicas || 0));
  }

  get isControlPlane() {
    return `${ this.spec?.template?.metadata?.labels?.[MACHINE_ROLES.CONTROL_PLANE] }` === 'true';
  }

  get isEtcd() {
    return `${ this.spec?.template?.metadata?.labels?.[MACHINE_ROLES.ETCD] }` === 'true';
  }

  // use this pool's definition in the provisioning cluster spec to scale, not this.spec.replicas
  get inClusterSpec() {
    // infra from Rancher node driver: provisioning cluster has reference to Rancher-generated crd <provider name>Config from the rke-machine-config.cattle.io api group
    const rkeMachineConfigName = this.template?.metadata?.annotations['rke.cattle.io/cloned-from-name'];
    // infra from upstream CAPI provider: provisioning cluster has reference to an upstream provider-specific machine template crd in the infrastructure.cluster.x-k8s.io api group
    const infrastructureRefName = this.spec?.template?.spec?.infrastructureRef?.name;
    const machineTemplateName = rkeMachineConfigName || infrastructureRefName;

    const machinePools = this.cluster?.spec?.rkeConfig?.machinePools || [];

    return machinePools.find((pool) => pool.machineConfigRef?.name === machineTemplateName);
  }

  scalePool(delta, save = true, depth = 0) {
    // This is used in different places with different scaling rules, so don't check if we can/cannot scale
    if (!this.inClusterSpec) {
      return;
    }

    const initialValue = this.cluster;

    this.inClusterSpec.quantity += delta;

    if ( !save ) {
      return;
    }

    const value = this.cluster;
    const liveModel = this.$rootGetters['management/byId'](CAPI.RANCHER_CLUSTER, this.cluster.id);

    if ( this.scaleTimer ) {
      clearTimeout(this.scaleTimer);
    }

    this.scaleTimer = setTimeout(() => {
      this.cluster.save().catch(async(err) => {
        let errors = exceptionToErrorsArray(err);

        if ( err.status === 409 && depth < 2 ) {
          const conflicts = await handleConflict(
            initialValue,
            value,
            liveModel,
            {
              dispatch: this.$dispatch,
              getters:  this.$rootGetters
            },
            'management'
          );

          if ( conflicts === false ) {
            // It was automatically figured out, save again
            // (pass in the delta again as `this.inClusterSpec.quantity` would have reset from the re-fetch done in `save`)
            return this.scalePool(delta, true, depth + 1);
          } else {
            errors = conflicts;
          }
        }

        this.$dispatch('growl/fromError', {
          title: 'Error scaling pool',
          err:   errors
        }, { root: true });
      });
    }, 1000);
  }

  get _availableActions() {
    const out = super._availableActions;

    if (!this.autoscalerStatusKey || !isAutoscalerFeatureFlagEnabled({ rootGetters: this.$rootGetters })) {
      return out;
    }

    const paused = this.isAutoscalerPaused;

    return [{
      action:  'toggleAutoscalerPause',
      label:   this.t(paused ? 'cluster.machinePool.autoscaler.pause.resumeAction' : 'cluster.machinePool.autoscaler.pause.pauseAction'),
      icon:    `icon ${ paused ? 'icon-play' : 'icon-pause' }`,
      enabled: this.canPauseResumeAutoscaler
    },
    { divider: true },
    ...out];
  }

  get isAutoscalerEnabled() {
    return isMachinePoolAutoscaling(this.inClusterSpec);
  }

  get isAutoscalerPaused() {
    return isMachinePoolAutoscalerPaused(this.inClusterSpec);
  }

  get isClusterAutoscalerPaused() {
    return !!this.cluster?.isAutoscalerPaused;
  }

  get autoscalerRange() {
    return machinePoolAutoscalerRange(this.inClusterSpec);
  }

  /**
   * Translation key naming the pool's autoscaler state, or null when the pool does not autoscale
   */
  get autoscalerStatusKey() {
    if (!this.isAutoscalerEnabled && !this.isAutoscalerPaused) {
      return null;
    }

    if (this.isClusterAutoscalerPaused) {
      return 'cluster.machinePool.autoscaler.pause.statusClusterPaused';
    }

    return this.isAutoscalerEnabled ? 'cluster.machinePool.autoscaler.pause.statusAutoscaling' : 'cluster.machinePool.autoscaler.pause.statusPaused';
  }

  get autoscalerNodeGroupName() {
    return `MachineDeployment/${ this.metadata.namespace }/${ this.metadata.name }`;
  }

  /**
   * Summary rows for the pool's autoscaler popover, in the shape `AutoscalerCard` renders. The
   * cluster autoscaler reports per node group, keyed by the pool's machine deployment.
   */
  async loadAutoscalerDetails() {
    const out = [{
      label: this.t('autoscaler.card.details.status'),
      value: this.t(this.autoscalerStatusKey)
    }, {
      label: this.t('cluster.machinePool.autoscaler.pause.range'),
      value: this.t('cluster.machinePool.autoscaler.pause.rangeValue', this.autoscalerRange)
    }];

    if (this.isAutoscalerPaused || this.isClusterAutoscalerPaused) {
      return out;
    }

    const status = await this.cluster?.loadAutoscalerStatus();
    const nodeGroup = typeof status === 'object' ? status?.nodeGroups?.find((group) => group.name === this.autoscalerNodeGroupName) : undefined;

    if (!nodeGroup) {
      return out;
    }

    if (nodeGroup.health?.status) {
      out.push({
        label: this.t('autoscaler.card.details.health'),
        value: {
          component: 'BadgeStateFormatter',
          props:     {
            value: nodeGroup.health.status, arbitrary: true, row: {}
          }
        }
      });
    }

    if (nodeGroup.scaleDown?.lastTransitionTime) {
      out.push({
        label: this.t('autoscaler.card.details.scaleDown'),
        value: {
          component: 'LiveDate',
          props:     { value: nodeGroup.scaleDown.lastTransitionTime, addSuffix: true }
        }
      });
    }

    if (nodeGroup.scaleUp?.lastTransitionTime) {
      out.push({
        label: this.t('autoscaler.card.details.scaleUp'),
        value: {
          component: 'LiveDate',
          props:     { value: nodeGroup.scaleUp.lastTransitionTime, addSuffix: true }
        }
      });
    }

    const registered = nodeGroup.health?.nodeCounts?.registered;

    if (registered) {
      out.push({ label: this.t('autoscaler.card.details.nodes') });
      out.push({ label: this.t('autoscaler.card.details.ready'), value: registered.ready || '0' });
      out.push({ label: this.t('autoscaler.card.details.notStarted'), value: registered.notStarted || '0' });
      out.push({ label: this.t('autoscaler.card.details.inTotal'), value: registered.total || '0' });
    }

    return out;
  }

  get isLastAutoscalingPool() {
    const pool = this.inClusterSpec;

    if (!isMachinePoolAutoscaling(pool)) {
      return false;
    }

    const machinePools = this.cluster?.spec?.rkeConfig?.machinePools || [];

    return !machinePools.some((other) => other !== pool && isMachinePoolAutoscaling(other));
  }

  get canPauseResumeAutoscaler() {
    if (!this.inClusterSpec || !this.autoscalerStatusKey || !this.cluster?.canUpdate || this.isClusterAutoscalerPaused) {
      return false;
    }

    return !this.isLastAutoscalingPool;
  }

  /**
   * Pause or resume the autoscaler for this pool, saving the provisioning cluster. A toggle that is
   * already in flight is handed back rather than started again.
   *
   * @returns a promise for whether the change was saved
   */
  toggleAutoscalerPause() {
    if (!this.autoscalerPauseRequest) {
      this.autoscalerPauseRequest = this.saveAutoscalerPause().finally(() => {
        this.autoscalerPauseRequest = null;
      });
    }

    return this.autoscalerPauseRequest;
  }

  async saveAutoscalerPause(depth = 0) {
    const pool = this.inClusterSpec;

    if (!pool || !this.canPauseResumeAutoscaler) {
      return false;
    }

    const rollback = snapshotAutoscalerFields(pool);

    if (this.isAutoscalerPaused) {
      resumeMachinePoolAutoscaler(pool);
    } else {
      pauseMachinePoolAutoscaler(pool, this.desired);
    }

    try {
      await this.cluster.save();

      return true;
    } catch (err) {
      if ( err.status === 409 ) {
        if ( depth < 2 ) {
          return this.saveAutoscalerPause(depth + 1);
        }
      } else {
        restoreAutoscalerFields(this.inClusterSpec, rollback);
      }

      this.$dispatch('growl/fromError', {
        title: this.t('cluster.machinePool.autoscaler.pause.error'),
        err:   exceptionToErrorsArray(err)
      }, { root: true });

      return false;
    }
  }

  // prevent scaling pool to 0 if it would scale down the only etcd or control plane node
  canScaleDownPool() {
    if (!this.canUpdate || this.inClusterSpec?.quantity === 0 || this.infrastructureRefKind === KIND.MACHINE_INV_SELECTOR_TEMPLATES) {
      return false;
    }

    // scaling workers is always ok
    if (!this.isEtcd && !this.isControlPlane) {
      return true;
    }

    return notOnlyOfRole(this, this.cluster.machines);
  }

  // prevent scaling up pool for Elemental machines
  canScaleUpPool() {
    if (this.infrastructureRefKind === KIND.MACHINE_INV_SELECTOR_TEMPLATES) {
      return false;
    }

    return true;
  }

  get showScalePool() {
    return this.canScaleDownPool() || this.canScaleUpPool();
  }

  get stateParts() {
    const out = [
      {
        label:     'Pending',
        color:     'bg-info',
        textColor: 'text-info',
        value:     this.pending,
        sort:      1,
      },
      {
        label:     'Outdated',
        color:     'bg-warning',
        textColor: 'text-warning',
        value:     this.outdated,
        sort:      2,
      },
      {
        label:     'Unavailable',
        color:     'bg-error',
        textColor: 'text-error',
        value:     this.unavailable,
        sort:      3,
      },
      {
        label:     'Ready',
        color:     'bg-success',
        textColor: 'text-success',
        value:     this.ready,
        sort:      4,
      },
    ].filter((x) => x.value > 0);

    return sortBy(out, 'sort:desc');
  }
}
