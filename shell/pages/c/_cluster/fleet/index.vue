<script>
import { IS_HELM_OP_FEATURE_ENABLED, NAME } from '@shell/config/product/fleet';
import { mapState } from 'vuex';
import { FLEET } from '@shell/config/types';
import { WORKSPACE } from '@shell/store/prefs';
import {
  getStateLabel,
  primaryDisplayStatusFromCount,
  stateDisplay,
  STATES,
  STATES_ENUM,
} from '@shell/plugins/dashboard-store/resource-class';
import Loading from '@shell/components/Loading';
import ResourceTable from '@shell/components/ResourceTable';
import CompoundStatusBadge from '@shell/components/CompoundStatusBadge';
import { checkPermissions, checkSchemasForFindAllHash } from '@shell/utils/auth';
import { WORKSPACE_ANNOTATION } from '@shell/config/labels-annotations';
import { filterBy } from '@shell/utils/array';
import FleetNoWorkspaces from '@shell/components/fleet/FleetNoWorkspaces.vue';
import { xOfy } from '@shell/utils/string';
import { BadgeState } from '@components/BadgeState';
import ResourcePanel from '@shell/components/fleet/FleetDashboardResourcePanel.vue';
import ResourceCard from '@shell/components/fleet/FleetDashboardResourceCard.vue';
import ButtonGroup from '@shell/components/ButtonGroup';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';

const chartParts = [
  {
    id:         'error',
    label:      'Error',
    color:      '#F64747',
    icon:       'error',
    badgeClass: 'error'
  },
  {
    id:         'warning',
    label:      'Warning',
    color:      '#DAC342',
    icon:       'warning',
    badgeClass: 'warning'
  },
  {
    id:         'info',
    label:      'InProgress',
    color:      '#3d98d3',
    icon:       'info',
    badgeClass: 'info'
  },
  {
    id:         'success',
    label:      'Active',
    color:      '#5D995D',
    icon:       'checkmark',
    badgeClass: 'success'
  }
];

