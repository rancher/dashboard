<script>
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading';
import { SCHEMA, LOGGING } from '@shell/config/types';
import { HCI } from '../types';

const schema = {
  id:         HCI.OUTPUT,
  type:       SCHEMA,
  attributes: {
    kind:       HCI.OUTPUT,
    namespaced: true
  },
  metadata: { name: HCI.OUTPUT },
};

export default {
  name:       'ListApps',
  components: { Loading, ResourceTable },

  async fetch() {
    this.rows = await this.$store.dispatch('harvester/findAll', { type: LOGGING.OUTPUT });
    const outputSchema = this.$store.getters['harvester/schemaFor'](LOGGING.OUTPUT);

    if (!outputSchema?.collectionMethods.find(x => x.toLowerCase() === 'post')) {
      this.$store.dispatch('type-map/configureType', { match: HCI.OUTPUT, isCreatable: false });
    }
  },

  data() {
    return { rows: [] };
  },

  computed: {
    schema() {
      return schema;
    }
  },

  typeDisplay() {
    return this.$store.getters['type-map/labelFor'](schema, 99);
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTable v-else :schema="schema" :rows="rows" />
</template>
