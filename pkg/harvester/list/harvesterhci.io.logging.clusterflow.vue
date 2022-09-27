<script>
import ResourceTable from '@shell/components/ResourceTable';
import Banner from '@components/Banner/Banner.vue';
import Loading from '@shell/components/Loading';
import { SCHEMA, LOGGING } from '@shell/config/types';
import { HCI } from '../types';

const schema = {
  id:         HCI.CLUSTER_FLOW,
  type:       SCHEMA,
  attributes: {
    kind:       HCI.CLUSTER_FLOW,
    namespaced: true
  },
  metadata: { name: HCI.CLUSTER_FLOW },
};

export default {
  name:       'ListApps',
  components: {
    Loading, ResourceTable, Banner
  },

  async fetch() {
    this.listSchema = this.$store.getters['harvester/schemaFor'](LOGGING.CLUSTER_FLOW);

    if (this.listSchema) {
      await this.$store.dispatch('harvester/findAll', { type: LOGGING.CLUSTER_OUTPUT });
      this.rows = await this.$store.dispatch('harvester/findAll', { type: LOGGING.CLUSTER_FLOW });
    }

    this.$store.dispatch('type-map/configureType', { match: HCI.CLUSTER_FLOW, isCreatable: this.listSchema && this.listSchema?.collectionMethods.find(x => x.toLowerCase() === 'post') });
  },

  data() {
    return { rows: [], listSchema: null };
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
  <ResourceTable v-else-if="listSchema" :schema="schema" :rows="rows" :ignore-filter="true" :groupable="false" />
  <Banner v-else color="warning">
    {{ t('harvester.generic.noSchema', {schema: schema.id}) }}
  </Banner>
</template>
