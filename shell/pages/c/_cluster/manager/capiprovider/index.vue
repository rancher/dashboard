<script>
import { CAPI } from '@shell/config/types';
import ResourceTable from '@shell/components/ResourceTable';
import Masthead from '@shell/components/ResourceList/Masthead';
import Loading from '@shell/components/Loading.vue';

export default {
  name:       'CAPIProviders',
  components: {
    ResourceTable, Masthead, Loading
  },
  data() {
    return {
      errors:   [],
      rows:     [],
      resource: CAPI.CAPI_PROVIDER,
      schema:   this.$store.getters['management/schemaFor'](CAPI.CAPI_PROVIDER),
    };
  },
  async fetch() {
    this.rows = await this.$store.dispatch('management/findAll', { type: CAPI.CAPI_PROVIDER });
  }
};
</script>

<template>
  <div>
    <Masthead
      :schema="schema"
      :resource="resource"
      :type-display="t('providers.capi.title')"
      :is-creatable="true"
    />
    <Loading v-if="$fetchState.pending" />
    <ResourceTable
      v-else
      :schema="schema"
      :resource="resource"
      :rows="rows"
      :row-actions="true"
      :table-actions="true"
      :data-testid="'capi-provider-list'"
      key-field="id"
      class="mb-20"
    />
  </div>
</template>