export default {
  name:       'FleetDashboard',
  components: {
    ButtonGroup,
    Checkbox,
    CompoundStatusBadge,
    Loading,
    FleetNoWorkspaces,
    ResourceCard,
    ResourcePanel,
    ResourceTable,
    BadgeState,
  },

  async fetch() {
    const schemas = {
      fleetWorkspaces: {
        inStoreType:     'management',
        type:            FLEET.WORKSPACE,
        schemaValidator: (schema) => {
          return !!schema?.links?.collection;
        }
      },
      clusterGroups: {
        inStoreType: 'management',
        type:        FLEET.CLUSTER_GROUP
      },
      allBundles: {
        inStoreType: 'management',
        type:        FLEET.BUNDLE,
        opt:         { excludeFields: ['metadata.managedFields', 'spec.resources'] },
      },
      gitRepos: {
        inStoreType: 'management',
        type:        FLEET.GIT_REPO,
      },
      fleetClusters: {
        inStoreType: 'management',
        type:        FLEET.CLUSTER,
      }
    };

    if (IS_HELM_OP_FEATURE_ENABLED) {
      schemas.helmOps = {
        inStoreType: 'management',
        type:        FLEET.HELM_OP,
      };
    }

    const hash = await checkSchemasForFindAllHash(schemas, this.$store);

    this[FLEET.GIT_REPO] = hash.gitRepos;
    this[FLEET.HELM_OP] = hash.helmOps;
    this[FLEET.CLUSTER] = hash.fleetClusters;

    this.fleetWorkspacesData = hash.fleetWorkspaces || [];

    try {
      const permissionsSchemas = {
        workspaces: { type: FLEET.WORKSPACE },
        gitRepos:   {
          type:            FLEET.GIT_REPO,
          schemaValidator: (schema) => schema.resourceMethods.includes('PUT')
        }
      };

      if (IS_HELM_OP_FEATURE_ENABLED) {
        permissionsSchemas.helmOps = {
          type:            FLEET.HELM_OP,
          schemaValidator: (schema) => schema.resourceMethods.includes('PUT')
        };
      }

      const permissions = await checkPermissions(permissionsSchemas, this.$store.getters);

      this.permissions = permissions;
    } catch (e) {
      console.error(e); // eslint-disable-line no-console
    }
  },

  data() {
    return {
      admissableAreas: ['clusters', 'bundles', 'resources'],
      headers:         [
        {
          name:          'name',
          labelKey:      'tableHeaders.repoName',
          value:         'nameDisplay',
          sort:          ['nameSort'],
          formatter:     'LinkDetail',
          canBeVariable: true,
        },
        {
          name:     'clustersReady',
          labelKey: 'tableHeaders.clustersReady',
          value:    'status.readyClusters',
          sort:     'status.readyClusters',
          search:   false,
        },
        {
          name:     'bundlesReady',
          labelKey: 'tableHeaders.bundlesReady',
          value:    'status.readyClusters',
          sort:     'status.readyClusters',
          search:   false,
        },
        {
          name:     'resourcesReady',
          labelKey: 'tableHeaders.resourcesReady',
          value:    'status.resourceCounts.ready',
          sort:     'status.resourceCounts.ready',
        }
      ],
      schema:              {},
      [FLEET.REPO]:        [],
      fleetWorkspacesData: [],
      isCollapsed:         {},
      permissions:         {},
      getStartedLink:      {
        name:   'c-cluster-product-resource-create',
        params: {
          product:  NAME,
          resource: FLEET.GIT_REPO
        },
      },

      FLEET,
      IS_HELM_OP_FEATURE_ENABLED,
      [FLEET.HELM_OP]: [],
      viewModeOptions: [
        {
          tooltipKey: 'fleet.dashboard.viewMode.table',
          icon:       'icon-list-flat',
          value:      'flat',
        },
        {
          tooltipKey: 'fleet.dashboard.viewMode.cards',
          icon:       'icon-apps',
          value:      'cards',
        },
      ],
      viewMode:         {},
      isStateCollapsed: {},
      gitReposFilter:   {},
      helmOpsFilter:    {},
      initFilter:       true,
    };
  },

  computed: {
    ...mapState(['workspace', 'allNamespaces']),

    chartOptions() {
      return {
        // scales: {
        //   myScale: {
        //     type: "logarithmic",
        //     position: 'left',
        //   },
        // },
        plugins: {
          legend: { display: false },
          title:  { display: false },
        },
        // onClick: (_, value) => {
        //   const index = value[0]?.index;

        //   const id = chartParts[index]?.id;

        //   this.filterRepos(id);
        // }
      };
    },

    chartData() {
      const labels = chartParts.map(({ label }) => label);
      const backgroundColor = chartParts.map(({ color }) => color);

      return this.fleetWorkspaces.reduce((acc, workspace) => {
        const types = [
          FLEET.GIT_REPO,
          FLEET.HELM_OP
        ].reduce((acc, type) => ({
          ...acc,
          [type]: {
            labels,
            datasets: [
              {
                data: Object.values(this.resourceStates(workspace, type)),
                backgroundColor,
              },
            ],
          }
        }), {});

        return {
          ...acc,
          [workspace.id]: types,
        };
      }, {});
    },

    stateArray() {
      // TODO stateSort can be used to sort the states !!!

      const states = [];

      [
        FLEET.GIT_REPO,
        FLEET.HELM_OP,
        FLEET.CLUSTER,
      ].forEach((type) => {
        this[type].forEach((obj) => {
          const {
            stateDisplay,
            stateBackground,
            stateIcon,
          } = obj;

          if (!states.find((s) => s.stateDisplay === stateDisplay)) {
            states.push({
              stateDisplay,
              stateBackground,
              stateIcon
            });
          }
        });
      });

      return states;
    },

    fleetWorkspaces() {
      if (this.fleetWorkspacesData?.length) {
        return this.fleetWorkspacesData;
      }

      // When user doesn't have access to the workspaces fall back to namespaces
      return this.allNamespaces.filter((item) => {
        return item.metadata.annotations[WORKSPACE_ANNOTATION] === WORKSPACE;
      }).map(( obj ) => {
        const repos = filterBy(this.gitRepos, 'metadata.namespace', obj.id);

        return {
          ...obj,
          counts: {
            clusters:      '-',
            clusterGroups: '-',
            gitRepos:      repos.length
          },
          repos,
          nameDisplay: obj.id
        };
      });
    },
    workspacesData() {
      return this.fleetWorkspaces.filter((ws) => ws.counts.gitRepos > 0);
    },
    emptyWorkspaces() {
      return this.fleetWorkspaces.filter((ws) => ws.counts.gitRepos === 0);
    },
    gitReposCounts() {
      return this[FLEET.GIT_REPO].reduce((prev, gitRepo) => {
        prev[gitRepo.id] = {
          bundles:   gitRepo.allBundlesStatuses,
          resources: gitRepo.allResourceStatuses,
        };

        return prev;
      }, {});
    },
    areAllCardsExpanded() {
      return Object.keys(this.isCollapsed).every((key) => !this.isCollapsed[key]);
    },
  },

  methods: {
    resourceStates(workspace, type) {
      return chartParts
        .reduce((acc, { id }) => ({
          ...acc,
          [id]: this.totalResources(workspace, type).filter((r) => r.dashboardState === id).length,
        }), {});
    },

    totalResources(workspace, type) {
      const workspaces = this.fleetWorkspaces.find((ws) => ws.id === workspace.id);

      switch (type) {
      case FLEET.GIT_REPO:
        return workspaces.repos;
      case FLEET.HELM_OP:
        return workspaces.helmOps;
      case FLEET.CLUSTER:
        return workspaces.clusters;
      }
    },

    totalStates(workspace, type) {
      return this.stateArray.reduce((acc, state) => {
        const count = this.totalResources(workspace, type).filter(({ stateDisplay }) => stateDisplay === state.stateDisplay).length;

        if (count > 0) {
          return [
            ...acc,
            {
              label: `${ state.stateDisplay }: ${ count } `,
              color: state.stateBackground,
              icon:  state.stateIcon,
            }
          ];
        }

        return acc;
      }, []);
    },

    panelDescription(workspace, type) {
      const count = this.totalResources(workspace, type).length;
      const label = this.t(`typeLabel."${ type }"`, { count });

      return {
        count,
        label
      };
    },

    toggleState(workspace, state) {
      if (!this.isStateCollapsed[workspace]) {
        this.isStateCollapsed[workspace] = {};
      }

      this.isStateCollapsed[workspace][state] = !this.isStateCollapsed[workspace][state];
    },

    filterByState(resources, stateDisplay) {
      return resources.filter((elem) => elem.stateDisplay === stateDisplay);
    },

    filteredStates(workspace) {
      return this.stateArray.filter((state) => !![
        ...this.totalResources(workspace, FLEET.GIT_REPO),
        ...this.totalResources(workspace, FLEET.HELM_OP)
      ].find((s) => s.stateDisplay === state.stateDisplay)
      );
    },

    setWorkspaceFilterAndLinkToGitRepo(value) {
      this.$store.commit('updateWorkspace', { value, getters: this.$store.getters } );
      this.$store.dispatch('prefs/set', { key: WORKSPACE, value });

      this.$router.push({
        name:   'c-cluster-product-resource',
        params: {
          product:  NAME,
          resource: FLEET.GIT_REPO
        },
      });
    },
    getStatusInfo(area, row, rowCounts) {
      const defaultStatusInfo = {
        badgeClass: `${ STATES[STATES_ENUM.NOT_READY].color } badge-class-default`,
        icon:       STATES[STATES_ENUM.NOT_READY].compoundIcon
      };

      // classes are defined in the themes SASS files...
      return this.getBadgeClassAndIcon(area, row, rowCounts) || defaultStatusInfo;
    },
    getBadgeClassAndIcon(area, row, rowCounts) {
      if (!this.admissableAreas.includes(area)) {
        return false;
      }

      let group;

      if (area === 'clusters') {
        const clusterInfo = row.clusterInfo;
        const state = clusterInfo.ready === clusterInfo.total ? STATES_ENUM.ACTIVE : STATES_ENUM.NOT_READY;

        return {
          badgeClass: `${ STATES[state].color } badge-class-area-${ area }`,
          icon:       STATES[state].compoundIcon
        };
      } else if (area === 'bundles') {
        group = rowCounts[row.id].bundles;
      } else if (area === 'resources') {
        group = rowCounts[row.id].resources;
      } else {
        // unreachable
        return false;
      }

      if (group.total === group.states.ready) {
        return {
          badgeClass: STATES[STATES_ENUM.ACTIVE].color,
          icon:       STATES[STATES_ENUM.ACTIVE].compoundIcon,
        };
      }
      const state = primaryDisplayStatusFromCount(group.states);

      return {
        badgeClass: STATES[state].color ? STATES[state].color : `${ STATES[STATES_ENUM.UNKNOWN].color } bg-unmapped-state`,
        icon:       STATES[state].compoundIcon ? STATES[state].compoundIcon : `${ STATES[STATES_ENUM.UNKNOWN].compoundIcon } unmapped-icon`
      };
    },
    getTooltipInfo(area, row, rowCounts) {
      if (!this.admissableAreas.includes(area)) {
        return {};
      }

      if (area === 'bundles') {
        return this.generateTooltipData(rowCounts[row.id].bundles.states);
      } else if (area === 'resources') {
        return this.generateTooltipData(rowCounts[row.id].resources.states);
      }

      return '';
    },
    generateTooltipData(infoObj) {
      return Object.keys(infoObj)
        .filter((key) => infoObj[key] > 0) // filter zero values
        .map((key) => `${ getStateLabel(key) }: ${ infoObj[key] }<br>`).join('');
    },
    getBadgeValue(area, row, rowCounts) {
      let value;

      if (!this.admissableAreas.includes(area)) {
        return 'N/A';
      }

      if (area === 'clusters') {
        value = `${ row.clusterInfo.ready }/${ row.clusterInfo.total }`;
      } else if (area === 'bundles') {
        const bundles = rowCounts[row.id].bundles;

        value = xOfy(bundles.states.ready || 0, bundles.total);
      } else if (area === 'resources') {
        const resources = rowCounts[row.id].resources;

        value = xOfy(resources.states.ready || 0, resources.total);
      }

      return value;
    },

    toggleCard(key) {
      this.isCollapsed[key] = !this.isCollapsed[key];
    },
    toggleCardAll(action) {
      const val = action !== 'expand';

      Object.keys(this.isCollapsed).forEach((key) => {
        this.isCollapsed[key] = val;
      });
    }
  },

  watch: {
    workspacesData(value) {
      value?.forEach((ws) => {
        this.isCollapsed[ws.id] = false;
        this.gitReposFilter[ws.id] = true;
        this.helmOpsFilter[ws.id] = true;
      });
    }
  }
};
</script>

