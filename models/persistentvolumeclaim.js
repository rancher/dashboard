
import { _CLONE } from '@/config/query-params';
import Vue from 'vue';

export default {
  applyDefaults() {
    return (_, realMode) => {
      const accessModes = realMode === _CLONE ? this.spec.accessModes : [];
      const storage = realMode === _CLONE ? this.spec.resources.requests.storage : null;

      Vue.set(this, 'spec', {
        accessModes,
        storageClassName: '',
        volumeName:       '',
        resources:        { requests: { storage } }
      });
    };
  },
};
