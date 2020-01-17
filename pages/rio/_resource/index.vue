<script>
import ResourceTable from '@/components/ResourceTable';
import { FRIENDLY } from '@/config/friendly';

export default {
  name: 'RioResouce',

  components: { ResourceTable },

  validate({ params, query, store }) {
    return !!FRIENDLY[params.resource];
  },

  computed: {
    typeDisplay() {
      return FRIENDLY[this.resource].plural;
    },

    schema() {
      return this.$store.getters['cluster/schemaFor'](this.type);
    },

    headers() {
      return FRIENDLY[this.resource].headers;
    },

    search() {
      return FRIENDLY[this.resource].search;
    },

    tableActions() {
      return FRIENDLY[this.resource].tableActions;
    },

    showCreate() {
      return typeof this.tableActions === 'undefined' || this.tableActions;
    }
  },

  asyncData(ctx) {
    const resource = ctx.params.resource;
    const type = FRIENDLY[resource].type;

    return ctx.store.dispatch('cluster/findAll', { type }).then((rows) => {
      return {
        resource,
        type,
        rows
      };
    });
  },
};
</script>

<template>
  <div>
    <header>
      <h1>
        {{ typeDisplay }}
      </h1>
      <div v-if="showCreate" class="actions">
        <nuxt-link to="create" append tag="button" type="button" class="btn bg-primary">
          Create
        </nuxt-link>
      </div>
    </header>
    <ResourceTable :schema="schema" :rows="rows" :headers="headers" :search="search" :table-actions="tableActions" />
  </div>
</template>
