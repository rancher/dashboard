import { CAPI } from '@shell/config/types';
import { sortBy } from '@shell/utils/sort';
import SteveModel from '@shell/plugins/steve/steve-class';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { handleConflict } from '@shell/plugins/dashboard-store/normalize';
import { MACHINE_ROLES } from '@shell/config/labels-annotations';
import { notOnlyOfRole } from '@shell/models/cluster.x-k8s.io.machine';
import { KIND } from '../config/elemental-types';
import {
  _getCluster, _getGroupByLabel, _getGroupByPoolShortLabel, _getProviderDisplay, _getTemplate, _getTemplateType
} from '@shell/plugins/steve/resourceUtils/cluster.x-k8s.io.machinedeployment';

export default class CapiMachineDeployment extends SteveModel {
  get cluster() {
    return _getCluster(this, { mgmtById: this.$rootGetters['management/byId'] });
  }

  get groupByLabel() {
    return _getGroupByLabel(this, { translate: this.$rootGetters['i18n/t'] });
  }

  get groupByPoolLabel() {
    return _getGroupByLabel(this, { translate: this.$rootGetters['i18n/t'] });
  }

  get groupByPoolShortLabel() {
    return _getGroupByPoolShortLabel(this, { translate: this.$rootGetters['i18n/t'] });
  }

  get infrastructureRefKind() {
    return this.spec?.template?.spec?.infrastructureRef?.kind;
  }

  get templateType() {
    return _getTemplateType(this);
  }

  get template() {
    return _getTemplate(this, { mgmtById: this.$rootGetters['management/byId'] });
  }

  get providerName() {
    return this.template?.nameDisplay;
  }

  get providerDisplay() {
    return _getProviderDisplay(this, { translateWithFallback: this.$rootGetters['i18n/withFallback'] });
  }

  get providerLocation() {
    return this.template?.providerLocation || this.t('node.list.poolDescription.noLocation');
  }

  get providerSize() {
    return this.template?.providerSize || this.t('node.list.poolDescription.noSize');
  }

  get desired() {
    return this.spec?.replicas || 0;
  }

  get pending() {
    return Math.max(0, this.desired - (this.status?.replicas || 0));
  }

  get outdated() {
    return Math.max(0, (this.status?.replicas || 0) - (this.status?.updatedReplicas || 0));
  }

  get ready() {
    return Math.max(0, (this.status?.replicas || 0) - (this.status?.unavailableReplicas || 0));
  }

  get unavailable() {
    return this.status?.unavailableReplicas || 0;
  }

  get isControlPlane() {
    return `${ this.spec?.template?.metadata?.labels?.[MACHINE_ROLES.CONTROL_PLANE] }` === 'true';
  }

  get isEtcd() {
    return `${ this.spec?.template?.metadata?.labels?.[MACHINE_ROLES.ETCD] }` === 'true';
  }

  // use this pool's definition in the cluster's rkeConfig to scale, not this.spec.replicas
  get inClusterSpec() {
    const machineConfigName = this.template?.metadata?.annotations['rke.cattle.io/cloned-from-name'];
    const machinePools = this.cluster.spec.rkeConfig.machinePools;

    return machinePools.find(pool => pool.machineConfigRef.name === machineConfigName);
  }

  scalePool(delta, save = true, depth = 0) {
    // This is used in different places with different scaling rules, so don't check if we can/cannot scale
    if (!this.inClusterSpec) {
      return;
    }

    const initialValue = this.cluster.toJSON();

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
      this.cluster.save().catch((err) => {
        let errors = exceptionToErrorsArray(err);

        if ( err.status === 409 && depth < 2 ) {
          const conflicts = handleConflict(initialValue, value, liveModel, this.$rootGetters, this.$store);

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
    ].filter(x => x.value > 0);

    return sortBy(out, 'sort:desc');
  }
}
