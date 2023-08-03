import { NAMESPACE_FILTER_ALL_SYSTEM, NAMESPACE_FILTER_ALL_USER } from '@shell/utils/namespace-filter';
import { NAMESPACE } from '@shell/config/types';
import { ALL_NAMESPACES } from '@shell/store/prefs';
import { mapGetters } from 'vuex';
import { ResourceListComponentName } from '../components/ResourceList/resource-list.config';
import stevePaginationUtils from '@shell/plugins/steve/pagination-utils';

/**
 * Companion mixin used with `resource-fetch` for `ResourceList` to determine if the user needs to filter the list by a single namespace
 */
export default {

  data() {
    return {
      forceUpdateLiveAndDelayed: 0,
      // This of type `OptPagination`
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
      this.pPagination = {
        // namespaces: this.namespaceFilters,
        ...this.pPagination,
        page:     event.page,
        pageSize: event.perPage,
        sort:     event.sort?.map((field) => ({
          field,
          asc: !event.descending
        })),
        filter: event.filter.searchQuery ? event.filter.searchFields.map((field) => ({
          field,
          value: event.filter.searchQuery,
        })) : []
      };
      console.warn('mixin', 'method', 'paginationChanged', this.pPagination); // eslint-disable-line no-console
    }
  },

  computed: {
    ...mapGetters(['currentProduct', 'namespaceFilters']),

    canPaginate() {
      return this.__paginationRequired && !!this.paginationHeaders?.length;
    },

    /**
     * Returns the namespace that requests should be filtered by
     */
    pagination() {
      console.warn('mixin', 'computed', 'pagination', this.canPaginate, this.pPagination); // eslint-disable-line no-console

      return this.canPaginate ? this.pPagination : '';
    },

    paginationHeaders() {
      return this.$store.getters['type-map/paginationHeadersFor'](this.schema);
    },

    /**
     * Do we need to filter the list by a namespace? This will control whether the user is shown an error
     *
     * We shouldn't show an error on pages with resources that aren't namespaced
     */
    __paginationRequired() {
      if (!stevePaginationUtils.isEnabled({ rootGetters: this.$store.getters })) {
        return false;
      }

      return this.__areResourcesNamespaced;
    },

    paginationResult() {
      return this.havePaginated?.result;
    },

    havePaginated() {
      // Only currently works with cluster store, so no need to worry about the store the resources are in
      return this.$store.getters[`cluster/havePaginated`](this.resource);
    },

  },

  watch: {
    namespaceFilters: {
      immediate: true,
      async handler(neu) {
        const isAll = this.$store.getters['isAllNamespaces'];

        const namespaced = this.schema.attributes.namespaced;
        const paginationRequires = this.canPaginate;

        if (!namespaced || !paginationRequires) {
          return;
        }

        const pref = this.$store.getters['prefs/get'](ALL_NAMESPACES);
        const hideSystemResources = this.currentProduct.hideSystemResources;

        const allButHidingSystemResources = isAll && (hideSystemResources || pref);

        let namespaces = neu;

        const allNamespaces = this.$store.getters[`${ this.inStore }/all`](NAMESPACE);

        if (allButHidingSystemResources) {
          // Determine the disallowed namespaces (rather than possibly thousands of allowed)
          namespaces = allNamespaces
            .filter((ns) => {
              const isObscure = pref ? false : ns.isObscure; // Filter out Rancher system namespaces
              const isSystem = hideSystemResources ? ns.isSystem : false; // Filter out Fleet system namespaces

              return isObscure || isSystem;
            })
            .map((ns) => `-${ ns.name }`);
        } else if (neu.length === 1) {
          const allSystem = allNamespaces.filter((ns) => ns.isSystem);

          if (neu[0] === NAMESPACE_FILTER_ALL_SYSTEM) {
            // get a list of all system namespaces
            namespaces = allSystem.map((ns) => `${ ns.name }`);
          } else if (neu[0] === NAMESPACE_FILTER_ALL_USER) {
            // Determine the disallowed namespaces (rather than possibly thousands of allowed)
            namespaces = allSystem.map((ns) => `-${ ns.name }`);
          }
        }

        this.pPagination = {
          ...this.pPagination,
          namespaces,
        };
      }
    },

    async pagination(neu) {
      console.warn('mixin', 'watch', 'pagination', this.pagination); // eslint-disable-line no-console

      // TODO: RC TEST - this shouldn't fire on lists that don't support pagination

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
  },
};
