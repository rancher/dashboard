import {
  NAMESPACE_FILTER_ALL_SYSTEM, NAMESPACE_FILTER_ALL_USER, NAMESPACE_FILTER_ALL_ORPHANS, NAMESPACE_FILTER_NAMESPACED_YES, NAMESPACE_FILTER_NAMESPACED_NO, NAMESPACE_FILTER_ALL
} from '@shell/utils/namespace-filter';
import { MANAGEMENT, NAMESPACE } from '@shell/config/types';
import { ALL_NAMESPACES } from '@shell/store/prefs';
import { mapGetters } from 'vuex';
import { ResourceListComponentName } from '../components/ResourceList/resource-list.config';
import paginationUtils from '@shell/utils/pagination-utils';
import debounce from 'lodash/debounce';

/**
 * Companion mixin used with `resource-fetch` for `ResourceList` to determine if the user needs to filter the list by a single namespace
 */
export default {

  data() {
    let defaultProject;

    if (this.$store.getters['management/canList'](MANAGEMENT.PROJECT)) {
      defaultProject = this.$store.getters['management/all'](MANAGEMENT.PROJECT)?.find((p) => p.isDefault);
    }

    return {
      forceUpdateLiveAndDelayed: 0,
      /**
       * This of type `OptPagination`
       */
      pPagination:               null,
      // Avoid scenarios where namespace is updated just before other pagination changes come in
      debouncedSetPagination:    debounce(this.setPagination, 50),

      // TODO: RC comment
      defaultProjectId:  defaultProject?.metadata.name,
      // TODO: RC comment
      additionalFilters: [],
    };
  },

  methods: {
    setPagination(pagination) {
      this.pPagination = pagination;
    },

    paginationChanged(event) {
      const searchFilters = event.filter.searchQuery ? event.filter.searchFields.map((field) => ({
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
        filter: [
          searchFilters,
          this.additionalFilters, // Apply the additional filters that don't come from user
        ]
      });
    },

    namespaceFilterChanged(neu) {
      if (!this.canPaginate || !this.schema?.attributes?.namespaced) {
        return;
      }
      // This is a context specific version of ResourceTable filteredRows (local ns filtering)

      // There is no user provided filter
      const isAll = this.$store.getters['isAllNamespaces'];
      // Links to ns.isObscure and covers things like `c-`, `user-`, etc (see OBSCURE_NAMESPACE_PREFIX)
      const showDynamicRancherNamespaces = this.$store.getters['prefs/get'](ALL_NAMESPACES);
      // Links to ns.isSystem and covers things like ns with system annotation, hardcoded list, etc
      const productHidesSystemNamespaces = this.currentProduct.hideSystemResources;

      // We'd like to show all namespaces... but either the user shouldn't see
      // - dynamic ones
      // - system ones
      const allButHidingSystemResources = isAll && (!showDynamicRancherNamespaces || productHidesSystemNamespaces);

      let namespaces;

      const allNamespaces = this.$store.getters[`${ this.currentProduct.inStore }/all`](NAMESPACE);

      this.additionalFilters = [];

      if (allButHidingSystemResources) {
        // Gather all system and obscure ns's and filter for resources NOT in them
        // This avoids filtering by thousands of ns that aren't system or obscure
        namespaces = allNamespaces.reduce((res, ns) => {
          const hideObscure = showDynamicRancherNamespaces ? false : ns.isObscure;
          const hideSystem = productHidesSystemNamespaces ? ns.isSystem : false;

          if (hideObscure || hideSystem) {
            res.push(`-${ ns.name }`);
          }

          return res;
        }, []);
      } else if (neu.length === 1) {
        if (neu[0] === NAMESPACE_FILTER_ALL_SYSTEM) {
          const allSystem = allNamespaces.filter((ns) => {
            return ns.isSystem && ns.id !== this.defaultProjectId; // This is duped below, but stops an iteration of all ns
          });

          // Filter by resources in system namespaces
          namespaces = allSystem.map((ns) => `${ ns.name }`);

          // TODO: RC given the resources in the default project's ns & default project are omitted this misses the resource in the default project's ns
          // Adding below gives us no results
          // if (!!this.defaultProjectId) {
          //   this.additionalFilters.push({ field: 'metadata.namespace', value: this.defaultProjectId });
          // }
        } else if (neu[0] === NAMESPACE_FILTER_ALL_USER) {
          const allSystem = allNamespaces.filter((ns) => {
            // Exclude default project's ns. which means we're not excluded resources in the default project. which means we're including resources in the namespace of the default project
            return ns.isSystem && ns.id !== this.defaultProjectId;
          });

          // Filter by resources NOT in system namespaces
          namespaces = allSystem.map((ns) => `-${ ns.name }`);

          if (!!this.defaultProjectId) {
            this.additionalFilters.push({
              field: 'metadata.namespace', value: this.defaultProjectId, notEqual: true
            });
          }
        } else {
          namespaces = neu;
        }
      } else {
        namespaces = neu;
      }

      this.debouncedSetPagination({
        ...this.pPagination,
        namespaces: namespaces.filter((n) => n !== NAMESPACE_FILTER_ALL_ORPHANS),
      });
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
    ...mapGetters(['currentProduct', 'namespaceFilters']),

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
          return;
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
