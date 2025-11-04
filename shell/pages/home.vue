<script lang="ts">
import { defineComponent } from 'vue';
import { mapPref, AFTER_LOGIN_ROUTE, HIDE_HOME_PAGE_CARDS } from '@shell/store/prefs';
import BannerGraphic from '@shell/components/BannerGraphic.vue';
import IndentedPanel from '@shell/components/IndentedPanel.vue';
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable.vue';
import { BadgeState } from '@components/BadgeState';
import CommunityLinks from '@shell/components/CommunityLinks.vue';
import SingleClusterInfo from '@shell/components/SingleClusterInfo.vue';
import DynamicContentBanner from '@shell/components/DynamicContent/DynamicContentBanner.vue';
import DynamicContentPanel from '@shell/components/DynamicContent/DynamicContentPanel.vue';
import { mapGetters, mapState } from 'vuex';
import { MANAGEMENT, CAPI, COUNT } from '@shell/config/types';
import { NAME as MANAGER } from '@shell/config/product/manager';
import { AGE, STATE } from '@shell/config/table-headers';
import { MODE, _IMPORT } from '@shell/config/query-params';
import { createMemoryFormat, formatSi, parseSi, createMemoryValues } from '@shell/utils/units';
import { markSeenReleaseNotes } from '@shell/utils/version';
import PageHeaderActions from '@shell/mixins/page-actions';
import { getVendor } from '@shell/config/private-label';
import { mapFeature, MULTI_CLUSTER } from '@shell/store/features';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import { filterHiddenLocalCluster, filterOnlyKubernetesClusters, paginationFilterClusters } from '@shell/utils/cluster';
import TabTitle from '@shell/components/TabTitle.vue';
import { ActionFindPageArgs } from '@shell/types/store/dashboard-store.types';

import { SET_LOGIN_ACTION, SHOW_HIDE_BANNER_ACTION } from '@shell/config/page-actions';
import { STEVE_NAME_COL, STEVE_STATE_COL } from '@shell/config/pagination-table-headers';
import { PaginationParamFilter, FilterArgs, PaginationFilterField, PaginationArgs } from '@shell/types/store/pagination.types';
import ProvCluster from '@shell/models/provisioning.cattle.io.cluster';
import { sameContents } from '@shell/utils/array';
import { PagTableFetchPageSecondaryResourcesOpts, PagTableFetchSecondaryResourcesOpts, PagTableFetchSecondaryResourcesReturns } from '@shell/types/components/paginatedResourceTable';
import { CURRENT_RANCHER_VERSION, getVersionData } from '@shell/config/version';
import { CAPI as CAPI_LAB_AND_ANO } from '@shell/config/labels-annotations';
import paginationUtils from '@shell/utils/pagination-utils';
import ResourceTable from '@shell/components/ResourceTable.vue';
import Preset from '@shell/mixins/preset';
import { PaginationFeatureHomePageClusterConfig } from '@shell/types/resources/settings';

