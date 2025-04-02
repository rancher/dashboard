<script>
import ResourceTable from '@shell/components/ResourceTable';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import { MANAGEMENT } from '@shell/config/types';
import { PROJECT } from '@shell/config/labels-annotations';

export default {
  name:       'Secrets',
  components: {
    ResourceTable, Tabbed, Tab
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
    const allProjects = this.$store.getters['management/all'](MANAGEMENT.PROJECT).map((p) => {
      const [clusterId, projectId] = p.id.split('/');

      return {
        clusterId,
        projectId,
        projectName: p.spec.displayName
      };
    });

    return {
      headers,
      allProjects
    };
  },

  computed: {
    projectScopedSecrets() {
      return this.rows.filter((r) => !!r.metadata.annotations?.[PROJECT]);
    },

    projectScopedHeaders() {
      const projectHeader = {
        name:     'project',
        labelKey: 'tableHeaders.project',
        sort:     'project',
      };

      return this.headers.map((h) => h.name === 'namespace' ? projectHeader : h);
    },

    showProjectScopedTab() {
      // TODO
      return true;
    }
  },

  methods: {
    getProjectName(row) {
      const [clusterId, projectId] = row.metadata.annotations[PROJECT].split(':');

      return this.allProjects.find((p) => p.clusterId === clusterId && p.projectId === projectId)?.projectName;
    }
  }
};
</script>

<template>
  <Tabbed hideSingleTab>
    <Tab
      label-key="secret.tabs.namespaced.label"
      name="namespaced"
      :weight="1"
    >
      <ResourceTable
        :loading="$fetchState.pending"
        :schema="schema"
        :headers="headers"
        :rows="rows"
        :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      />
    </Tab>
    <Tab
      v-if="showProjectScopedTab"
      label-key="secret.tabs.projectScoped.label"
      name="project-scoped"
    >
      <ResourceTable
        :loading="$fetchState.pending"
        :schema="schema"
        :headers="projectScopedHeaders"
        :rows="projectScopedSecrets"
        :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      >
        <template #cell:project="{row}">
          <span>{{ getProjectName(row) }}</span>
        </template>
      </ResourceTable>
    </Tab>
  </Tabbed>
</template>
