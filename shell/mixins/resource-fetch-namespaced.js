import { NAMESPACE_FILTER_KINDS, NAMESPACE_FILTER_NS_PREFIX, NAMESPACE_FILTER_P_PREFIX } from 'utils/namespace-filter';
import { mapGetters } from 'vuex';
import { ResourceListComponentName } from '../components/ResourceList/resource-list.config';
import richardsLogger from '@shell/utils/richards-logger';


/**
 * Companion mixin used with `resource-fetch` for `ResourceList` to determine if the user needs to filter the list by a single namespace
 */
export default {

  data() {
    return { forceUpdateLiveAndDelayed: 0 };
  },

  computed: {
    ...mapGetters(['currentProduct', 'currentCluster', 'namespaceFilters']),

    /**
     * Does the user need to update the filter to supply a single namespace?
     */
    namespaceFilterRequired() {
      richardsLogger.warn('rfn', 'namespaceFilterRequired', this.__namespaceRequired, this.__validFilter)

      return this.__namespaceRequired && !this.__validFilter;
    },

    /**
     * Returns the namespace that requests should be filtered by
     */
    namespaceFilter() {
      richardsLogger.warn('rfn', 'namespaceFilters', this.namespaceFilters)

      return this.__namespaceRequired ? this.__validFilter : '';
    },

    /**
     * If the Project/Namespace filter from the header contains a valid ns / project filter ... return it
     */
    __validFilter() {
      const valid = this.namespaceFilters.every(f => f.startsWith(NAMESPACE_FILTER_NS_PREFIX) || f.startsWith(NAMESPACE_FILTER_P_PREFIX))
      richardsLogger.warn('rfn', '__validFilter', valid, this.namespaceFilters)
      return valid ? this.namespaceFilters : null;
    },

    /**
     * Do we need to filter the list by a namespace?
     */
    __namespaceRequired() {
      if (!this.perfConfig.forceNsFilterV2?.enabled) {
        return false;
      }

      return !this.currentProduct.showWorkspaceSwitcher && this.__areResourcesNamespaced;
    },

    /**
     * Are all core list resources namespaced?
     */
    __areResourcesNamespaced() {
      return (this.loadResources || []).every((type) => {
        const schema = this.$store.getters['cluster/schemaFor'](type);// TODO: RC test fleet, cluster management isn't included

        return schema?.attributes?.namespaced;
      });
    },

  },

  watch: {
    __namespaceRequired: {
      handler(neu) {
        richardsLogger.warn('rfn', 'watch __namespaceRequired', neu);
        this.$store.dispatch('setNamespaceFilterMode', neu ? [NAMESPACE_FILTER_KINDS.NAMESPACE, NAMESPACE_FILTER_KINDS.PROJECT]: null, { root: true });
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
