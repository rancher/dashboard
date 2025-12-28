<script lang="ts">
import Masthead from '@shell/components/ResourceList/Masthead';
import { SECRET_SCOPE, SECRET_QUERY_PARAMS } from '@shell/config/query-params';
import { SECRET, VIRTUAL_TYPES } from '@shell/config/types';
import { STORE } from '@shell/store/store-types';
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable';
import { PaginationArgs, PaginationFilterField, PaginationParamFilter } from '@shell/types/store/pagination.types';
import Secret from '@shell/models/secret';
import { TableColumn } from '@shell/types/store/type-map';
import { mapGetters } from 'vuex';
import { GROUP_RESOURCES, mapPref } from '@shell/store/prefs';
import { UI_PROJECT_SECRET, UI_PROJECT_SECRET_COPY } from '@shell/config/labels-annotations';
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
        name:  'project',
        label: this.t('tableHeaders.project'),
        value: 'project.nameDisplay',
        // blocked on https://github.com/rancher/rancher/issues/51001
        // search: `metadata.labels[${ UI_PROJECT_SECRET }]`,
        sort:  `metadata.labels[${ UI_PROJECT_SECRET }]`,
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
        params: { resource: SECRET },
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
     * - not project-scoped
     * - not in current cluster (mgmt secrets are global)
     */
    filterRowsLocal(rows: Secret[]) {
      return rows.filter((r: Secret) => {
        // Filter in pss but not the copies
        if (!r.isProjectScoped) {
          return;
        }

        // Filter in if this cluster
        if (r.projectScopedClusterId === this.currentCluster.id) {
          return true;
        }

        return false;
      });
    },

    /**
     * Remotely filter out secrets that are..
     * - not project-scoped
     * - not in current cluster (mgmt secrets are global)
     */
    filterRowsApi(pagination: PaginationArgs): PaginationArgs {
      const sort = pagination.sort.find((s) => s.field === this.sortFields.local);

      if (sort) {
        sort.field = this.sortFields.vai;
      }

      if (!pagination.filters) {
        pagination.filters = [];
      }

      // Filter in pss (and annoyingly their copies)
      const labelFilter = PaginationParamFilter.createSingleField({
        field:  `metadata.labels[${ UI_PROJECT_SECRET }]`,
        exists: true,
      });

      // Filter out their copies
      const annotationFilter = PaginationParamFilter.createSingleField({
        field:  `metadata.annotations[${ UI_PROJECT_SECRET_COPY }]`,
        value:  `true`,
        equals: false,
        exact:  true,
      });

      // Filter in the current clusters pss
      // TODO: RC CURRENTLY BROKEN GIVEN https://github.com/rancher/rancher/issues/52810
      const nsFields: PaginationFilterField[] = [{
        field:  'spec.clusterName',
        value:  this.currentCluster.id,
        equals: true,
        exact:  true,
      }];

      const namespaceFilter = PaginationParamFilter.createSingleField(nsFields[0]);

      let foundLabelFilter = false;
      let foundAnnotationFilter = false;
      let foundNsFilter = false;

      for (let i = 0; i < pagination.filters.length; i++) {
        const filter = pagination.filters[i];

        if (filter.param === namespaceFilter.fields[0].field) {
          // 1. strip out all ns filters, this includes the one that hides resources in system namespaces...... which we need
          // 2. use the ns filter to find upstream project scoped secrets that are in this cluster
          pagination.filters[i] = namespaceFilter;
          foundNsFilter = true;
        } else {
          if (!!filter.fields.find((f) => f.field === annotationFilter.fields[0].field)) {
            foundAnnotationFilter = true;
          } else if (!!filter.fields.find((f) => f.field === labelFilter.fields[0].field)) {
            foundLabelFilter = true;
          }
        }
      }

      if (!foundLabelFilter) {
        pagination.filters.push(labelFilter);
      }

      if (!foundAnnotationFilter) {
        pagination.filters.push(annotationFilter);
      }

      if (!foundNsFilter) {
        pagination.filters.push(namespaceFilter);
      }

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
