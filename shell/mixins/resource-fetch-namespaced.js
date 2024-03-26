import { NAMESPACE_FILTER_NS_PREFIX, NAMESPACE_FILTER_P_PREFIX } from '@shell/utils/namespace-filter';
import { mapGetters } from 'vuex';
import { ResourceListComponentName } from '../components/ResourceList/resource-list.config';
import pAndNFiltering from '@shell/plugins/steve/projectAndNamespaceFiltering.utils';

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
      return this.__namespaceRequired && !this.__validFilter;
    },

    /**
     * Returns the namespace that requests should be filtered by
     */
    namespaceFilter() {
      return this.__namespaceRequired ? this.__validFilter : '';
    },

    /**
     * If the Project/Namespace filter from the header contains a valid ns / project filter ... return it
     */
    __validFilter() {
      const valid = this.namespaceFilters.length && this.namespaceFilters.every((f) => f.startsWith(NAMESPACE_FILTER_NS_PREFIX) || f.startsWith(NAMESPACE_FILTER_P_PREFIX));

      return valid ? this.namespaceFilters : null;
    },

    /**
     * Do we need to filter the list by a namespace? This will control whether the user is shown an error
     *
     * We shouldn't show an error on pages with resources that aren't namespaced
     */
    __namespaceRequired() {
      if (!pAndNFiltering.isEnabled(this.$store.getters)) {
        return false;
      }

      return this.__areResourcesNamespaced;
    },

    /**
     * Are all core list resources namespaced?
     */
    __areResourcesNamespaced() {
      // Only enable for the cluster store at the moment. In theory this should work in management as well, as they're both 'steve' stores
      if (this.currentProduct.inStore !== 'cluster') {
        return false;
      }

      return (this.loadResources || []).every((type) => {
        const schema = this.$store.getters['cluster/schemaFor'](type);

        return schema?.attributes?.namespaced;
      });
    },

  },

  watch: {
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
