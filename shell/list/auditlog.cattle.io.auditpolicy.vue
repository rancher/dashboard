<script lang="ts">
import { BadgeState } from '@components/BadgeState';
import { AGE } from '@shell/config/table-headers';
import ResourceFetch from '@shell/mixins/resource-fetch';
import ResourceTable from '@shell/components/ResourceTable.vue';

export default {
  components: { BadgeState, ResourceTable },
  mixins:     [ResourceFetch],
  props:      {
    resource: {
      type:     String,
      required: true,
    },

    schema: {
      type:     Object,
      required: true,
    },

    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },

  async fetch() {
    await this.$fetchType(this.resource);
  },

  computed: {
    headers() {
      const headersFromSchema = this.$store.getters['type-map/headersFor'](this.schema);

      const headers = headersFromSchema.filter((h: {name : string}) => h.name !== 'valid' && h.name !== 'active');

      headers.push(AGE);

      return headers;
    },
  }

};
</script>

<template>
  <ResourceTable
    :schema="schema"
    :headers="headers"
    :rows="rows"
    :loading="loading"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
    :namespaced="schema.attributes.namespaced"
    fetchSecondaryResources="fetchSecondaryResources"
  >
    <template #cell:enabled="{row}">
      <BadgeState
        :color="row.spec.enabled ? 'bg-success' : 'badge-disabled'"
        :label="row.spec.enabled ? t('generic.enabled') : t('generic.disabled') "
      />
    </template>
  </ResourceTable>
</template>
