<script lang="ts">
import Masthead from '@shell/components/ResourceList/Masthead';
import { SECRET_SCOPE, SECRET_QUERY_PARAMS } from '@shell/config/query-params';
import { MANAGEMENT, SECRET } from '@shell/config/types';
import { STORE } from '@shell/store/store-types';
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable';
import { TableColumn } from '@shell/types/store/type-map';
import ResourceFetch from '@shell/mixins/resource-fetch';
import { mapGetters } from 'vuex';

export default {
  name: 'ListSecret',

  components: {
    Masthead,
    PaginatedResourceTable
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

    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },

  mixins: [ResourceFetch],

  data() {
    return {
      canViewProjects:  false,
      activeTab:        SECRET_QUERY_PARAMS.NAMESPACED,
      SECRET_TABS:      SECRET_QUERY_PARAMS,
      managementSchema: undefined,

      STORE,

      namespacedHeaders:    [] as TableColumn[],
      namespacedHeadersSsp: [] as TableColumn[],
    };
  },

  async created() {
    this.canViewProjects = this.$store.getters[`${ STORE.MANAGEMENT }/schemaFor`](MANAGEMENT.PROJECT);

    this.managementSchema = this.$store.getters[`${ STORE.MANAGEMENT }/schemaFor`](SECRET);
    this.namespacedHeaders = this.$store.getters['type-map/headersFor'](this.schema, false) as TableColumn[];
    this.namespacedHeadersSsp = this.$store.getters['type-map/headersFor'](this.schema, true) as TableColumn[];
  },

  computed: {
    createLocation() {
      return {
        name:  'c-cluster-product-resource-create',
        query: { [SECRET_SCOPE]: SECRET_QUERY_PARAMS.NAMESPACED }
      };
    },

    ...mapGetters(['currentCluster']),
  },

};
</script>

<template>
  <div>
    <Masthead
      component-testid="secrets-list"
      :schema="schema"
      :resource="resource"
      :create-location="createLocation"
    />
    <PaginatedResourceTable
      :schema="schema"
      :headers="namespacedHeaders"
      :pagination-headers="namespacedHeadersSsp"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
    />
  </div>
</template>
