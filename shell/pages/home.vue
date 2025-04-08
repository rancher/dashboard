<script lang="ts">
import { defineComponent } from 'vue';
import { mapPref, AFTER_LOGIN_ROUTE, READ_WHATS_NEW, HIDE_HOME_PAGE_CARDS } from '@shell/store/prefs';
import { Banner } from '@components/Banner';
import BannerGraphic from '@shell/components/BannerGraphic.vue';
import IndentedPanel from '@shell/components/IndentedPanel.vue';
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable.vue';
import { BadgeState } from '@components/BadgeState';
import CommunityLinks from '@shell/components/CommunityLinks.vue';
import SingleClusterInfo from '@shell/components/SingleClusterInfo.vue';
import { mapGetters, mapState } from 'vuex';
import { MANAGEMENT, CAPI } from '@shell/config/types';
import { NAME as MANAGER } from '@shell/config/product/manager';
import { STATE } from '@shell/config/table-headers';
import { MODE, _IMPORT } from '@shell/config/query-params';
import { createMemoryFormat, formatSi, parseSi, createMemoryValues } from '@shell/utils/units';
import { getVersionInfo, readReleaseNotes, markReadReleaseNotes, markSeenReleaseNotes } from '@shell/utils/version';
import PageHeaderActions from '@shell/mixins/page-actions';
import { getVendor } from '@shell/config/private-label';
import { mapFeature, MULTI_CLUSTER } from '@shell/store/features';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import { filterHiddenLocalCluster, filterOnlyKubernetesClusters, paginationFilterClusters } from '@shell/utils/cluster';
import TabTitle from '@shell/components/TabTitle.vue';
import { ActionFindPageArgs } from '@shell/types/store/dashboard-store.types';

import { RESET_CARDS_ACTION, SET_LOGIN_ACTION, SHOW_HIDE_BANNER_ACTION } from '@shell/config/page-actions';
import { STEVE_NAME_COL, STEVE_STATE_COL } from '@shell/config/pagination-table-headers';
import { PaginationParamFilter, FilterArgs, PaginationFilterField, PaginationArgs } from '@shell/types/store/pagination.types';
import ProvCluster from '@shell/models/provisioning.cattle.io.cluster';
import { sameContents } from '@shell/utils/array';
import { PagTableFetchPageSecondaryResourcesOpts, PagTableFetchSecondaryResourcesOpts, PagTableFetchSecondaryResourcesReturns } from '@shell/types/components/paginatedResourceTable';
import { CURRENT_RANCHER_VERSION } from '@shell/config/version';
import { CAPI as CAPI_LAB_AND_ANO } from '@shell/config/labels-annotations';

