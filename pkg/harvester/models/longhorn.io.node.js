import SteveModel from '@shell/plugins/steve/steve-class';

export default class LonghornNode extends SteveModel {
  get used() {
    let out = 0;

    this.disks.filter(d => d.allowScheduling).map((disk) => {
      if (disk?.storageAvailable && disk?.storageMaximum) {
        out += disk.storageMaximum - disk.storageAvailable;
      }
    });

    return out;
  }

  get disks() {
    const diskStatus = this?.status?.diskStatus || {};
    const diskSpec = this?.spec?.disks || {};

    return Object.keys(diskSpec).map((key) => {
      return {
        ...diskStatus[key],
        ...diskSpec[key],
      };
    }) || [];
  }
}
