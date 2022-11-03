<script>
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading';
import Masthead from './Masthead';
import ResourceLoadingIndicator from './ResourceLoadingIndicator';
import ResourceFetch from '@shell/mixins/resource-fetch';
import IconMessage from '@shell/components/IconMessage.vue';

export default {
  name: 'ResourceList',

  components: {
    Loading,
    ResourceTable,
    Masthead,
    ResourceLoadingIndicator,
    IconMessage
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
        store.dispatch('loadingError', new Error(`Type ${ resource } not found, unable to display list`));

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
    }
  },

  watch: {
    /**
     * ResourceList has two modes
     * 1) Root component handles API request to fetch resources
     * 2) Custom list component handles API request to fetch resources
     *
     * Case 2 will fetch resources when the component is shown and will use the latest namespace filter
     * Case 1 requires a manual prod by watching namespaceFilterRequired
     */
    namespaceFilterRequired(neu, old) {
      if (!neu && !this.hasFetch) {
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
    icon="icon-search"
  >
    <template #message>
      <span v-html="t('resourceList.nsFiltering', { resource: $store.getters['type-map/labelFor'](schema, 2) || customTypeDisplay }, true)" />
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
      :load-namespace="namespaceFilter"
    >
      <template slot="extraActions">
        <slot name="extraActions" />
      </template>
    </Masthead>
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
    .right-action {
      position: absolute;
      top: 10px;
      right: 10px;
    }
  </style>
