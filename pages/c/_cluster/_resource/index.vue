<script>
import ResourceTable from '@/components/ResourceTable';

export default {
  components: { ResourceTable },
  computed:   {
    schema() {
      return this.$store.getters['cluster/schemaFor'](this.resource);
    },

    headers() {
      return this.$store.getters['type-map/headersFor'](this.schema);
    },

    hasComponent() {
      return this.$store.getters['type-map/hasCustomList'](this.resource);
    },

    showComponent() {
      return this.$store.getters['type-map/importList'](this.resource);
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
        {{ typeDisplay }}
      </h1>
      <div class="actions">
        <nuxt-link to="create" append tag="button" type="button" class="btn bg-primary">
          Create
        </nuxt-link>
      </div>
    </header>
    <div v-if="hasComponent">
      <component
        :is="showComponent"
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