export default defineComponent({
  name:       'Home',
  layout:     'home',
  components: {
    BannerGraphic,
    IndentedPanel,
    PaginatedResourceTable,
    BadgeState,
    CommunityLinks,
    SingleClusterInfo,
    TabTitle,
    ResourceTable,
    DynamicContentBanner,
    DynamicContentPanel,
  },

  mixins: [PageHeaderActions, Preset],

  data() {
    const options = this.$store.getters[`type-map/optionsFor`](CAPI.RANCHER_CLUSTER)?.custom || {};
    const params = {
      product:  MANAGER,
      cluster:  BLANK_CLUSTER,
      resource: CAPI.RANCHER_CLUSTER
    };
    const defaultCreateLocation = {
      name: 'c-cluster-product-resource-create',
      params,
    };
    const defaultImportLocation = {
      ...defaultCreateLocation,
      query: { [MODE]: _IMPORT }
    };

    return {
      HIDE_HOME_PAGE_CARDS,
      // Page actions don't change on the Home Page
      pageActions: [
        {
          label:  this.t('nav.header.setLoginPage'),
          action: SET_LOGIN_ACTION
        },
        { divider: true },
        {
          label:  this.t('nav.header.showHideBanner'),
          action: SHOW_HIDE_BANNER_ACTION
        },
      ],
      vendor: getVendor(),

      provClusterSchema: this.$store.getters['management/schemaFor'](CAPI.RANCHER_CLUSTER),

      canViewMgmtClusters:  !!this.$store.getters['management/schemaFor'](MANAGEMENT.CLUSTER),
      canViewMachine:       !!this.$store.getters['management/canList'](CAPI.MACHINE),
      canViewMgmtNodes:     !!this.$store.getters['management/canList'](MANAGEMENT.NODE),
      canViewMgmtPools:     !!this.$store.getters['management/canList'](MANAGEMENT.NODE_POOL),
      canViewMgmtTemplates: !!this.$store.getters['management/canList'](MANAGEMENT.NODE_TEMPLATE),

      manageLocation: {
        name:   'c-cluster-product-resource',
        params: {
          product:  MANAGER,
          cluster:  BLANK_CLUSTER,
          resource: CAPI.RANCHER_CLUSTER
        },
      },

      createLocation: options.createLocation ? options.createLocation(params) : defaultCreateLocation,

      importLocation: options.importLocation ? options.importLocation(params) : defaultImportLocation,

      headers: [
        STATE,
        {
          name:          'name',
          labelKey:      'tableHeaders.name',
          value:         'nameDisplay',
          sort:          ['nameSort'],
          canBeVariable: true,
          getValue:      (row: ProvCluster) => row.mgmt?.nameDisplay
        },
        {
          label:     this.t('landing.clusters.provider'),
          subLabel:  this.t('landing.clusters.distro'),
          value:     'mgmt.status.provider',
          name:      'Provider',
          sort:      ['mgmt.status.provider'],
          formatter: 'ClusterProvider'
        },
        {
          label:    this.t('landing.clusters.kubernetesVersion'),
          subLabel: this.t('landing.clusters.architecture'),
          name:     'kubernetesVersion',
        },
        {
          label: this.t('tableHeaders.cpu'),
          value: '',
          name:  'cpu',
          sort:  ['status.allocatable.cpu', 'status.available.cpu']
        },
        {
          label: this.t('tableHeaders.memory'),
          value: '',
          name:  'memory',
          sort:  ['status.allocatable.memory', 'status.available.memory']
        },
        {
          label:        this.t('tableHeaders.pods'),
          name:         'pods',
          value:        '',
          sort:         ['status.allocatable.pods', 'status.requested.pods'],
          formatter:    'PodsUsage',
          delayLoading: true
        },
        // {
        //   name:  'explorer',
        //   label:  this.t('landing.clusters.explorer')
        // }
      ],

      paginationHeaders: [
        STEVE_STATE_COL,
        {
          ...STEVE_NAME_COL,
          canBeVariable: true,
          value:         `metadata.annotations[${ CAPI_LAB_AND_ANO.HUMAN_NAME }]`,
          sort:          [`metadata.annotations[${ CAPI_LAB_AND_ANO.HUMAN_NAME }]`],
          search:        `metadata.annotations[${ CAPI_LAB_AND_ANO.HUMAN_NAME }]`,
        },
        {
          label:     this.t('landing.clusters.provider'),
          subLabel:  this.t('landing.clusters.distro'),
          value:     'mgmt.status.provider',
          name:      'Provider',
          sort:      false,
          search:    false,
          formatter: 'ClusterProvider'
        },
        {
          label:    this.t('landing.clusters.kubernetesVersion'),
          subLabel: this.t('landing.clusters.architecture'),
          name:     'kubernetesVersion',
          sort:     false,
          search:   false,
        },
        {
          label:  this.t('tableHeaders.cpu'),
          value:  '',
          name:   'cpu',
          sort:   false,
          search: false,
        },
        {
          label:  this.t('tableHeaders.memory'),
          value:  '',
          name:   'memory',
          sort:   false,
          search: false,
        },
        {
          label:        this.t('tableHeaders.pods'),
          name:         'pods',
          value:        '',
          sort:         false,
          search:       false,
          formatter:    'PodsUsage',
          delayLoading: true
        },
      ],

      clusterCount: 0,

      CURRENT_RANCHER_VERSION,

      /**
       * User has decided to disable the alt list
       */
      altClusterListDisabled: false,
      /**
       * There are too many clusters to show in the home page list.
       *
       * If not disabled, show alt table
       */
      tooManyClusters:        undefined as boolean | undefined,
      altClusterListRows:     undefined as any[] | undefined,
      altClusterListFeature:  paginationUtils.getFeature<PaginationFeatureHomePageClusterConfig>({ rootGetters: this.$store.getters }, 'homePageCluster'),

      presetVersion: getVersionData()?.Version,
    };
  },

  mounted() {
    this.preset('altClusterListDisabled', 'boolean');
  },

  computed: {
    ...mapState(['managementReady']),
    ...mapGetters(['currentCluster', 'defaultClusterId']),
    mcm: mapFeature(MULTI_CLUSTER),

    vaiOnSettingsHeaders() {
      return [
        ...this.headers, // include age as we're sorting by it
        AGE
      ];
    },

    canCreateCluster() {
      return !!this.provClusterSchema?.collectionMethods.find((x: string) => x.toLowerCase() === 'post');
    },

    afterLoginRoute: mapPref(AFTER_LOGIN_ROUTE),
    homePageCards:   mapPref(HIDE_HOME_PAGE_CARDS),

    /**
     * Show the alt table
     */
    altClusterList() {
      return this.tooManyClusters && !this.altClusterListDisabled;
    }

  },

  watch: {
    async altClusterList(neu) {
      if (neu) {
        await this.initAltClusters();
      }
    },
  },

  async created() {
    // Update last visited on load
    await this.$store.dispatch('prefs/setLastVisited', { name: 'home' });

    // We mark the release notes as seen still - the user has visited the home page, which will show the
    // notification centre containing the release notes notification
    // If we do not, then if they set the landing page, that won't work unless the release notes are marked read
    // otherwise we always take them to the home page to see the release notes
    markSeenReleaseNotes(this.$store);

    this.tooManyClusters = this.isTooManyClusters();

    if (this.altClusterList) {
      await this.initAltClusters();
    }
  },

  // Forget the types when we leave the page
  beforeUnmount() {
    this.$store.dispatch('management/forgetType', CAPI.MACHINE);
    this.$store.dispatch('management/forgetType', MANAGEMENT.NODE);
    this.$store.dispatch('management/forgetType', MANAGEMENT.NODE_POOL);
    this.$store.dispatch('management/forgetType', MANAGEMENT.NODE_TEMPLATE);
  },

  methods: {
    /**
     * Of type PagTableFetchSecondaryResources
     */
    fetchSecondaryResources(opts: PagTableFetchSecondaryResourcesOpts): PagTableFetchSecondaryResourcesReturns {
      if (opts.canPaginate) {
        return Promise.resolve({});
      }

      const promises = [];

      if ( this.canViewMgmtClusters ) {
        // This is the only one we need to block on (needed for the initial sort on mgmt name)
        promises.push(this.$store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER }));
      }

      if ( this.canViewMachine ) {
        this.$store.dispatch('management/findAll', { type: CAPI.MACHINE });
      }

      if ( this.canViewMgmtNodes ) {
        this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE });
      }

      // We need to fetch node pools and node templates in order to correctly show the provider for RKE1 clusters
      if ( this.canViewMgmtPools ) {
        this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_POOL });
      }

      if ( this.canViewMgmtTemplates ) {
        this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_TEMPLATE });
      }

      return Promise.all(promises);
    },

    async fetchPageSecondaryResources({
      canPaginate, force, page, pagResult
    }: PagTableFetchPageSecondaryResourcesOpts) {
      if (!canPaginate || !page?.length) {
        this.clusterCount = 0;

        return;
      }

      this.clusterCount = pagResult.count;

      if ( this.canViewMgmtClusters ) {
        const opt: ActionFindPageArgs = {
          force,
          pagination: new FilterArgs({
            filters: PaginationParamFilter.createMultipleFields(page.map((r: any) => new PaginationFilterField({
              field: 'id',
              value: r.mgmtClusterId
            }))),
          })
        };

        this.$store.dispatch(`management/findPage`, { type: MANAGEMENT.CLUSTER, opt });
      }

      if ( this.canViewMachine ) {
        const opt: ActionFindPageArgs = {
          force,
          pagination: new FilterArgs({
            filters: PaginationParamFilter.createMultipleFields(page.map((r: any) => new PaginationFilterField({
              field: 'spec.clusterName',
              value: r.metadata.name
            }))),
          })
        };

        await this.$store.dispatch(`management/findPage`, { type: CAPI.MACHINE, opt });
      }

      if ( this.canViewMgmtNodes ) {
        const opt: ActionFindPageArgs = {
          force,
          pagination: new FilterArgs({
            filters: PaginationParamFilter.createMultipleFields(page.map((r: any) => new PaginationFilterField({
              field: 'id',
              value: r.mgmtClusterId,
              exact: false,
            }))),
          })
        };

        this.$store.dispatch(`management/findPage`, { type: MANAGEMENT.NODE, opt });
      }

      // We need to fetch node pools and node templates in order to correctly show the provider for RKE1 clusters
      if ( this.canViewMgmtPools && this.canViewMgmtTemplates ) {
        const nodePoolFilters = PaginationParamFilter.createMultipleFields(page
          .filter((p: any) => p.status?.clusterName)
          .map((r: any) => new PaginationFilterField({
            field: 'spec.clusterName',
            value: r.status?.clusterName
          })));
        const nodePools = await this.$store.dispatch(`management/findPage`, {
          type: MANAGEMENT.NODE_POOL,
          opt:  {
            force,
            pagination: new FilterArgs({ filters: nodePoolFilters })
          }
        });

        const templateOpt = PaginationParamFilter.createMultipleFields(nodePools
          .filter((np: any) => !!np.nodeTemplateId)
          .map((np: any) => new PaginationFilterField({
            field: 'id',
            value: np.nodeTemplateId,
            exact: true,
          })));

        this.$store.dispatch(`management/findPage`, {
          type: MANAGEMENT.NODE_TEMPLATE,
          opt:  {
            force,
            pagination: new FilterArgs({ filters: templateOpt })
          }
        });
      }
    },

    /**
     * Define actions for each navigation link
     * @param {*} action
     */
    handlePageAction(action: any) {
      switch (action.action) {
      case SHOW_HIDE_BANNER_ACTION:
        this.toggleBanner();
        break;

      case SET_LOGIN_ACTION:
        this.afterLoginRoute = 'home';
        break;

      // no default
      }
    },

    cpuUsed(cluster: any) {
      return parseSi(cluster.status.requested?.cpu);
    },

    cpuAllocatable(cluster: any) {
      return parseSi(cluster.status.allocatable?.cpu);
    },

    memoryAllocatable(cluster: any) {
      const parsedAllocatable = (parseSi(cluster.status.allocatable?.memory) || 0).toString();
      const format = createMemoryFormat(parsedAllocatable);

      return formatSi(parsedAllocatable, format);
    },

    memoryReserved(cluster: any) {
      const memValues = createMemoryValues(cluster?.status?.allocatable?.memory, cluster?.status?.requested?.memory);

      return `${ memValues.useful }/${ memValues.total } ${ memValues.units }`;
    },

    async resetCards() {
      const value = this.$store.getters['prefs/get'](HIDE_HOME_PAGE_CARDS) || {};

      delete value.setLoginPage;

      await this.$store.dispatch('prefs/set', { key: HIDE_HOME_PAGE_CARDS, value });
    },

    async toggleBanner() {
      const value = this.$store.getters['prefs/get'](HIDE_HOME_PAGE_CARDS) || {};

      if (value.welcomeBanner) {
        delete value.welcomeBanner;
      } else {
        value.welcomeBanner = true;
      }

      await this.$store.dispatch('prefs/set', { key: HIDE_HOME_PAGE_CARDS, value });
    },

    /**
     * Filter out hidden clusters from list of all clusters
     */
    filterRowsLocal(rows: any[]) {
      return filterHiddenLocalCluster(filterOnlyKubernetesClusters(rows || [], this.$store), this.$store);
    },

    /**
     * Filter out hidden clusters via api
     */
    filterRowsApi(pagination: PaginationArgs): PaginationArgs {
      if (!pagination.filters) {
        pagination.filters = [];
      }

      const existingFilters = pagination.filters;
      const requiredFilters = paginationFilterClusters(this.$store, false);

      for (let i = 0; i < requiredFilters.length; i++) {
        let found = false;
        const required = requiredFilters[i];

        for (let j = 0; j < existingFilters.length; j++) {
          const existing = existingFilters[j];

          if (
            required.fields.length === existing.fields.length &&
            sameContents(required.fields.map((e) => e.field), existing.fields.map((e) => e.field))
          ) {
            Object.assign(existing, required);
            found = true;
            break;
          }
        }

        if (!found) {
          pagination.filters.push(required);
        }
      }

      return pagination;
    },

    async toggleAltClusterListDisabled(disabled: boolean) {
      // Clear the cache so the table doesn't show the previous mode's results
      await this.$store.dispatch('management/forgetType', CAPI.RANCHER_CLUSTER);

      this.altClusterListDisabled = disabled;
    },

    /**
     * Determine if we should use an alternative cluster list which contains most recently created clusters
     *
     * Checks
     * - can view clusters
     * - if vai is on
     * - if alt list feature is on
     * - if cluster count exceeds threshold
     */
    isTooManyClusters(): boolean {
      if (!this.provClusterSchema || !this.canViewMgmtClusters) {
        return false;
      }

      const featureConfig = this.altClusterListFeature;

      if (!featureConfig || !featureConfig.enabled) { // vai is off, or feature is explicitly disabled
        return false;
      }

      const threshold = featureConfig.configuration?.threshold;

      if (threshold === undefined) { // invalid config
        return false;
      }

      const counts = this.$store.getters[`management/all`](COUNT)?.[0]?.counts || {};

      this.clusterCount = counts[CAPI.RANCHER_CLUSTER]?.summary.count;

      return this.clusterCount > threshold;
    },

    /**
     * Fetch clusters used to populate alt table
     */
    async initAltClusters() {
      const featureConfig = this.altClusterListFeature;
      const results = featureConfig?.configuration?.results || 50;

      // Fetch a limited number of provisioning clusters
      const opt1: ActionFindPageArgs = {
        pagination: {
          projectsOrNamespaces: [],
          filters:              paginationFilterClusters(this.$store, false),
          page:                 1,
          pageSize:             results, // We're fetching the total results... then paging locally
          sort:                 [{ field: 'metadata.creationTimestamp', asc: false }]
        },
        watch: false,
      };
      const provClusters = await this.$store.dispatch('management/findPage', { type: CAPI.RANCHER_CLUSTER, opt: opt1 });

      // Also fetch the management clusters associated with the provisioning clusters
      const opt2: ActionFindPageArgs = {
        pagination: new FilterArgs({
          filters: PaginationParamFilter.createMultipleFields(provClusters.map((r: any) => new PaginationFilterField({
            field: 'id',
            value: r.mgmtClusterId
          }))),
        }),
        watch: false,
      };

      await this.$store.dispatch(`management/findPage`, { type: MANAGEMENT.CLUSTER, opt: opt2 });

      this.altClusterListRows = provClusters;
    },
  }
});

