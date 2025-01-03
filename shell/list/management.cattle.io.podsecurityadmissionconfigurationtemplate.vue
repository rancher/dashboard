<script>
import ResourceTable from '@shell/components/ResourceTable';
import { STORAGE_CLASS } from '@shell/config/types';
import ResourceFetch from '@shell/mixins/resource-fetch';
import { Banner } from '@components/Banner';

export default {
  name:       'PodSecurityAdmission',
  components: { ResourceTable, Banner },
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
  emits: ['error'],

  async fetch() {
    const inStore = this.$store.getters['currentStore']();

    try {
    // Fetch storage classes so we can determine if a PVC can be expanded
      await this.$store.dispatch(`${ inStore }/findAll`, { type: STORAGE_CLASS });
    } catch (e) {
      this.$emit('error', e?.data || e);
    }
    await this.$fetchType(this.resource);
  }
};
</script>

<template>
  <div>
    <Banner
      color="info"
      :label="t('podSecurityAdmission.banner.modifications')"
    />

    <ResourceTable
      :loading="loading"
      :schema="schema"
      :rows="rows"
    />
  </div>
</template>
