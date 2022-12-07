import { clone } from '@shell/utils/object';
import { HCI } from '../../types';
import HarvesterResource from '../harvester';
import { PRODUCT_NAME as HARVESTER_PRODUCT } from '../../config/harvester';
import { PVC } from '@shell/config/types';

export default class HciSnapshot extends HarvesterResource {
  get availableActions() {
    return [
      {
        action:  'restoreSnapshot',
        enabled: this.hasAction('restore'),
        icon:    'icon icon-refresh',
        label:   this.t('harvester.action.restore'),
      },
      ...super._availableActions
    ];
  }

  get canClone() {
    return false;
  }

  restoreSnapshot(resources = this) {
    this.$dispatch('promptModal', {
      resources,
      component: 'RestoreSnapshotDialog'
    });
  }

  get detailLocation() {
    const detailLocation = clone(this._detailLocation);

    detailLocation.params.resource = HCI.SNAPSHOT;

    return detailLocation;
  }

  get doneOverride() {
    const detailLocation = clone(this._detailLocation);

    delete detailLocation.params.namespace;
    delete detailLocation.params.id;
    detailLocation.params.resource = HCI.SNAPSHOT;
    detailLocation.name = `${ HARVESTER_PRODUCT }-c-cluster-resource`;

    return detailLocation;
  }

  get parentNameOverride() {
    return this.$rootGetters['i18n/t'](`typeLabel."${ HCI.SNAPSHOT }"`, { count: 1 })?.trim();
  }

  get parentLocationOverride() {
    return this.doneOverride;
  }

  get volume() {
    const inStore = this.$rootGetters['currentProduct'].inStore;
    const namespace = this?.metadata?.namespace;
    const pvc = this?.spec?.source?.persistentVolumeClaimName;

    const volume = this.$rootGetters[`${ inStore }/byId`](
      PVC,
      `${ namespace }/${ pvc }`
    );

    return volume;
  }
}
