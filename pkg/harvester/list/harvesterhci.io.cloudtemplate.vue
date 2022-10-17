<script>
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading';
import { CONFIG_MAP, SCHEMA } from '@shell/config/types';
import { HCI } from '../types';
import { NAME, AGE, NAMESPACE } from '@shell/config/table-headers';
import { HCI as HCI_ANNOTATIONS } from '@shell/config/labels-annotations';

const schema = {
  id:         HCI.CLOUD_TEMPLATE,
  type:       SCHEMA,
  attributes: {
    kind:       HCI.CLOUD_TEMPLATE,
    namespaced: true
  },
  metadata: { name: HCI.CLOUD_TEMPLATE },
};

export default {
  name:       'HarvesterListCloudTemplate',
  components: { ResourceTable, Loading },

  async fetch() {
    this.rows = await this.$store.dispatch('harvester/findAll', { type: CONFIG_MAP });

    const configSchema = this.$store.getters['harvester/schemaFor'](CONFIG_MAP);

    if (!configSchema?.collectionMethods.find(x => x.toLowerCase() === 'post')) {
      this.$store.dispatch('type-map/configureType', { match: HCI.CLOUD_TEMPLATE, isCreatable: false });
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

    filteredRows() {
      return this.rows.filter(r => !!r.metadata?.labels?.[HCI_ANNOTATIONS.CLOUD_INIT]);
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
    :rows="filteredRows"
    key-field="_key"
    v-on="$listeners"
  />
</template>
