import { mapGetters } from 'vuex';
import { ResourceListComponentName } from '../components/ResourceList/resource-list.config';

/**
 * Companion mixin used with `resource-fetch` for `ResourceList` to determine if the user needs to filter the list by a single namespace TODO: RC
 */
export default {

  data() {
    return { forceUpdateLiveAndDelayed: 0 }; // TODO: RC
  },

  methods: {
    haveAllPaginated(type) {
      return this.$store.getters['haveAllPaginated'](type);
    },
  },

  computed: {
    ...mapGetters(['currentProduct', 'currentCluster']),

    // /**
    //  * Does the user need to update the filter to supply a single namespace?
    //  */
    // namespaceFilterRequired() {
    //   return this.__namespaceRequired && !this.__validFilter;
    // },
    // __validFilter

    /**
     * Returns the namespace that requests should be filtered by
     */
    pagination() {
      // TODO: RC get from  store
      // TODO: RC sortable table --> store
      const pagination = {
        page:      1,
        total:     10,
        filter:    '',
        namespace: undefined,
        sort:      {
          field:     undefined,
          direction: undefined,
        }
      };

      return this.__paginationRequired ? pagination : '';
    },

    /**
     * Do we need to filter the list by a namespace? This will control whether the user is shown an error
     *
     * We shouldn't show an error on pages with resources that aren't namespaced
     */
    __paginationRequired() {
      // if (!pAndNFiltering.isEnabled(this.$store.getters)) {
      //   return false;
      // }

      // return this.__areResourcesNamespaced;

      return true;
    },

  },

  watch: {
    async pagination(neu) {
      // TODO: RC if not namespaced,  don't bother with ns      this.__areResourcesNamespaced

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
