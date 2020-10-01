import Vue from 'vue';

export default {
  applyDefaults() {
    return () => {
      Vue.set(this, 'spec', {
        accessModes: [], storageClassName: '', volumeName: '', resources: { requests: { storage: null } }
      });
    };
  },
};
