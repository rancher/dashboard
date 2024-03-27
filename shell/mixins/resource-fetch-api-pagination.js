import { NAMESPACE_FILTER_NAMESPACED_YES, NAMESPACE_FILTER_NAMESPACED_NO, NAMESPACE_FILTER_ALL } from '@shell/utils/namespace-filter';
import { mapGetters } from 'vuex';
import { ResourceListComponentName } from '../components/ResourceList/resource-list.config';
import paginationUtils from '@shell/utils/pagination-utils';
import debounce from 'lodash/debounce';
import { OptPaginationFilter, OptPaginationFilterField } from '@shell/types/store/dashboard-store.types';
import stevePaginationUtils from '@shell/plugins/steve/steve-pagination-utils';
import { ALL_NAMESPACES } from '@shell/store/prefs';
import { NAMESPACE } from '@shell/config/types';

/**
 * Companion mixin used with `resource-fetch` for `ResourceList` to determine if the user needs to filter the list by a single namespace
 */
export default {

  data() {
    return {
      forceUpdateLiveAndDelayed: 0,
      /**
       * This of type `OptPagination`
       */
      pPagination:               null,
      // Avoid scenarios where namespace is updated just before other pagination changes come in
      debouncedSetPagination:    debounce(this.setPagination, 50),

      /**
       * Apply these additional filters given the ns / project header selection
       */
      requestFilters: {
        filters:              [],
        projectsOrNamespaces: [],
      },
    };
  },

  methods: {
    setPagination(pagination) {
      this.pPagination = pagination;
    },

    paginationChanged(event) {
      const searchFilters = event.filter.searchQuery ? event.filter.searchFields.map((field) => new OptPaginationFilterField({
        field,
        value: event.filter.searchQuery,
      })) : [];

      this.debouncedSetPagination({
        ...this.pPagination,
        page:     event.page,
        pageSize: event.perPage,
        sort:     event.sort?.map((field) => ({
          field,
          asc: !event.descending
        })),
        projectsOrNamespaces: this.requestFilters.projectsOrNamespaces,
        filter:               [
          new OptPaginationFilter({ fields: searchFilters }),
          ...this.requestFilters.filters, // Apply the additional filters. these aren't from the user but from ns filtering
        ]
      });
    },

    namespaceFilterChanged(neu) {
      if (!this.canPaginate || !this.schema?.attributes?.namespaced) {
        return;
      }

      const {
        projectsOrNamespaces,
        filters
      } = stevePaginationUtils.createParamsFromNsFilter({
        allNamespaces:                this.$store.getters[`${ this.currentProduct.inStore }/all`](NAMESPACE),
        selection:                    neu,
        isAllNamespaces:              this.isAllNamespaces,
        isLocalCluster:               this.$store.getters['currentCluster'].isLocal,
        showDynamicRancherNamespaces: this.showDynamicRancherNamespaces,
        productHidesSystemNamespaces: this.productHidesSystemNamespaces,
      });

      this.requestFilters.filters = filters;
      this.requestFilters.projectsOrNamespaces = projectsOrNamespaces;

      // Kick off a change
      this.debouncedSetPagination({ ...this.pPagination });
    },

    paginationEqual(neu, old) {
      if (!neu.page) {
        // Not valid, don't bother
        return false;
      }

      if (paginationUtils.paginationEqual(neu, old)) {
        // Same, nae bother
        return false;
      }

      return true;
    }
  },

  computed: {
    ...mapGetters(['currentProduct', 'namespaceFilters', 'isAllNamespaces']),

    /**
     * Does the user need to update the filter to supply valid options?
     */
    paginationNsFilterRequired() {
      return this.canPaginate && !this.__validPaginationNsFilter;
    },

    /**
     * Check if the Project/Namespace filter from the header contains a valid ns / project filter
     */
    __validPaginationNsFilter() {
      return paginationUtils.validateNsProjectFilters(this.namespaceFilters);
    },

    /**
     * ResourceList imports resource-fetch --> this mixin
     * When there is no custom list this is fine (ResourceList with mixins --> ResourceTable)
     * When there is a custom list there are two instances of this mixin (ResourceList with mixins --> CustomList with mixins --> ResourceTable)
     * - In this scenario, reduce churn by existing earlier if mixin is from parent ResourceList and leave work for CustomList mixins
     */
    isResourceList() {
      return !!this.hasListComponent;
    },

    /**
     * Is Pagination supported and ready for this list?
     */
    pagination() {
      if (this.isResourceList) {
        return;
      }

      return this.canPaginate ? this.pPagination : '';
    },

    /**
     * Should this list be paginated via API?
     */
    canPaginate() {
      if (this.isResourceList) {
        return;
      }

      return this.resource && paginationUtils.isEnabled({ rootGetters: this.$store.getters }, {
        store:    this.currentProduct.inStore,
        resource: { id: this.resource.id || this.resource }
      });
    },

    paginationResult() {
      if (this.isResourceList) {
        return;
      }

      return this.havePaginated?.result;
    },

    havePaginated() {
      if (this.isResourceList) {
        return;
      }

      return this.$store.getters[`${ this.currentProduct.inStore }/havePage`](this.resource);
    },

    /**
      * Links to ns.isSystem and covers things like ns with system annotation, hardcoded list, etc
      */
    productHidesSystemNamespaces() {
      return this.currentProduct.hideSystemResources;
    },

    /**
      * Links to ns.isObscure and covers things like `c-`, `user-`, etc (see OBSCURE_NAMESPACE_PREFIX)
      */
    showDynamicRancherNamespaces() {
      return this.$store.getters['prefs/get'](ALL_NAMESPACES);
    }
  },

  watch: {
    /**
     * Monitor the rows to ensure deleting the last entry in a server-side paginated page doesn't
     * result in an empty page
     */
    rows(neu) {
      if (!this.pagination || this.isResourceList) {
        return;
      }

      if (this.pagination.page > 1 && neu.length === 0) {
        this.setPagination({
          ...this.pagination,
          page: this.pagination.page - 1
        });
      }
    },

    namespaceFilters: {
      immediate: true,
      async handler(neu, old) {
        if (this.isResourceList) {
          return;
        }

        // Transitioning from no ns filters to no ns filters should be avoided
        const neuEmpty = !neu || neu.length === 0 || neu[0] === NAMESPACE_FILTER_ALL;
        const oldEmpty = !old || old.length === 0 || old[0] === NAMESPACE_FILTER_ALL;

        if (neuEmpty && oldEmpty) {
          const allButHidingSystemResources = this.isAllNamespaces && (!this.showDynamicRancherNamespaces || this.productHidesSystemNamespaces);

          // If we're showing all... and not hiding system or obscure ns then don't go through filter process
          if (!allButHidingSystemResources) {
            return;
          }
        }

        // Transitioning to a ns filter that doesn't affect the list should be avoided
        if (neu.length === 1) {
          if ([NAMESPACE_FILTER_NAMESPACED_YES, NAMESPACE_FILTER_NAMESPACED_NO].includes(neu[0])) {
            return;
          }
        }

        this.namespaceFilterChanged(neu);
      }
    },

    async pagination(neu, old) {
      if (this.isResourceList) {
        return;
      }

      // When a pagination is required and the user changes page / sort / filter, kick off a new set of API requests
      //
      // ResourceList has two modes
      // 1) ResourceList component handles API request to fetch resources
      // 2) Custom list component handles API request to fetch resources
      //
      // This covers case 2
      if (neu && this.$options.name !== ResourceListComponentName && !!this.$fetch && this.paginationEqual(neu, old)) {
        await this.$fetch();

        // Ensure any live/delayed columns get updated
        this.forceUpdateLiveAndDelayed = new Date().getTime();
      }
    },

  },
};
