import { HCI } from '@/config/types';
import SteveModel from '@/plugins/steve/steve-class';

export default class HciBlockDevice extends SteveModel {
  get childParts() {
    const inStore = this.$rootGetters['currentProduct'].inStore;
    const bds = this.$rootGetters[`${ inStore }/all`](HCI.BLOCK_DEVICE);

    const parts = bds.filter(b => b.status?.deviceStatus?.parentDevice === this.spec?.devPath);

    return parts;
  }

  get isChildPartProvisioned() {
    const parts = this.childParts.filter(p => p.spec?.fileSystem?.provisioned) || [];

    return parts.length > 0;
  }
}
