import NormanModel from '@/plugins/steve/norman-class';
import { SNAPSHOT } from '@/config/labels-annotations';
import { CAPI } from '@/config/types';
import { findBy } from '@/utils/array';

export default class EtcdBackup extends NormanModel {
  get _availableActions() {
    const out = super._availableActions;

    const restore = {
      action:     'promptRestore',
      enabled:    true,
      icon:       'icon icon-fw icon-backup-restore',
      label:      'Restore'
    };

    out.unshift(restore);

    return out;
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
}
