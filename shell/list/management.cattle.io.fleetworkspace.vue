<script>
import ResourceTable from '@shell/components/ResourceTable';
import resourceFetch from '@shell/mixins/resource-fetch';

export default {
  name:       'ListWorkspace',
  components: { ResourceTable },
  mixins:     [resourceFetch],
  props:      {
    resource: {
      type:     String,
      required: true,
    },
    schema: {
      type:     Object,
      required: true,
    },
    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },

  async fetch() {
    try {
      await this.$fetchType(this.resource);
    } catch (e) {}
  },

  $loadingResources() {
    return { loadIndeterminate: true };
  },
};
</script>

<template>
  <ResourceTable
    v-bind="$attrs"
    :rows="rows"
    :schema="schema"
    :loading="loading"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
    :set-page-fn="resourceQueryMethods.setPage"
    :set-search-fn="resourceQueryMethods.setSearch"
    :set-sort-fn="resourceQueryMethods.setSort"
    :list-length="listLength"
    v-on="$listeners"
  />
</template>
