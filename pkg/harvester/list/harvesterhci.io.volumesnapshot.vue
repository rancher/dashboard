<script>
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading';
import { SCHEMA } from '@shell/config/types';
import { VOLUME_SNAPSHOT, HCI } from '../types';

const schema = {
  id:         HCI.SNAPSHOT,
  type:       SCHEMA,
  attributes: {
    kind:       HCI.SNAPSHOT,
    namespaced: true
  },
  metadata: { name: HCI.SNAPSHOT },
};

export default {
  name: 'HarvesterListSnapshot',

  components: { ResourceTable, Loading },

  async fetch() {
    this.rows = await this.$store.dispatch('harvester/findAll', { type: VOLUME_SNAPSHOT });

    const snapShotSchema = this.$store.getters['harvester/schemaFor'](VOLUME_SNAPSHOT);

    if (!snapShotSchema?.collectionMethods.find(x => x.toLowerCase() === 'post')) {
      this.$store.dispatch('type-map/configureType', { match: HCI.SNAPSHOT, isCreatable: false });
    }
  },

  data() {
    return { rows: [] };
  },

  computed: {
    filteredRows() {
      return this.rows.filter((R) => {
        return R.metadata?.ownerReferences?.[0]?.kind === 'PersistentVolumeClaim';
      });
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
    :groupable="true"
    :namespaced="false"
    :schema="schema"
    :rows="filteredRows"
    key-field="_key"
    v-on="$listeners"
  />
</template>
