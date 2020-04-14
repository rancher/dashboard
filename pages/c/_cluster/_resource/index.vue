<script>
import ResourceTable from '@/components/ResourceTable';
import Favorite from '@/components/nav/Favorite';
import { AS_YAML, _FLAGGED } from '@/config/query-params';

export default {
  components: { ResourceTable, Favorite },

  data() {
    const params = { ...this.$route.params };
    const resource = params.resource;

    const formRoute = this.$router.resolve({ name: `${ this.$route.name }-create`, params }).href;

    const query = { [AS_YAML]: _FLAGGED };

    const hasListComponent = this.$store.getters['type-map/hasCustomList'](resource);
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
      listComponent,
      formRoute,
      yamlRoute,
      AS_YAML,
      FLAGGED: _FLAGGED
    };
  },

  computed:   {
    headers() {
      if ( this.hasListComponent || !this.schema ) {
        // Custom lists figure out their own headers
        return [];
      }

      return this.$store.getters['type-map/headersFor'](this.schema);
    },

    typeDisplay() {
      if ( this.customTypeDisplay ) {
        return this.customTypeDisplay;
      }

      if ( !this.schema ) {
        return '?';
      }

      return this.$store.getters['type-map/pluralLabelFor'](this.schema);
    },
  },

  async asyncData(ctx) {
    const { params, store } = ctx;
    const resource = params.resource;
    const hasListComponent = store.getters['type-map/hasCustomList'](resource);
    const hasEditComponent = store.getters['type-map/hasCustomEdit'](resource);
    const schema = store.getters['cluster/schemaFor'](resource);

    let foundData = false;
    let rows;
    let more = {};
    let customTypeDisplay;

    if ( hasListComponent ) {
      // If you provide your own list then call its asyncData
      const importer = store.getters['type-map/importList'](resource);
      const component = (await importer())?.default;

      if ( component?.asyncData ) {
        more = await component.asyncData(ctx);
        foundData = true;
      }

      if ( component?.typeDisplay ) {
        customTypeDisplay = component.typeDisplay(ctx);
      }
    }

    if ( !foundData ) {
      rows = await store.dispatch('cluster/findAll', { type: resource });
    }

    await store.dispatch('type-map/addRecent', resource);

    return {
      schema,
      hasListComponent,
      hasEditComponent,
      resource,
      rows,
      customTypeDisplay,
      ...more
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
          v-if="schema"
          :to="{path: yamlRoute}"
          tag="button"
          type="button"
          class="btn bg-primary"
        >
          Create from YAML
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
        v-bind="$data"
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
