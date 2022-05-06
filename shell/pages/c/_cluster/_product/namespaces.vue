<script>
import ResourceTable from '@shell/components/ResourceTable';
import { STATE, NAME, AGE } from '@shell/config/table-headers';
import { NAMESPACE, VIRTUAL_TYPES } from '@shell/config/types';
import Loading from '@shell/components/Loading';
import Masthead from '@shell/components/ResourceList/Masthead';

export default {
  name:       'ListNamespace',
  components: {
    Loading, Masthead, ResourceTable
  },

  props: {},

  async fetch() {
    const inStore = this.$store.getters['currentStore'](NAMESPACE);

    this.schema = this.$store.getters[`${ inStore }/schemaFor`](NAMESPACE);
    this.rows = await this.$store.dispatch(`${ inStore }/findAll`, { type: NAMESPACE });
  },

  data() {
    return {
      rows: [], schema: null, NAMESPACE, VIRTUAL_TYPES
    };
  },

  computed: {
    headers() {
      return [
        STATE,
        NAME,
        AGE
      ];
    },
    createLocation() {
      return {
        name:   'c-cluster-product-resource-create',
        params: {
          product:  this.$store.getters['currentProduct'].name,
          resource: NAMESPACE
        },
      };
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <Masthead
      :schema="schema"
      :resource="NAMESPACE"
      :favorite-resource="VIRTUAL_TYPES.NAMESPACE"
      :create-location="createLocation"
    />
    <ResourceTable
      v-bind="$attrs"
      :schema="schema"
      :headers="headers"
      :rows="rows"
      :groupable="false"
      group-tooltip="resourceTable.groupBy.project"
      key-field="_key"
      v-on="$listeners"
    >
      <template #cell:project="{row}">
        <span v-if="row.project">{{ row.project.nameDisplay }}</span>
        <span v-else class="text-muted">&ndash;</span>
      </template>
    </ResourceTable>
  </div>
</template>
