<script>
import ResourceTable from '@/components/ResourceTable';
import Favorite from '@/components/nav/Favorite';
import { EDIT_YAML, _FLAGGED } from '@/config/query-params';

export default {
  components: { ResourceTable, Favorite },

  data() {
    let listComponent;

    if ( this.hasListComponent ) {
      listComponent = this.$store.getters['type-map/importList'](this.resource);
    }

    const params = { ...this.$route.params };

    const formRoute = this.$router.resolve({ name: `${ this.$route.name }-create`, params }).href;

    const query = { [EDIT_YAML]: _FLAGGED };

    const yamlRoute = this.$router.resolve({
      name: `${ this.$route.name }-create`,
      params,
      query
    }).href;

    return {
      formRoute,
      yamlRoute,
      listComponent,
      EDIT_YAML,
      FLAGGED:       _FLAGGED
    };
  },

  computed:   {
    schema() {
      return this.$store.getters['cluster/schemaFor'](this.resource);
    },

    headers() {
      return this.$store.getters['type-map/headersFor'](this.schema);
    },

    hasEditComponent() {
      return this.$store.getters['type-map/hasCustomEdit'](this.resource);
    },

    hasListComponent() {
      return this.$store.getters['type-map/hasCustomList'](this.resource);
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
