import { NAMESPACE_FILTER_ALL_SYSTEM, NAMESPACE_FILTER_ALL_USER } from '@shell/utils/namespace-filter';
import Vue from 'vue';
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

      // this.currentProduct?.hideSystemResources // TODO: RC oh lordy - need to wire in this as a filter

      this.pPagination = {
        // namespaces: this.namespaceFilters,
        ...this.pPagination,
        page:     event.page,
        pageSize: event.perPage,
        sort:     event.sort?.map((field) => {
          let safeField = field; // TODO: RC oh lordy

          switch (field) {
          case 'nameSort':
            safeField = this.rows[0].namePath; // TODO: RC oh lordy
            break;
          case 'namespace':
            safeField = 'metadata.namespace';
            break;
          case 'subTypeDisplay':
            safeField = '_type'; // TODO: RC secret. this isn't by label of the type. this doesn't work anyway
            break;
          }

          return {
            field: safeField,
            asc:   !event.descending
          };
        }),
        filter: {} // TODO: RC oh lordy. this contains not only model values... but `getValue` fns as well
      };
      console.warn('mixin', 'method', 'paginationChanged', this.pPagination);
    }
  },

  computed: {
    ...mapGetters(['currentProduct', 'currentCluster', 'namespaceFilters', 'namespaces']),
    /**
     * Returns the namespace that requests should be filtered by
     */
    pagination() {
      // TODO: RC get from  store (including revision)
      // TODO: RC sortable table --> store
      console.warn('mixin', 'pagination', this.__paginationRequired, this.pPagination);

      // {
      //   namespaces: undefined,
      //   page:       1,
      //   pageSize:   10,
      //   sort:       [],
      //   filter:     {}
      // }

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