export default defineComponent({
  name:       'Home',
  layout:     'home',
  components: {
    Banner,
    BannerGraphic,
    IndentedPanel,
    PaginatedResourceTable,
    BadgeState,
    CommunityLinks,
    SingleClusterInfo,
    TabTitle,
  },

  mixins: [PageHeaderActions],

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
      fullVersion: getVersionInfo(this.$store).fullVersion,
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
        {
          label:  this.t('nav.header.restoreCards'),
          action: RESET_CARDS_ACTION
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

      CURRENT_RANCHER_VERSION
    };
  },

  computed: {
    ...mapState(['managementReady']),
    ...mapGetters(['currentCluster', 'defaultClusterId', 'releaseNotesUrl']),
    mcm: mapFeature(MULTI_CLUSTER),

    canCreateCluster() {
      return !!this.provClusterSchema?.collectionMethods.find((x: string) => x.toLowerCase() === 'post');
    },

    afterLoginRoute: mapPref(AFTER_LOGIN_ROUTE),
    homePageCards:   mapPref(HIDE_HOME_PAGE_CARDS),

    readWhatsNewAlready() {
      return readReleaseNotes(this.$store);
    },

    showSetLoginBanner() {
      return this.homePageCards?.setLoginPage;
    },
  },

  async created() {
    // Update last visited on load
    await this.$store.dispatch('prefs/setLastVisited', { name: 'home' });
    markSeenReleaseNotes(this.$store);
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

      if ( this.canViewMgmtClusters ) {
        this.$store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER });
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

      return Promise.resolve({});
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
      case RESET_CARDS_ACTION:
        this.resetCards();
        break;

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

    showWhatsNew() {
      // Update the value, so that the message goes away
      markReadReleaseNotes(this.$store);
    },

    showUserPrefs() {
      this.$router.push({ name: 'prefs' });
    },

    async resetCards() {
      const value = this.$store.getters['prefs/get'](HIDE_HOME_PAGE_CARDS) || {};

      delete value.setLoginPage;

      await this.$store.dispatch('prefs/set', { key: HIDE_HOME_PAGE_CARDS, value });

      await this.$store.dispatch('prefs/set', { key: READ_WHATS_NEW, value: '' });
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

    async closeSetLoginBanner(retry = 0) {
      let value = this.$store.getters['prefs/get'](HIDE_HOME_PAGE_CARDS);

      if (value === true || value === false || value.length > 0) {
        value = {};
      }
      value.setLoginPage = true;

      const res = await this.$store.dispatch('prefs/set', { key: HIDE_HOME_PAGE_CARDS, value });

      if (retry === 0 && res?.type === 'error' && res?.status === 500) {
        await this.closeSetLoginBanner(retry + 1);
      }
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
    }
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
      {{ vendor }}
    </TabTitle>
    <BannerGraphic
      :small="true"
      :title="t('landing.welcomeToRancher', {vendor})"
      :pref="HIDE_HOME_PAGE_CARDS"
      pref-key="welcomeBanner"
      data-testid="home-banner-graphic"
    />
    <IndentedPanel class="mt-20 mb-20">
      <div
        v-if="!readWhatsNewAlready"
        class="row"
      >
        <div class="col span-12">
          <Banner
            data-testid="changelog-banner"
            color="info whats-new"
          >
            <div>
              {{ t('landing.seeWhatsNew', { version: CURRENT_RANCHER_VERSION }) }}
            </div>
            <a
              class="hand banner-link"
              :href="releaseNotesUrl"
              role="link"
              target="_blank"
              rel="noopener noreferrer nofollow"
              :aria-label="t('landing.whatsNewLink', { version: CURRENT_RANCHER_VERSION })"
              @click.stop="showWhatsNew"
              @keyup.stop.enter="showWhatsNew"
            ><span v-clean-html="t('landing.whatsNewLink', { version: CURRENT_RANCHER_VERSION })" /></a>
          </Banner>
        </div>
      </div>
      <div class="row home-panels">
        <div class="col main-panel">
          <div
            v-if="!showSetLoginBanner"
            class="mb-10 row"
          >
            <div class="col span-12">
              <Banner
                color="set-login-page mt-0"
                data-testid="set-login-page-banner"
                :closable="true"
                @close="closeSetLoginBanner()"
              >
                <div>
                  {{ t('landing.landingPrefs.title') }}
                </div>
                <a
                  class="hand mr-20"
                  tabindex="0"
                  :aria-label="t('landing.landingPrefs.userPrefs')"
                  @click.prevent.stop="showUserPrefs"
                  @keyup.prevent.stop.enter="showUserPrefs"
                  @keyup.prevent.stop.space="showUserPrefs"
                ><span v-clean-html="t('landing.landingPrefs.userPrefs')" /></a>
              </Banner>
            </div>
          </div>
          <div class="row panel">
            <div
              v-if="mcm"
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
                    <h2 class="mb-0">
                      {{ t('landing.clusters.title') }}
                    </h2>
                    <BadgeState
                      v-if="clusterCount"
                      :label="clusterCount.toString()"
                      color="role-tertiary ml-20 mr-20"
                    />
                  </div>
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
        <CommunityLinks class="col span-3 side-panel" />
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
    }

    .side-panel {
      margin-left: 1.75%;
    }
  }

  .set-login-page, .whats-new {
    > :deep() .banner__content {
      display: flex;

      > div {
        flex: 1;
      }
      > a {
        align-self: flex-end;
      }
    }
  }

  .banner.set-login-page {
    border: 1px solid var(--border);
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
