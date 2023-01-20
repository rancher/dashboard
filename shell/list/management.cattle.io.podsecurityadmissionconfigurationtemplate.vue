<script>
import ResourceTable from '@shell/components/ResourceTable';
import { STORAGE_CLASS } from '@shell/config/types';
import ResourceFetch from '@shell/mixins/resource-fetch';

export default {
  name:       'PodSecurityAdmission',
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
  />
</template>
