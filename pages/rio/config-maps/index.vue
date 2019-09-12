<script>
import ResourceTable from '@/components/ResourceTable';
import { CONFIG_MAP } from '@/utils/types';
import { STATE, NAME, NAMESPACE, UPDATED } from '@/utils/table-headers';

const RESOURCE = CONFIG_MAP;

export default {
  components: { ResourceTable },

  computed: {
    schema() {
      return this.$store.getters['v1/schemaFor'](RESOURCE);
    },

    headers() {
    },
  },

  asyncData(ctx) {
    return ctx.store.dispatch('v1/findAll', { type: RESOURCE }).then((rows) => {
      return {
        resource: RESOURCE,
        rows
      };
    });
  },
}; </script>

<template>
  <div>
    <header>
      <h1>
        Config Maps
      </h1>
      <div class="actions">
        <nuxt-link to="create" append tag="button" type="button" class="btn bg-primary">
          Create
        </nuxt-link>
      </div>
    </header>
    <ResourceTable :schema="schema" :rows="rows" :headers="headers" />
  </div>
</template>
