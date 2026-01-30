<script lang="ts">
import Masthead from '@shell/components/ResourceList/Masthead';
import { SECRET_SCOPE, SECRET_QUERY_PARAMS } from '@shell/config/query-params';
import { MANAGEMENT, SECRET } from '@shell/config/types';
import { STORE } from '@shell/store/store-types';
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable';
import { TableColumn } from '@shell/types/store/type-map';
import ResourceFetch from '@shell/mixins/resource-fetch';
import { mapGetters } from 'vuex';
import { SECRET_CLONE, SECRET_PROJECT_SCOPED } from '@shell/config/table-headers';
import { STEVE_SECRET_CLONE } from '@shell/config/pagination-table-headers';

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

    const headers = this.namespacedHeaders.slice(0, -1);
    const headersSSP = this.namespacedHeadersSsp.slice(0, -1);

    if (this.canViewProjects) {
      // if the user can see projects, add a column to let them know if it's a secret from a project scoped secret
      headers.push(SECRET_CLONE);
      headersSSP.push(STEVE_SECRET_CLONE);
      if (this.currentCluster.isLocal) {
        this.$store.dispatch('management/findAll', { type: MANAGEMENT.PROJECT });

        // if the user is on the local cluster, add a column to let them know if it's a project scoped secret (from another cluster)
        headers.push(SECRET_PROJECT_SCOPED);
        headersSSP.push(SECRET_PROJECT_SCOPED);
      }
    }

    headers.push(this.namespacedHeaders[this.namespacedHeaders.length - 1]);
    headersSSP.push(this.namespacedHeadersSsp[this.namespacedHeadersSsp.length - 1]);

    this.namespacedHeaders = headers;
    this.namespacedHeadersSsp = headersSSP;
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
