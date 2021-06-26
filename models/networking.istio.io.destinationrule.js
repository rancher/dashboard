import Vue from 'vue';

export default {

  applyDefaults() {
    return () => {
      Vue.set(
        this, 'spec', {
          subsets:       [],
          trafficPolicy: {}
        });
    };
  },
};
