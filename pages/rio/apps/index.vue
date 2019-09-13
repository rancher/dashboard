<script>
import ResourceTable from '@/components/ResourceTable';
import { RIO } from '@/utils/types';
import {
  EXPAND, NAME, NAMESPACE, RIO_IMAGE, CREATED, // SCALE
} from '@/utils/table-headers';

const RESOURCE = RIO.APP;

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
        // SCALE,
        CREATED,
      ];

      return out;
    }
  },

  asyncData(ctx) {
    return Promise.all([
      ctx.store.dispatch('v1/findAll', { type: RESOURCE }),
      ctx.store.dispatch('v1/findAll', { type: RIO.VERSION }),
    ]).then(([apps, versions]) => {
      return {
        resource: RESOURCE,
        rows:     apps
      };
    });
  },
};
</script>

<template>
  <div>
    <header>
      <h1>Apps &amp; Versions</h1>
      <div class="actions">
        <nuxt-link to="create" append tag="button" type="button" class="btn bg-primary">
          Deploy
        </nuxt-link>
      </div>
    </header>

    <ResourceTable :schema="schema" :headers="headers" :rows="rows" />
  </div>
</template>
