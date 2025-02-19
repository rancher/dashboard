<script>
import { mapGetters } from 'vuex';
import ResourceTable, { defaultTableSortGenerationFn } from '@shell/components/ResourceTable';
import { STATE, AGE, NAME, NS_SNAPSHOT_QUOTA } from '@shell/config/table-headers';
import { uniq } from '@shell/utils/array';
import { MANAGEMENT, NAMESPACE, VIRTUAL_TYPES, HCI } from '@shell/config/types';
import { PROJECT_ID, FLAT_VIEW } from '@shell/config/query-params';
import { PanelLocation, ExtensionPoint } from '@shell/core/types';
import ExtensionPanel from '@shell/components/ExtensionPanel';
import Masthead from '@shell/components/ResourceList/Masthead';
import { mapPref, GROUP_RESOURCES, ALL_NAMESPACES, DEV } from '@shell/store/prefs';
import MoveModal from '@shell/components/MoveModal';
import ButtonMultiAction from '@shell/components/ButtonMultiAction.vue';

import { NAMESPACE_FILTER_ALL_ORPHANS } from '@shell/utils/namespace-filter';
import ResourceFetch from '@shell/mixins/resource-fetch';
import DOMPurify from 'dompurify';
import { HARVESTER_NAME as HARVESTER } from '@shell/config/features';

