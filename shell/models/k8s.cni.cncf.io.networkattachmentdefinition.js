import SteveModel from '@shell/plugins/steve/steve-class';
import { HCI } from '@shell/config/labels-annotations';

export default class NetworkAttachmentDef extends SteveModel {
  applyDefaults() {
    const spec = this.spec || {
      config: JSON.stringify({
        cniVersion:  '0.3.1',
        name:        '',
        type:        'bridge',
        bridge:      '',
        promiscMode: true,
        vlan:        '',
        ipam:        {}
      })
    };

    this['spec'] = spec;
  }

  get parseConfig() {
    try {
      return JSON.parse(this.spec.config) || {};
    } catch (err) {
      return {};
    }
  }

  get isIpamStatic() {
    return this.parseConfig.ipam?.type === 'static';
  }

  get clusterNetwork() {
    return this?.metadata?.labels?.[HCI.CLUSTER_NETWORK];
  }

  get vlanType() {
    const labels = this.metadata?.labels || {};
    const type = labels[HCI.NETWORK_TYPE];

    return type;
  }

  get vlanId() {
    return this.vlanType === 'UntaggedNetwork' ? 'N/A' : this.parseConfig.vlan;
  }

  get customValidationRules() {
    const rules = [
      {
        nullable:       false,
        path:           'metadata.name',
        required:       true,
        minLength:      1,
        maxLength:      63,
        translationKey: 'harvester.fields.name'
      }
    ];

    return rules;
  }

  get connectivity() {
    const annotations = this.metadata?.annotations || {};
    const route = annotations[HCI.NETWORK_ROUTE];
    let config = {};

    if (this.vlanType === 'UntaggedNetwork') {
      return 'N/A';
    }

    try {
      config = JSON.parse(route || '{}');
    } catch {
      return 'invalid';
    }

    const connectivity = config.connectivity;

    if (connectivity === 'false') {
      return 'inactive';
    } else if (connectivity === 'true') {
      return 'active';
    } else {
      return connectivity;
    }
  }
}
