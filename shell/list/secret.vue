<script lang="ts">
import Masthead from '@shell/components/ResourceList/Masthead';
import Loading from '@shell/components/Loading';
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import { SECRET_SCOPE, SECRET_TABS } from '@shell/config/query-params';
import { NAMESPACE as NAMESPACE_HEADER, PROJECT } from '@shell/config/table-headers';
import { MANAGEMENT } from '@shell/config/types';
import { UI_PROJECT_SECRET, UI_PROJECT_SECRET_COPY } from '@shell/config/labels-annotations';
import { mapPref, GROUP_RESOURCES } from '@shell/store/prefs';
import { PaginationArgs, PaginationParamFilter } from '@shell/types/store/pagination.types';

// TODO
const IS_COPY_COL = {
  name: 'isCopy',
  sort: 'isCopy'
};
const ORIGIN_PROJECT_COL = {
  name: 'originProject',
  sort: 'originProject'
};

export default {
  name:       'Secret',
  components: {
    PaginatedResourceTable, Tabbed, Tab, Masthead, Loading
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

  data() {
    return {
      canViewProjects: false,
      allProjects:     new Map(),
      activeTab:       SECRET_TABS.NAMESPACED,
      SECRET_TABS,
      // TODO
      // projectSecretsGroupOptions: [
      //   {
      //     icon:       'icon-list-flat',
      //     value:      'none',
      //     tooltipKey: 'resourceTable.groupBy.none',
      //   },
      //   {
      //     tooltipKey: 'resourceTable.groupBy.project',
      //     icon:       'icon-folder',
      //     hideColumn: 'project',
      //     value: 'project',
      //     field: 'project',
      //     // groupLabelKey: 'groupByLabel' create one in secret model?
      //   }
      // ]
    };
  },

  async created() {
    const canViewProjects = this.$store.getters['management/schemaFor'](MANAGEMENT.PROJECT);

    this.canViewProjects = canViewProjects;

    if (canViewProjects) {
      const findAll = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.PROJECT, opt: { force: true } });

      findAll.forEach((p) => {
        const [clusterId, projectId] = p.id.split('/');

        this.allProjects.set(projectId, {
          clusterId,
          projectId,
          projectName: p.spec.displayName
        });
      });
    }
  },

  computed: {
    groupPreference: mapPref(GROUP_RESOURCES),

    projectgroupBy() {
      // TODO
      return this.groupPreference === 'none' ? null : 'project';
    },

    projectScopedHeaders() {
      return this.namespacedHeaders.map((h) => {
        // replace namespace col with project
        if (h.name === NAMESPACE_HEADER.name) {
          return {
            ...PROJECT,
            value: (row: any) => this.getProjectName(row),
            sort:  'project',
          };
        }

        return h;
      }) // removing unnessesary columns e.g. 'isCopy' and 'origin project'
        .filter((col) => col.name !== IS_COPY_COL.name && col.name !== ORIGIN_PROJECT_COL.name);
    },

    createLocation() {
      return {
        name:  'c-cluster-product-resource-create',
        query: { [SECRET_SCOPE]: this.activeTab }
      };
    },

    createLabel() {
      if (!this.canViewProjects) {
        return this.t('generic.create');
      } else if (this.activeTab === SECRET_TABS.NAMESPACED) {
        return this.t('secret.tabs.namespaced.create');
      } else if (this.activeTab === SECRET_TABS.PROJECT_SCOPED) {
        return this.t('secret.tabs.projectScoped.create');
      }

      return this.t('generic.create');
    },

    namespacedHeaders() {
      const headers = [...this.$store.getters['type-map/headersFor'](this.schema, false)];

      if (this.canViewProjects) {
        headers.splice(headers.length - 1, 0, {
          name:  IS_COPY_COL.name,
          value: 'isProjectSecretCopy',
          sort:  IS_COPY_COL.sort,
        }, {
          name:  ORIGIN_PROJECT_COL.name,
          value: (row: any) => {
            if (row.isProjectSecretCopy) {
              return this.getProjectName(row);
            }
          },
          sort: ORIGIN_PROJECT_COL.sort,
        });
      }

      return headers;
    },
  },

  methods: {
    getProjectName(row) {
      const projectId = row.metadata?.labels?.[UI_PROJECT_SECRET];

      if (!projectId) {
        return;
      }

      return this.allProjects.get(projectId)?.projectName || this.t('generic.unknown');
    },

    handleTabChange(data) {
      this.activeTab = data.selectedName;
    },

    /**
     * Filter out secrets that are not project-scoped
     */
    filterRowsLocal(rows) {
      // TODO:
      // when displaying the project secrets for the local cluster, this filtering logic to only show the original project secrets makes sense
      // but for the downstream clusters you only have the project secret copies, so this will filter everything out, as a result you will always display an empty list
      return rows.filter((r) => !!r.metadata.labels?.[UI_PROJECT_SECRET] && (!r.metadata?.annotations || r.metadata?.annotations?.[UI_PROJECT_SECRET_COPY] !== 'true') );
    },

    /**
     * TODO
     */
    filterRowsApi(pagination: PaginationArgs): PaginationArgs {
      if (!pagination.filters) {
        pagination.filters = [];
      }

      const field = `metadata.labels[${ UI_PROJECT_SECRET }]`;
      // const field2 = `metadata.annotations[${ UI_PROJECT_SECRET_COPY }]`;

      let existing: PaginationParamFilter | null = null;

      for (let i = 0; i < pagination.filters.length; i++) {
        const filter = pagination.filters[i];

        if (!!filter.fields.find((f) => f.field === field)) {
          existing = filter;
          break;
        }
      }

      const required = PaginationParamFilter.createSingleField({
        field,
        exists: true
      });

      // TODO - getting 500 error for multiple:
      // "message": "existence tests are valid only for labels; not valid for field 'true'",
      // const required = PaginationParamFilter.createMultipleFields([
      // new PaginationFilterField(
      //   {
      //     field,
      //     exists: true
      //   }),
      //   new PaginationFilterField(
      //   {
      //     field2,
      //     value:  'true',
      //     equals: false,
      //   })
      // ]);

      if (!!existing) {
        Object.assign(existing, required);
      } else {
        pagination.filters.push(required);
      }

      return pagination;
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <Masthead
      component-testid="secrets-list"
      :schema="schema"
      :resource="resource"
      :create-location="createLocation"
      :create-button-label="createLabel"
      :is-creatable="true"
    />
    <Tabbed
      hideSingleTab
      @changed="handleTabChange"
    >
      <Tab
        label-key="secret.tabs.namespaced.label"
        :name="SECRET_TABS.NAMESPACED"
        :weight="1"
      >
        <PaginatedResourceTable
          :schema="schema"
          :headers="namespacedHeaders"
          :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
        />
      </Tab>
      <Tab
        v-if="canViewProjects"
        label-key="secret.tabs.projectScoped.label"
        :name="SECRET_TABS.PROJECT_SCOPED"
      >
        <!-- TODO -->
        <!-- :group-options="projectSecretsGroupOptions" -->
        <PaginatedResourceTable
          :groupable="false"
          :group-by="projectgroupBy"
          :schema="schema"
          :headers="projectScopedHeaders"
          :local-filter="filterRowsLocal"
          :api-filter="filterRowsApi"
          :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
          in-store="management"
        />
      </Tab>
    </Tabbed>
  </div>
</template>
