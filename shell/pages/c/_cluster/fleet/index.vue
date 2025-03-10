<script>
import { mapState } from 'vuex';
import { FLEET } from '@shell/config/types';
import { WORKSPACE } from '@shell/store/prefs';
import {
  getStateLabel,
  STATES,
  STATES_ENUM,
} from '@shell/plugins/dashboard-store/resource-class';
import Loading from '@shell/components/Loading';
import { Card } from '@components/Card';
import Tab from '@shell/components/Tabbed/Tab';
import ResourceTable from '@shell/components/ResourceTable';
import CompoundStatusBadge from '@shell/components/CompoundStatusBadge';
import { checkPermissions, checkSchemasForFindAllHash } from '@shell/utils/auth';
import { WORKSPACE_ANNOTATION } from '@shell/config/labels-annotations';
import { filterBy } from '@shell/utils/array';
import FleetNoWorkspaces from '@shell/components/fleet/FleetNoWorkspaces.vue';
import { NAME } from '@shell/config/product/fleet';
import { xOfy } from '@shell/utils/string';
import FleetResources from '@shell/components/fleet/FleetResources';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { DoughnutChart } from 'vue-chart-3';
import { Chart, registerables } from 'chart.js';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import ForceDirectedTreeChart from '@shell/components/fleet/ForceDirectedTreeChart';
import SlideInPanel from '@shell/components/SlideInPanel';
import DetailTop from '@shell/components/DetailTop';

import {
  AGE,
  NAME as NAME_COL,
  STATE,
} from '@shell/config/table-headers';

Chart.register(...registerables);

