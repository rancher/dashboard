import { HCI } from '@shell/config/types';
import SteveModel from '@shell/plugins/steve/steve-class';

export default class HciBlockDevice extends SteveModel {
  get childParts() {
    const inStore = this.$rootGetters['currentProduct'].inStore;
    const bds = this.$rootGetters[`${ inStore }/all`](HCI.BLOCK_DEVICE);

    const parts = bds.filter((b) => {
      return b.status?.deviceStatus?.parentDevice === this.spec?.devPath &&
              b.spec.nodeName === this.spec.nodeName;
    });

    return parts;
  }

  get isChildPartProvisioned() {
    const parts = this.childParts.filter(p => p.spec?.fileSystem?.provisioned) || [];

    return parts.length > 0;
  }

  get provisionPhase() {
    const label = this?.status?.provisionPhase;
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

  get displayName() {
    return this.status?.deviceStatus?.devPath || this?.metadata?.name;
  }
}
