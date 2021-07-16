import Vue from 'vue';

export default {
  applyDefaults() {
    return () => {
      Vue.set(
        this, 'spec', this.defaultSpec);
    };
  },

  defaultSpec() {
    return {
      host:          '',
      subsets:       [],
      trafficPolicy: {
        loadBalancer:   { simple: 'ROUND_ROBIN' },
        connectionPool: {
          tcp:  {},
          http: {},
        },
        outlierDetection: {},
        tls:              {},
      }
    };
  }
};
