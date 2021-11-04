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
    rows: {
      type:     Array,
      required: true,
    },
  },

  computed: {

    filterRows() {
      // A custom list component is needed
      // because the backend gives a null value for
      // boundapps of a service that is not bound
      // to any apps.
      // ResourceTable needs the value to be
      // an array because boundapps is defined as a list
      // in the service type.
      return this.rows.map((row) => {
        if (!row.boundapps) {
          row.boundapps = [];
        }

        // SortableTable also checks for the namespace
        // name in the metadata, so we put it in meta.
        row.meta = {
          name:      row.name,
          namespace: row.namespace
        };
        delete row.namespace;

        return row;
      });
    },
  }
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
