import { set, clone } from '@shell/utils/object';
import HarvesterResource from './harvester';
import { HCI } from '../types';

export default class HciVlanConfig extends HarvesterResource {
  applyDefaults() {
    const defaultSpec = {
      uplink: {
        nics:           [],
        linkAttributes: {},
        bondOptions:    { mode: 'active-backup' },
      },
    };

    set(this, 'spec', this.spec || defaultSpec);
    set(this, 'spec.uplink.linkAttributes', this.spec?.uplink?.linkAttributes || {});
    set(this, 'spec.uplink.bondOptions', this.spec?.uplink?.bondOptions || {});
  }

  get groupByClusterNetwork() {
    return this.spec?.clusterNetwork;
  }

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
}
