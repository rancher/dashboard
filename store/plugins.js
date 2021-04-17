export const state = function() {
  return {};
};

export const actions = {};

export const getters = {
  credentialDrivers() {
    const ctx = require.context('@/cloud-credential', true, /.*/);

    const drivers = ctx.keys().filter(path => !path.match(/\.(vue|js)$/)).map(path => path.substr(2));

    return drivers;
  },

  machineDrivers() {
    // @TODO enable/disable based on what the API says, generic driver support
    const ctx = require.context('@/machine-config', true, /.*/);

    const drivers = ctx.keys().filter(path => !path.match(/\.(vue|js)$/)).map(path => path.substr(2));

    return drivers;
  },

  clusterDrivers() {
    // @TODO Read from somewhere actually dynamic
    return ['amazoneks', 'googlegke', 'azureaks'];
  },
};
