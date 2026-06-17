<script>
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading';
import Masthead from './Masthead';
import ResourceLoadingIndicator from './ResourceLoadingIndicator';
import ResourceFetch from '@shell/mixins/resource-fetch';
import IconMessage from '@shell/components/IconMessage.vue';
import { ResourceListComponentName } from './resource-list.config';
import { PanelLocation, ExtensionPoint } from '@shell/core/types';
import ExtensionPanel from '@shell/components/ExtensionPanel';
import { sameContents } from '@shell/utils/array';
import perfSettingsUtils from '@shell/utils/perf-setting.utils';
import { BadgeState } from '@components/BadgeState';
import { stateDisplay } from '@shell/plugins/dashboard-store/resource-class';
import { useStateColor } from '@shell/composables/useStateColor';

export default {
  name: ResourceListComponentName,

  components: {
    Loading,
    ResourceTable,
    Masthead,
    ResourceLoadingIndicator,
    IconMessage,
    ExtensionPanel,
    BadgeState,
  },
  mixins: [ResourceFetch],

  setup() {
    const { toStateColor } = useStateColor();

    return { toStateColor };
  },

  props: {
    hasAdvancedFiltering: {
      type:    Boolean,
      default: false
    },
    advFilterHideLabelsAsCols: {
      type:    Boolean,
      default: false
    },
    advFilterPreventFilteringLabels: {
      type:    Boolean,
      default: false
    },
  },

  async fetch() {
    const store = this.$store;
    const resource = this.resource;

    const schema = this.schema;

    if ( this.hasListComponent ) {
      // If you provide your own list then call its fetch
      const importer = this.listComponent;

      const component = await importer.__asyncLoader();

      if ( component?.typeDisplay ) {
        this.customTypeDisplay = component.typeDisplay.apply(this);
      }

      // Is the custom component responsible fetching the resources?
      // - Component has a fetch method - legacy method. fetch will handle the requests
      // - Component contains the PaginatedResourceTable component - go forward method. PaginatedResourceTable owns fetching the resources
      if ( component?.fetch || component?.components?.['PaginatedResourceTable']) {
        this.componentWillFetch = true;
      }

      // If the custom component supports it, ask it what resources it loads, so we can
      // use the incremental loading indicator when enabled
      if (component?.$loadingResources) {
        const { loadResources, loadIndeterminate } = component?.$loadingResources(this.$route, this.$store);

        this.loadResources = loadResources || [resource];
        this.loadIndeterminate = loadIndeterminate || false;
      }
    }

    if ( !this.componentWillFetch ) {
      if ( !schema ) {
        store.dispatch('loadingError', new Error(this.t('nav.failWhale.resourceListNotFound', { resource }, true)));

        return;
      }

      // See comment for `namespaceFilter` and `pagination` watchers, skip fetch if we're not ready yet... and something is going to call fetch later on
      if (!this.namespaceFilterRequired && (!this.canPaginate || this.refreshFlag)) {
        await this.$fetchType(resource);
      }
    }
  },

  beforeMount() {
    if (!this.hasListComponent) {
      // If a list doesn't have a list component confirm via schema that the resource is listable
      const inStore = this.$store.getters['currentStore'](this.resource);
      const canList = this.$store.getters[`${ inStore }/canList`](this.resource);

      if (!canList) {
        this.$store.dispatch('loadingError', new Error(this.t('nav.failWhale.resourceListNotListable', { resource: this.schema?.id || this.resource || 'unknown' }, true)));
      }
    }
  },

  data() {
    const getters = this.$store.getters;
    const params = { ...this.$route.params };
    const resource = params.resource;

    const hasListComponent = getters['type-map/hasCustomList'](resource);

    const inStore = getters['currentStore'](resource);
    const schema = getters[`${ inStore }/schemaFor`](resource);

    const showMasthead = getters[`type-map/optionsFor`](resource).showListMasthead;

    return {
      schema,
      overrideInStore:                  undefined,
      hasListComponent,
      showMasthead:                     showMasthead === undefined ? true : showMasthead,
      resource,
      extensionType:                    ExtensionPoint.PANEL,
      extensionLocation:                PanelLocation.RESOURCE_LIST,
      loadResources:                    [resource], // List of resources that will be loaded, this could be many (`Workloads`)
      /**
       * Will the custom component handle the fetch of resources....
       * or will this instance fetch resources
       */
      componentWillFetch:               false,
      // manual refresh
      manualRefreshInit:                false,
      watch:                            false,
      force:                            false,
      // Provided by fetch later
      customTypeDisplay:                null,
      // incremental loading
      loadIndeterminate:                false,
      // query param for simple filtering
      useQueryParamsForSimpleFiltering: true,
    };
  },

  computed: {
    headers() {
      if ( this.hasListComponent || !this.schema ) {
        // Custom lists figure out their own headers
        return [];
      }

      return this.$store.getters['type-map/headersFor'](this.schema, this.canPaginate);
    },

    groupBy() {
      return this.$store.getters['type-map/groupByFor'](this.schema);
    },

    showIncrementalLoadingIndicator() {
      return perfSettingsUtils.incrementalLoadingUtils.isEnabled(this.calcCanPaginate(), this.perfConfig);
    },

    activeStateFilters() {
      const raw = this.$route?.query?.stateFilter;

      if (!raw) {
        return [];
      }

      const states = raw.split(',').filter(Boolean);

      return states.map((s) => {
        const match = this.rows.find((row) => row.metadata?.state?.name === s);

        if (match) {
          return {
            label: match.stateDisplay,
            color: match.stateBackground,
          };
        }

        return {
          label: stateDisplay(s, true),
          color: `bg-${ this.toStateColor(s, this.resource) }`,
        };
      });
    },

  },

  methods: {
    clearStateFilter() {
      const query = { ...this.$route.query };

      delete query.stateFilter;
      this.$router.push({ ...this.$route, query });
    },
  },

  watch: {

    /**
     * When a NS filter is required and the user selects a different one, kick off a new set of API requests
     *
     * ResourceList has two modes
     * 1) ResourceList component handles API request to fetch resources
     * 2) Custom list component handles API request to fetch resources
     *
     * This covers case 1
     */
    namespaceFilter(neu, old) {
      if (neu && !this.componentWillFetch) {
        if (sameContents(neu, old)) {
          return;
        }

        this.$fetchType(this.resource);
      }
    },

    /**
     * When a pagination is required and the user changes page / sort / filter, kick off a new set of API requests
     *
     * ResourceList has two modes
     * 1) ResourceList component handles API request to fetch resources
     * 2) Custom list component handles API request to fetch resources
     *
     * This covers case 1
     */
    pagination(neu, old) {
      if (neu && !this.componentWillFetch && !this.paginationEqual(neu, old)) {
        this.$fetchType(this.resource);
      }
    },

    /**
     * Monitor the rows to ensure deleting the last entry in a server-side paginated page doesn't
     * result in an empty page
     */
    rows(neu) {
      if (!this.pagination) {
        return;
      }

      if (this.pagination.page > 1 && neu.length === 0) {
        this.setPagination({
          ...this.pagination,
          page: this.pagination.page - 1
        });
      }
    },
  },

  created() {
    let listComponent = false;

    const resource = this.$route.params.resource;
    const hasListComponent = this.$store.getters['type-map/hasCustomList'](resource);

    if ( hasListComponent ) {
      listComponent = this.$store.getters['type-map/importList'](resource);
    }

    this.listComponent = listComponent;
  },
};
</script>

