import { NAMESPACE_FILTER_NAMESPACED_YES, NAMESPACE_FILTER_NAMESPACED_NO, NAMESPACE_FILTER_ALL } from '@shell/utils/namespace-filter';
import { NAMESPACE } from '@shell/config/types';
import { ALL_NAMESPACES } from '@shell/store/prefs';
import { mapGetters } from 'vuex';
import { ResourceListComponentName } from '../components/ResourceList/resource-list.config';
import paginationUtils from '@shell/utils/pagination-utils';
import debounce from 'lodash/debounce';
import { PaginationParamFilter, PaginationFilterField, PaginationArgs } from '@shell/types/store/pagination.types';
import stevePaginationUtils from '@shell/plugins/steve/steve-pagination-utils';

/**
 * Companion mixin used with `resource-fetch` for `ResourceList` to determine if the user needs to filter the list by a single namespace
 */
export default {

  props: {
    namespaced: {
      type:    Boolean,
      default: null, // Automatic from schema
    },

    /**
     * Where in the ui this mixin is used. For instance the home page cluster list would be `home`
     */
    context: {
      type:    String,
      default: null,
    },
  },

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
    /**
     * @param {PaginationArgs} pagination
     */
    setPagination(pagination) {
      if (pagination) {
        this.pPagination = pagination;
      }
    },

    paginationChanged(event) {
      const searchFilters = event.filter.searchQuery ? event.filter.searchFields.map((field) => new PaginationFilterField({
        field,
        value: event.filter.searchQuery,
        exact: false,
      })) : [];

      const pagination = new PaginationArgs({
        page:     event.page,
        pageSize: event.perPage,
        sort:     event.sort?.map((field) => ({
          field,
          asc: !event.descending
        })),
        projectsOrNamespaces: this.requestFilters.projectsOrNamespaces,
        filters:              [
          new PaginationParamFilter({ fields: searchFilters }),
          ...this.requestFilters.filters, // Apply the additional filters. these aren't from the user but from ns filtering
        ]
      });

      this.debouncedSetPagination(pagination);
    },

    namespaceFilterChanged(neu) {
      if (!this.canPaginate || !this.isNamespaced) {
        return;
      }

      const {
        projectsOrNamespaces,
        filters
      } = stevePaginationUtils.createParamsFromNsFilter({
        allNamespaces:                this.$store.getters[`${ this.currentProduct?.inStore }/all`](NAMESPACE),
        selection:                    neu,
        isAllNamespaces:              this.isAllNamespaces,
        isLocalCluster:               this.$store.getters['currentCluster'].isLocal,
        showDynamicRancherNamespaces: this.showDynamicRancherNamespaces,
        productHidesSystemNamespaces: this.productHidesSystemNamespaces,
      });

      this.requestFilters.filters = filters;
      this.requestFilters.projectsOrNamespaces = projectsOrNamespaces;

      // Kick off a change
      if (this.pPagination) {
        this.debouncedSetPagination({ ...this.pPagination });
      }
    },

    /**
     * @param {PaginationArgs} neu
     * @param {PaginationArgs} old
     */
    paginationEqual(neu, old) {
      if (!neu.page) {
        // Not valid, count as not equal
        return false;
      }

      if (paginationUtils.paginationEqual(neu, old)) {
        return true;
      }

      return false;
    }
  },

  computed: {
    ...mapGetters(['currentProduct', 'isAllNamespaces']),

    /**
     * Why is this a specific getter and not not in mapGetters?
     *
     * Adding it to mapGetters means the kubewarden unit tests fail as they don't mock it....
     */
    namespaceFilters() {
      return this.$store.getters['namespaceFilters'];
    },

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
     * - In this scenario, reduce churn by exiting earlier if mixin is from parent ResourceList and leave work for CustomList mixins
     */
    isResourceList() {
      return !!this.hasListComponent;
    },

    /**
     * Is Pagination supported and has the table supplied pagination settings from the table?
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

      if (!this.resource) {
        return false;
      }

      const args = {
        id:      this.resource.id || this.resource,
        context: this.context,
      };

      return this.resource && this.$store.getters[`${ this.inStore }/paginationEnabled`]?.(args);
    },

    paginationResult() {
      if (this.isResourceList || !this.canPaginate) {
        return;
      }

      return this.havePaginated?.result;
    },

    havePaginated() {
      if (this.isResourceList) {
        return;
      }

      return this.$store.getters[`${ this.inStore }/havePage`](this.resource);
    },

    /**
      * Links to ns.isSystem and covers things like ns with system annotation, hardcoded list, etc
      */
    productHidesSystemNamespaces() {
      return this.currentProduct?.hideSystemResources;
    },

    /**
      * Links to ns.isObscure and covers things like `c-`, `user-`, etc (see OBSCURE_NAMESPACE_PREFIX)
      */
    showDynamicRancherNamespaces() {
      return this.$store.getters['prefs/get'](ALL_NAMESPACES);
    },

    isNamespaced() {
      if (this.namespaced !== null) { // null is the default value
        // This is an override, but only if it's set
        return !!this.namespaced;
      }

      return this.schema?.attributes?.namespaced;
    }
  },

  watch: {
    /**
     * Monitor the rows to ensure deleting the last entry in a server-side paginated page doesn't
     * result in an empty page
     */
    rows(neu) {
      if (!this.canPaginate || !this.pagination || this.isResourceList) {
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
        if (!this.canPaginate || !this.isNamespaced) {
          return;
        }

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

    /**
     * When a pagination is required and the user changes page / sort / filter, kick off a new set of API requests
     *
     * @param {StorePaginationResult} neu
     * @param {StorePaginationResult} old
     */
    async pagination(neu, old) {
      if (!this.canPaginate) {
        return;
      }

      // ResourceList has two modes
      // 1) ResourceList component handles API request to fetch resources
      // 2) Custom list component handles API request to fetch resources
      //
      // This covers case 2, so ignore case 1
      if (this.isResourceList) {
        return;
      }

      if (neu && this.$options.name !== ResourceListComponentName && !!this.$fetch && !this.paginationEqual(neu, old)) {
        await this.$fetch(false);
        // Ensure any live/delayed columns get updated
        this.forceUpdateLiveAndDelayed = new Date().getTime();
      }
    },

    /**
     * If the pagination result has changed fetch secondary resources
     *
     * Lists should implement fetchPageSecondaryResources to fetch them
     *
     * @param {StorePaginationResult} neu
     * @param {StorePaginationResult} old
     */
    async paginationResult(neu, old) {
      if (!this.fetchPageSecondaryResources || !neu ) { // || neu.timestamp === old?.timestamp
        return;
      }

      if (neu.timestamp === old?.timestamp) {
        // This occurs when the user returns to the page... and pagination hasn't actually changed
        return;
      }

      await this.fetchPageSecondaryResources({
        canPaginate: this.canPaginate, force: false, page: this.rows, pagResult: this.paginationResult
      });
    }
  },
};
