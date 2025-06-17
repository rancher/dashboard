<script>
import Masthead from '@shell/components/ResourceList/Masthead';
import Loading from '@shell/components/Loading';
import ResourceTable from '@shell/components/ResourceTable';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import { SCOPE as SECRET_SCOPE, SCOPED_TABS as SECRET_SCOPED_TABS } from '@shell/config/query-params';
import { NAMESPACE as NAMESPACE_HEADER } from '@shell/config/table-headers';
import { MANAGEMENT } from '@shell/config/types';
import { UI_PROJECT_SCOPED } from '@shell/config/labels-annotations';

export default {
  name:       'Secret',
  components: {
    ResourceTable, Tabbed, Tab, Masthead, Loading
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

    rows: {
      type:     Array,
      required: true,
    },

    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    const headers = this.$store.getters['type-map/headersFor'](this.schema, false);
    const hasAccessToProjectSchema = this.$store.getters['management/schemaFor'](MANAGEMENT.PROJECT);
    const allProjects = [];

    if (hasAccessToProjectSchema) {
      this.$store.getters['management/all'](MANAGEMENT.PROJECT).forEach((p) => {
        const [clusterId, projectId] = p.id.split('/');

        allProjects.push({
          clusterId,
          projectId,
          projectName: p.spec.displayName
        });
      });
    }

    return {
      headers,
      hasAccessToProjectSchema,
      allProjects,
      activeTab: null,
      SECRET_SCOPED_TABS
    };
  },

  computed: {
    projectScopedSecrets() {
      return this.rows.filter((r) => !!r.metadata.labels?.[UI_PROJECT_SCOPED]);
    },

    projectScopedHeaders() {
      const projectHeader = {
        name:     'project',
        labelKey: 'tableHeaders.project',
        sort:     'project',
      };

      return this.headers.map((h) => h.name === NAMESPACE_HEADER.name ? projectHeader : h);
    },

    createLocation() {
      return {
        name:  'c-cluster-product-resource-create',
        query: { [SECRET_SCOPE]: this.activeTab }
      };
    },

    createLabel() {
      if (!this.hasAccessToProjectSchema) {
        return this.t('generic.create');
      } else if (this.activeTab === SECRET_SCOPED_TABS.NAMESPACED) {
        return this.t('secret.tabs.namespaced.create');
      } else if (this.activeTab === SECRET_SCOPED_TABS.PROJECT_SCOPED) {
        return this.t('secret.tabs.projectScoped.create');
      }

      return this.t('generic.create');
    },
  },

  methods: {
    getProjectName(row) {
      const projectId = row.metadata.labels[UI_PROJECT_SCOPED];

      return this.allProjects.find((p) => p.projectId === projectId)?.projectName;
    },

    handleTabChange(data) {
      this.activeTab = data.selectedName;
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <Masthead
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
        :name="SECRET_SCOPED_TABS.NAMESPACED"
        :weight="1"
      >
        <ResourceTable
          :schema="schema"
          :headers="headers"
          :rows="rows"
          :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
        />
      </Tab>
      <Tab
        v-if="hasAccessToProjectSchema"
        label-key="secret.tabs.projectScoped.label"
        :name="SECRET_SCOPED_TABS.PROJECT_SCOPED"
      >
        <ResourceTable
          :schema="schema"
          :headers="projectScopedHeaders"
          :rows="projectScopedSecrets"
          :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
          :groupable="false"
        >
          <template #cell:project="{row}">
            <span>{{ getProjectName(row) }}</span>
          </template>
        </ResourceTable>
      </Tab>
    </Tabbed>
  </div>
</template>
