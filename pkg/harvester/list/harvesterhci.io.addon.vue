<script>
import Loading from '@shell/components/Loading';
import ResourceTable from '@shell/components/ResourceTable';

import { allHash } from '@shell/utils/promise';
import { HCI } from '../types';
import { STATE, NAME } from '@shell/config/table-headers';

export default {
  name: 'ListHarvesterAddons',

  components: {
    ResourceTable,
    Loading,
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    await allHash({ storages: this.$store.dispatch(`${ inStore }/findAll`, { type: HCI.ADD_ONS }) });
  },

  computed: {
    rows() {
      const inStore = this.$store.getters['currentProduct'].inStore;

      const addons = this.$store.getters[`${ inStore }/all`](HCI.ADD_ONS);

      return addons;
    },

    headers() {
      return [
        STATE,
        NAME,
        {
          name:          'description',
          labelKey:      'tableHeaders.description',
          value:         'metadata.name',
          align:         'left',
          sort:          ['status.description'],
          formatter:     'Translate',
          formatterOpts: { prefix: 'harvester.addons.descriptions' },
        },
      ];
    },

    schema() {
      const inStore = this.$store.getters['currentProduct'].inStore;

      return this.$store.getters[`${ inStore }/schemaFor`](HCI.ADD_ONS);
    },
  },
};
</script>

<template>
  <div>
    <Loading v-if="$fetchState.pending" />
    <ResourceTable
      :rows="rows"
      :schema="schema"
      :headers="headers"
    />
  </div>
</template>
