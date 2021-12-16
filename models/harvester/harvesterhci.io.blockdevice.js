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

  get provisionPhase() {
    const label = this.value?.blockDevice?.status?.provisionPhase;
    let color = '';
    let icon = '';

    switch (label) {
    case 'Provisioned':
      color = 'bg-success';
      icon = 'icon-checkmark';
      break;
    case 'Unprovisioning':
      color = 'bg-warning';
      icon = 'icon-warning';
      break;
    case 'NotProvisioned':
      color = 'bg-error';
      icon = 'icon-warning';
      break;
    default:
      break;
    }

    return {
      label,
      color,
      icon,
    };
  }
}
