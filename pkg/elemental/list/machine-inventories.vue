<script>
import ResourceTable from '@shell/components/ResourceTable';
import { ELEMENTAL_TYPES } from '../types';
import Loading from '@shell/components/Loading';

export default {
  name:       'ElementalMachineInventoriesList',
  components: {
    Loading,
    ResourceTable,
  },
  async fetch() {
    // this.$store.dispatch(`epinio/findAll`, { type: ELEMENTAL_TYPES.APP });
    await this.$store.dispatch(`elemental/findAll`, { type: ELEMENTAL_TYPES.MACHINE_INVENTORIES });
  },
  props:      {
    schema: {
      type:     Object,
      required: true,
    },
  },

  computed: {
    rows() {
      return this.$store.getters['elemental/all'](ELEMENTAL_TYPES.MACHINE_INVENTORIES);
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
      <!-- <template #cell:boundApps="{ row }">
        <span v-if="row.applications.length">
          <template v-for="(app, index) in row.applications">
            <LinkDetail :key="app.id" :row="app" :value="app.meta.name" />
            <span v-if="index < row.applications.length - 1" :key="app.id + 'i'">, </span>
          </template>
        </span>
        <span v-else class="text-muted">&nbsp;</span>
      </template> -->
    </ResourceTable>
  </div>
</template>
