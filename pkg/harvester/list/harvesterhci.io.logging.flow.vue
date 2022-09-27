<script>
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading';
import { SCHEMA, LOGGING } from '@shell/config/types';
import { HCI } from '../types';

const schema = {
  id:         HCI.FLOW,
  type:       SCHEMA,
  attributes: {
    kind:       HCI.FLOW,
    namespaced: true
  },
  metadata: { name: HCI.FLOW },
};

export default {
  name:       'ListApps',
  components: { Loading, ResourceTable },

  async fetch() {
    try {
      await this.$store.dispatch('harvester/findAll', { type: LOGGING.OUTPUT });
      await this.$store.dispatch('harvester/findAll', { type: LOGGING.CLUSTER_OUTPUT });
    } catch (e) {}
    const rows = await this.$store.dispatch('harvester/findAll', { type: LOGGING.FLOW });
    const flowSchema = this.$store.getters['harvester/schemaFor'](LOGGING.FLOW);

    if (!flowSchema?.collectionMethods.find(x => x.toLowerCase() === 'post')) {
      this.$store.dispatch('type-map/configureType', { match: HCI.FLOW, isCreatable: false });
    }

    this.rows = rows;
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
