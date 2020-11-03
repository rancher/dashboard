<script>
import ResourceTable from '@/components/ResourceTable';
import Loading from '@/components/Loading';

export default {
  name:       'ListApps',
  components: { Loading, ResourceTable },

  props: {
    resource: {
      type:     String,
      required: true,
    },

    schema: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    await this.$store.dispatch('catalog/load');

    this.rows = await this.$store.dispatch('cluster/findAll', { type: this.resource });
  },

  data() {
    return { rows: null };
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTable v-else :schema="schema" :rows="rows">
    <template #cell:upgrade="{row}">
      <span v-if="row.upgradeAvailable" class="badge-state bg-warning hand" @click="row.goToUpgrade(row.upgradeAvailable)">
        {{ row.upgradeAvailable }}
        <i classs="icon icon-upload" />
      </span>
      <span v-else-if="row.upgradeAvailable === false" v-t="'catalog.app.managed'" class="text-muted" />
    </template>
  </ResourceTable>
</template>
