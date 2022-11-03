import { mapGetters } from 'vuex';

/**
 * Companion mixin used with `resource-fetch` for `ResourceList` to determine if the user needs to filter the list by a single namespace
 */
export default {

  computed: {
    ...mapGetters(['currentCluster', 'isSingleNamespace']),

    /**
     * Does the user need to update the filter to supply a single namespace?
     */
    namespaceFilterRequired() {
      return this.__namespaceRequired && !this.__singleNamespaceFilter;
    },

    /**
     * Returns the namespace that requests should be filtered by
     */
    namespaceFilter() {
      return this.__namespaceRequired ? this.__singleNamespaceFilter : '';
    },

    /**
     * If the Project/Namespace filter from the header contains a single NS... return it
     */
    __singleNamespaceFilter() {
      const ns = this.isSingleNamespace;

      return ns ? ns.replace('ns://', '') : '';
    },

    /**
     * Do we need to filter the list by a namespace?
     */
    __namespaceRequired() {
      if (!this.forceNsFilter?.enabled || this.perfConfig.forceNsFilter.threshold === undefined) {
        return false;
      }

      return this.__areResourcesNamespaced && this.__areResourcesTooMany;
    },

    /**
     * Are all core list resources namespaced?
     */
    __areResourcesNamespaced() {
      return (this.loadResources || []).every((type) => {
        const schema = this.$store.getters['cluster/schemaFor'](type);

        return schema?.attributes?.namespaced;
      });
    },

    /**
     * Are there too many core list resources to show in the list?
     */
    __areResourcesTooMany() {
      const count = this.__getCountForResources(this.loadResources);

      return count > this.perfConfig.forceNsFilter.threshold;
    },

  },
};
