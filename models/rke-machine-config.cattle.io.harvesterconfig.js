import cloneDeep from 'lodash/cloneDeep';
import merge from 'lodash/merge';

export default {
  applyDefaults() {
    return (idx, machinePools) => {
      const _machinePools = cloneDeep(machinePools);

      if (_machinePools[idx]) {
        const copyConfig = _machinePools[idx]?.config;

        delete copyConfig.id;
        delete copyConfig.links;
        delete copyConfig.metadata;
        delete copyConfig.apiVersion;
        merge(this, copyConfig);
      }
    };
  },
};
