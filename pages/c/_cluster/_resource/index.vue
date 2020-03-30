<script>
import ResourceTable from '@/components/ResourceTable';
import Favorite from '@/components/nav/Favorite';
import { EDIT_YAML, _FLAGGED } from '@/config/query-params';

export default {
  components: { ResourceTable, Favorite },

  data() {
    const params = { ...this.$route.params };
    const resource = params.resource;

    const formRoute = this.$router.resolve({ name: `${ this.$route.name }-create`, params }).href;

    const query = { [EDIT_YAML]: _FLAGGED };

    const hasListComponent = this.$store.getters['type-map/hasCustomList'](resource);
    const hasEditComponent = this.$store.getters['type-map/hasCustomEdit'](resource);
    let listComponent;

    if ( hasListComponent ) {
      listComponent = this.$store.getters['type-map/importList'](resource);
    }

    const yamlRoute = this.$router.resolve({
      name: `${ this.$route.name }-create`,
      params,
      query
    }).href;

    return {
      hasListComponent,
      hasEditComponent,
      listComponent,
      formRoute,
      yamlRoute,
      EDIT_YAML,
      FLAGGED: _FLAGGED
    };
  },

  computed:   {
    schema() {
      return this.$store.getters['cluster/schemaFor'](this.resource);
    },

    headers() {
      if ( this.hasListComponent ) {
        // Custom lists figure out their own headers
        return [];
      }

      return this.$store.getters['type-map/headersFor'](this.schema);
    },

    typeDisplay() {
      return this.$store.getters['type-map/pluralLabelFor'](this.schema);
    },
  },

  async asyncData({ params, store }) {
    const resource = params.resource;

    const rows = await store.dispatch('cluster/findAll', { type: resource });

    await store.dispatch('type-map/addRecent', resource);

    return {
      resource,
      rows
    };
  },
}; </script>

<template>
  <div>
    <header>
      <h1>
        {{ typeDisplay }} <Favorite :resource="resource" />
      </h1>
      <div class="actions">
        <nuxt-link
          :to="{path: yamlRoute}"
          tag="button"
          type="button"
          class="btn bg-primary"
        >
          Import
        </nuxt-link>
        <nuxt-link
          v-if="hasEditComponent"
          :to="{path: formRoute}"
          tag="button"
          type="button"
          class="btn bg-primary"
        >
          Create
        </nuxt-link>
      </div>
    </header>
    <div v-if="hasListComponent">
      <component
        :is="listComponent"
        :schema="schema"
        :rows="rows"
        :headers="headers"
      />
    </div>
    <ResourceTable v-else :schema="schema" :rows="rows" :headers="headers" />
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
