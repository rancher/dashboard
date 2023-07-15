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

export default {
  name: ResourceListComponentName,

  components: {
    Loading,
    ResourceTable,
    Masthead,
    ResourceLoadingIndicator,
    IconMessage,
    ExtensionPanel
  },
  mixins: [ResourceFetch],

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
      // If you provide your own list then call its asyncData
      const importer = this.listComponent;
      const component = (await importer())?.default;

      if ( component?.typeDisplay ) {
        this.customTypeDisplay = component.typeDisplay.apply(this);
      }

      // If your list page has a fetch then it's responsible for populating rows itself
      if ( component?.fetch ) {
        this.hasFetch = true;
      }

      // If the custom component supports it, ask it what resources it loads, so we can
      // use the incremental loading indicator when enabled
      if (component?.$loadingResources) {
        const { loadResources, loadIndeterminate } = component?.$loadingResources(this.$route, this.$store);

        this.loadResources = loadResources || [resource];
        this.loadIndeterminate = loadIndeterminate || false;
      }
    }

    if ( !this.hasFetch ) {
      if ( !schema ) {
        store.dispatch('loadingError', new Error(this.t('nav.failWhale.resourceListNotFound', { resource }, true)));

        return;
      }

      // See comment for `namespaceFilterRequired` watcher, skip fetch if we don't have a valid NS
      if (!this.namespaceFilterRequired) {
        await this.$fetchType(resource);
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
      inStore,
      schema,
      hasListComponent,
      showMasthead:                     showMasthead === undefined ? true : showMasthead,
      resource,
      extensionType:                    ExtensionPoint.PANEL,
      extensionLocation:                PanelLocation.RESOURCE_LIST,
      loadResources:                    [resource], // List of resources that will be loaded, this could be many (`Workloads`)
      hasFetch:                         false,
      // manual refresh
      manualRefreshInit:                false,
      watch:                            false,
      force:                            false,
      // Provided by fetch later
      customTypeDisplay:                null,
      // incremental loading
      loadIndeterminate:                false,
      // query param for simple filtering
      useQueryParamsForSimpleFiltering: true
    };
  },

  computed: {
    headers() {
      if ( this.hasListComponent || !this.schema ) {
        // Custom lists figure out their own headers
        return [];
      }

      return this.$store.getters['type-map/headersFor'](this.schema);
    },

    groupBy() {
      return this.$store.getters['type-map/groupByFor'](this.schema);
    },

    showIncrementalLoadingIndicator() {
      return this.perfConfig?.incrementalLoading?.enabled;
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
      if (sameContents(neu, old)) {
        return;
      }

      if (neu && !this.hasFetch) {
        this.$fetchType(this.resource);
      }
    }
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
  <div v-else>
    <Masthead
      v-if="showMasthead"
      :type-display="customTypeDisplay"
      :schema="schema"
      :resource="resource"
      :show-incremental-loading-indicator="showIncrementalLoadingIndicator"
      :load-resources="loadResources"
      :load-indeterminate="loadIndeterminate"
    >
      <template slot="extraActions">
        <slot name="extraActions" />
      </template>
    </Masthead>
    <!-- Extensions area -->
    <ExtensionPanel
      :resource="{}"
      :type="extensionType"
      :location="extensionLocation"
    />

    <div v-if="hasListComponent">
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
      :loading="loading"
      :headers="headers"
      :group-by="groupBy"
      :has-advanced-filtering="hasAdvancedFiltering"
      :adv-filter-hide-labels-as-cols="advFilterHideLabelsAsCols"
      :adv-filter-prevent-filtering-labels="advFilterPreventFilteringLabels"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
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
  </style>
