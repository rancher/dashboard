<script>
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading';
import { SCHEMA, LOGGING } from '@shell/config/types';
import { HCI } from '../types';

const schema = {
  id:         HCI.CLUSTER_OUTPUT,
  type:       SCHEMA,
  attributes: {
    kind:       HCI.CLUSTER_OUTPUT,
    namespaced: true
  },
  metadata: { name: HCI.CLUSTER_OUTPUT },
};

export default {
  name:       'ListApps',
  components: { Loading, ResourceTable },

  async fetch() {
    this.rows = await this.$store.dispatch('harvester/findAll', { type: LOGGING.CLUSTER_OUTPUT });
    const clusterOutputSchema = this.$store.getters['harvester/schemaFor'](LOGGING.CLUSTER_OUTPUT);

    if (!clusterOutputSchema?.collectionMethods.find(x => x.toLowerCase() === 'post')) {
      this.$store.dispatch('type-map/configureType', { match: HCI.CLUSTER_OUTPUT, isCreatable: false });
    }
  },

  data() {
    return { rows: null };
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
  <ResourceTable v-else-if="rows" :schema="schema" :rows="rows" :ignore-filter="true" :groupable="false" />
</template>
