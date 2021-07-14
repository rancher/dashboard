<script>
import Loading from '@/components/Loading';
import ResourceTable from '@/components/ResourceTable';

import { allHash } from '@/utils/promise';
import { HCI, PV } from '@/config/types';
import { STATE, AGE, NAME, NAMESPACE } from '@/config/table-headers';

export default {
  name:       'ListVolume',
  components: { Loading, ResourceTable },

  props: {
    schema: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    const hash = await allHash({
      pv:         this.$store.dispatch('virtual/findAll', { type: PV }),
      vm:         this.$store.dispatch('virtual/findAll', { type: HCI.VM }),
      dataVolume: this.$store.dispatch('virtual/findAll', { type: HCI.DATA_VOLUME })
    });

    this.dataVolume = hash.dataVolume;
  },

  data() {
    return { dataVolume: [] };
  },

  computed: {
    rows() {
      return this.dataVolume;
    },
    headers() {
      return [
        STATE,
        NAME,
        NAMESPACE,
        {
          name:      'size',
          labelKey:  'tableHeaders.size',
          value:     'spec.pvc.resources.requests.storage',
          sort:      'volumeSort',
        },
        // {
        //   name:      'accessMode',
        //   label:     'Access Mode',
        //   value:     "$['spec']['pvc']['accessModes'][0]",
        //   sort:      "$['spec']['pvc']['accessModes'][0]",
        // },
        {
          name:      'AttachedVM',
          labelKey:  'tableHeaders.attachedVM',
          type:      'attached',
          value:      'spec.claimRef',
          sort:      'name',
          formatter: 'volumesState'
        },
        {
          name:      'progress',
          labelKey:  'tableHeaders.progress',
          type:      'progress',
          value:      'status.progress',
          sort:      'progress',
        },
        {
          name:      'phase',
          labelKey:  'tableHeaders.phase',
          value:     'phaseStatus',
          sort:      ['stateSort', 'nameSort'],
          width:     130,
          default:   'unknown',
          state:     'phaseStatus',
          formatter: 'BadgeStatus',
        },
        AGE,
      ];
    },
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