<template>
  <div>
    <Loading v-if="$fetchState.pending" />
    <FleetNoWorkspaces
      v-else-if="!fleetWorkspacesData.length"
      :can-view="permissions.workspaces"
    />
    <div
      v-else
      class=""
    >
      <div class="dashboard-header">
        <h1>
          <t k="fleet.dashboard.pageTitle" />
        </h1>
        <div>
          <p
            v-if="areAllCardsExpanded"
            @click="toggleCardAll('collapse')"
          >
            {{ t('fleet.dashboard.collapseAll') }}
          </p>
          <p
            v-else
            @click="toggleCardAll('expand')"
          >
            {{ t('fleet.dashboard.expandAll') }}
          </p>
        </div>
      </div>
      <div
        v-for="(workspace, i) in workspacesData"
        :key="i"
        class="card-container m-0 mt-20"
        :show-actions="false"
        :show-separator="false"
        :show-highlight-border="false"
      >
        <div class="card-panel-main">
          <div
            class="card-panel-main-details"
            :class="{ expand: !isCollapsed[workspace.id] }"
          >
            <h2 class="title">
              <div class="label">
                <i class="icon icon-folder" />
                <span>{{ t('fleet.dashboard.workspace') }} : &nbsp;</span>
              </div>
              <router-link
                :to="workspace.detailLocation"
              >
                {{ workspace.nameDisplay }}
              </router-link>
            </h2>
            <div class="body">
              <ResourcePanel
                class="git-repo"
                :chart-data="chartData[workspace.id][FLEET.GIT_REPO]"
                :chart-options="chartOptions"
                :description="panelDescription(workspace, FLEET.GIT_REPO)"
                :states="totalStates(workspace, FLEET.GIT_REPO)"
              />
              <ResourcePanel
                v-if="IS_HELM_OP_FEATURE_ENABLED"
                class="helm-ops"
                :chart-data="chartData[workspace.id][FLEET.HELM_OP]"
                :chart-options="chartOptions"
                :description="panelDescription(workspace, FLEET.HELM_OP)"
                :states="totalStates(workspace, FLEET.HELM_OP)"
              />
              <div class="spacer" />
              <ResourcePanel
                class="clusters"
                :description="panelDescription(workspace, FLEET.CLUSTER)"
                :states="totalStates(workspace, FLEET.CLUSTER)"
              />
            </div>
          </div>
          <div class="card-panel-main-actions">
            <div class="expand-button">
              <p
                @click="toggleCard(workspace.id)"
              >
                {{ isCollapsed[workspace.id] ? t('fleet.dashboard.expand') : t('fleet.dashboard.collapse') }}
              </p>
              <i
                class="icon"
                :class="{
                  ['icon-chevron-down']: isCollapsed[workspace.id],
                  ['icon-chevron-up']: !isCollapsed[workspace.id],
                }"
              />
            </div>
            <div
              v-if="!isCollapsed[workspace.id]"
              class="view-button"
            >
              <ButtonGroup
                :value="viewMode[workspace.id] || 'cards'"
                :options="viewModeOptions"
                @update:value="viewMode[workspace.id] = $event"
              />
            </div>
          </div>
        </div>
        <div
          v-if="!isCollapsed[workspace.id]"
          class="card-panel-expand mt-20"
        >
          <div class="card-panel-filters">
            <Checkbox
              :value="gitReposFilter[workspace.id]"
              :label="'Show Git Repos'"
              @update:value="gitReposFilter[workspace.id] = $event"
            />
            <Checkbox
              :value="helmOpsFilter[workspace.id]"
              :label="'Show Helm Ops'"
              @update:value="helmOpsFilter[workspace.id] = $event"
            />
          </div>
          <div
            v-if="!viewMode[workspace.id] || viewMode[workspace.id] === 'cards'"
            class="cards-panel"
          >
            <div
              v-for="(state, j) in filteredStates(workspace)"
              :key="j"
              class="card-panel"
            >
              <div
                class="card-panel-title"
                @click="toggleState(workspace.id, state.stateDisplay)"
              >
                <h3>
                  {{ state.stateDisplay }}
                </h3>
                <i
                  class="icon"
                  :class="{
                    ['icon-chevron-down']: isStateCollapsed[workspace.id]?.[state.stateDisplay],
                    ['icon-chevron-up']: !isStateCollapsed[workspace.id]?.[state.stateDisplay],
                  }"
                />
              </div>
              <div
                v-if="!isStateCollapsed[workspace.id]?.[state.stateDisplay]"
                class="card-panel-body"
              >
                <template v-if="gitReposFilter[workspace.id]">
                  <ResourceCard
                    v-for="(repository, y) in filterByState(workspace.repos, state.stateDisplay)"
                    :key="y"
                    class="resource-card"
                    :value="repository"
                  />
                </template>
                <template v-if="helmOpsFilter[workspace.id]">
                  <ResourceCard
                    v-for="(helmOp, z) in filterByState(workspace.helmOps, state.stateDisplay)"
                    :key="z"
                    class="resource-card"
                    :value="helmOp"
                  />
                </template>
              </div>
            </div>
          </div>

          <div
            v-if="viewMode[workspace.id] === 'flat'"
            class="table-panel"
          >
            RESOURCE TABLE
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  > div {
    display: flex;
    align-items: center;

    p {
      color: var(--primary);
      margin-right: 2px;

      &:hover {
        text-decoration: underline;
        cursor: pointer;
      }
    }

    i {
      color: var(--primary);
    }
  }
}

