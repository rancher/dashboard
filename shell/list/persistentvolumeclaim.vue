<script>
import ResourceTable from '@shell/components/ResourceTable';
import { STORAGE_CLASS } from '@shell/config/types';
import ResourceFetch from '@shell/mixins/resource-fetch';

export default {
  name:       'ListPersistentVolumeClaim',
  components: { ResourceTable },
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
    const inStore = this.$store.getters['currentStore']();

    // Fetch storage classes so we can determine if a PVC can be expanded
    this.$store.dispatch(`${ inStore }/findAll`, { type: STORAGE_CLASS });

    await this.$fetchType(this.resource);
  }
};
</script>

<template>
  <ResourceTable
    :loading="loading"
    :schema="schema"
    :rows="rows"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
  />
</template>
