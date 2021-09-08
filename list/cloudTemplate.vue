<script>
import ResourceTable from '@/components/ResourceTable';
import Loading from '@/components/Loading';
import { CONFIG_MAP, SCHEMA } from '@/config/types';
import { NAME, AGE, NAMESPACE } from '@/config/table-headers';
import { HCI } from '@/config/labels-annotations';

const schema = {
  id:         'cloudTemplate',
  type:       SCHEMA,
  attributes: {
    kind:       'cloudTemplate',
    namespaced: true
  },
  metadata: { name: 'cloudTemplate' },
};

export default {
  name:       'ListCloudTemplate',
  components: { ResourceTable, Loading },

  async fetch() {
    this.rows = await this.$store.dispatch('virtual/findAll', { type: CONFIG_MAP });

    const configSchema = this.$store.getters['virtual/schemaFor'](CONFIG_MAP);

    if (!configSchema?.collectionMethods.find(x => x.toLowerCase() === 'post')) {
      this.$store.dispatch('type-map/configureType', { match: 'cloudTemplate', isCreatable: false });
    }
  },

  data() {
    return { rows: [] };
  },

  computed: {
    headers() {
      return [
        NAME,
        NAMESPACE,
        {
          name:          'type',
          labelKey:      'tableHeaders.type',
          value:         'metadata.labels',
          formatter:     'CloudInitType',
        },
        AGE
      ];
    },

    filterdRows() {
      return this.rows.filter(r => !!r.metadata?.labels?.[HCI.CLOUD_INIT]);
    },

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
  <ResourceTable
    v-else
    v-bind="$attrs"
    :headers="headers"
    :groupable="true"
    :schema="schema"
    :rows="filterdRows"
    key-field="_key"
    v-on="$listeners"
  />
</template>
