<script>
import Loading from '@shell/components/Loading';
import ResourceTable from '@shell/components/ResourceTable';

import { allHash } from '@shell/utils/promise';
import { SCHEMA, STORAGE_CLASS } from '@shell/config/types';
import { HCI } from '../types';
import {
  STATE, AGE, NAME, STORAGE_CLASS_PROVISIONER, STORAGE_CLASS_DEFAULT
} from '@shell/config/table-headers';

const schema = {
  id:         HCI.STORAGE,
  type:       SCHEMA,
  attributes: {
    kind:       HCI.STORAGE,
    namespaced: false
  },
  metadata: { name: HCI.STORAGE },
};

export default {
  name: 'ListHarvesterStorages',

  components: {
    ResourceTable,
    Loading,
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    await allHash({ storages: this.$store.dispatch(`${ inStore }/findAll`, { type: STORAGE_CLASS }) });
  },

  data() {
    return { schema };
  },

  computed: {
    rows() {
      const inStore = this.$store.getters['currentProduct'].inStore;

      const storages = this.$store.getters[`${ inStore }/all`](STORAGE_CLASS);

      return storages.filter(s => !s.parameters?.backingImage);
    },

    headers() {
      return [
        STATE,
        NAME,
        STORAGE_CLASS_PROVISIONER,
        STORAGE_CLASS_DEFAULT,
        {
          name:     'numberOfReplicas',
          labelKey: 'harvester.storage.numberOfReplicas.label',
          value:    'parameters.numberOfReplicas',
          sort:     ['parameters.numberOfReplicas'],
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
  <div>
    <Loading v-if="$fetchState.pending" />
    <ResourceTable
      :rows="rows"
      :schema="schema"
      :headers="headers"
    />
  </div>
</template>
