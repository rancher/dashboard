import Vue from 'vue';
import cluster, { DEFAULT_WORKSPACE } from '@/models/provisioning.cattle.io.cluster';

export default {
  ...cluster,

  applyDefaults() {
    return () => {
      if ( !this.spec ) {
        Vue.set(this, 'spec', { agentEnvVars: [] });
        Vue.set(this, 'metadata', { namespace: DEFAULT_WORKSPACE });
      }
    };
  },

  isReady() {
    // If the Connected condition exists, use that (2.6+)
    if ( this.hasCondition('Connected') ) {
      return this.isCondition('Connected');
    }

    // Otherwise use Ready (older)
    return this.isCondition('Ready');
  },

  canEdit() {
    return false;
  },
};
