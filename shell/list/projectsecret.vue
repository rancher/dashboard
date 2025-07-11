<script lang="ts">
import Masthead from '@shell/components/ResourceList/Masthead';
import { SECRET_SCOPE, SECRET_QUERY_PARAMS } from '@shell/config/query-params';
import { MANAGEMENT, SECRET, VIRTUAL_TYPES } from '@shell/config/types';
import { STORE } from '@shell/store/store-types';
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable';
import { FilterArgs, PaginationArgs, PaginationFilterField, PaginationParamFilter } from '@shell/types/store/pagination.types';
import Secret from '@shell/models/secret';
import { TableColumn } from '@shell/types/store/type-map';
import ResourceFetch from '@shell/mixins/resource-fetch';
import { mapGetters } from 'vuex';
import { GROUP_RESOURCES, mapPref } from '@shell/store/prefs';
import { UI_PROJECT_SECRET } from '@shell/config/labels-annotations';
import { RancherKubeMetadata } from '@shell/types/kube/kube-api';
import {
  AGE, SECRET_DATA, STATE, SUB_TYPE, NAME as NAME_COL,
} from '@shell/config/table-headers';
import { STEVE_AGE_COL, STEVE_NAME_COL, STEVE_STATE_COL } from '@shell/config/pagination-table-headers';
import { escapeHtml } from '@shell/utils/string';
import { ActionFindPageArgs } from '@shell/types/store/dashboard-store.types';
import { PagTableFetchPageSecondaryResourcesOpts } from '@shell/types/components/paginatedResourceTable';

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

  mixins: [ResourceFetch],

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
        hideColumn:    'project',
        groupLabelKey: 'groupByProject',
        tooltipKey:    'resourceTable.groupBy.project'
      }],
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
        search: `metadata.labels[${ UI_PROJECT_SECRET }]`,
        sort:   `metadata.labels[${ UI_PROJECT_SECRET }]`,
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
      // this is the field that sort will be applied on, either via vai, or locally
      return this.canPaginate ? `metadata.labels[${ UI_PROJECT_SECRET }]` : `metadata.labels."${ UI_PROJECT_SECRET }"`;
    },

    groupBy() {
      // this is the field that is used locally to find the value
      return this.groupPreference === 'none' ? null : `metadata.labels."${ UI_PROJECT_SECRET }"`;
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
        const metadata = r.metadata as RancherKubeMetadata; // Secrets will always have metadata, but hybrid-class does nasty things which breaks typing

        return r.isProjectScoped && metadata.namespace.startsWith(this.currentCluster.id);
      });
    },

    /**
     * Remotely filter out secrets that are..
     * - not project-scoped
     * - not in current cluster (mgmt secrets are global)
     */
    filterRowsApi(pagination: PaginationArgs): PaginationArgs {
      if (!pagination.filters) {
        pagination.filters = [];
      }

      const labelFilter = PaginationParamFilter.createSingleField({
        field:  `metadata.labels[${ UI_PROJECT_SECRET }]`,
        exists: true,
      });
      const namespaceFilter = PaginationParamFilter.createSingleField({
        field: 'metadata.namespace',
        value: `${ this.currentCluster.id }-`,
        exact: false,
      });

      let existingLabelFilter: PaginationParamFilter | null = null;
      let foundNsFilter = false;

      for (let i = 0; i < pagination.filters.length; i++) {
        const filter = pagination.filters[i];

        if (filter.param === namespaceFilter.fields[0].field) {
          // 1. strip out all ns filters, this includes the one that hides resources in system namespaces...... which we need
          // 2. use the ns filter to find upstream project scoped secrets that are in this cluster
          pagination.filters[i] = namespaceFilter;
          foundNsFilter = true;
        } else if (!!filter.fields.find((f) => f.field === labelFilter.fields[0].field)) {
          existingLabelFilter = labelFilter;
        }
      }

      if (!!existingLabelFilter) {
        Object.assign(existingLabelFilter, labelFilter);
      } else {
        pagination.filters.push(labelFilter);
      }

      if (!foundNsFilter) {
        pagination.filters.push(namespaceFilter);
      }

      return pagination;
    },

    /**
     * of type PagTableFetchSecondaryResources
     */
    async fetchSecondaryResources({ canPaginate }: { canPaginate: boolean}) {
      if (canPaginate) {
        return;
      }
      // only force if we're in local and need projects from other clusters
      await this.$store.dispatch('management/findAll', { type: MANAGEMENT.PROJECT, opt: { force: this.currentCluster.isLocal } });
    },

    /**
     * fetch projects associated with this page
     *
     * of type PagTableFetchPageSecondaryResources
     */
    async fetchPageSecondaryResources({ canPaginate, force, page }: PagTableFetchPageSecondaryResourcesOpts) {
      // Fetch projects associated with this page
      if (!canPaginate || !page?.length) {
        return;
      }

      const opt: ActionFindPageArgs = {
        force,
        pagination: new FilterArgs({
          filters: PaginationParamFilter.createMultipleFields(page
            .filter((r: Secret) => r.projectScopedClusterId && r.projectScopedProjectId)
            .map((r: Secret) => new PaginationFilterField({
              field: 'id',
              value: `${ r.projectScopedClusterId }/${ r.projectScopedProjectId }`
            }))),
        })
      };

      this.$store.dispatch(`management/findPage`, { type: MANAGEMENT.PROJECT, opt });
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
      :groupBy="groupBy"
      :groupSort="groupSort"
      :groupable="true"
      :groupOptions="groupOptions"
      :schema="schema"
      :headers="projectedScopedHeaders"
      :namespaced="false"
      :pagination-headers="projectedScopedHeadersSsp"
      :local-filter="filterRowsLocal"
      :api-filter="filterRowsApi"
      :fetchSecondaryResources="fetchSecondaryResources"
      :fetchPageSecondaryResources="fetchPageSecondaryResources"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :overrideInStore="STORE.MANAGEMENT"
    />
  </div>
</template>
