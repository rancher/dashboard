<script lang="ts">
import Masthead from '@shell/components/ResourceList/Masthead.vue';
import { SECRET_SCOPE, SECRET_QUERY_PARAMS } from '@shell/config/query-params';
import { SECRET } from '@shell/config/types';
import { STORE } from '@shell/store/store-types';
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable.vue';
import { PaginationArgs, PaginationParamFilter } from '@shell/types/store/pagination.types';
import Secret from '@shell/models/secret';
import { TableColumn } from '@shell/types/store/type-map';
import ResourceFetch from '@shell/mixins/resource-fetch';
import { mapGetters } from 'vuex';
import { GROUP_RESOURCES, mapPref } from '@shell/store/prefs';
import { UI_PROJECT_SECRET } from '@shell/config/labels-annotations';
import {
  AGE, SECRET_DATA, STATE, SUB_TYPE, NAME as NAME_COL, NAMESPACE as NAMESPACE_COL,
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

  mixins: [ResourceFetch],

  async fetch() {
    // this.$initializeFetchData(SECRET, undefined, STORE.MANAGEMENT);
  },

  data() {
    return {
      escapeHtml,
      SECRET,
      STORE,
      schema:        this.$store.getters[`${ STORE.MANAGEMENT }/schemaFor`](SECRET),
      clusterSchema: this.$store.getters[`${ STORE.CLUSTER }/schemaFor`](SECRET),
      inStore:       STORE.MANAGEMENT,

      projectedScopedHeaders:    [] as TableColumn[],
      projectedScopedHeadersSsp: [] as TableColumn[],

      mastheadLabel: '',
      groupOptions:  [{
        tooltipKey: 'resourceTable.groupBy.none',
        icon:       'icon-list-flat',
        value:      'none',
      }, {
        icon:          'icon-cluster',
        value:         'role',
        field:         `metadata.labels[${ UI_PROJECT_SECRET }]`,
        hideColumn:    'project',
        groupLabelKey: 'groupByNode',
        tooltipKey:    'resourceTable.groupBy.node'
      }]
    };
  },

  async created() {
    this.projectedScopedHeaders = [
      STATE,
      NAME_COL,
      NAMESPACE_COL, {
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

    groupBy() {
      return this.groupPreference === 'none' ? null : `metadata.labels[${ UI_PROJECT_SECRET }]`;
    },

  },

  methods: {
    /**
     * Filter out secrets that are not project-scoped
     */
    filterRowsLocal(rows: Secret[]) {
      return rows.filter((r: Secret) => {
        // TODO: RC test
        return r.isProjectScoped;
      });
    },

    /**
     * TODO: RC description
     */
    filterRowsApi(pagination: PaginationArgs): PaginationArgs {
      if (!pagination.filters) {
        pagination.filters = [];
      }

      const requiredFields =
      [
        PaginationParamFilter.createSingleField({
          field:  `metadata.labels[${ UI_PROJECT_SECRET }]`,
          exists: true,
        }),
        PaginationParamFilter.createSingleField({
          field: 'metadata.namespace',
          value: `${ this.currentCluster.id }-`,
          exact: false,
        })
      ];

      // const field2 = `metadata.annotations[${ UI_PROJECT_SECRET_COPY }]`;

      const existing: { [field: string]: PaginationParamFilter | null} = {};

      for (let i = 0; i < pagination.filters.length; i++) {
        const filter = pagination.filters[i];

        for (let y = 0; y < filter.fields.length; y++) {
          const existingField = filter.fields[y];

          if (!existingField.field ) {
            continue;
          }
          if (requiredFields.find((reqField) => reqField.fields[0].field === existingField.field)) {
            existing[existingField.field] = filter;
          }
          if (Object.keys(existing).length === requiredFields.length) {
            break;
          }
        }
      }

      // this.metadata?.annotations?.[UI_PROJECT_SECRET_COPY] === 'true'

      for (let i = 0; i < requiredFields.length; i++) {
        const reqField = requiredFields[i];

        if (!!existing[reqField.fields[0].field]) {
          Object.assign(existing, reqField);
        } else {
          pagination.filters.push(reqField);
        }
      }

      return pagination;
    },

    projectLabel(secret?: any) {
      return this.t('resourceTable.groupLabel.project', { name: escapeHtml(secret?.project?.nameDisplay || 'unknown') }, true);
    }
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
      :create-location="createLocation"

      :isCreatable="true"
    />
    <PaginatedResourceTable
      :groupBy="groupBy"
      :groupable="true"
      :groupTooltip="'abvc'"
      :groupOptions="groupOptions"
      :schema="schema"
      :headers="projectedScopedHeaders"
      :pagination-headers="projectedScopedHeadersSsp"
      :local-filter="filterRowsLocal"
      :api-filter="filterRowsApi"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :overrideInStore="STORE.MANAGEMENT"
    >
      <template #group-by="{group}">
        <div
          v-trim-whitespace
          v-clean-html="projectLabel(group.rows[0])"
          class="group-tab"
        />
      </template>
    </PaginatedResourceTable>
  </div>
</template>
