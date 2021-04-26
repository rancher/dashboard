import { SYSTEM_PROJECT } from '@/config/labels-annotations';
import { NAMESPACE } from '@/config/types';

export default {
  isSystem() {
    return this.metadata?.labels?.[SYSTEM_PROJECT] === 'true';
  },

  namespaces() {
    // I don't know how you'd end up with a project outside of rancher, but just in case...
    if ( !this.$rootGetters['isRancher'] ) {
      return [];
    }

    const all = this.$rootGetters['cluster/all'](NAMESPACE);

    return all.filter((ns) => {
      return ns.projectId === this.metadata.name;
    });
  },

  listLocation() {
    return { name: 'c-cluster-product-projectsnamespaces' };
  },

  parentLocationOverride() {
    return this.listLocation;
  },

  shortId() {
    return this.id.split('/')[1];
  }
};
