<script lang="ts">
import Masthead from '@shell/components/ResourceList/Masthead.vue';
import { SECRET_SCOPE, SECRET_QUERY_PARAMS } from '@shell/config/query-params';
import { SECRET, VIRTUAL_TYPES } from '@shell/config/types';
import { STORE } from '@shell/store/store-types';
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable.vue';
import { PaginationArgs } from '@shell/types/store/pagination.types';
import { isProjectScopedSecretInCluster, projectScopedSecretsFilters } from '@shell/utils/project-scoped-secrets';
import Secret from '@shell/models/secret';
import { TableColumn } from '@shell/types/store/type-map';
import { mapGetters } from 'vuex';
import { GROUP_RESOURCES, mapPref } from '@shell/store/prefs';
import { UI_PROJECT_SECRET } from '@shell/config/labels-annotations';
import {
  AGE, SECRET_DATA, STATE, SUB_TYPE, NAME as NAME_COL,
} from '@shell/config/table-headers';
import { STEVE_AGE_COL, STEVE_NAME_COL, STEVE_STATE_COL } from '@shell/config/pagination-table-headers';
import { escapeHtml } from '@shell/utils/string';

export default {
  name:       'ListProjectScopedSecrets',
  components: { Masthead, PaginatedResourceTable },
  props:      {
    resource: {
      type:     String,
      required: true,
    },

    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return {
      escapeHtml,
      SECRET,
      PROJECT_SECRETS: VIRTUAL_TYPES.PROJECT_SECRETS,
      STORE,
      schema:          this.$store.getters[`${ STORE.MANAGEMENT }/schemaFor`](SECRET),
      clusterSchema:   this.$store.getters[`${ STORE.CLUSTER }/schemaFor`](SECRET),
      inStore:         STORE.MANAGEMENT,

      projectedScopedHeaders:    [] as TableColumn[],
      projectedScopedHeadersSsp: [] as TableColumn[],

      mastheadLabel: '',
      groupOptions:  [{
        tooltipKey: 'resourceTable.groupBy.none',
        icon:       'icon-list-flat',
        value:      'none',
      }, {
        icon:          'icon-folder',
        value:         'project',
        field:         'groupByProject',
        hideColumn:    'project',
        groupLabelKey: 'groupByProject',
        tooltipKey:    'resourceTable.groupBy.project'
      }],

      // these are the fields that sort will be applied on, either remotely by vai, or locally
      sortFields: {
        local: `groupByProject`, // would be nicer to user '`metadata.labels."${ UI_PROJECT_SECRET }"`', but that's invalid for ssp
        vai:   `metadata.labels[${ UI_PROJECT_SECRET }]`,
      },

    };
  },

  async created() {
    this.projectedScopedHeaders = [
      STATE,
      NAME_COL, {
        name:   'project',
        label:  this.t('tableHeaders.project'),
        value:  'project.nameDisplay',
        search: `project.nameDisplay`,
        sort:   ['projectNameSort', 'nameSort'],
      },
      SUB_TYPE,
      SECRET_DATA,
      AGE
    ];

    this.projectedScopedHeadersSsp = [
      STEVE_STATE_COL,
      STEVE_NAME_COL, {
        name:   'project',
        label:  this.t('tableHeaders.project'),
        value:  'project.nameDisplay',
        search: `spec.displayName`,
        sort:   `spec.displayName`,
      }, {
        ...SUB_TYPE,
        value:  'metadata.fields.1',
        sort:   'metadata.fields.1',
        search: 'metadata.fields.1',
      }, {
        ...SECRET_DATA,
        sort:   false,
        search: false,
      },
      STEVE_AGE_COL
    ];

    this.mastheadLabel = this.t(`typeLabel."${ this.resource }"`, { count: this.row?.length || 0 });
  },

  computed: {
    ...mapGetters(['currentCluster']),

    createLocation() {
      return {
        name:   'c-cluster-product-resource-create',
        params: { resource: VIRTUAL_TYPES.PROJECT_SECRETS },
        query:  { [SECRET_SCOPE]: SECRET_QUERY_PARAMS.PROJECT_SCOPED }
      };
    },

    groupPreference: mapPref(GROUP_RESOURCES),

    groupSort() {
      return this.sortFields.local;
    },

  },

  methods: {
    /**
     * Locally filter out secrets that are...
     * - not project-scoped (also excludes their copies)
     * - not in the current cluster (mgmt secrets are global)
     *
     * Project scoped secrets are a cluster / project level management resource, so the ns/project
     * header selection is intentionally not applied here (see side nav count).
     */
    filterRowsLocal(rows: Secret[]) {
      return rows.filter((r: Secret) => isProjectScopedSecretInCluster(r, this.currentCluster.id));
    },

    /**
     * Map the local sort field onto the one vai understands, strip the ns/project header injection,
     * and filter in this cluster's project scoped secrets (excluding their copies).
     *
     * The ns/project header selection is intentionally not applied: project scoped secrets are a
     * cluster / project level management resource, so the list always shows all of them.
     */
    filterRowsApi(pagination: PaginationArgs): PaginationArgs {
      const sort = pagination.sort?.find((s) => s.field === this.sortFields.local);

      if (sort) {
        sort.field = this.sortFields.vai;
      }

      // The ns/project header selection injects `projectsornamespaces` and `metadata.namespace`
      // filters. Project scoped secrets are management store secrets that don't live in the selected
      // cluster's namespaces, so those filters would hide them all. Strip them out here...
      pagination.projectsOrNamespaces = [];
      pagination.filters = (pagination.filters || []).filter(
        (filter) => !filter.fields?.some((f) => f.field === 'metadata.namespace')
      );

      // ...then filter in the current cluster's project scoped secrets (labelFilter) while filtering
      // out their copies (annotationFilter). Shared with the side nav count fetch so both match the
      // same set.
      const { labelFilter, annotationFilter, clusterFilter } = projectScopedSecretsFilters(this.currentCluster.id);

      pagination.filters.push(clusterFilter, annotationFilter, labelFilter);

      return pagination;
    },

  }
};
</script>

<template>
  <div>
    <Masthead
      component-testid="secrets-list"
      :schema="schema"
      :typeDisplay="mastheadLabel"
      :resource="SECRET"
      :favoriteResource="PROJECT_SECRETS"
      :create-location="createLocation"
      :isCreatable="true"
    />
    <PaginatedResourceTable
      :groupSort="groupSort"
      :groupable="true"
      :groupOptions="groupOptions"
      :schema="schema"
      :headers="projectedScopedHeaders"
      :namespaced="false"
      :pagination-headers="projectedScopedHeadersSsp"
      :local-filter="filterRowsLocal"
      :api-filter="filterRowsApi"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :overrideInStore="STORE.MANAGEMENT"
    />
  </div>
</template>
