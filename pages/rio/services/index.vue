<script>
import ResourceTable from '@/components/ResourceTable';
import { RIO } from '@/utils/types';
import {
  EXPAND, NAME, NAMESPACE, RIO_IMAGE, CREATED, SCALE
} from '@/utils/table-headers';
import { removeObject } from '@/utils/array';

const RESOURCE = RIO.SERVICE;

export default {
  components: { ResourceTable },

  computed: {
    schema() {
      return this.$store.getters['v1/schemaFor'](RESOURCE);
    },

    headers() {
      const out = [
        EXPAND,
        NAME,
        NAMESPACE,
        RIO_IMAGE,
        SCALE,
        CREATED,
      ];

      return out;
    }
  },

  asyncData(ctx) {
    return ctx.store.dispatch('v1/findAll', { type: RESOURCE }).then((rows) => {
      return {
        resource: RESOURCE,
        rows
      };
    });
  },
};
</script>

<template>
  <div>
    <div class="header">
      <h2>Rio Services</h2>
    </div>

    <ResourceTable :schema="schema" :headers="headers" :rows="rows" />
  </div>
</template>
