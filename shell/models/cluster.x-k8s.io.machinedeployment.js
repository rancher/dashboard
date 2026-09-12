import { CAPI } from '@shell/config/types';
import { escapeHtml } from '@shell/utils/string';
import { sortBy } from '@shell/utils/sort';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { handleConflict } from '@shell/plugins/dashboard-store/normalize';
import { CAPI as CAPI_ANNOTATIONS, MACHINE_ROLES } from '@shell/config/labels-annotations';
import { notOnlyOfRole } from '@shell/models/cluster.x-k8s.io.machine';
import { KIND } from '../config/elemental-types';
import { KIND as HARVESTER_KIND } from '../config/harvester-manager-types';
import CapiMachineRoot from '@shell/models/base-cluster.x-k8s.io';
import {
  isMachinePoolAutoscalerEnabled,
  isMachinePoolAutoscalerPaused,
  machinePoolAutoscalerRange,
  pauseMachinePoolAutoscaler,
  resumeMachinePoolAutoscaler
} from '@shell/utils/autoscaler-utils';

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
    const rkeMachineConfigName = this.template?.metadata?.annotations?.['rke.cattle.io/cloned-from-name'];
    // infra from upstream CAPI provider: provisioning cluster has reference to an upstream provider-specific machine template crd in the infrastructure.cluster.x-k8s.io api group
    const infrastructureRefName = this.spec?.template?.spec?.infrastructureRef?.name;
    const machineTemplateName = rkeMachineConfigName || infrastructureRefName;

    if (!machineTemplateName) {
      return undefined;
    }

    // custom and imported clusters have no rkeConfig, so there's no pool to find
    const machinePools = this.cluster?.spec?.rkeConfig?.machinePools || [];

    return machinePools.find((pool) => pool?.machineConfigRef?.name === machineTemplateName);
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

  /**
   * Is the autoscaler configured for this pool?
   *
   * The provisioning cluster's machine pool is the first answer, and it stays enabled while the pool is paused. The
   * CAPI node group annotations on this machine deployment are the second: they are how an upstream CAPI provider's
   * machine deployment is autoscaled without a range on the pool. A paused pool is already true from the pool, so the
   * pruned annotations cannot flip it back
   */
  get isAutoscalerEnabled() {
    const fromAnnotations = !!(this.annotations?.[CAPI_ANNOTATIONS.AUTOSCALER_MACHINE_POOL_MIN_SIZE] || this.annotations?.[CAPI_ANNOTATIONS.AUTOSCALER_MACHINE_POOL_MAX_SIZE]);

    return isMachinePoolAutoscalerEnabled(this.inClusterSpec) || fromAnnotations;
  }

  /**
   * Is the autoscaler paused for this pool? Its range is stashed on the pool, and the CAPI node group annotations have
   * been pruned from this machine deployment
   */
  get isAutoscalerPaused() {
    return isMachinePoolAutoscalerPaused(this.inClusterSpec);
  }

  /**
   * Pausing and resuming writes the pool's range on the provisioning cluster, so it needs a pool with a range to write
   * and permission to update that cluster.
   *
   * Deliberately not `isAutoscalerEnabled`, which is also true for a machine deployment autoscaled by its own CAPI node
   * group annotations. Those belong to an upstream provider, there is nothing on the pool to stash, and offering a
   * button that cannot do anything is worse than offering none.
   *
   * A pause also has to record the number of machines the autoscaler left the pool with, so it waits for a machine
   * deployment that knows its replica count rather than pausing the pool onto a stale quantity
   */
  get canPauseResumeAutoscaler() {
    return isMachinePoolAutoscalerEnabled(this.inClusterSpec) && typeof this.spec?.replicas === 'number' && !!this.cluster?.canUpdate;
  }

  /**
   * The resize resuming the autoscaler would cause, or null when it would cause none. The pool has been scaled, while
   * paused, to a count outside the range that is about to be restored, and the autoscaler corrects that as soon as it
   * takes the pool back. `direction` and `target` say which way and to what, so the user is told before it happens
   *
   * @returns {{direction: 'up'|'down', target: number, count: number}|null}
   */
  get autoscalerResumeResize() {
    if (!this.isAutoscalerPaused || typeof this.spec?.replicas !== 'number') {
      return null;
    }

    const { min, max } = machinePoolAutoscalerRange(this.inClusterSpec);
    const count = this.spec.replicas;

    if (max !== undefined && count > max) {
      return {
        direction: 'down', target: max, count
      };
    }

    if (min !== undefined && count < min) {
      return {
        direction: 'up', target: min, count
      };
    }

    return null;
  }

  /**
   * Pause or resume the autoscaler for this pool, in one save of the provisioning cluster that holds the pool's range.
   *
   * Returns the save, which rejects if it failed. The pool is put back as it was and the error growled first, so a
   * caller only needs the rejection to tell the user what happened
   */
  toggleAutoscalerPause() {
    const pool = this.inClusterSpec;

    if (!pool || !isMachinePoolAutoscalerEnabled(pool)) {
      return;
    }

    return this.setAutoscalerPaused(!isMachinePoolAutoscalerPaused(pool));
  }

  /**
   * Pause or resume the autoscaler for this pool and save the provisioning cluster.
   *
   * A conflicting save is retried rather than reported: `save` has already refetched the cluster by the time this runs,
   * so the pool is server truth again and applying the same intent to it is all that is needed. The intent is carried
   * through the retry rather than re-derived, so a pause cannot turn into a resume because someone else got there first
   */
  setAutoscalerPaused(paused, depth = 0) {
    const pool = this.inClusterSpec;

    if (!pool) {
      return;
    }

    const previousQuantity = pool.quantity;

    if (paused) {
      // The pool keeps the number of machines the autoscaler left it with, rather than snapping back to the quantity it
      // was created with
      pauseMachinePoolAutoscaler(pool, this.spec?.replicas);
    } else {
      resumeMachinePoolAutoscaler(pool);
    }

    return this.cluster.save().catch((err) => {
      // Steve rejects with the response body, where the status is `_status`. Plain `status` is only there when the
      // error body carried one, and `save` decides whether to refetch on `_status` alone
      if ((err?.status === 409 || err?._status === 409) && depth < 2) {
        return this.setAutoscalerPaused(paused, depth + 1);
      }

      // Put the pool back the way it was, so the control doesn't show a state that was never saved. Only while it is
      // still the pool that was changed: a conflict refetches the cluster, and what came back is another writer's
      // state, not a change of ours waiting to be undone
      if (this.inClusterSpec === pool) {
        if (paused) {
          resumeMachinePoolAutoscaler(pool);
        } else {
          pauseMachinePoolAutoscaler(pool);
        }

        if (previousQuantity === undefined) {
          delete pool.quantity;
        } else {
          pool.quantity = previousQuantity;
        }
      }

      this.$dispatch('growl/fromError', {
        title: this.t(paused ? 'cluster.machinePool.autoscaler.growl.pauseError' : 'cluster.machinePool.autoscaler.growl.resumeError'),
        err:   exceptionToErrorsArray(err)
      }, { root: true });

      throw err;
    });
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
