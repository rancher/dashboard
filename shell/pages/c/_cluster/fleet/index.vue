<script>
import isEqual from 'lodash/isEqual';
import { queryParamsFor } from '@shell/utils/router';
import fetchMixin from '@shell/mixins/fetch.client.js';
import { installDirectives } from '@shell/initialize/install-directives.js';
import { installComponents } from '@shell/initialize/install-components.js';
import { installPlugins } from '@shell/initialize/install-plugins.js';
import { createApp } from 'vue';
import cleanHtmlDirective from '@shell/directives/clean-html';
import i18n from '@shell/plugins/i18n';
import { createRouter, createWebHistory } from 'vue-router';
import Routes from '@shell/config/router/routes';
import { mapState } from 'vuex';
import { FLEET, POD } from '@shell/config/types';
import { WORKSPACE } from '@shell/store/prefs';
import {
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
import FleetResources from '@shell/components/fleet/FleetResources';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { DoughnutChart } from 'vue-chart-3';
import { Chart, registerables } from 'chart.js';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import ForceDirectedTreeChart from '@shell/components/fleet/ForceDirectedTreeChart';
import SlideInPanel from '@shell/components/SlideInPanel';
import DetailTop from '@shell/components/DetailTop';
import { shallowRef } from 'vue';
import Banner from '@components/Banner/Banner.vue';
import ResourceDetail from '@shell/components/ResourceDetail';

import {
  AGE,
  NAME as NAME_COL,
  STATE,
} from '@shell/config/table-headers';

Chart.register(...registerables);

const chartOptions = [
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
    Banner,
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
    DetailTop,
    ResourceDetail
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
      slideInPanelApp: null,
      restoreRoute: null,
      resourceDetail: this.getComponent(),
      routeHardcoded: null,
      resourceComponent: null,
      selectedResource:  null,
      renderGraph:       false,
      getGraphConfig,
      repoFilter:        null,
      selectedCluster:   null,
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

          const id = chartOptions[index]?.id;

          this.filterRepos(id);
        }
      };
    },

    chartData() {
      return {
        labels:   chartOptions.map(({ label }) => label),
        datasets: [
          {
            data:            this.statusRepositoryArray,
            backgroundColor: chartOptions.map(({ color }) => color),
          },
        ],
      };
    },

    statuses() {
      const res = [];

      chartOptions.forEach(({ id, badgeClass, icon }) => {
        const count = this.statusRepository[id];

        if (count > 0) {
          res.push({
            id, badgeClass, icon, count
          });
        }
      });

      return res;
    },

    statusRepository() {
      return chartOptions
        .reduce((acc, { id }) => ({
          ...acc,
          [id]: this.totalRepositories.filter((r) => r.dashboardState === id).length,
        }), {});
    },

    statusRepositoryArray() {
      return Object.values(this.statusRepository);
    },

    filteredRepositories() {
      return this.totalRepositories.filter((r) => !this.repoFilter || r.dashboardState === this.repoFilter);
    },

    totalRepositories() {
      return this.fleetWorkspaces.find((ws) => ws.id === this.workspace).repos;
    },

    errorRepositories() {
      return this.totalRepositories.filter((r) => r.dashboardState === 'error');
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
      const allClusters = this.$store.getters['management/all'](FLEET.CLUSTER);

      return allClusters.filter((c) => c.namespace === this.workspace).map((c) => c.name);
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
  },
  methods: {
    async fillResourceDetail(value, valueObj) {

      this.restoreRoute = this.$route;

      let slideInPanel;

      let route = this.$router.resolve(value.detailLocation);

      const { cluster, id, namespace, resource } = route.params;

      let pathCustom = `/fleet/c/${ cluster }/${ resource }/${ namespace }/${ id }`;

      route.fullPath = pathCustom;
      route.href = pathCustom;
      route.path = pathCustom;
      route.params.product = 'fleet';
      route.name = 'c-cluster-fleet-slide';

      history.pushState({},"", route.path)

      console.log('route---', route)


      const router = createRouter({
        routes: Routes,
        history:  createWebHistory(),
        base:     pathCustom,
        fallback: false,
      });

      router.applyQuery = function(qp, defaults = {}) {
          const query = queryParamsFor(router.currentRoute.value.query, qp, defaults);
          const hash = router.currentRoute.value.hash || '';

          if (isEqual(query, router.currentRoute.value.query)) {
            return;
          }

          return router.replace({ query, hash }).catch((err) => {
            if (err && err.name === 'NavigationDuplicated') {
              // Do nothing, this is fine...
              // https://github.com/vuejs/vue-router/issues/2872
            } else {
              throw err;
            }
          });
        };

      route = router.resolve(value.detailLocation);

      // const pathCustom = `/fleet/c/${ cluster }/${ resource }/${ namespace }/${ id }`;
      pathCustom = `/fleet/c/${ cluster }/${ resource }/${ namespace }/${ id }`;
      route.fullPath = pathCustom;
      route.href = pathCustom;
      route.path = pathCustom;
      route.params.product = 'fleet';
      route.name = 'c-cluster-fleet-slide';

      router.replace(route);

      // Create a DIV that we can mount the slide-in panel component into
      const div = document.createElement('div');

      const PANEL_ID = 'fleetslidein';
      div.id = PANEL_ID;

      const parentDiv = document.getElementById('fleetslideinparent');

      parentDiv.appendChild(div);

      const slideInPanelApp = createApp(ResourceDetail, {
        liveModelProp: valueObj,
        namespacedProp: false,
        onRouteChange: (prev, curr) => console.log(curr),
      });

      const store = this.$store;

      // await this.$store.dispatch('management/findAll', { type: POD });

      setTimeout(() => {
        slideInPanelApp.directive('clean-html', cleanHtmlDirective);
        slideInPanelApp.use(store);
        slideInPanelApp.use(router)
        slideInPanelApp.use(i18n, { store });

        // Fetch mixin
        slideInPanelApp.mixin(fetchMixin);
        
        // Bulk install components
        installComponents(slideInPanelApp);
        
        // Bulk install directives
        installDirectives(slideInPanelApp);
        
        // Bulk install Plugins. Note: Some are added within the App itself
        installPlugins(slideInPanelApp);

        slideInPanel = slideInPanelApp.mount(`#${ PANEL_ID }`);

        this.slideInPanelApp = slideInPanelApp;
      }, 0);
    },

    onPanelClose() {
      console.log('panel Close')

      history.pushState({},"", this.restoreRoute.path)
      this.slideInPanelApp.unmount();
    },
    getComponent() {
      return require(`@shell/components/ResourceDetail`).default;
    },
    filterRepos(id) {
      this.repoFilter = id || null;

      this.selectedRepo = null;
      if (this.filteredRepositories.length > 0) {
        this.$nextTick(() => {
          this.selectedRepo = this.filteredRepositories[0];
        });
      }
    },

    toggle(name) {
      this.selectedCluster = this.totalClusters[0];
      this.expand = !this.expand;
    },

    tempBadgeStatus(current, total) {
      const state = total === current ? 'active' : 'modified';

      return {
        badgeClass: STATES[state].color ? STATES[state].color : `${ STATES[STATES_ENUM.UNKNOWN].color } bg-unmapped-state`,
        icon:       STATES[state].compoundIcon ? STATES[state].compoundIcon : `${ STATES[STATES_ENUM.UNKNOWN].compoundIcon } unmapped-icon`
      };
    },
    onRepoitoryRowClick(value) {
      this.selectedRepo = value.row;
    },
    onRepositoryBadgeClick(index) {
      this.toggle();

      this.filterRepos(index);
    },

    async onResourceRowClick(value) {
      if (value?.row?.detailLocation) {

        const { cluster } = value.row.detailLocation.params;
        const { id, type } = value.row;

        const res = await this.$store.dispatch('cluster/find', {
          type,
          id,
          opt: { url: `/k8s/clusters/${ cluster }/v1/${ type }/${ id }?exclude=metadata.managedFields` }
        });

        this.resourceComponent = shallowRef(this.$store.getters['type-map/importDetail'](type, id));

        await this.fillResourceDetail(value.row, res);

        this.selectedResource = value.row;

        this.$refs.slideInPanel.open();
      }
    },

    onBadgeClick() {

    },
  },

  watch: {
    workspace() {
      this.filterRepos(null);
      this.selectedCluster = this.totalClusters[0];
    },

    selectedRepo() {
      this.renderGraph = false;
      this.$nextTick(() => {
        this.renderGraph = true;
        this.selectedResource = null;
      });
    },

    selectedCluster() {
      this.$nextTick(() => {
        this.selectedResource = null;
      });
    },
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
              :show-separator="false"
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
                  <div
                    v-for="(status, i) in statuses"
                    :key="i"
                    class="col"
                  >
                    <CompoundStatusBadge
                      :badge-class="status.badgeClass"
                      :icon="status.icon"
                      :value="'' + status.count"
                      @click="onRepositoryBadgeClick(status.id)"
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
                        :sub-rows-description="false"
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
                            :weight="5"
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
                            :weight="4"
                          >
                            <div
                              v-if="selectedRepo && selectedRepo.stateDescription"
                              class="row errors"
                            >
                              <Banner
                                color="error"
                              >
                                {{ selectedRepo.stateDescription }}
                              </Banner>
                            </div>
                            <div class="row resource-list">
                              <div class="col span-12">
                                <FleetResources
                                  :value="selectedRepo"
                                  :cluster-id="workspace + '/' + selectedCluster"
                                  :selected-row-click="selectedResource"
                                  @rowClick="onResourceRowClick"
                                >
                                  <template
                                    v-if="workspace !== 'fleet-local'"
                                    #header-left
                                  >
                                    <div class="row">
                                      <div class="col span-4">
                                        <LabeledSelect
                                          v-model:value="selectedCluster"
                                          :label="'Cluster'"
                                          :options="totalClusters"
                                          :mode="'edit'"
                                        />
                                      </div>
                                    </div>
                                  </template>
                                </FleetResources>
                              </div>
                              <div class="col slide-in-panel">
                                <SlideInPanel
                                  ref="slideInPanel"
                                  :loading="false"
                                  @close="onPanelClose"
                                >
                                  <template #title />
                                  <template #body>
                                    <div class="body">
                                      <div id="fleetslideinparent">
                                      </div>
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
              :show-separator="false"
              :show-highlight-border="false"
              class="m-0 mt-20"
            >
              <template #title>
                <h3>Bundles</h3>
              </template>
              <template #body>
                <div class="p-5 body-content">
                  <CompoundStatusBadge
                    :badge-class="tempBadgeStatus(readyBundles.length, totalBundles.length).badgeClass"
                    :icon="tempBadgeStatus(readyBundles.length, totalBundles.length).icon"
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
              :show-separator="false"
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
              :show-separator="false"
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
              :show-separator="false"
              :show-highlight-border="false"
              class="m-0 mt-20"
            >
              <template #title>
                <h3>Errors</h3>
              </template>
              <template #body>
                <div class="p-5 body-content">
                  {{ errorRepositories.length }}
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
  cursor: pointer;
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

.banner {
  margin-top: 0;
}

:deep() .cru-resource-footer {
  padding: 0;
}

.compound-cluster-badge {
  cursor: pointer;
}

.repo-list, .resource-list {
  :deep() .main-row {
    cursor: pointer;
  }
}
</style>
