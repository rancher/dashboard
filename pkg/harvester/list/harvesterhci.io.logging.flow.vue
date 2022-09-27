<script>
import ResourceTable from '@shell/components/ResourceTable';
import Banner from '@components/Banner/Banner.vue';
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
  components: {
    Loading, ResourceTable, Banner
  },

  async fetch() {
    this.listSchema = this.$store.getters['harvester/schemaFor'](LOGGING.FLOW);

    if (this.listSchema) {
      try {
        await this.$store.dispatch('harvester/findAll', { type: LOGGING.OUTPUT });
        await this.$store.dispatch('harvester/findAll', { type: LOGGING.CLUSTER_OUTPUT });
      } catch (e) {}

      this.rows = await this.$store.dispatch('harvester/findAll', { type: LOGGING.FLOW });
    }

    this.$store.dispatch('type-map/configureType', { match: HCI.FLOW, isCreatable: this.listSchema && this.listSchema?.collectionMethods.find(x => x.toLowerCase() === 'post') });
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
  <ResourceTable v-else-if="listSchema" :schema="schema" :rows="rows" />
  <Banner v-else color="warning">
    {{ t('harvester.generic.noSchema', {schema: schema.id}) }}
  </Banner>
</template>
