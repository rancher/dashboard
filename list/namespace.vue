<script>
import { mapGetters } from 'vuex';
import ResourceTable from '@/components/ResourceTable';
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
    ...mapGetters(['isSingleVirtualCluster']),

    filterRow() {
      if (this.isSingleVirtualCluster) {
        return this.rows.filter( N => !N.isSystem);
      } else {
        return this.rows;
      }
    }
  }
};
</script>

<template>
  <ResourceTable
    v-bind="$attrs"
    :rows="filterRow"
    :groupable="true"
    :schema="schema"
    key-field="_key"
    v-on="$listeners"
  />
</template>
