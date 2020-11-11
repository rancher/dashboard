<script>
import ResourceTable from '@/components/ResourceTable';
import { AS_YAML, _FLAGGED } from '@/config/query-params';
import Loading from '@/components/Loading';
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
      const inStore = store.getters['currentProduct'].inStore;

      this.rows = await store.dispatch(`${ inStore }/findAll`, { type: resource });
    }
  },

  data() {
    const getters = this.$store.getters;
    const params = { ...this.$route.params };
    const resource = params.resource;

    const formRoute = { name: `${ this.$route.name }-create`, params };

    const query = { [AS_YAML]: _FLAGGED };

    const hasListComponent = getters['type-map/hasCustomList'](resource);
    const hasEditComponent = getters['type-map/hasCustomEdit'](resource);

    const yamlRoute = {
      name: `${ this.$route.name }-create`,
      params,
      query
    };

    const inStore = getters['currentProduct'].inStore;
    const schema = getters[`${ inStore }/schemaFor`](resource);

    return {
      formRoute,
      yamlRoute,
      schema,
      hasListComponent,
      hasEditComponent,
      resource,

      // Provided by fetch later
      rows:              null,
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

    typeDisplay() {
      if ( this.customTypeDisplay ) {
        return this.customTypeDisplay;
      }

      if ( !this.schema ) {
        return '?';
      }

      return this.$store.getters['type-map/labelFor'](this.schema, 99);
    },

    isYamlCreateable() {
      return !this.$store.getters['type-map/isFormOnly'](this.$route.params.resource);
    },

    isCreatable() {
      if ( this.schema && !this.schema?.collectionMethods.find(x => x.toLowerCase() === 'post') ) {
        return false;
      }

      return this.$store.getters['type-map/isCreatable'](this.$route.params.resource);
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

}; </script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <Masthead
      :schema="schema"
      :resource="resource"
      :type-display="typeDisplay"
      :is-yaml-creatable="schema && isCreatable && isYamlCreateable"
      :is-creatable="hasEditComponent && isCreatable"
      :yaml-create-location="yamlRoute"
      :create-location="formRoute"
    />

    <div v-if="hasListComponent">
      <component
        :is="listComponent"
        v-bind="$data"
      />
    </div>
    <ResourceTable v-else :schema="schema" :rows="rows" :headers="headers" :group-by="groupBy" />
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
