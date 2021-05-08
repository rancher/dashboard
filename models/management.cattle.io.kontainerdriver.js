const HIDDEN = ['rke'];
const V2 = ['amazoneks', 'googlegke'];
const IMPORTABLE = ['amazoneks', 'googlegke'];

// The Ember create page has short names that don't match the full kontainer driver
const KONTAINER_TO_DRIVER = {
  azurekubernetesservice:        'azureaks',
  googlekubernetesengine:        'googlegke',
  rancherkubernetesengine:       'rke',
  amazonelasticcontainerservice: 'amazoneks',
  tencentkubernetesengine:       'tencenttke',
  huaweicontainercloudengine:    'huaweicce',
  oraclecontainerengine:         'oracleoke',
  linodekubernetesengine:        'linodelke',
};

// And the Import page has even shorter ones that don't match kontainer or create...
const DRIVER_TO_IMPORT = {
  googlegke: 'gke',
  amazoneks: 'eks',
  azureaks:  'aks',
};

export default {
  showCreate() {
    if ( HIDDEN.includes(this.driverName) ) {
      return false;
    }

    return !!this.spec.active;
  },

  showRegister() {
    return this.showCreate && IMPORTABLE.includes(this.driverName);
  },

  emberCreatePath() {
    let driver = this.driverName;

    if ( V2.includes(driver) ) {
      driver += 'v2';
    }

    return `/g/clusters/add/launch/${ driver }`;
  },

  emberRegisterPath() {
    const provider = DRIVER_TO_IMPORT[this.driverName] || this.driverName;

    return `/g/clusters/add/launch/import?importProvider=${ provider }`;
  },

  driverName() {
    return KONTAINER_TO_DRIVER[this.id] || this.id;
  },
};
