const credentialOptions = {
  aws:          { publicKey: 'accessKey', publicMode: 'full' },
  digitalocean: { publicKey: 'accessToken', publicMode: 'prefix' },
  azure:        { publicKey: 'clientId', publicMode: 'full' },
};

// Dynamically loaded drivers can call this eventually to register thier options
export function configureCredential(name, opt) {
  credentialOptions[name] = opt;
}

export const state = function() {
  return {};
};

export const getters = {
  credentialDrivers() {
    const ctx = require.context('@/cloud-credential', true, /.*/);

    const drivers = ctx.keys().filter(path => !path.match(/\.(vue|js)$/)).map(path => path.substr(2));

    return drivers;
  },

  credentialOptions() {
    return (name) => {
      return credentialOptions[name] || {};
    };
  },

  machineDrivers() {
    // The subset of drivers supported by Vue
    const ctx = require.context('@/machine-config', true, /.*/);

    const drivers = ctx.keys().filter(path => !path.match(/\.(vue|js)$/)).map(path => path.substr(2));

    return drivers;
  },

  clusterDrivers() {
    // The subset of drivers supported by Vue
    return [];
  },
};
