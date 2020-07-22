import { SYSTEM_PROJECT } from '@/config/labels-annotations';
import { NAMESPACE } from '@/config/types';

export default {
  isSystem() {
    return this.metadata?.labels?.[SYSTEM_PROJECT] === 'true';
  },

  longId() {
    return `${ this.spec.clusterName }:${ this.metadata.name }`;
  },

  namespaces() {
    // I don't know how you'd end up with a project outside of rancher, but just in case...
    if ( !this.$rootGetters['isMultiCluster'] ) {
      return [];
    }

    const all = this.$rootGetters['cluster/all'](NAMESPACE);

    return all.filter((ns) => {
      return ns.projectId === this.id;
    });
  }
};
