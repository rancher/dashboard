import SteveModel from '@shell/plugins/steve/steve-class';
import { escapeHtml } from '@shell/utils/string';
import { HCI } from '../types';

const STATUS_DISPLAY = {
  enabled: {
    displayKey: 'generic.enabled',
    color:      'bg-success'
  },
  pending: {
    displayKey: 'generic.inProgress',
    color:      'bg-info'
  },
  disabled: {
    displayKey: 'generic.disabled',
    color:      'bg-warning'
  },
  error: {
    displayKey: 'generic.disabled',
    color:      'bg-warning'
  }
};

/**
 * Class representing PCI Device resource.
 * @extends SteveModal
 */
export default class PCIDevice extends SteveModel {
  get _availableActions() {
    const out = super._availableActions;

    out.push(
      {
        action:     'enablePassthrough',
        enabled:    !this.isEnabling,
        icon:       'icon icon-fw icon-dot',
        label:      'Enable Passthrough',
        bulkable: true
      },
      {
        action:     'disablePassthrough',
        enabled:    this.isEnabling && this.claimedByMe,
        icon:       'icon icon-fw icon-dot-open',
        label:      'Disable Passthrough',
        bulkable: true
      },
    );

    return out;
  }

  get passthroughClaim() {
    const passthroughClaims = this.$getters['all'](HCI.PCI_CLAIM) || [];

    return !!this.status && passthroughClaims.find(req => req?.spec?.nodeName === this.status?.nodeName && req?.spec?.address === this.status?.address);
  }

  // this is an id for each 'type' of device - there may be multiple instances of device CRs
  get uniqueId() {
    return `${ this.status?.vendorId }:${ this.status?.deviceId }`;
  }

  get claimedBy() {
    return this.passthroughClaim?.spec?.userName;
  }

  get claimedByMe() {
    if (!this.passthroughClaim) {
      return false;
    }
    const isSingleProduct = this.$rootGetters['isSingleProduct'];
    let userName = 'admin';

    // if this is imported Harvester, there may be users other than admin
    if (!isSingleProduct) {
      userName = this.$rootGetters['auth/v3User']?.username;
    }

    return this.claimedBy === userName;
  }

  // isEnabled controls visibility in vm create page & ability to delete claim
  // isEnabling controls ability to add claim
  // there will be a brief period where isEnabling === true && isEnabled === false
  get isEnabled() {
    return !!this.passthroughClaim?.status?.passthroughEnabled;
  }

  get isEnabling() {
    return !!this.passthroughClaim;
  }

  // map status.passthroughEnabled to disabled/enabled & overwrite default dash colors
  get claimStatusDisplay() {
    if (!this.passthroughClaim) {
      return STATUS_DISPLAY.disabled;
    }
    if (this.isEnabled) {
      return STATUS_DISPLAY.enabled;
    }

    return STATUS_DISPLAY.pending;
  }

  get stateDisplay() {
    const t = this.$rootGetters['i18n/t'];

    return t(this.claimStatusDisplay.displayKey);
  }

  get stateBackground() {
    return this.claimStatusDisplay.color;
  }

  // 'enable' passthrough creates the passthrough claim CRD -
  async enablePassthrough() {
    // isSingleProduct == this is a standalone Harvester cluster
    const isSingleProduct = this.$rootGetters['isSingleProduct'];
    let userName = 'admin';

    // if this is imported Harvester, there may be users other than 'admin
    if (!isSingleProduct) {
      userName = this.$rootGetters['auth/v3User']?.username;
    }

    const pt = await this.$dispatch(`create`, {
      type:     HCI.PCI_CLAIM,
      metadata: {
        name:            this.metadata.name,
        ownerReferences: [{
          apiVersion: 'devices.harvesterhci.io/v1beta1',
          kind:       'PCIDevice',
          name:       this.metadata.name,
          uid:        this.metadata.uid,
        }]
      },
      spec:     {
        address:  this.status.address,
        nodeName:   this.status.nodeName,
        userName
      }
    } );

    try {
      await pt.save();
    } catch (err) {
      this.$dispatch('growl/fromError', {
        title: this.$rootGetters['i18n/t']('harvester.pci.claimError', { name: escapeHtml(this.metadata.name) }),
        err,
      }, { root: true });
    }
  }

  // 'disable' passthrough deletes claim
  // backend should return error if device is in use
  async disablePassthrough() {
    try {
      if (!this.claimedByMe) {
        throw new Error(this.$rootGetters['i18n/t']('harvester.pci.cantUnclaim', { name: escapeHtml(this.metadata.name) }));
      } else {
        await this.passthroughClaim.remove();
      }
    } catch (err) {
      this.$dispatch('growl/fromError', {
        title: this.$rootGetters['i18n/t']('harvester.pci.unclaimError', { name: escapeHtml(this.metadata.name) }),
        err,
      }, { root: true });
    }
  }

  // group device list by node
  get groupByNode() {
    const name = this.status?.nodeName || this.$rootGetters['i18n/t']('generic.none');

    return this.$rootGetters['i18n/t']('resourceTable.groupLabel.node', { name: escapeHtml(name) });
  }

  // group device list by unique device (same vendorid and deviceid)
  get groupByDevice() {
    return this.status?.description;
  }
}
