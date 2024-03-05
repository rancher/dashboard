import Vue from 'vue';
import { clone } from '@shell/utils/object';
import { insertAt } from '@shell/utils/array';
import HybridModel from '@shell/plugins/steve/hybrid-class';
const HIDDEN = ['rke', 'rancherkubernetesengine'];

const IMPORTABLE = ['amazoneks', 'googlegke', 'azureaks'];

const defaultSpec = {
  active:           true,
  checksum:         '',
  url:              '',
  uiUrl:            '',
  whitelistDomains: []
};

export const KONTAINER_TO_DRIVER = {
  amazonelasticcontainerservice:    'amazoneks',
  azurekubernetesservice:           'azureaks',
  aks:                              'azureaksv2', // Guessing it will be called this...
  eks:                              'amazoneksv2',
  gke:                              'googlegkev2',
  googlekubernetesengine:           'googlegke',
  huaweicontainercloudengine:       'huaweicce', // Does this actually exist?
  huaweiengine:                     'huaweicce',
  linodekubernetesengine:           'linodelke', // Does this actually exist?
  lke:                              'linodelke',
  lkeengine:                        'linodelke',
  okeengine:                        'oracleoke',
  oke:                              'oracleoke',
  oraclecontainerengine:            'oracleoke', // Does this actually exist?
  rke2:                             'rke2',
  tencentengine:                    'tencenttke',
  tencentkubernetesengine:          'tencenttke', // Does this actually exist?
  aliyunkubernetescontainerservice: 'aliyun',
  baiducloudcontainerengine:        'baidu',
  opentelekomcloudcontainerengine:  'otccce',
};

// And the Import page has even shorter ones that don't match kontainer or create...
export const DRIVER_TO_IMPORT = {
  googlegke: 'gke',
  amazoneks: 'eks',
  azureaks:  'aks',
};

export default class Driver extends HybridModel {
  applyDefaults() {
    if ( !this.spec ) {
      Vue.set(this, 'spec', clone(defaultSpec));
    }
  }

  get _availableActions() {
    const out = super._availableActions;

    insertAt(out, 0, {
      action:   'deactivate',
      label:    'Deactivate',
      icon:     'icon icon-pause',
      bulkable: true,
      enabled:  !!this.links.update && !!this.spec?.active
    });

    insertAt(out, 1, {
      action:   'activate',
      label:    'Activate',
      icon:     'icon icon-play',
      bulkable: true,
      enabled:  !!this.links.update && !this.spec?.active
    });

    return out;
  }

  get showCreate() {
    if ( HIDDEN.includes(this.driverName) ) {
      return false;
    }

    return !!this.spec.active;
  }

  get showImport() {
    return this.showCreate && IMPORTABLE.includes(this.driverName);
  }

  get driverName() {
    if (!this.spec?.builtIn) {
      // if the driver is not built in, there's a good change its a custom one
      // custom drivers have a random id, so shouldn't be used as the type
      // instead use the status.displayName. this will map to the name extracted from the binary
      const driverName = this.status?.displayName?.toLowerCase();

      if (driverName) {
        // some drivers are built in but don't have the builtIn flag. ensure we pass these through K_TO_D
        return KONTAINER_TO_DRIVER[driverName] || driverName;
      }
    }

    return KONTAINER_TO_DRIVER[this.id] || this.id;
  }

  get nameDisplay() {
    const path = `cluster.provider.${ this.driverName }`;
    const label = this.driverName || this.metadata?.name || this.id;

    return this.$rootGetters['i18n/withFallback'](path, label);
  }

  get description() {
    if (!!this.spec?.builtIn || !!this.spec?.builtin) {
      return this.$rootGetters['i18n/withFallback']('tableHeaders.builtIn');
    } else {
      return this.spec?.url;
    }
  }

  get norman() {
    return (async() => {
      const norman = await this.basicNorman;

      norman.active = this.spec.active;
      norman.checksum = this.spec.checksum;
      norman.url = this.spec.url;
      norman.uiUrl = this.spec.uiUrl;
      norman.whitelistDomains = this.spec.whitelistDomains;
      norman.active = this.spec.active;

      return norman;
    })();
  }

  async save() {
    const norman = await this.norman;

    await norman.save();
  }

  async remove() {
    const norman = await this.norman;

    await norman.remove();
  }
}
