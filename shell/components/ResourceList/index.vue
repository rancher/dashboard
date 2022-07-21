<script>
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading';
import Masthead from './Masthead';
import { COUNT } from '@shell/config/types';

const TOO_MANY_ITEMS_TO_AUTO_UPDATE = 0;

export default {
  components: {
    Loading,
    ResourceTable,
    Masthead
  },

  async fetch() {
    console.log('************* RESOURCE LIST LOAD !!!! *************', this.resource);
    const store = this.$store;
    const resource = this.resource;

    const inStore = store.getters['currentStore'](resource);

    this.inStore = inStore;

    const schema = store.getters[`${ inStore }/schemaFor`](resource);

    if ( this.$store.getters[`${ inStore }/haveAll`](COUNT) ) {
      const counts = this.$store.getters[`${ inStore }/all`](COUNT)[0].counts;

      console.log('counts data', counts);

      if (counts[`${ resource }`]) {
        this.resourceCount = counts[`${ resource }`].summary?.count;
        console.info('here!!!', counts[`${ resource }`].summary?.count);
      }
    }

    console.log('*** resourceCount ***', this.resourceCount);

    if (this.resourceCount >= TOO_MANY_ITEMS_TO_AUTO_UPDATE) {
      this.watch = false;
      this.tooManyItemsToAutoUpdate = true;

      console.log('*** tooManyItemsToAutoUpdate ***', this.tooManyItemsToAutoUpdate);
      console.log('*** watch ***', this.watch);
    }

    if ( this.hasListComponent ) {
      // If you provide your own list then call its asyncData
      const importer = store.getters['type-map/importList'](resource);
      const component = (await importer())?.default;

      if ( component?.typeDisplay ) {
        this.customTypeDisplay = component.typeDisplay.apply(this);
      }

      // If your list page has a fetch then it's responsible for populating rows itself
      if ( component?.fetch ) {
        this.hasFetch = true;
      }
    }

    console.error('*** hasFetch ***', this.hasFetch);

    if ( !this.hasFetch ) {
      if ( !schema ) {
        store.dispatch('loadingError', `Type ${ resource } not found`);

        return;
      }

      this.rows = await store.dispatch(`${ inStore }/findAll`, {
        type: resource,
        opt:  { watch: this.watch }
      });
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

    console.error('*** hasListComponent ***', hasListComponent);

    return {
      schema,
      hasListComponent,
      hasData:      existingData.length > 0,
      showMasthead: showMasthead === undefined ? true : showMasthead,
      resource,
      hasFetch:     false,

      // Provided by fetch later
      rows:                     [],
      customTypeDisplay:        null,
      watch:                    true,
      tooManyItemsToAutoUpdate: false,
      inStore:                  null,
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

  methods: {
    async handleRefreshData() {
      console.log('event received on default resource list!');

      if (!this.hasListComponent && !this.hasFetch) {
        console.error(`*** dispatching new request for ${ this.resource } on default resource list`);
        this.rows = await this.$store.dispatch(`${ this.inStore }/findAll`, {
          type: this.resource,
          opt:  { watch: false, force: true }
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
      :too-many-items-to-auto-update="tooManyItemsToAutoUpdate"
      @refresh-table-data="handleRefreshData"
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
