<script>
import ResourceTable from '@/components/ResourceTable';
import { EPINIO_TYPES } from '@/products/epinio/types';
import Loading from '@/components/Loading';

export default {
  name:       'EpinioServicesList',
  components: {
    Loading,
    ResourceTable,
  },
  async fetch() {
    this.$store.dispatch(`epinio/findAll`, { type: EPINIO_TYPES.APP });
    await this.$store.dispatch(`epinio/findAll`, { type: EPINIO_TYPES.SERVICE });
  },
  props:      {
    schema: {
      type:     Object,
      required: true,
    },
  },

  computed: {
    rows() {
      return this.$store.getters['epinio/all'](EPINIO_TYPES.SERVICE);
    },
  },
  created() {
    this.$nuxt.$on('createdService', () => {
      this.$store.dispatch(`epinio/findAll`, {
        type: EPINIO_TYPES.SERVICE,
        opt:  { force: true },
      });
    });
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <ResourceTable
      v-bind="$attrs"
      :rows="rows"
      :schema="schema"
      v-on="$listeners"
    >
      <template #cell:boundApps="{ row }">
        <span v-if="row.applications.length">
          <template v-for="(app, index) in row.applications">
            <LinkDetail :key="app.id" :row="app" :value="app.meta.name" />
            <span v-if="index < row.applications.length - 1" :key="app.id + 'i'">, </span>
          </template>
        </span>
        <span v-else class="text-muted">&nbsp;</span>
      </template>
    </ResourceTable>
  </div>
</template>
