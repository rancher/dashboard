<script>
import ResourceTable from '@shell/components/ResourceTable';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';

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
    filterHideRows() {
      return this.rows.filter((repo) => !(repo?.metadata?.annotations?.[CATALOG_ANNOTATIONS.HIDDEN_REPO] === 'true'));
    }
  }
};
</script>

<template>
  <div>
    <ResourceTable
      :schema="schema"
      :rows="filterHideRows"
      :loading="loading"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      data-testid="app-cluster-repo-list"
    />
  </div>
</template>