</script>

<template>
  <div
    v-if="managementReady"
    class="home-page"
  >
    <TabTitle
      :show-child="false"
      :breadcrumb="false"
    >
      {{ `${vendor} - ${t('landing.homepage')}` }}
    </TabTitle>
    <BannerGraphic
      :title="t('landing.welcomeToRancher', {vendor})"
      :pref="HIDE_HOME_PAGE_CARDS"
      pref-key="welcomeBanner"
      data-testid="home-banner-graphic"
    />
    <DynamicContentBanner location="banner" />
    <IndentedPanel class="mt-20 mb-20">
      <div class="row home-panels">
        <div class="col main-panel">
          <div
            v-if="altClusterList !== undefined"
            class="row panel"
          >
            <div
              v-if="mcm && altClusterList"
              class="col span-12"
            >
              <ResourceTable
                :schema="provClusterSchema"
                :table-actions="false"
                :row-actions="false"
                key-field="id"

                :headers="vaiOnSettingsHeaders"
                defaultSortBy="age"

                :loading="!altClusterListRows"

                :rows="altClusterListRows || []"
                :rowsPerPage="altClusterListFeature?.configuration.pagesPerRow || 10"

                :namespaced="false"
                :groupable="false"
              >
                <template #header-left>
                  <div class="row table-heading">
                    <h1 class="mb-0">
                      {{ t('landing.clusters.title') }}
                    </h1>
                  </div>
                </template>
                <template #sub-header-row>
                  <h2 class="too-many-clusters">
                    {{ t('landing.clusters.tooMany.showingSome', { rows: altClusterListRows?.length || '...', total: clusterCount}) }}
                    <a @click="toggleAltClusterListDisabled(true)">{{ t('landing.clusters.tooMany.showAll') }}</a>
                  </h2>
                </template>
                <!--
                  Below is a big copy & paste from PaginatedResourceTable, however should be temporary (altClusterList removed in 2.14 once full SSP support for clusters if available)
                -->
                <template
                  v-if="canCreateCluster || !!provClusterSchema"
                  #header-middle
                >
                  <div class="table-heading">
                    <router-link
                      v-if="!!provClusterSchema"
                      :to="manageLocation"
                      class="btn btn-sm role-secondary"
                      data-testid="cluster-management-manage-button"
                      role="button"
                      :aria-label="t('cluster.manageAction')"
                      @keyup.space="$router.push(manageLocation)"
                    >
                      {{ t('cluster.manageAction') }}
                    </router-link>
                    <router-link
                      v-if="canCreateCluster"
                      :to="importLocation"
                      class="btn btn-sm role-primary"
                      data-testid="cluster-create-import-button"
                      role="button"
                      :aria-label="t('cluster.importAction')"
                      @keyup.space="$router.push(importLocation)"
                    >
                      {{ t('cluster.importAction') }}
                    </router-link>
                    <router-link
                      v-if="canCreateCluster"
                      :to="createLocation"
                      class="btn btn-sm role-primary"
                      data-testid="cluster-create-button"
                      role="button"
                      :aria-label="t('generic.create')"
                      @keyup.space="$router.push(createLocation)"
                    >
                      {{ t('generic.create') }}
                    </router-link>
                  </div>
                </template>
                <template #col:name="{row}">
                  <td class="col-name">
                    <div class="list-cluster-name">
                      <p
                        v-if="row.mgmt"
                        class="cluster-name"
                      >
                        <router-link
                          v-if="row.mgmt.isReady && !row.hasError"
                          :to="{ name: 'c-cluster-explorer', params: { cluster: row.mgmt.id }}"
                          role="link"
                          :aria-label="row.nameDisplay"
                        >
                          {{ row.nameDisplay }}
                        </router-link>
                        <span v-else>{{ row.nameDisplay }}</span>
                        <i
                          v-if="row.unavailableMachines"
                          v-clean-tooltip="row.unavailableMachines"
                          class="conditions-alert-icon icon-alert icon"
                        />
                        <i
                          v-if="row.isRke1"
                          v-clean-tooltip="t('cluster.rke1Unsupported')"
                          class="rke1-unsupported-icon icon-warning icon"
                        />
                      </p>
                      <p
                        v-if="row.description"
                        class="cluster-description"
                      >
                        {{ row.description }}
                      </p>
                    </div>
                  </td>
                </template>
                <template #col:kubernetesVersion="{row}">
                  <td class="col-name">
                    <span>
                      {{ row.kubernetesVersion }}
                    </span>
                    <div
                      v-clean-tooltip="{content: row.architecture.tooltip, placement: 'left'}"
                      class="text-muted"
                    >
                      {{ row.architecture.label }}
                    </div>
                  </td>
                </template>
                <template #col:cpu="{row}">
                  <td v-if="row.mgmt && cpuAllocatable(row.mgmt)">
                    {{ `${cpuAllocatable(row.mgmt)} ${t('landing.clusters.cores', {count:cpuAllocatable(row.mgmt) })}` }}
                  </td>
                  <td v-else>
                    &mdash;
                  </td>
                </template>
                <template #col:memory="{row}">
                  <td v-if="row.mgmt && memoryAllocatable(row.mgmt) && !memoryAllocatable(row.mgmt).match(/^0 [a-zA-z]/)">
                    {{ memoryAllocatable(row.mgmt) }}
                  </td>
                  <td v-else>
                    &mdash;
                  </td>
                </template>
                <!-- <template #cell:explorer="{row}">
                    <router-link v-if="row && row.isReady" class="btn btn-sm role-primary" :to="{name: 'c-cluster', params: {cluster: row.id}}">
                      {{ t('landing.clusters.explore') }}
                    </router-link>
                    <button v-else :disabled="true" class="btn btn-sm role-primary">
                      {{ t('landing.clusters.explore') }}
                    </button>
                  </template> -->
              </ResourceTable>
            </div>
            <div
              v-else-if="mcm"
              class="col span-12"
            >
              <PaginatedResourceTable
                v-if="provClusterSchema"
                :schema="provClusterSchema"
                :table-actions="false"
                :row-actions="false"
                key-field="id"
                :headers="headers"
                :pagination-headers="paginationHeaders"
                context="home"

                :local-filter="filterRowsLocal"
                :api-filter="filterRowsApi"

                :namespaced="false"
                :groupable="false"
                manualRefreshButtonSize="sm"
                :fetchSecondaryResources="fetchSecondaryResources"
                :fetchPageSecondaryResources="fetchPageSecondaryResources"
              >
                <template #header-left>
                  <div class="row table-heading">
                    <h1 class="mb-0">
                      {{ t('landing.clusters.title') }}
                    </h1>
                    <BadgeState
                      v-if="clusterCount && !tooManyClusters"
                      :label="clusterCount.toString()"
                      color="bg-info ml-20 mr-20"
                    />
                  </div>
                </template>
                <template
                  v-if="tooManyClusters"
                  #sub-header-row
                >
                  <h2 class="too-many-clusters">
                    {{ t('landing.clusters.tooMany.showingAll', { rows: altClusterListRows?.length || '...', total: clusterCount}) }}
                    <a @click="toggleAltClusterListDisabled(false)">{{ t('landing.clusters.tooMany.showSome') }}</a>
                  </h2>
                </template>
                <template
                  v-if="canCreateCluster || !!provClusterSchema"
                  #header-middle
                >
                  <div class="table-heading">
                    <router-link
                      v-if="!!provClusterSchema"
                      :to="manageLocation"
                      class="btn btn-sm role-secondary"
                      data-testid="cluster-management-manage-button"
                      role="button"
                      :aria-label="t('cluster.manageAction')"
                      @keyup.space="$router.push(manageLocation)"
                    >
                      {{ t('cluster.manageAction') }}
                    </router-link>
                    <router-link
                      v-if="canCreateCluster"
                      :to="importLocation"
                      class="btn btn-sm role-primary"
                      data-testid="cluster-create-import-button"
                      role="button"
                      :aria-label="t('cluster.importAction')"
                      @keyup.space="$router.push(importLocation)"
                    >
                      {{ t('cluster.importAction') }}
                    </router-link>
                    <router-link
                      v-if="canCreateCluster"
                      :to="createLocation"
                      class="btn btn-sm role-primary"
                      data-testid="cluster-create-button"
                      role="button"
                      :aria-label="t('generic.create')"
                      @keyup.space="$router.push(createLocation)"
                    >
                      {{ t('generic.create') }}
                    </router-link>
                  </div>
                </template>
                <template #col:name="{row}">
                  <td class="col-name">
                    <div class="list-cluster-name">
                      <p
                        v-if="row.mgmt"
                        class="cluster-name"
                      >
                        <router-link
                          v-if="row.mgmt.isReady && !row.hasError"
                          :to="{ name: 'c-cluster-explorer', params: { cluster: row.mgmt.id }}"
                          role="link"
                          :aria-label="row.nameDisplay"
                        >
                          {{ row.nameDisplay }}
                        </router-link>
                        <span v-else>{{ row.nameDisplay }}</span>
                        <i
                          v-if="row.unavailableMachines"
                          v-clean-tooltip="row.unavailableMachines"
                          class="conditions-alert-icon icon-alert icon"
                        />
                        <i
                          v-if="row.isRke1"
                          v-clean-tooltip="t('cluster.rke1Unsupported')"
                          class="rke1-unsupported-icon icon-warning icon"
                        />
                      </p>
                      <p
                        v-if="row.description"
                        class="cluster-description"
                      >
                        {{ row.description }}
                      </p>
                    </div>
                  </td>
                </template>
                <template #col:kubernetesVersion="{row}">
                  <td class="col-name">
                    <span>
                      {{ row.kubernetesVersion }}
                    </span>
                    <div
                      v-clean-tooltip="{content: row.architecture.tooltip, placement: 'left'}"
                      class="text-muted"
                    >
                      {{ row.architecture.label }}
                    </div>
                  </td>
                </template>
                <template #col:cpu="{row}">
                  <td v-if="row.mgmt && cpuAllocatable(row.mgmt)">
                    {{ `${cpuAllocatable(row.mgmt)} ${t('landing.clusters.cores', {count:cpuAllocatable(row.mgmt) })}` }}
                  </td>
                  <td v-else>
                    &mdash;
                  </td>
                </template>
                <template #col:memory="{row}">
                  <td v-if="row.mgmt && memoryAllocatable(row.mgmt) && !memoryAllocatable(row.mgmt).match(/^0 [a-zA-z]/)">
                    {{ memoryAllocatable(row.mgmt) }}
                  </td>
                  <td v-else>
                    &mdash;
                  </td>
                </template>
                <!-- <template #cell:explorer="{row}">
                  <router-link v-if="row && row.isReady" class="btn btn-sm role-primary" :to="{name: 'c-cluster', params: {cluster: row.id}}">
                    {{ t('landing.clusters.explore') }}
                  </router-link>
                  <button v-else :disabled="true" class="btn btn-sm role-primary">
                    {{ t('landing.clusters.explore') }}
                  </button>
                </template> -->
              </PaginatedResourceTable>
            </div>
            <div
              v-else
              class="col span-12"
            >
              <SingleClusterInfo />
            </div>
          </div>
        </div>
        <div class="col span-3 side-panel">
          <CommunityLinks />
          <DynamicContentPanel location="rhs" />
        </div>
      </div>
    </IndentedPanel>
  </div>
