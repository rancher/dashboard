<script>
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading';
import Masthead from './Masthead';

export default {
  components: {
    Loading,
    ResourceTable,
    Masthead
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
    }

    if ( !hasFetch ) {
      if ( !schema ) {
        store.dispatch('loadingError', `Type ${ resource } not found`);

        return;
      }

      this.rows = await store.dispatch(`${ inStore }/findAll`, { type: resource });
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

    const existingData = getters[`${ inStore }/all`](resource) || [];

    return {
      schema,
      hasListComponent,
      hasData:      existingData.length > 0,
      showMasthead: showMasthead === undefined ? true : showMasthead,
      resource,

      // Provided by fetch later
      rows:              [],
      customTypeDisplay: null,
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

    loading() {
      return this.hasData ? false : this.$fetchState.pending;
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
    />

    <div v-if="hasListComponent">
      <component
        :is="listComponent"
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
