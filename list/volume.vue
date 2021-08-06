<script>
import Loading from '@/components/Loading';
import ResourceTable from '@/components/ResourceTable';

import { allHash } from '@/utils/promise';
import { PVC, SCHEMA, HCI } from '@/config/types';
import { STATE, AGE, NAME, NAMESPACE } from '@/config/table-headers';

const schema = {
  id:         'volume',
  type:       SCHEMA,
  attributes: {
    kind:       'volume',
    namespaced: true
  },
  metadata: { name: 'volume' },
};

export default {
  name:       'ListVolume',
  components: { Loading, ResourceTable },

  async fetch() {
    const hash = await allHash({
      pvcs: this.$store.dispatch('virtual/findAll', { type: PVC }),
      vms:  this.$store.dispatch('virtual/findAll', { type: HCI.VM })
    });

    this.rows = hash.pvcs;
  },

  data() {
    return { rows: [] };
  },

  computed: {
    schema() {
      return schema;
    },

    headers() {
      return [
        STATE,
        NAME,
        NAMESPACE,
        {
          name:      'size',
          labelKey:  'tableHeaders.size',
          value:     'spec.resources.requests.storage',
          sort:      'volumeSort',
        },
        {
          name:      'AttachedVM',
          labelKey:  'tableHeaders.attachedVM',
          type:      'attached',
          value:     'spec.claimRef',
          sort:      'name',
          formatter: 'volumesState'
        },
        {
          ...STATE,
          name:          'phase',
          labelKey:      'tableHeaders.phase',
          formatterOpts: { arbitrary: true },
          value:         'phaseState',
        },
        AGE,
      ];
    },
  },

  typeDisplay() {
    return this.$store.getters['type-map/labelFor'](schema, 99);
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTable
    v-else
    v-bind="$attrs"
    :headers="headers"
    :groupable="true"
    default-sort-by="age"
    :rows="rows"
    :schema="schema"
    key-field="_key"
    v-on="$listeners"
  />
</template>
