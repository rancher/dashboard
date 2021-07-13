<script>
import ResourceTable from '@/components/ResourceTable';
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
  components: { ResourceTable },

  async fetch() {
    this.rows = await this.$store.dispatch('virtual/findAll', { type: CONFIG_MAP });
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
    const { params:{ resource: type } } = this.$route;
    let paramSchema = schema;

    if (type !== schema.id) {
      paramSchema = this.$store.getters['virtual/schemaFor'](type);
    }

    return this.$store.getters['type-map/labelFor'](paramSchema, 99);
  },
};
</script>

<template>
  <ResourceTable
    v-bind="$attrs"
    :headers="headers"
    :groupable="true"
    :schema="schema"
    :rows="filterdRows"
    key-field="_key"
    v-on="$listeners"
  />
</template>