</template>

<style lang='scss' scoped>
  .banner-link:focus-visible {
    @include focus-outline;
  }

  .home-panels {
    display: flex;
    align-items: stretch;
    .col {
      margin: 0
    }
    .main-panel {
      flex: auto;

      .too-many-clusters {
        margin-bottom: 5px;

        a {
          cursor: pointer;
        }
      }
    }

    .side-panel {
      margin-left: 1.75%;
    }
  }

  .table-heading {
    align-items: center;
    display: flex;
    height: 39px;

    & > a {
      margin-left: 10px;
    }
  }
  .panel:not(:first-child) {
    margin-top: 20px;
  }
  .getting-started {
    align-items: flex-end;
    display: flex;

    > span {
      flex: 1;
      margin-right: 20px;
    }
  }
  .getting-started-btn {
    display: contents;
    white-space: nowrap;
  }

  .col-name {
    max-width: 280px;
  }

  .list-cluster-name {

    .cluster-name {
      display: flex;
      align-items: center;

      // Ensure long cluster names truncate with ellipsis
      > A, > span {
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .cluster-description {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--muted);
    }

    .conditions-alert-icon {
      color: var(--error);
      margin-left: 4px;
    }

    .rke1-unsupported-icon {
      color: var(--warning);
      margin-left: 4px;
    }
  }

  // Hide the side-panel showing links when the screen is small
  @media screen and (max-width: 996px) {
    .side-panel {
      display: none;
    }
  }
</style>

<style lang="scss">
.home-page {
  .search {
    align-items: center;
    display: flex;
    height: 39px;

    > INPUT {
      background-color: transparent;
      height: 30px;
      padding: 8px;
    }
  }

  h2 {
    font-size: 16px;
  }
}
</style>
