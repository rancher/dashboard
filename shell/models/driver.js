import Vue from 'vue';
import { DESCRIPTION } from '@shell/config/labels-annotations';
import { clone } from '@shell/utils/object';
import NormanModel from '@shell/plugins/steve/norman-class';

const HIDDEN = ['rke', 'rancherkubernetesengine'];
const V2 = ['amazoneks', 'googlegke', 'azureaks'];
const IMPORTABLE = ['amazoneks', 'googlegke', 'azureaks'];

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

export default class Driver extends NormanModel {
  get showCreate() {
    if ( HIDDEN.includes(this.driverName) ) {
      return false;
    }

    return !!this.active;
  }

  get canViewYaml() {
    return false;
  }

  get showImport() {
    return this.showCreate && IMPORTABLE.includes(this.driverName);
  }

  get emberCreatePath() {
    let driver = this.driverName;

    if ( V2.includes(driver) && !driver.endsWith('v2') ) {
      driver += 'v2';
    }

    return `/g/clusters/add/launch/${ driver }`;
  }

  get emberImportPath() {
    const provider = DRIVER_TO_IMPORT[this.driverName] || this.driverName;

    return `/g/clusters/add/launch/import?importProvider=${ provider }`;
  }

  get driverName() {
    if (!this.builtIn) {
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
    const label = this.driverName || this.name || this.id;

    return this.$rootGetters['i18n/withFallback'](path, label);
  }

  get description() {
    if (!!this.builtIn || !!this.builtin) {
      return this.$rootGetters['i18n/withFallback']('tableHeaders.builtIn');
    } else {
      return this.url;
    }
  }

  /**
   * Set description based on the type of model available with private fallback
   */
  set description(value) {
    if (this.annotations) {
      this.annotations[DESCRIPTION] = value;
    }

    this._description = value;
  }

  async save(opt) {
    const clone = await this.$dispatch('clone', { resource: this });

    clone.active = true;
    delete clone.metadata;

    return clone._save(opt);
  }
}
