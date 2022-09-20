import { set } from '@shell/utils/object';
import HarvesterResource from './harvester';

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
}
