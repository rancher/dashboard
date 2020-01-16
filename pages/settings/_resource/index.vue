<script>

import { get } from '@/utils/object';
import { FRIENDLY } from '@/config/friendly';
import ResourceTable from '@/components/ResourceTable';
export default {
  components: { ResourceTable },
  computed:   {
    schema() {
      return this.$store.getters['cluster/schemaFor'](FRIENDLY[this.resource].type);
    },
    headers() {
      return get(FRIENDLY[this.resource], 'headers');
    },
    displayName() {
      return FRIENDLY[this.resource].plural;
    },
    actions() {
      return this.rows[0].availableActions;
    }
  },

  asyncData(ctx) {
    const resource = ctx.params.resource;

    return ctx.store.dispatch('cluster/findAll', { opt: { url: `/v3/${ resource }` }, type: FRIENDLY[resource].type })
      .then((rows) => {
        return {
          resource,
          rows
        };
      });
  },
};
</script>

<template>
  <div>
    <h1>
      {{ displayName }}
    </h1>
    <ResourceTable :rows="rows" :schema="schema" :headers="headers" />
  </div>
</template>
