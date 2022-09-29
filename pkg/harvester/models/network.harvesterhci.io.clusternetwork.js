import { HCI } from '../types';
import { clone } from '@shell/utils/object';
import HarvesterResource from './harvester';

export default class HciClusterNetwork extends HarvesterResource {
  get doneOverride() {
    const detailLocation = clone(this.listLocation);

    detailLocation.params.resource = HCI.CLUSTER_NETWORK;

    return detailLocation;
  }

  get parentLocationOverride() {
    return {
      ...this.listLocation,
      params: {
        ...this.listLocation.params,
        resource: HCI.CLUSTER_NETWORK
      }
    };
  }

  get canDelete() {
    return this._canDelete && this.id !== 'mgmt';
  }

  get canUpdate() {
    return this.hasLink('update') && this.$rootGetters['type-map/optionsFor'](this.type).isEditable && this.id !== 'mgmt';
  }
}
