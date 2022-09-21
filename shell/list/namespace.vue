<script>
import { mapGetters } from 'vuex';
import ResourceTable from '@shell/components/ResourceTable';

export default {
  name:       'ListNamespace',
  components: { ResourceTable },
  props:      {
    schema: {
      type:     Object,
      required: true,
    },
    rows: {
      type:     Array,
      required: true,
    },
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
  }
};
</script>

<template>
  <ResourceTable
    v-bind="$attrs"
    :rows="filterRow"
    :groupable="false"
    :schema="schema"
    key-field="_key"
    v-on="$listeners"
  />
</template>
