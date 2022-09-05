<script lang="ts">
import Vue, { PropType } from 'vue';
import EpinioCatalogServiceModel from '../models/catalogservices';
import { EPINIO_PRODUCT_NAME, EPINIO_TYPES } from '../types';

import ResourceTable from '@shell/components/ResourceTable.vue';

interface Data {
}

export default Vue.extend<Data, any, any, any>({
  components: { ResourceTable },

  props: {
    value: {
      type:     Object as PropType<EpinioCatalogServiceModel>,
      required: true
    },
  },

  async fetch() {
    await this.$store.dispatch(`epinio/findAll`, { type: EPINIO_TYPES.SERVICE_INSTANCE });
  },

  data() {
    const servicesSchema = this.$store.getters[`${ EPINIO_PRODUCT_NAME }/schemaFor`](EPINIO_TYPES.SERVICE_INSTANCE);
    const servicesHeaders: [] = this.$store.getters['type-map/headersFor'](servicesSchema);

    return {
      servicesSchema,
      servicesHeaders
    };
  },
});
</script>

<template>
  <div>
    <h2 class="mt-20">
      {{ t('epinio.catalogService.detail.servicesTitle', { catalogService: value.name }) }}
    </h2>
    <ResourceTable
      :schema="servicesSchema"
      :rows="value.services"
      :loading="$fetchState.pending"
      :headers="servicesHeaders"
    />
  </div>
</template>
