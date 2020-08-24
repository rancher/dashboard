import Vue from 'vue';

export default {
  applyDefaults() {
    return () => {
      Vue.set(this, 'spec', { accessModes: [], resources: { requests: { storage: null } } });
    };
  },
};
