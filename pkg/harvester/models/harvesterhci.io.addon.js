import HarvesterResource from './harvester';
import { HCI as HCI_ANNOTATIONS } from '../config/labels-annotations';

export default class HciAddonConfig extends HarvesterResource {
  get stateColor() {
    const state = this.stateDisplay;

    if (state?.toLowerCase().includes('enabled') || state?.toLowerCase().includes('success')) {
      return 'text-success';
    } else if (state === 'Disabled') {
      return 'text-darker';
    } else if (state === 'Processing') {
      return 'text-info';
    } else if (state?.toLowerCase().includes('failed') || state?.toLowerCase().includes('error')) {
      return 'text-error';
    } else {
      return 'text-info';
    }
  }

  get stateDisplay() {
    if (!this?.status?.status) {
      return this.spec.enabled === false ? 'Disabled' : 'Processing';
    }

    const out = this?.status?.status;

    if (out.startsWith('Addon')) {
      return out.replace('Addon', '');
    }

    return out;
  }

  get displayName() {
    const isExperimental = this.metadata?.labels?.[HCI_ANNOTATIONS.ADDON_EXPERIMENTAL] === 'true';

    return isExperimental ? `${ this.metadata.name } (${ this.t('generic.experimental') })` : this.metadata.name;
  }
}
