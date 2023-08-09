import { NAMESPACE_FILTER_ALL_SYSTEM, NAMESPACE_FILTER_ALL_USER } from '@shell/utils/namespace-filter';
import { mapGetters } from 'vuex';
import { ResourceListComponentName } from '../components/ResourceList/resource-list.config';

/**
 * Companion mixin used with `resource-fetch` for `ResourceList` to determine if the user needs to filter the list by a single namespace TODO: RC
 */
export default {

  data() {
    return {
      forceUpdateLiveAndDelayed: 0,
      // : OptPagination // TODO: RC
      pPagination:               {
        namespaces: undefined,
        page:       1,
        pageSize:   10,
        sort:       [],
        filter:     {}
      }
    };
  },

  methods: {
    haveAllPaginated(type) {
      return this.$store.getters['haveAllPaginated'](type);
    },

    paginationChanged(event) {
      console.warn('mixin', 'method', 'paginationChanged', event);

      // TODO: RC wire in currentProduct?.hideSystemResources to namespaces?
      this.pPagination = {
        // namespaces: this.namespaceFilters,
        ...this.pPagination,
        page:     event.page,
        pageSize: event.perPage,
        // TODO: RC document. headers. sort
        // `nameSort` --> path of name
        // `namespace` --> metadata.namespaces
        // `subTypeDisplay` --> `_type` (minus localisation and fallback)
        sort:     event.sort?.map((field) => ({
          field,
          asc: !event.descending
        })),
        // TODO: RC document. headers. filter
        // searchFields contains fns (getValue) to find the value to apply the searchQuery to
        filter: event.filter.searchQuery ? event.filter.searchFields.map((field) => ({
          field,
          value: event.filter.searchQuery,
        })) : []
      };
      console.warn('mixin', 'method', 'paginationChanged', this.pPagination);
    }
  },

  computed: {
    ...mapGetters(['currentProduct', 'currentCluster', 'namespaceFilters', 'namespaces', 'currentStore']), // TODO: RC currentStore
    /**
     * Returns the namespace that requests should be filtered by
     */
    pagination() {
      // TODO: RC get from  store (including revision)
      // TODO: RC sortable table --> store
      console.warn('mixin', 'pagination', 'pagination', this.__paginationRequired, this.pPagination);

      return this.__paginationRequired ? this.pPagination : '';
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

    paginationResult() {
      return this.havePaginated?.result;
    },

    havePaginated() {
      return this.$store.getters[`cluster/havePaginated`](this.resource); // TODO: RC
    },

  },

  watch: {
    async namespaceFilters(neu) {
      const isAll = this.$store.getters['isAllNamespaces'];

      const namespaced = this.schema.attributes.namespaced;

      if (
        !namespaced ||
        isAll || // this.currentProduct?.hideSystemResources // TODO: RC oh lordy
        !this.__paginationRequired
      ) {
        return;
      }

      if (neu.length === 1) {
        // ---------- make common
        // const allNamespaces = this.$store.getters[`${ this.inStore }/all`](NAMESPACE);
        // const allowedNamespaces = allNamespaces
        //   .filter((ns) => state.prefs.data['all-namespaces'] ? true : !ns.isObscure); // Filter out Rancher system namespaces
        // .filter((ns) => product.hideSystemResources ? !ns.isSystem : true); // Filter out Fleet system namespaces

        // ---------

        if (neu[0] === NAMESPACE_FILTER_ALL_SYSTEM) {
          // get a list of all system namespaces

          return ;
        }

        if (neu[0] === NAMESPACE_FILTER_ALL_USER) {
          // get a list of all system namespaces... and NOT them

          return ;
        }
      }

      // ALL_SYSTEM
      // ALL_USER
      // ALL_ORPHANS
      // export const NAMESPACE_FILTER_ALL_SYSTEM = `${ NAMESPACE_FILTER_ALL_PREFIX }://system`;
      // export const NAMESPACE_FILTER_ALL_USER = `${ NAMESPACE_FILTER_ALL_PREFIX }://user`;
      // export const NAMESPACE_FILTER_ALL_ORPHANS = `${ NAMESPACE_FILTER_ALL_PREFIX }://orphans`;

      this.pPagination = {
        ...this.pPagination,
        namespaces: neu,
      };
    },

    async pagination(neu) {
      console.warn('mixin', 'watch', 'pagination', this.pagination);

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
          // TODO: RC
          await this.$fetch();
        }
        // Ensure any live/delayed columns get updated
        this.forceUpdateLiveAndDelayed = new Date().getTime();
      }
    }
  },
};