export default {
  name:       'ListProjectNamespace',
  components: {
    ExtensionPanel,
    Masthead,
    MoveModal,
    ResourceTable,
    ButtonMultiAction,
  },
  mixins: [ResourceFetch],

  props: {
    createProjectLocationOverride: {
      type:    Object,
      default: () => null
    },

    createNamespaceLocationOverride: {
      type:    Object,
      default: () => null
    }
  },

  async fetch() {
    const inStore = this.$store.getters['currentStore'](NAMESPACE);

    this.harvesterResourceQuotaSchema = this.$store.getters[`${ inStore }/schemaFor`](HCI.RESOURCE_QUOTA);
    this.schema = this.$store.getters[`${ inStore }/schemaFor`](NAMESPACE);
    this.projectSchema = this.$store.getters[`management/schemaFor`](MANAGEMENT.PROJECT);

    if ( !this.schema ) {
      // clusterReady:   When switching routes, it will cause clusterReady to change, causing itself to repeat rendering。
      // this.$store.dispatch('loadingError', `Type ${ NAMESPACE } not found`);

      return;
    }

    await this.$fetchType(NAMESPACE);
    this.projects = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.PROJECT, opt: { force: true } });
  },

  data() {
    return {
      loadResources:                [NAMESPACE],
      loadIndeterminate:            true,
      harvesterResourceQuotaSchema: null,
      schema:                       null,
      projects:                     [],
      projectSchema:                null,
      extensionType:                ExtensionPoint.PANEL,
      extensionLocation:            PanelLocation.RESOURCE_LIST,
      MANAGEMENT,
      VIRTUAL_TYPES,
      defaultCreateProjectLocation: {
        name:   'c-cluster-product-resource-create',
        params: {
          product:  this.$store.getters['currentProduct'].name,
          resource: MANAGEMENT.PROJECT
        },
      }
    };
  },

  computed: {
    ...mapGetters(['currentCluster', 'currentProduct']),
    namespaces() {
      const inStore = this.$store.getters['currentStore'](NAMESPACE);

      return this.$store.getters[`${ inStore }/all`](NAMESPACE);
    },
    loading() {
      return !this.currentCluster || this.namespaces.length ? false : this.$fetchState.pending;
    },
    showIncrementalLoadingIndicator() {
      return this.perfConfig?.incrementalLoading?.enabled;
    },
    isNamespaceCreatable() {
      return (this.schema?.collectionMethods || []).includes('POST');
    },
    isHarvester() {
      return this.$store.getters['currentProduct'].inStore === HARVESTER;
    },
    headers() {
      const headers = [
        STATE,
        NAME,
      ];

      if (this.groupPreference === 'none') {
        const projectHeader = {
          name:  'project',
          label: this.t('tableHeaders.project'),
          value: 'project.nameDisplay',
          sort:  ['projectNameSort', 'nameSort'],
        };

        headers.push(projectHeader);
      }

      if (this.isHarvester && this.harvesterResourceQuotaSchema) {
        headers.push(NS_SNAPSHOT_QUOTA);
      }

      headers.push(AGE);

      return headers;
    },
    projectIdsWithNamespaces() {
      const ids = this.rows
        .map((row) => row.projectId)
        .filter((id) => id);

      return uniq(ids);
    },
    clusterProjects() {
      const clusterId = this.currentCluster.id;

      // Get the list of projects from the store so that the list
      // is updated if a new project is created or removed.
      const projectsInAllClusters = this.$store.getters['management/all'](MANAGEMENT.PROJECT);

      if (this.currentProduct?.customNamespaceFilter && this.currentProduct?.inStore && this.$store.getters[`${ this.currentProduct.inStore }/filterProject`]) {
        return this.$store.getters[`${ this.currentProduct.inStore }/filterProject`];
      }

      const clustersInProjects = projectsInAllClusters.filter((project) => project.spec.clusterName === clusterId);

      return clustersInProjects;
    },
    projectsWithoutNamespaces() {
      return this.activeProjects.filter((project) => {
        return !this.projectIdsWithNamespaces.find((item) => project?.id?.endsWith(`/${ item }`));
      });
    },
    // We're using this because we need to show projects as groups even if the project doesn't have any namespaces.
    rowsWithFakeNamespaces() {
      const fakeRows = this.projectsWithoutNamespaces.map((project) => {
        return {
          groupByLabel:     `${ ('resourceTable.groupLabel.notInAProject') }-${ project.id }`,
          isFake:           true,
          mainRowKey:       project.id,
          nameDisplay:      project.spec?.displayName, // Enable filtering by the project name
          project,
          availableActions: []
        };
      });

      if (this.showMockNotInProjectGroup) {
        fakeRows.push( {
          groupByLabel: this.t('resourceTable.groupLabel.notInAProject'), // Same as the groupByLabel for the namespace model
          mainRowKey:   'fake-empty',
        });
      }

      return [...this.rows, ...fakeRows];
    },
    createProjectLocation() {
      return this.createProjectLocationOverride || this.defaultCreateProjectLocation;
    },
    groupPreference: mapPref(GROUP_RESOURCES),
    activeNamespaceFilters() {
      return this.$store.getters['activeNamespaceFilters'];
    },
    activeProjectFilters() {
      const activeProjects = {};

      for (const filter of this.activeNamespaceFilters) {
        const [type, id] = filter.split('://', 2);

        if (type === 'project') {
          activeProjects[id] = true;
        }
      }

      return activeProjects;
    },
    activeProjects() {
      const namespaceFilters = this.$store.getters['activeNamespaceFilters'];

      if (namespaceFilters.includes(NAMESPACE_FILTER_ALL_ORPHANS) && Object.keys(this.activeProjectFilters).length === 0) {
        // If the user wants to only see namespaces that are not
        // in a project, don't show any projects.
        return [];
      }

      // If the user is not filtering by any projects or namespaces, return
      // all projects in the cluster.
      if (!this.userIsFilteringForSpecificNamespaceOrProject()) {
        return this.clusterProjects;
      }

      // Filter out projects that are not selected in the top nav.
      return this.clusterProjects.filter((projectData) => {
        const projectId = projectData.id.split('/')[1];

        return !!this.activeProjectFilters[projectId];
      });
    },
    activeNamespaces() {
      // Apply namespace filters from the top nav.
      const activeNamespaces = this.$store.getters['namespaces']();

      return this.namespaces.filter((namespaceData) => {
        return !!activeNamespaces[namespaceData.metadata.name];
      });
    },
    filteredRows() {
      return this.groupPreference === 'none' ? this.rows : this.rowsWithFakeNamespaces;
    },
    rows() {
      let isDev;

      try {
        isDev = this.$store.getters['prefs/get'](ALL_NAMESPACES);
      } catch {
        isDev = this.$store.getters['prefs/get'](DEV);
      }

      if (isDev) {
        // If all namespaces options are turned on in the user preferences,
        // return all namespaces including system namespaces and RBAC
        // management namespaces.
        return this.activeNamespaces;
      }

      return this.activeNamespaces.filter((namespace) => {
        const isSettingSystemNamespace = this.$store.getters['systemNamespaces'].includes(namespace.metadata.name);
        const systemNS = namespace.isSystem || namespace.isFleetManaged || isSettingSystemNamespace;

        return this.currentProduct?.hideSystemResources ? !systemNS : true;
      });
    },

    canSeeProjectlessNamespaces() {
      return this.currentCluster.canUpdate;
    },

    showMockNotInProjectGroup() {
      if (!this.canSeeProjectlessNamespaces) {
        return false;
      }

      const someNamespacesAreNotInProject = !this.rows.some((row) => !row.project);

      // Hide the "Not in a Project" group if the user is filtering
      // for specific namespaces or projects.
      const usingSpecificFilter = this.userIsFilteringForSpecificNamespaceOrProject();

      return !usingSpecificFilter && someNamespacesAreNotInProject;
    },

    notInProjectKey() {
      return this.$store.getters['i18n/t']('resourceTable.groupLabel.notInAProject');
    },
    showCreateNsButton() {
      return this.groupPreference !== 'namespace';
    }
  },
  methods: {
    /**
     * Get PSA HTML to be displayed in the tooltips
     */
    getPsaTooltip(row) {
      const dictionary = row.psaTooltipsDescription;
      const list = Object.values(dictionary)
        .sort()
        .map((text) => `<li>${ text }</li>`).join('');
      const title = `<p>${ this.t('podSecurityAdmission.name') }: </p>`;

      return `${ title }<ul class="psa-tooltip">${ list }</ul>`;
    },

    userIsFilteringForSpecificNamespaceOrProject() {
      const activeFilters = this.$store.getters['namespaceFilters'];

      for (let i = 0; i < activeFilters.length; i++) {
        const filter = activeFilters[i];
        const filterType = filter.split('://')[0];

        if (filterType === 'ns' || filterType === 'project') {
          return true;
        }
      }

      return false;
    },
    slotName(project) {
      return `main-row:${ project.id }`;
    },
    createNamespaceLocation(group) {
      const project = group.rows[0].project;

      const location = this.createNamespaceLocationOverride ? { ...this.createNamespaceLocationOverride } : {
        name:   'c-cluster-product-resource-create',
        params: {
          product:  this.$store.getters['currentProduct'].name,
          resource: NAMESPACE
        },
      };

      location.query = { [PROJECT_ID]: project?.metadata.name };

      return location;
    },

    createNamespaceLocationFlatList() {
      const location = this.createNamespaceLocationOverride ? { ...this.createNamespaceLocationOverride } : {
        name:   'c-cluster-product-resource-create',
        params: {
          product:  this.$store.getters['currentProduct']?.name,
          resource: NAMESPACE
        },
      };

      location.query = { [FLAT_VIEW]: true };

      return location;
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
        return DOMPurify.sanitize(
          this.t('resourceTable.groupLabel.project', { name: row.project?.nameDisplay }, true),
          { ALLOWED_TAGS: ['span'] }
        );
      }

      return row.groupByLabel;
    },

    projectDescription(group) {
      const project = group.rows[0].project;

      return project?.description;
    },

    projectResource(group) {
      const row = group.rows[0];

      return row.nameDisplay || row.id || '';
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
  <div class="project-namespaces outlet">
    <Masthead
      :schema="projectSchema"
      :type-display="t('projectNamespaces.label')"
      :resource="MANAGEMENT.PROJECT"
      :favorite-resource="VIRTUAL_TYPES.PROJECT_NAMESPACES"
      :create-location="createProjectLocation"
      :create-button-label="t('projectNamespaces.createProject')"
      :show-incremental-loading-indicator="showIncrementalLoadingIndicator"
      :load-resources="loadResources"
      :load-indeterminate="loadIndeterminate"
    >
      <template
        v-if="showCreateNsButton"
        #extraActions
      >
        <router-link
          :to="createNamespaceLocationFlatList()"
          class="btn role-primary mr-10"
          data-testid="create_project_namespaces"
        >
          {{ t('projectNamespaces.createNamespace') }}
        </router-link>
      </template>
    </Masthead>
    <!-- Extensions area -->
    <ExtensionPanel
      :resource="{}"
      :type="extensionType"
      :location="extensionLocation"
    />
    <ResourceTable
      ref="table"
      v-bind="{...$attrs, class: null }"
      class="table project-namespaces-table"
      :schema="schema"
      :headers="headers"
      :rows="filteredRows"
      :groupable="true"
      :sort-generation-fn="sortGenerationFn"
      :loading="loading"
      group-tooltip="resourceTable.groupBy.project"
      key-field="_key"
    >
      <template #group-by="group">
        <div
          class="project-bar"
          :class="{'has-description': projectDescription(group.group)}"
        >
          <div
            v-trim-whitespace
            class="group-tab"
          >
            <div
              v-clean-html="projectLabel(group.group)"
              class="project-name"
            />
            <div
              v-if="projectDescription(group.group)"
              class="description text-muted text-small"
            >
              {{ projectDescription(group.group) }}
            </div>
          </div>
          <div class="right">
            <router-link
              v-if="isNamespaceCreatable && (canSeeProjectlessNamespaces || group.group.key !== notInProjectKey)"
              class="create-namespace btn btn-sm role-secondary mr-5"
              :to="createNamespaceLocation(group.group)"
            >
              {{ t('projectNamespaces.createNamespace') }}
            </router-link>
            <ButtonMultiAction
              class="project-action mr-10"
              :borderless="true"
              :aria-label="t('projectNamespaces.tableActionsLabel', { resource: projectResource(group.group) })"
              :invisible="!showProjectActionButton(group.group)"
              @click="showProjectAction($event, group.group)"
            />
          </div>
        </div>
      </template>
      <template #cell:project="{row}">
        <span v-if="row.project">{{ row.project.nameDisplay }}</span>
        <span
          v-else
          class="text-muted"
        >&ndash;</span>
      </template>
      <template #cell:name="{row}">
        <div class="namespace-name">
          <router-link
            v-if="row.detailLocation && !row.hideDetailLocation"
            :to="row.detailLocation"
          >
            {{ row.name }}
          </router-link>
          <span v-else>
            {{ row.name }}
          </span>
          <i
            v-if="row.injectionEnabled"
            v-clean-tooltip="t('projectNamespaces.isIstioInjectionEnabled')"
            class="icon icon-istio ml-5"
          />
          <i
            v-if="row.hasSystemLabels"
            v-clean-tooltip="getPsaTooltip(row)"
            class="icon icon-lock ml-5"
          />
        </div>
      </template>
      <template
        v-for="(project, i) in projectsWithoutNamespaces"
        :key="i"
        #[slotName(project)]="{ fullColspan }"
      >
        <tr
          class="main-row"
        >
          <td
            class="empty text-center"
            :colspan="fullColspan"
          >
            {{ t('projectNamespaces.noNamespaces') }}
          </td>
        </tr>
      </template>
      <template #main-row:fake-empty="{ fullColspan }">
        <tr class="main-row">
          <td
            class="empty text-center"
            :colspan="fullColspan"
          >
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
  & :deep() {
    .project-namespaces-table table {
      table-layout: fixed;
    }

    .project-name {
      line-height: 30px;
    }

    .project-bar {
      display: flex;
      flex-direction: row;
      justify-content: space-between;

      .group-tab {
        max-width: calc(100% - 230px);
      }

      .project-name {
        display: flex;
        flex-direction: row;
        align-items: center;

        span:first-child {
          padding-right: 8px;
        }

        span:last-child {
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
        }
      }

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

    .namespace-name {
      display: flex;
      align-items: center;

      .icon-istio {
        color: var(--primary);
      }
    }
  }
}
</style>
<style lang="scss">
  .psa-tooltip {
    // These could pop up a lot as the mouse moves around, keep them as small and unintrusive as possible
    // (easier to test with v-clean-tooltip="{ content: getPSA(row), autoHide: false, show: true }")
    margin: 3px 0;
    padding: 0 8px 0 22px;
  }
</style>
