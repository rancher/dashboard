import NormanModel from '@shell/plugins/steve/norman-class';
import { get } from '@shell/utils/object';
import { base64Decode } from '@shell/utils/crypto';
import { ucFirst } from '@shell/utils/string';
import {
  _getCluster, _getClusterId, _getClusterName, _getName, _getNameDisplay
} from '@shell/plugins/steve/resourceUtils/rke.cattle.io.etcdsnapshot';

export default class EtcdBackup extends NormanModel {
  /**
   * Restrict actions for snapshots to restore only
   */
  get _availableActions() {
    return [{
      action:  'promptRestore',
      enabled: true,
      icon:    'icon icon-fw icon-backup-restore',
      label:   'Restore'
    }];
  }

  promptRestore() {
    this.$dispatch('promptRestore', [this]);
  }

  get clusterName() {
    return _getClusterName(this);
  }

  get clusterId() {
    return _getClusterId(this);
  }

  get name() {
    return _getName(this);
  }

  get cluster() {
    return _getCluster(this, { mgmtAll: this.$rootGetters['management/all'] });
  }

  get rke2() {
    return this.cluster?.isRke2;
  }

  get nameDisplay() {
    return _getNameDisplay(this);
  }

  get errorMessage() {
    const inError = get(this, 'snapshotFile.status') === 'failed';

    if (inError) {
      return base64Decode(this.snapshotFile?.message);
    } else {
      return null;
    }
  }

  get stateDescription() {
    const trans = this.stateObj?.transitioning || false;
    const error = this.stateObj?.error || this.snapshotFile?.status === 'failed' || false;
    const message = this.stateObj?.message;

    const fileMessage = this.snapshotFile?.status === 'failed' ? base64Decode(this.snapshotFile?.message) : null;

    return trans || error ? fileMessage || ucFirst(message) : '';
  }

  get backupLocation() {
    return this.metadata?.annotations?.['etcdsnapshot.rke.io/storage'];
  }
}
