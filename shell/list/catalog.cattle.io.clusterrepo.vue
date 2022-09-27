<script>
import ResourceTable from '@shell/components/ResourceTable';
export default {
  name:       'ListClusterReposApps',
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
  },
  computed: {
    loading() {
      return this.rows.length ? false : this.$fetchState?.pending;
    }
  },
};
</script>

<template>
  <div>
    <ResourceTable
      :schema="schema"
      :rows="rows"
      :loading="loading"
    />
  </div>
</template>
