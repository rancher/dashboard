import { mapGetters } from 'vuex';
import { ResourceListComponentName } from '../components/ResourceList/resource-list.config';

/**
 * Companion mixin used with `resource-fetch` for `ResourceList` to determine if the user needs to filter the list by a single namespace
 */
export default {

  data() {
    return { forceUpdateLiveAndDelayed: 0 };
  },

  computed: {
    ...mapGetters(['currentProduct', 'currentCluster', 'isSingleNamespace']),

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

      return !this.currentProduct.showWorkspaceSwitcher && this.__areResourcesNamespaced && this.__areResourcesTooMany;
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
      // __getCountForResources is defined on resource-fetch mixin...
      const count = this.__getCountForResources(this.loadResources);

      return count > this.perfConfig.forceNsFilter.threshold;
    },

  },

  watch: {
    __namespaceRequired: {
      handler(neu) {
        this.$store.dispatch('setNamespaceFilterMode', neu ? 'namespace' : null, { root: true });
      },
      immediate: true,
    },

    async namespaceFilter(neu) {
      if (neu) {
        // When a NS filter is required and the user selects a different one, kick off a new set of API requests
        //
        // ResourceList has two modes
        // 1) ResourceList component handles API request to fetch resources
        // 2) Custom list component handles API request to fetch resources
        //
        // This covers case 2
        if (this.$options.name !== ResourceListComponentName && !!this.$fetch) {
          await this.$fetch();
        }
        // Ensure any live/delayed columns get updated
        this.forceUpdateLiveAndDelayed = new Date().getTime();
      }
    }
  }
};
