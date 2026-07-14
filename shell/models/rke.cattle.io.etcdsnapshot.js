import NormanModel from '@shell/plugins/steve/norman-class';
import { SNAPSHOT } from '@shell/config/labels-annotations';
import { CAPI, DEFAULT_WORKSPACE } from '@shell/config/types';
import { get } from '@shell/utils/object';
import { base64Decode } from '@shell/utils/crypto';
import { ucFirst } from '@shell/utils/string';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';

export default class EtcdBackup extends NormanModel {
  /**
   * Restrict actions for snapshots to restore only
   */
  get _availableActions() {
    return [{
      action:  'promptRestore',
      enabled: this.restoreEnabled,
      icon:    'icon icon-backup-restore',
      label:   'Restore'
    }];
  }

  promptRestore() {
    this.$dispatch('promptRestore', [this]);
  }

  get clusterName() {
    return this.metadata.labels[SNAPSHOT.CLUSTER_NAME];
  }

  get clusterId() {
    return this.cluster?.id;
  }

  get name() {
    return this.metadata.name;
  }

  get cluster() {
    const ns = this.metadata?.namespace || DEFAULT_WORKSPACE;

    return this.$rootGetters['management/byId'](CAPI.RANCHER_CLUSTER, `${ ns }/${ this.clusterName }`);
  }

  get rke2() {
    return this.cluster?.isRke2;
  }

  get nameDisplay() {
    return this.snapshotFile?.name || this.name;
  }

  get restoreEnabled() {
    return this.snapshotFile?.status === STATES_ENUM.SUCCESSFUL && !this.isSnapshotTooOld;
  }

  get isSnapshotTooOld() {
    return this.snapshotFile?.createdAt <= this.cluster?.metadata?.creationTimestamp;
  }

  get errorMessage() {
    const inError = get(this, 'snapshotFile.status') === STATES_ENUM.FAILED;

    if (inError) {
      return base64Decode(this.snapshotFile?.message);
    } else {
      return null;
    }
  }

  get stateDescription() {
    const trans = this.stateObj?.transitioning || false;
    const error = this.stateObj?.error || this.snapshotFile?.status === STATES_ENUM.FAILED || false;
    const message = this.stateObj?.message;

    const fileMessage = this.snapshotFile?.status === STATES_ENUM.FAILED ? base64Decode(this.snapshotFile?.message) : null;

    return trans || error ? fileMessage || ucFirst(message) : '';
  }

  get backupLocation() {
    return this.metadata?.annotations?.['etcdsnapshot.rke.io/storage'];
  }
}
