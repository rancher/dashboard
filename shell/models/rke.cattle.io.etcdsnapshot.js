import NormanModel from '@shell/plugins/steve/norman-class';
import { SNAPSHOT } from '@shell/config/labels-annotations';
import { CAPI } from '@shell/config/types';
import { findBy } from '@shell/utils/array';

export default class EtcdBackup extends NormanModel {
  /**
   * Restrict actions for snapshots to restore only
   */
  get _availableActions() {
    return [{
      action:     'promptRestore',
      enabled:    true,
      icon:       'icon icon-fw icon-backup-restore',
      label:      'Restore'
    }];
  }

  promptRestore() {
    this.$dispatch('promptRestore', [this]);
  }

  get clusterName() {
    return this.metadata.labels[SNAPSHOT.CLUSTER_NAME];
  }

  get clusterId() {
    return this.cluster.id;
  }

  get name() {
    return this.metadata.name;
  }

  get cluster() {
    return findBy(this.$rootGetters['management/all'](CAPI.RANCHER_CLUSTER), 'metadata.name', this.clusterName);
  }

  get rke2() {
    return this.cluster?.isRke2;
  }

  get nameDisplay() {
    return this.snapshotFile?.name || this.name;
  }
}
