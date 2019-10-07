<script>
import ResourceTable from '@/components/ResourceTable';
// import { allHash } from '@/utils/promise';
import { get } from '@/utils/object';

import { RIO } from '@/config/types';
import {
  STATE, NAMESPACE_NAME_UNLINKED, RIO_IMAGE, SCALE, AGE,
} from '~/config/table-headers';

export default {
  components: { ResourceTable },

  data() {
    return { showAll: false };
  },

  computed: {
    schema() {
      return this.$store.getters['cluster/schemaFor'](RIO.SERVICE);
    },

    headers() {
      const out = [
        STATE,
        NAMESPACE_NAME_UNLINKED,
        RIO_IMAGE,
        SCALE,
        AGE,
      ];

      return out;
    },

    rows() {
      return this.services;

      /*
      const ctx = { getters: this.$store.getters, dispatch: this.$store.dispatch };
      const services = this.services;
      const map = {};

      for ( const service of services ) {
        const key = service.appKey;
        let entry = map[key];

        if ( !entry ) {
          entry = proxyFor(ctx, {
            type:      'app',
            metadata: {
              namespace:         service.metadata.namespace,
              name:              service.appName,
              creationTimestamp: service.metadata.creationTimestamp,
            },
            services:  [],
          });

          map[key] = entry;
        }

        if ( service.metadata.creationTimestamp < entry.metadata.creationTimestamp ) {
          entry.metadata.creationTimestamp = service.metadata.creationTimestamp;
        }

        entry.services.push(service);
      }

      const out = [];

      for ( const app of Object.values(map) ) {
        if ( app.services.length > 1 ) {
          out.push(app);
        } else if ( app.services.length === 1 ) {
          out.push(app.services[0]);
        }
      }

      return out;
*/
    },
  },

  async asyncData(ctx) {
    const services = await ctx.store.dispatch('cluster/findAll', { type: RIO.SERVICE });

    return { services };
  },

  methods: { get },
};
</script>

<template>
  <div>
    <header>
      <h1>Services</h1>
      <div class="actions">
        <nuxt-link to="create" append tag="button" type="button" class="btn bg-primary">
          Deploy
        </nuxt-link>
      </div>
    </header>

    <ResourceTable
      :schema="schema"
      :headers="headers"
      :rows="rows"
    >
      <template #more-header-middle>
        <label>
          <input type="checkbox" :checked="showAll"> All
        </label>
      </template>
    </ResourceTable>
  </div>
</template>
