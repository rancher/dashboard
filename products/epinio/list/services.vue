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
    const all = await Promise.all([
      this.$store.dispatch(`epinio/findAll`, { type: EPINIO_TYPES.APP }),
      this.$store.dispatch(`epinio/findAll`, { type: EPINIO_TYPES.SERVICE })
    ]);

    this.rows = all[1];
  },
  props:      {
    schema: {
      type:     Object,
      required: true,
    },
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
