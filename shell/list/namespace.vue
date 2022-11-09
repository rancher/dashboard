<script>
import { mapGetters } from 'vuex';
import ResourceTable from '@shell/components/ResourceTable';

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
  data() {
    return { asddsa: true };
  },

  computed: {
    ...mapGetters(['currentProduct']),

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
    :schema="schema"
    key-field="_key"
    :loading="loading"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
    v-on="$listeners"
  />
</template>
