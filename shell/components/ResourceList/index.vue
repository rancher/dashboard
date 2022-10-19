<script>
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading';
import Masthead from './Masthead';
import ResourceLoadingIndicator from './ResourceLoadingIndicator';
import ResourceFetch from '@shell/mixins/resource-fetch';
import { quickHashObj } from '@shell/utils/crypto';
import { cloneDeep } from 'lodash';

export default {
  components: {
    Loading,
    ResourceTable,
    Masthead,
    ResourceLoadingIndicator
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

    let hasFetch = false;

    const inStore = store.getters['currentStore'](resource);

    const schema = store.getters[`${ inStore }/schemaFor`](resource);

    if ( this.hasListComponent ) {
      // If you provide your own list then call its asyncData
      const importer = store.getters['type-map/importList'](resource);
      const component = (await importer())?.default;

      if ( component?.typeDisplay ) {
        this.customTypeDisplay = component.typeDisplay.apply(this);
      }

      // If your list page has a fetch then it's responsible for populating rows itself
      if ( component?.fetch ) {
        hasFetch = true;
      }

      // If the custom component supports it, ask it what resources it loads, so we can
      // use the incremental loading indicator when enabled
      if (component?.$loadingResources) {
        const { loadResources, loadIndeterminate } = component?.$loadingResources(this.$route, this.$store);

        this.loadResources = loadResources || [resource];
        this.loadIndeterminate = loadIndeterminate || false;
      }
    }

    if ( !hasFetch ) {
      if ( !schema ) {
        store.dispatch('loadingError', new Error(`Type ${ resource } not found, unable to display list`));

        return;
      }

      await this.$fetchType(resource);
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
      showMasthead:      showMasthead === undefined ? true : showMasthead,
      resource,
      // manual refresh
      manualRefreshInit: false,
      watch:             false,
      force:             false,
      // Provided by fetch later
      customTypeDisplay: null,
      // incremental loading
      loadResources:     [resource],
      loadIndeterminate: false,
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
    listLength() {
      const { params: { resource: type } } = this.$route;

      return this.$store.getters['cluster/listLength'](type);

      // return undefined;
    }
  },

  methods: {
    setPage(num) {
      const currentResourceQueryHash = quickHashObj(this.resourceQuery);
      const resourceQueryClone = cloneDeep(this.resourceQuery);

      resourceQueryClone.page = num;
      if (currentResourceQueryHash !== quickHashObj(resourceQueryClone)) {
        this.resourceQuery = { ...resourceQueryClone };
      }
    },
    setSearch(search, field = 'metadata.name') {
      const currentResourceQueryHash = quickHashObj(this.resourceQuery);
      const resourceQueryClone = cloneDeep(this.resourceQuery);
      const isAll = this.$store.getters['isAllNamespaces'];

      // const isAll = true;
      resourceQueryClone.search = [];

      if (search) {
        resourceQueryClone.search.push({ field, string: search });
      }
      if (!isAll) {
        // const includedNamespaces = this.$store.getters['namespaces']();
        const includedNamespaces = {};
        const namespaceArray = Object.keys(includedNamespaces);

        resourceQueryClone.search.push({
          field: 'metadata.namespace', string: namespaceArray.join(', '), exact: true
        });
      }
      if (currentResourceQueryHash !== quickHashObj(resourceQueryClone)) {
        this.resourceQuery = {
          ...resourceQueryClone,
          page: 1
        };
      }
    },
    setSort(sortBy) {
      const currentResourceQueryHash = quickHashObj(this.resourceQuery);
      let resourceQueryClone = cloneDeep(this.resourceQuery);

      resourceQueryClone = {
        ...resourceQueryClone,
        page: 1,
        sortBy
      };
      if (currentResourceQueryHash !== quickHashObj(resourceQueryClone)) {
        this.resourceQuery = { ...resourceQueryClone };
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
  <div>
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
        <slot name="extraActions"></slot>
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
      :set-page-fn="setPage"
      :set-search-fn="setSearch"
      :set-sort-fn="setSort"
      :list-length="listLength"
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
