<script>
import ResourceTable from '@shell/components/ResourceTable';
import { STATE, AGE, NAME } from '@shell/config/table-headers';
import { uniq } from '@shell/utils/array';
import { MANAGEMENT, NAMESPACE, VIRTUAL_TYPES } from '@shell/config/types';
import Loading from '@shell/components/Loading';
import { PROJECT_ID } from '@shell/config/query-params';
import Masthead from '@shell/components/ResourceList/Masthead';
import { mapPref, GROUP_RESOURCES, DEV } from '@shell/store/prefs';
import MoveModal from '@shell/components/MoveModal';
import { NAME as HARVESTER } from '@shell/config/product/harvester';
import { defaultTableSortGenerationFn } from '@shell/components/ResourceTable.vue';

export default {
  name:       'ListNamespace',
  components: {
    Loading, Masthead, MoveModal, ResourceTable
  },

  props: {},

  async fetch() {
    const inStore = this.$store.getters['currentStore'](NAMESPACE);

    this.schema = this.$store.getters[`${ inStore }/schemaFor`](NAMESPACE);
    this.projectSchema = this.$store.getters[`management/schemaFor`](MANAGEMENT.PROJECT);

    if ( !this.schema ) {
      // clusterReady:   When switching routes, it will cause clusterReady to change, causing itself to repeat rendering。
      // this.$store.dispatch('loadingError', `Type ${ NAMESPACE } not found`);

      return;
    }

    this.namespaces = await this.$store.dispatch(`${ inStore }/findAll`, { type: NAMESPACE });
    this.projects = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.PROJECT, opt: { force: true } });
  },

  data() {
    return {
      schema:        null,
      namespaces:    [],
      projects:      [],
      projectSchema: null,
      MANAGEMENT,
      VIRTUAL_TYPES
    };
  },

  computed: {
    isNamespaceCreatable() {
      return (this.schema?.collectionMethods || []).includes('POST');
    },
    headers() {
      const project = {
        name:          'project',
        label:         'Project',
        value:         'project.nameDisplay',
        sort:          ['projectNameSort', 'nameSort'],
      };

      return [
        STATE,
        NAME,
        this.groupPreference === 'none' ? project : null,
        AGE
      ].filter(h => h);
    },
    projectIdsWithNamespaces() {
      const ids = this.rows
        .map(row => row.projectId)
        .filter(id => id);

      return uniq(ids);
    },
    clusterProjects() {
      const clusterId = this.$store.getters['currentCluster'].id;

      return this.projects.filter(project => project.spec.clusterName === clusterId);
    },
    projectsWithoutNamespaces() {
      return this.clusterProjects.filter((project) => {
        return !this.projectIdsWithNamespaces.find(item => project?.id?.endsWith(`/${ item }`));
      });
    },
    // We're using this because we need to show projects as groups even if the project doesn't have any namespaces.
    rowsWithFakeNamespaces() {
      const fakeRows = this.projectsWithoutNamespaces.map((project) => {
        return {
          groupByLabel:     `${ ('resourceTable.groupLabel.notInAProject') }-${ project.id }`,
          isFake:           true,
          mainRowKey:       project.id,
          project,
          availableActions: []
        };
      });

      if (this.showMockNotInProjectGroup) {
        fakeRows.push( {
          groupByLabel:     this.t('resourceTable.groupLabel.notInAProject'), // Same as the groupByLabel for the namespace model
          mainRowKey:       'fake-empty',
        });
      }

      return [...this.rows, ...fakeRows];
    },
    createProjectLocation() {
      return {
        name:   'c-cluster-product-resource-create',
        params: {
          product:  this.$store.getters['currentProduct'].name,
          resource: MANAGEMENT.PROJECT
        },
      };
    },
    groupPreference: mapPref(GROUP_RESOURCES),
    filteredRows() {
      return this.groupPreference === 'none' ? this.rows : this.rowsWithFakeNamespaces;
    },
    rows() {
      if (this.$store.getters['prefs/get'](DEV)) {
        return this.namespaces;
      }

      const isVirtualCluster = this.$store.getters['isVirtualCluster'];
      const isVirtualProduct = this.$store.getters['currentProduct'].name === HARVESTER;

      return this.namespaces.filter((namespace) => {
        return isVirtualCluster && isVirtualProduct ? (!namespace.isSystem && !namespace.isObscure) : !namespace.isObscure;
      });
    },

    showMockNotInProjectGroup() {
      return !this.rows.some(row => !row.project);
    }
  },
  methods: {
    slotName(project) {
      return `main-row:${ project.id }`;
    },
    createNamespaceLocation(group) {
      const project = group.rows[0].project;

      return {
        name:   'c-cluster-product-resource-create',
        params: {
          product:  this.$store.getters['currentProduct'].name,
          resource: NAMESPACE
        },
        query: { [PROJECT_ID]: project?.metadata.name }
      };
    },
    showProjectAction(event, group) {
      const project = group.rows[0].project;

      this.$store.commit(`action-menu/show`, {
        resources: [project],
        elem:      event.target
      });
    },
    showProjectActionButton(group) {
      const project = group.rows[0].project;

      return !!project;
    },
    projectLabel(group) {
      const row = group.rows[0];

      if (row.isFake) {
        return this.t('resourceTable.groupLabel.project', { name: row.project?.nameDisplay }, true);
      }

      return row.groupByLabel;
    },

    projectDescription(group) {
      const project = group.rows[0].project;

      return project?.description;
    },
    clearSelection() {
      this.$refs.table.clearSelection();
    },

    sortGenerationFn() {
      // The sort generation function creates a unique value and is used to create a key including sort details.
      // The unique key determines if the list is redrawn or a cached version is shown.
      // Because we ensure the 'not in a project' group is there via a row, and timing issues, the unqiue key doesn't change
      // after a namespace is removed... so the list won't update... so we need to inject a string to ensure the key is fresh
      const base = defaultTableSortGenerationFn(this.schema, this.$store);

      return base + (this.showMockNotInProjectGroup ? '-mock' : '');
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else class="project-namespaces">
    <Masthead
      :schema="projectSchema"
      :type-display="t('projectNamespaces.label')"
      :resource="MANAGEMENT.PROJECT"
      :favorite-resource="VIRTUAL_TYPES.PROJECT_NAMESPACES"
      :create-location="createProjectLocation"
      :create-button-label="t('projectNamespaces.createProject')"
    />
    <ResourceTable
      ref="table"
      class="table"
      v-bind="$attrs"
      :schema="schema"
      :headers="headers"
      :rows="filteredRows"
      :groupable="true"
      :sort-generation-fn="sortGenerationFn"
      group-tooltip="resourceTable.groupBy.project"
      key-field="_key"
      v-on="$listeners"
    >
      <template #group-by="group">
        <div class="project-bar" :class="{'has-description': projectDescription(group.group)}">
          <div v-trim-whitespace class="group-tab">
            <div class="project-name" v-html="projectLabel(group.group)" />
            <div v-if="projectDescription(group.group)" class="description text-muted text-small">
              {{ projectDescription(group.group) }}
            </div>
          </div>
          <div class="right">
            <n-link
              v-if="isNamespaceCreatable"
              class="create-namespace btn btn-sm role-secondary"
              :to="createNamespaceLocation(group.group)"
            >
              {{ t('projectNamespaces.createNamespace') }}
            </n-link>
            <button type="button" class="project-action btn btn-sm role-multi-action actions mr-5" :class="{invisible: !showProjectActionButton(group.group)}" @click="showProjectAction($event, group.group)">
              <i class="icon icon-actions" />
            </button>
          </div>
        </div>
      </template>
      <template #cell:project="{row}">
        <span v-if="row.project">{{ row.project.nameDisplay }}</span>
        <span v-else class="text-muted">&ndash;</span>
      </template>
      <template v-for="project in projectsWithoutNamespaces" v-slot:[slotName(project)]>
        <tr :key="project.id" class="main-row">
          <td class="empty text-center" colspan="5">
            {{ t('projectNamespaces.noNamespaces') }}
          </td>
        </tr>
      </template>
      <template #main-row:fake-empty>
        <tr class="main-row">
          <td class="empty text-center" colspan="5">
            {{ t('projectNamespaces.noProjectNoNamespaces') }}
          </td>
        </tr>
      </template>
    </ResourceTable>
    <MoveModal @moving="clearSelection" />
  </div>
</template>
<style lang="scss" scoped>
.project-namespaces {
  & ::v-deep {
    .project-name {
      line-height: 30px;
    }

    .project-bar {
      display: flex;
      flex-direction: row;
      justify-content: space-between;

      &.has-description {
        .right {
          margin-top: 5px;
        }
        .group-tab {
          &, &::after {
              height: 50px;
          }

          &::after {
              right: -20px;
          }

          .description {
              margin-top: -20px;
          }
        }
      }
    }
  }
}
</style>
