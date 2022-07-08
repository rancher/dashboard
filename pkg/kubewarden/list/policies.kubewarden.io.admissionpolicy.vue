<script>
import { Banner } from '@components/Banner';
import Loading from '@shell/components/Loading';
import ResourceTable from '@shell/components/ResourceTable';

export default {
  components: {
    Banner, Loading, ResourceTable
  },

  props: {
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
    this.rows = await this.$store.dispatch('cluster/findAll', { type: this.resource });
  },

  data() {
    return { rows: null };
  },

  computed: {
    headers() {
      return this.$store.getters['type-map/headersFor'](this.schema);
    },

    hasNamespaceSelector(row) {
      return row.namespaceSelector;
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <Banner
      class="type-banner mb-20 mt-0"
      color="info"
      :label="t('kubewarden.admissionPolicy.description')"
    />
    <ResourceTable :schema="schema" :rows="rows" :headers="headers">
      <template #col:mode="{ row }">
        <td>
          <span class="policy__mode">
            <span class="text-capitalize">{{ row.spec.mode }}</span>
            <i
              v-if="!hasNamespaceSelector(row)"
              :[v-tooltip.bottom]="t('kubewarden.admissionPolicy.namespaceWarning')"
              class="icon icon-warning"
            />
          </span>
        </td>
      </template>
    </ResourceTable>
  </div>
</template>
