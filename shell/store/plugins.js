import { removeObjects } from '@shell/utils/array';

export function simplify(key) {
  return key.toLowerCase().replace(/[^a-z0-9]/ig, '');
}

const credentialOptions = {
  aws:          {
    publicKey:  'accessKey',
    publicMode: 'full',
    keys:       ['region', 'accessKey', 'secretKey']
  },
  digitalocean: {
    publicKey:  'accessToken',
    publicMode: 'prefix',
    keys:       'accessToken'
  },
  azure:        {
    publicKey:  'clientId',
    publicMode: 'full',
    keys:       ['subscriptionId', 'tenantId', 'clientId', 'clientSecret']
  },
  linode: {
    publicKey:  'token',
    publicMode: 'prefix',
    keys:       'token'
  }
};

// Credential drivers that rke1 supports
export const rke1Supports = [
  'aws',
  'azure',
  'digitalocean',
  'gcp',
  'harvester',
  'linode',
  'oracle',
  'pnap',
  'vmwarevsphere'
];

// Map a credential driver name to a component name
// e.g. ec2 and eks both use the 'aws' driver to share the same pool of creds.
const driverMap = {
  aks:                             'azure',
  amazonec2:                       'aws',
  amazoneks:                       'aws',
  amazonelasticcontainerservice:   'aws',
  azurekubernetesservice:          'azure',
  google:                          'gcp',
  googlekubernetesengine:          'gcp',
  huaweicontainercloudengine:      'huawei',
  linodekubernetesengine:          'linode',
  oci:                             'oracle',
  opentelekomcloudcontainerengine: 'otc',
  oraclecontainerengine:           'oracle',
};

// Map a driver component back to the cloud credential field name their data has to be stored in
const driverToFieldMap = {
  aws:    'amazonec2',
  gcp:    'google',
  oracle: 'oci',
};

// Machine driver fields that are probably a credential field
export const likelyFields = [
  'username', 'password',
  'accesskey', 'secretkey',
  'accesskeyid', 'secretkeyid', 'accesskeysecret',
  'token', 'apikey',
  'secret',
  'clientid', 'clientsecret', 'subscriptionid', 'tenantid',
].map(x => simplify(x));

// Machine driver fields that are maaaaybe a credential field
export const iffyFields = [
  'location', 'region',
].map(x => simplify(x));

// Machine driver fields that are safe to display the whole value
export const fullFields = [
  'username',
  'accesskey',
  'accesskeyid',
  'clientid'
].map(x => simplify(x));

// Machine driver fields that are safe to display the beginning of
export const prefixFields = [
  'token',
  'apikey',
  'secret',
].map(x => simplify(x));

// Machine driver fields that are safe to display the end of
export const suffixFields = [
].map(x => simplify(x));

// Machine driver to cloud provider mapping
const driverToCloudProviderMap = {
  amazonec2:     'aws',
  azure:         'azure',
  digitalocean:  '', // Show restricted options
  harvester:     'harvester',
  linode:        '', // Show restricted options
  vmwarevsphere: 'rancher-vsphere',

  custom: undefined // Show all options
};

// Dynamically loaded drivers can call this eventually to register their options
export function configureCredential(name, opt) {
  credentialOptions[name] = opt;
}

// Map a driver to a different credential name, e.g. amazonec2 and amazoneks both use the 'aws' credential type.
export function mapDriver(name, to) {
  driverMap[name] = to;
}

export const state = function() {
  return {};
};

export const getters = {
  credentialDrivers() {
    const ctx = require.context('@shell/cloud-credential', true, /.*/);

    const drivers = ctx.keys().filter(path => !path.match(/\.(vue|js)$/)).map(path => path.substr(2));

    return drivers;
  },

  credentialOptions() {
    return (name) => {
      name = (name || '').toLowerCase();

      return credentialOptions[name] || {};
    };
  },

  credentialDriverFor() {
    return (name) => {
      name = (name || '').toLowerCase();

      return driverMap[name] || name;
    };
  },

  credentialFieldForDriver() {
    return (name) => {
      name = (name || '').toLowerCase();

      return driverToFieldMap[name] || name;
    };
  },

  machineDrivers() {
    // The subset of drivers supported by Vue components
    const ctx = require.context('@shell/machine-config', true, /.*/);

    const drivers = ctx.keys().filter(path => !path.match(/\.(vue|js)$/)).map(path => path.substr(2));

    return drivers;
  },

  clusterDrivers() {
    // The subset of drivers supported by Vue components
    return [];
  },

  schemaForDriver(state, getters, rootState, rootGetters) {
    return (name) => {
      const id = `rke-machine-config.cattle.io.${ name }config`;
      const schema = rootGetters['management/schemaFor'](id);

      return schema;
    };
  },

  fieldNamesForDriver(state, getters) {
    return (name) => {
      const schema = getters.schemaForDriver(name);

      if ( !schema ) {
        // eslint-disable-next-line no-console
        console.error(`Machine Driver Config schema not found for ${ name }`);

        return [];
      }

      const out = Object.keys(schema?.resourceFields || {});

      removeObjects(out, ['apiVersion', 'dockerPort', 'kind', 'metadata']);

      return out;
    };
  },

  fieldsForDriver(state, getters) {
    return (name) => {
      const schema = getters.schemaForDriver(name);
      const names = getters.fieldNamesForDriver(name);

      const out = {};

      for ( const n of names ) {
        out[n] = schema.resourceFields[n];
      }

      return out;
    };
  },

  cloudProviderForDriver() {
    return (name) => {
      return driverToCloudProviderMap[name];
    };
  },
};