export default {
  name:       'FleetDashboard',
  components: {
    Loading,
    LabeledSelect,
    ResourceTable,
    Card,
    CompoundStatusBadge,
    FleetNoWorkspaces,
    FleetResources,
    Tab,
    DoughnutChart,
    ResourceTabs,
    ForceDirectedTreeChart,
    SlideInPanel,
    DetailTop
  },

  async fetch() {
    const hash = await checkSchemasForFindAllHash({
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
    }, this.$store);

    this.gitRepos = hash.gitRepos;
    this.fleetWorkspacesData = hash.fleetWorkspaces || [];

    try {
      const permissions = await checkPermissions({ workspaces: { type: FLEET.WORKSPACE }, gitRepos: { type: FLEET.GIT_REPO, schemaValidator: (schema) => schema.resourceMethods.includes('PUT') } }, this.$store.getters);

      this.permissions = permissions;
    } catch (e) {
      console.error(e); // eslint-disable-line no-console
    }
  },

  data() {
    const repoSchema = this.$store.getters['management/schemaFor'](FLEET.GIT_REPO);
    const getGraphConfig = this.$store.getters['type-map/hasGraph']('fleet.cattle.io.gitrepo');

    return {
      resourceComponent: null,
      selectedResource:  null,
      renderGraph:       false,
      getGraphConfig,
      repoFilter:        null,
      selectedCluster:   'fleet-1-france',
      repoSchema,
      expand:            false,
      selectedRepo:      null,
      admissableAreas:   ['clusters', 'bundles', 'resources'],
      headers:           [
        NAME_COL,
        STATE,
        AGE
      ],
      schema:              {},
      gitRepos:            [],
      fleetWorkspacesData: [],
      isCollapsed:         {},
      permissions:         {},
      getStartedLink:      {
        name:   'c-cluster-product-resource-create',
        params: {
          product:  NAME,
          resource: FLEET.GIT_REPO
        },
      }
    };
  },
  computed: {
    ...mapState(['workspace', 'allNamespaces']),

    selectedResourceObj() {
      if (this.selectedResource) {
        const { id, type } = this.selectedResource;

        return this.$store.getters['cluster/byId'](type, id);
      }

      return null;
    },

    chartLabels() {
      return [
        'Modified',
        'Active'
      ];
    },

    options() {
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
        onClick: (_, value) => {
          const index = value[0]?.index;

          this.filterRepos(index);
        }
      };
    },

    chartData() {
      const total = this.totalRepositories.length;
      const active = this.readyRepositories.length;
      const modified = total - active;

      return {
        labels:   this.chartLabels,
        datasets: [
          {
            data:            [modified, active],
            backgroundColor: [
              '#DAC342',
              '#5D995D',
            ],
          },
        ],
      };
    },

    filteredRepositories() {
      return this.totalRepositories.filter((r) => !this.repoFilter || r.stateDisplay === this.repoFilter);
    },

    totalRepositories() {
      return this.fleetWorkspaces.find((ws) => ws.id === this.workspace).repos;
    },

    readyRepositories() {
      return this.totalRepositories.filter((r) => r.status?.resourceCounts?.desiredReady === r.status?.resourceCounts?.ready && !r.status?.resourceCounts?.missing);
    },

    totalBundles() {
      return this.totalRepositories.reduce((acc, repo) => [
        ...acc,
        ...repo.bundles
      ], []);
    },

    readyBundles() {
      return this.totalBundles.filter((b) => b.status?.summary.desiredReady === b.status?.summary.ready);
    },

    totalClusters() {
      return ['local', 'fleet-1-france', 'fleet-2-france'];
    },

    reposByCluster() {
      return this.totalRepositories.filter((x) => {
        return true;
      });
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
    areAllCardsExpanded() {
      return Object.keys(this.isCollapsed).every((key) => !this.isCollapsed[key]);
    },
    gitReposCounts() {
      return this.gitRepos.reduce((prev, gitRepo) => {
        prev[gitRepo.id] = {
          bundles:   gitRepo.allBundlesStatuses,
          resources: gitRepo.allResourceStatuses,
        };

        return prev;
      }, {});
    },
  },
  methods: {
    filterRepos(index) {
      this.repoFilter = this.chartLabels[index];

      this.selectedRepo = null;
      if (this.filteredRepositories.length > 0) {
        this.$nextTick(() => {
          this.selectedRepo = this.filteredRepositories[0];
        });
      }
    },

    toggle(name) {
      this.expand = !this.expand;
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
    getBadgeClassAndIcon(current, total) {
      const state = total === current ? 'active' : 'modified';

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
    toggleCollapse(val, key) {
      this.isCollapsed[key] = val;
    },
    toggleAll(action) {
      const val = action !== 'expand';

      Object.keys(this.isCollapsed).forEach((key) => {
        this.isCollapsed[key] = val;
      });
    },
    onRepoitoryRowClick(value) {
      this.selectedRepo = value.row;
    },
    onRepositoryBadgeClick(index) {
      this.toggle();

      this.filterRepos(index);
    },

    onResourceRowClick(value) {
      if (value.row) {
        this.selectedResource = value.row;

        const { cluster } = value.row.detailLocation.params;
        const { id, type } = value.row;

        this.$store.dispatch('cluster/find', {
          type,
          id,
          opt: { url: `/k8s/clusters/${ cluster }/v1/${ type }/${ id }?exclude=metadata.managedFields` }
        });

        this.resourceComponent = this.$store.getters['type-map/importDetail'](type, id);

        this.$refs.slideInPanel.open();
      }
    },

    onBadgeClick() {

    },
  },

  watch: {
    workspace() {
      this.expand = false;
      this.selectedRepo = null;
      this.repoFilter = null;
    },

    selectedCluster() {
      this.$nextTick(() => {
        this.selectedResource = null;
      });
    },

    selectedRepo() {
      this.renderGraph = false;
      this.$nextTick(() => {
        this.renderGraph = true;
      });
    },

    fleetWorkspaces(value) {
      value?.filter((ws) => ws.repos?.length).forEach((ws) => {
        this.isCollapsed[ws.id] = false;
      });
    }
  }
};
</script>

<template>
  <div>
    <Loading v-if="$fetchState.pending" />
    <!-- no git repos -->
    <FleetNoWorkspaces
      v-else-if="!fleetWorkspacesData.length"
      :can-view="permissions.workspaces"
    />

    <!-- no git repos -->
    <div
      v-else-if="!gitRepos.length"
      class="fleet-empty-dashboard"
    >
      <i class="icon-fleet mb-30" />
      <h1>{{ t('fleet.dashboard.welcome') }}</h1>
      <p class="mb-30">
        <span>{{ t('fleet.dashboard.gitOpsScale') }}</span>
        <a
          :href="t('fleet.dashboard.learnMoreLink')"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          {{ t('fleet.dashboard.learnMore') }} <i class="icon icon-external-link" />
        </a>
      </p>
      <template v-if="permissions.gitRepos">
        <h3 class="mb-30">
          {{ t('fleet.dashboard.noRepo', null, true) }}
        </h3>
        <router-link
          :to="getStartedLink"
          class="btn role-secondary"
        >
          {{ t('fleet.dashboard.getStarted') }}
        </router-link>
      </template>
    </div>

    <div v-else>
      <div class="title mb-20">
        <h1>
          <t k="fleet.dashboard.pageTitle" />
        </h1>
      </div>
      <div class="workspace-title">
        <h2 class="text-default-text">
          <p>
            <i class="icon icon-folder" />
            <span>Workspace: {{ workspace }}</span>
          </p>
        </h2>
      </div>
      <div class="body">
        <div class="row row-first">
          <div
            class="col col-repo"
            :class="{
              ['expand']: expand,
              ['span-4']: !expand
            }"
          >
            <Card
              :show-actions="false"
              :show-body-separator="false"
              :show-highlight-border="false"
              class="m-0 mt-20"
            >
              <template #title>
                <div class="title">
                  <h3>Repositories</h3>
                  <p
                    v-if="expand"
                    @click="toggle()"
                  >
                    {{ expand ? 'Collapse' : 'Expand' }}
                  </p>
                </div>
              </template>
              <template #body>
                <div
                  v-if="!expand"
                  class="row p-5 row-badge"
                >
                  <div class="col">
                    <CompoundStatusBadge
                      :badge-class="getBadgeClassAndIcon(1, 1).badgeClass"
                      :icon="getBadgeClassAndIcon(1, 1).icon"
                      :value="'' + readyRepositories.length"
                      @click="onRepositoryBadgeClick(1)"
                    />
                  </div>

                  <div class="col">
                    <CompoundStatusBadge
                      v-if="totalRepositories.length - readyRepositories.length > 0"
                      :badge-class="getBadgeClassAndIcon(readyRepositories.length, totalRepositories.length).badgeClass"
                      :icon="getBadgeClassAndIcon(readyRepositories.length, totalRepositories.length).icon"
                      :value="'' + (totalRepositories.length - readyRepositories.length)"
                      @click="onRepositoryBadgeClick(0)"
                    />
                  </div>

                  <div class="col">
                    <CompoundStatusBadge
                      :badge-class="'error'"
                      :icon="'error'"
                      :value="'0'"
                    />
                  </div>
                </div>
                <div
                  v-if="expand"
                  class="repo-list"
                >
                  <div class="row">
                    <div class="col span-6">
                      <DoughnutChart
                        class="repositories-graph"
                        :chart-data="chartData"
                        :options="options"
                      />
                    </div>
                    <div class="col span-6">
                      <ResourceTable
                        v-bind="$attrs"
                        class="repo-table-select"
                        :schema="repoSchema"
                        :headers="headers"
                        :rows="filteredRepositories"
                        :search="false"
                        :table-actions="false"
                        :row-actions="false"
                        :click-selection="true"
                        :selected-row-click="selectedRepo"
                        :loading="$fetchState.pending"
                        key-field="_key"
                        @rowClick="onRepoitoryRowClick"
                      />
                    </div>
                  </div>

                  <div class="row">
                    <div class="col span-12">
                      <div
                        v-if="selectedRepo"
                        class="repo-details"
                      >
                        <ResourceTabs
                          :value="selectedRepo"
                          mode="view"
                          class="mt-20"
                          :need-related="false"
                          :default-tab="'resources'"
                        >
                          <Tab
                            name="basics"
                            :label="'Details'"
                            :weight="4"
                          >
                            <div class="row mb-10">
                              <div class="col span-2">
                                <span> Name </span>
                              </div>
                              <div class="col span-6 ml-20">
                                <span>
                                  {{ selectedRepo.name }}
                                </span>
                              </div>
                            </div>
                            <div class="row mb-10">
                              <div class="col span-2">
                                <span> Repository </span>
                              </div>
                              <div class="col span-6 ml-20">
                                <span>
                                  {{ selectedRepo.spec.repo }}
                                </span>
                              </div>
                            </div>
                            <div class="row mb-10">
                              <div class="col span-2">
                                <span> Revision </span>
                              </div>
                              <div class="col span-6 ml-20">
                                <span>
                                  {{ selectedRepo.spec.revision || selectedRepo.spec.branch }}
                                </span>
                              </div>
                            </div>
                            <div class="row mb-10">
                              <div class="col span-2">
                                <span> Path </span>
                              </div>
                              <div class="col span-6 ml-20">
                                <span>
                                  {{ selectedRepo.spec.paths }}
                                </span>
                              </div>
                            </div>

                            <div class="row mb-10">
                              <div class="col span-2">
                                <span> Target Namespace </span>
                              </div>
                              <div class="col span-6 ml-20">
                                <span>
                                  {{ selectedRepo.spec.targetNamespace }}
                                </span>
                              </div>
                            </div>

                            <div class="row mb-10">
                              <div class="col span-2">
                                <span> Polling Interval </span>
                              </div>
                              <div class="col span-6 ml-20">
                                <span>
                                  {{ selectedRepo.spec.pollingInterval }}
                                </span>
                              </div>
                            </div>
                          </Tab>
                          <Tab
                            name="resources"
                            :label="'Resources'"
                            :weight="3"
                          >
                            <div class="row cluster-select">
                              <div class="col span-3">
                                <LabeledSelect
                                  v-model:value="selectedCluster"
                                  :label="'Cluster'"
                                  :options="totalClusters"
                                  :mode="'edit'"
                                />
                              </div>
                            </div>
                            <div class="row resource-list">
                              <div class="col span-12">
                                <FleetResources
                                  :value="selectedRepo"
                                  :cluster-id="workspace + '/' + selectedCluster"
                                  :click-selection="true"
                                  :selected-row-click="selectedResource"
                                  @rowClick="onResourceRowClick"
                                />
                              </div>
                              <div class="col slide-in-panel">
                                <SlideInPanel
                                  ref="slideInPanel"
                                >
                                  <template #title>
                                    <div
                                      v-if="selectedResourceObj"
                                      class="title"
                                    >
                                      <h3 class="m-0">
                                        {{ selectedResourceObj.kind }}: {{ selectedResourceObj.name }}
                                      </h3>
                                    </div>
                                  </template>
                                  <template #body>
                                    <div class="body">
                                      <DetailTop
                                        class="mb-20 mt-10"
                                        :value="selectedResourceObj"
                                      />
                                      <component
                                        :is="resourceComponent"
                                        v-model:value="selectedResourceObj"
                                        :mode="'view'"
                                      />
                                    </div>
                                  </template>
                                </SlideInPanel>
                              </div>
                            </div>
                          </Tab>
                          <Tab
                            name="metrics"
                            :label="'Metrics'"
                            :weight="2"
                          >
                            <div class="row">
                              <span class="col span-4">
                                Metrics
                              </span>
                            </div>
                            <div class="row">
                              <span class="col span-4">
                                Metrics
                              </span>
                            </div>
                            <div class="row">
                              <span class="col span-4">
                                Metrics
                              </span>
                            </div>
                            <div class="row">
                              <span class="col span-4">
                                Metrics
                              </span>
                            </div>
                            <div class="row">
                              <span class="col span-4">
                                Metrics
                              </span>
                            </div>
                            <div class="row">
                              <span class="col span-4">
                                Metrics
                              </span>
                            </div>
                          </Tab>
                          <Tab
                            name="graph"
                            :label="'Graph'"
                            :weight="1"
                          >
                            <ForceDirectedTreeChart
                              v-if="renderGraph"
                              :data="selectedRepo"
                              :fdc-config="getGraphConfig"
                            />
                          </Tab>
                        </ResourceTabs>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </Card>
          </div>
          <div
            class="col"
            :class="{
              ['span-6']: expand,
              ['span-4']: !expand
            }"
          >
            <Card
              :show-actions="false"
              :show-body-separator="false"
              :show-highlight-border="false"
              class="m-0 mt-20"
            >
              <template #title>
                <h3>Bundles</h3>
              </template>
              <template #body>
                <div class="p-5 body-content">
                  <CompoundStatusBadge
                    :badge-class="getBadgeClassAndIcon(readyBundles.length, totalBundles.length).badgeClass"
                    :icon="getBadgeClassAndIcon(readyBundles.length, totalBundles.length).icon"
                    :value="readyBundles.length + '/' + totalBundles.length"
                    @click="onBadgeClick"
                  />
                </div>
              </template>
            </Card>
          </div>
          <div
            class="col"
            :class="{
              ['span-6']: expand,
              ['span-4']: !expand
            }"
          >
            <Card
              :show-actions="false"
              :show-body-separator="false"
              :show-highlight-border="false"
              class="m-0 mt-20"
            >
              <template #title>
                <h3>Clusters</h3>
              </template>
              <template #body>
                <div class="p-5 body-content">
                  {{ totalClusters.length }}
                </div>
              </template>
            </Card>
          </div>
        </div>

        <div class="row">
          <div class="col span-6">
            <Card
              :show-actions="false"
              :show-body-separator="false"
              :show-highlight-border="false"
              class="m-0 mt-20"
            >
              <template #title>
                <h3>Logs</h3>
              </template>
              <template #body>
                <div class="p-5 body-content">
                  empty
                </div>
              </template>
            </Card>
          </div>
          <div class="col span-6">
            <Card
              :show-actions="false"
              :show-body-separator="false"
              :show-highlight-border="false"
              class="m-0 mt-20"
            >
              <template #title>
                <h3>Errors</h3>
              </template>
              <template #body>
                <div class="p-5 body-content">
                  empty
                </div>
              </template>
            </Card>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
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