.card-container {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--modal-border);
  border-radius: 10px;
  background-color: var(--body-bg);

  .card-panel-main {
    display: flex;
    align-items: start;
    justify-content: space-between;

    .card-panel-main-details {
      display: flex;
      align-items: center;

      .title {
        .label {
          display: flex;
          align-items: center;

          .icon {
            margin-right: 5px;
          }
        }
      }

      .body {
        display: flex;
        gap: 15px;

        .spacer {
          border-left: 1px solid var(--border);
        }
      }

      &.expand {
        display: block;

        .title {
          display: flex;
        }
      }
    }

    .card-panel-main-actions {
      display: flex;
      flex-direction: column;
      align-items: end;

      .expand-button {
        display: flex;
        align-items: center;

        p {
          color: var(--primary);
          margin-right: 2px;

          &:hover {
            text-decoration: underline;
            cursor: pointer;
          }
        }

        i {
          color: var(--primary);
        }
      }

      .view-button {
        margin-top: 45px;
      }
    }
  }

  .card-panel-expand {
    .card-panel-filters {
      display: flex;
      flex-direction: column;
    }
    .cards-panel {
      .card-panel {
        .card-panel-title {
          display: flex;
          align-items: center;
          cursor: pointer;

          h3 {
            margin: 0 2px 0 0;
          }
        }

        .card-panel-body {
          display: flex;

          .resource-card {
            margin: 10px;
          }
        }
      }
    }
  }
}

.fleet-empty-dashboard {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  min-height: 100%;

  .icon-fleet {
    font-size: 100px;
    color: var(--disabled-text);
  }

  > p > span {
    color: var(--disabled-text);
  }
}

.fleet-dashboard-data {
  .title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 48px;

    > div {
      display: flex;
      align-items: center;

      p{
        color: var(--primary);

        &:hover {
          text-decoration: underline;
          cursor: pointer;
        }
      }
    }
  }

  .title-footnote {
    display: flex;
    align-items: center;
    color: var(--darker);
  }

  .header-icons {
    display: flex;
    align-items: center;

    p {
      margin-right: 30px;
      display: flex;
      align-items: center;

      > span {
        color: var(--disabled-text);

        > span {
          color: var(--body-text);
        }
      }

      i {
        color: var(--disabled-text);
        font-size: 20px;
        margin-right: 10px;
      }
    }
  }
}
</style>
