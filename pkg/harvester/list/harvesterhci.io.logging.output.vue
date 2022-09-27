<script>
import ResourceTable from '@shell/components/ResourceTable';
import Banner from '@components/Banner/Banner.vue';
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
  components: {
    Loading, ResourceTable, Banner
  },

  async fetch() {
    this.listSchema = this.$store.getters['harvester/schemaFor'](LOGGING.OUTPUT);

    if (this.listSchema) {
      this.rows = await this.$store.dispatch('harvester/findAll', { type: LOGGING.OUTPUT });
    }

    this.$store.dispatch('type-map/configureType', { match: HCI.OUTPUT, isCreatable: this.listSchema && this.listSchema?.collectionMethods.find(x => x.toLowerCase() === 'post') });
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
