<script>
/**
 * This file is used in shell/scripts/test-plugins-build.sh (creates an extension with it in, and builds using a shell built from source)
 */
import { mapGetters } from 'vuex';
import { NS_SNAPSHOT_QUOTA } from '@shell/config/table-headers';
import ResourceTable from '@shell/components/ResourceTable';
import { HCI } from '@shell/config/types';
export default {
  name:       'ListNamespace',
  components: { ResourceTable },
  props:      {
    resource: {
      type:     String,
      required: true,
    },
    schema: {
      type:     Object,
      required: true,
    },
    rows: {
      type:     Array,
      required: true,
    },
    loading: {
      type:     Boolean,
      required: false,
    },
    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },

  computed: {
    ...mapGetters(['currentProduct']),
    hasHarvesterResourceQuotaSchema() {
      const inStore = this.$store.getters['currentProduct'].inStore;

      return !!this.$store.getters[`${ inStore }/schemaFor`](HCI.RESOURCE_QUOTA);
    },
    headers() {
      const headersFromSchema = this.$store.getters['type-map/headersFor'](this.schema);

      if (this.hasHarvesterResourceQuotaSchema) {
        headersFromSchema.splice(2, 0, NS_SNAPSHOT_QUOTA);
      }

      return headersFromSchema;
    },
    filterRow() {
      if (this.currentProduct.hideSystemResources) {
        return this.rows.filter( (N) => {
          return !N.isSystem && !N.isFleetManaged;
        });
      } else {
        return this.rows;
      }
    },
  },

  $loadingResources() {
    return { loadIndeterminate: true };
  },
};
</script>

<template>
  <ResourceTable
    v-bind="$attrs"
    :rows="filterRow"
    :groupable="false"
    :headers="headers"
    :schema="schema"
    key-field="_key"
    :loading="loading"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
  />
</template>