<template>
  <IconMessage
    v-if="namespaceFilterRequired"
    :vertical="true"
    :subtle="false"
    icon="icon-filter_alt"
  >
    <template #message>
      {{ t('resourceList.nsFiltering') }}
    </template>
  </IconMessage>
  <IconMessage
    v-else-if="paginationNsFilterRequired"
    :vertical="true"
    :subtle="false"
    icon="icon-filter_alt"
  >
    <template #message>
      {{ t('resourceList.nsFilteringGeneric') }}
    </template>
  </IconMessage>
  <div
    v-else
    class="outlet"
  >
    <Masthead
      v-if="showMasthead"
      :type-display="customTypeDisplay"
      :schema="schema"
      :resource="resource"
      :show-incremental-loading-indicator="showIncrementalLoadingIndicator"
      :load-resources="loadResources"
      :load-indeterminate="loadIndeterminate"
    >
      <template
        v-if="activeStateFilters.length"
        #subHeader
      >
        <div class="state-filter-bar text-muted">
          {{ t('resourceList.stateFilterApplied') }}
          <BadgeState
            v-for="state in activeStateFilters"
            :key="state.label"
            :color="state.color"
            :label="state.label"
            class="badge-state-font-size"
          />
          <span>.</span>
          <a
            role="button"
            @click="clearStateFilter"
          >
            {{ t('resourceList.clearStateFilter') }}
          </a>
        </div>
      </template>
      <template #extraActions>
        <slot name="extraActions" />
      </template>
    </Masthead>
    <!-- Extensions area -->
    <ExtensionPanel
      :resource="{}"
      :type="extensionType"
      :location="extensionLocation"
    />

    <div
      v-if="hasListComponent"
    >
      <component
        :is="listComponent"
        :incremental-loading-indicator="showIncrementalLoadingIndicator"
        :rows="rows"
        v-bind="$data"
      />
    </div>
    <ResourceTable
      v-else
      :schema="schema"
      :rows="rows"
      :alt-loading="canPaginate && !isFirstLoad"
      :loading="loading"
      :headers="headers"
      :group-by="groupBy"
      :has-advanced-filtering="hasAdvancedFiltering"
      :adv-filter-hide-labels-as-cols="advFilterHideLabelsAsCols"
      :adv-filter-prevent-filtering-labels="advFilterPreventFilteringLabels"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
      :external-pagination-enabled="canPaginate"
      :external-pagination-result="paginationResult"
      @pagination-changed="paginationChanged"
    />
  </div>
</template>

<style lang="scss" scoped>
    .header {
      position: relative;
    }
    H2 {
      position: relative;
      margin: 0 0 20px 0;
    }
    .filter{
      line-height: 45px;
    }
    .right-action {
      position: absolute;
      top: 10px;
      right: 10px;
    }

    .state-filter-bar {
      display: flex;
      align-items: center;
      gap: 4px;

      a {
        cursor: pointer;
      }
    }

    .badge-state-font-size {
      font-size: .85em;
    }
</style>