.workspace-title {
  margin: 0;
  display: flex;
  gap: 5px;

  h2 {
    margin: 0;
    padding: 10px;
  }

  p {
    margin-right: 30px;
    display: flex;
    align-items: center;

    i {
      font-size: 20px;
      margin-right: 10px;
    }
  }
}

.card-container, .workspace-title {
  border: 1px solid var(--modal-border);
  border-radius: 0;
  background-color: var(--body-bg);
}

:deep() .card-body {

  .body-content {
    margin: auto;
  }
}

:deep() .card-container .card-title {
  display: block;
}

.card-title {

  align-items: center;

  min-height: 48px;

  > div {
    display: flex;

  justify-content: space-between;
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

.repo-table-select {
  height: 450px;
  width: 200px;
}

.repo-details {
  padding: 10px 0;
}

.cluster-select {
  justify-content: start;
  margin-bottom: 10px;
}

.repositories-graph {
  padding: 20px 0 0 20px;
  height: 400px;
  width: 400px;
}

.row-badge {
  justify-content: center;
}

.row-first {
  flex-wrap: wrap;
}

.col-repo {
  transition: width 0.3s;
}

.expand {
  width: 100%;
}

.slide-in-panel {
  .body {
    padding: 10px;

    .detail-top {
      border-top: none;
    }
  }
}
</style>
