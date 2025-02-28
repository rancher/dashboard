import HybridModel from '@shell/plugins/steve/hybrid-class';

const HIDDEN = ['rke', 'rancherkubernetesengine'];

const V2 = ['amazoneks', 'googlegke', 'azureaks'];
const IMPORTABLE = ['amazoneks', 'googlegke', 'azureaks'];

// The Ember create page has short names that don't match the full kontainer driver
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

// Legacy KEV1 Hosted cluster drivers
export const KEV1 = [
  'amazonelasticcontainerservice',
  'azurekubernetesservice',
  'googlekubernetesengine',
];

// And the Import page has even shorter ones that don't match kontainer or create...
export const DRIVER_TO_IMPORT = {
  googlegke: 'gke',
  amazoneks: 'eks',
  azureaks:  'aks',
};

export default class KontainerDriver extends HybridModel {
  get showCreate() {
    if ( HIDDEN.includes(this.driverName) ) {
      return false;
    }

    return !!this.spec.active;
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
    if (!this.spec.builtIn) {
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
}
