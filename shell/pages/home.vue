<script>
import { mapPref, AFTER_LOGIN_ROUTE, READ_WHATS_NEW, HIDE_HOME_PAGE_CARDS } from '@shell/store/prefs';
import { Banner } from '@components/Banner';
import BannerGraphic from '@shell/components/BannerGraphic';
import IndentedPanel from '@shell/components/IndentedPanel';
import SortableTable from '@shell/components/SortableTable';
import { BadgeState } from '@components/BadgeState';
import CommunityLinks from '@shell/components/CommunityLinks';
import SingleClusterInfo from '@shell/components/SingleClusterInfo';
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
import { filterOnlyKubernetesClusters, filterHiddenLocalCluster } from '@shell/utils/cluster';
import TabTitle from '@shell/components/TabTitle';

import { RESET_CARDS_ACTION, SET_LOGIN_ACTION } from '@shell/config/page-actions';

export default {
  name:       'Home',
  layout:     'home',
  components: {
    Banner,
    BannerGraphic,
    IndentedPanel,
    SortableTable,
    BadgeState,
    CommunityLinks,
    SingleClusterInfo,
    TabTitle
  },

  mixins: [PageHeaderActions],

  fetch() {
    if ( this.$store.getters['management/schemaFor'](CAPI.RANCHER_CLUSTER) ) {
      this.$store.dispatch('management/findAll', { type: CAPI.RANCHER_CLUSTER });
    }

    if ( this.$store.getters['management/schemaFor'](MANAGEMENT.CLUSTER) ) {
      this.$store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER });
    }

    if ( this.$store.getters['management/canList'](CAPI.MACHINE) ) {
      this.$store.dispatch('management/findAll', { type: CAPI.MACHINE });
    }

    if ( this.$store.getters['management/canList'](MANAGEMENT.NODE) ) {
      this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE });
    }

    // We need to fetch node pools and node templates in order to correctly show the provider for RKE1 clusters
    if ( this.$store.getters['management/canList'](MANAGEMENT.NODE_POOL) ) {
      this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_POOL });
    }

    if ( this.$store.getters['management/canList'](MANAGEMENT.NODE_TEMPLATE) ) {
      this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_TEMPLATE });
    }
  },

  data() {
    const fullVersion = getVersionInfo(this.$store).fullVersion;
    // Page actions don't change on the Home Page
    const pageActions = [
      {
        labelKey: 'nav.header.setLoginPage',
        action:   SET_LOGIN_ACTION
      },
      { separator: true },
      {
        labelKey: 'nav.header.restoreCards',
        action:   RESET_CARDS_ACTION
      },
    ];

    return {
      HIDE_HOME_PAGE_CARDS, fullVersion, pageActions, vendor: getVendor(),
    };
  },

  computed: {
    ...mapState(['managementReady']),
    ...mapGetters(['currentCluster', 'defaultClusterId', 'releaseNotesUrl']),
    mcm: mapFeature(MULTI_CLUSTER),

    mgmtClusters() {
      return this.$store.getters['management/all'](MANAGEMENT.CLUSTER);
    },

    provClusters() {
      return this.$store.getters['management/all'](CAPI.RANCHER_CLUSTER);
    },

    // User can go to Cluster Management if they can see the cluster schema
    canManageClusters() {
      const schema = this.$store.getters['management/schemaFor'](CAPI.RANCHER_CLUSTER);

      return !!schema;
    },

    canCreateCluster() {
      const schema = this.$store.getters['management/schemaFor'](CAPI.RANCHER_CLUSTER);

      return !!schema?.collectionMethods.find((x) => x.toLowerCase() === 'post');
    },

    manageLocation() {
      return {
        name:   'c-cluster-product-resource',
        params: {
          product:  MANAGER,
          cluster:  BLANK_CLUSTER,
          resource: CAPI.RANCHER_CLUSTER
        },
      };
    },

    createLocation() {
      return {
        name:   'c-cluster-product-resource-create',
        params: {
          product:  MANAGER,
          cluster:  BLANK_CLUSTER,
          resource: CAPI.RANCHER_CLUSTER
        },
      };
    },

    importLocation() {
      return {
        name:   'c-cluster-product-resource-create',
        params: {
          product:  MANAGER,
          cluster:  BLANK_CLUSTER,
          resource: CAPI.RANCHER_CLUSTER
        },
        query: { [MODE]: _IMPORT }
      };
    },

    afterLoginRoute: mapPref(AFTER_LOGIN_ROUTE),
    homePageCards:   mapPref(HIDE_HOME_PAGE_CARDS),

    readWhatsNewAlready() {
      return readReleaseNotes(this.$store);
    },

    showSetLoginBanner() {
      return this.homePageCards?.setLoginPage;
    },

    clusterHeaders() {
      return [
        STATE,
        {
          name:          'name',
          labelKey:      'tableHeaders.name',
          value:         'nameDisplay',
          sort:          ['nameSort'],
          canBeVariable: true,
          getValue:      (row) => row.mgmt?.nameDisplay
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
      ];
    },

    kubeClusters() {
      const filteredClusters = filterHiddenLocalCluster(filterOnlyKubernetesClusters(this.provClusters || [], this.$store), this.$store);

      return filteredClusters.map((provCluster) => {
        const mgmtCluster = this.mgmtClusters?.find((c) => provCluster.mgmt?.id === c.id);

        provCluster.description = provCluster.description || mgmtCluster?.description;

        return provCluster;
      });
    }
  },

  async created() {
    // Update last visited on load
    await this.$store.dispatch('prefs/setLastVisited', { name: 'home' });
    markSeenReleaseNotes(this.$store);
  },

  // Forget the types when we leave the page
  beforeDestroy() {
    this.$store.dispatch('management/forgetType', CAPI.MACHINE);
    this.$store.dispatch('management/forgetType', MANAGEMENT.NODE);
    this.$store.dispatch('management/forgetType', MANAGEMENT.NODE_POOL);
    this.$store.dispatch('management/forgetType', MANAGEMENT.NODE_TEMPLATE);
  },

  methods: {
    /**
     * Define actions for each navigation link
     * @param {*} action
     */
    handlePageAction(action) {
      switch (action.action) {
      case RESET_CARDS_ACTION:
        this.resetCards();
        break;

      case SET_LOGIN_ACTION:
        this.afterLoginRoute = 'home';
        break;

      // no default
      }
    },

    cpuUsed(cluster) {
      return parseSi(cluster.status.requested?.cpu);
    },

    cpuAllocatable(cluster) {
      return parseSi(cluster.status.allocatable?.cpu);
    },
    memoryAllocatable(cluster) {
      const parsedAllocatable = (parseSi(cluster.status.allocatable?.memory) || 0).toString();
      const format = createMemoryFormat(parsedAllocatable);

      return formatSi(parsedAllocatable, format);
    },

    memoryReserved(cluster) {
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
      await this.$store.dispatch('prefs/set', { key: HIDE_HOME_PAGE_CARDS, value: {} });
      await this.$store.dispatch('prefs/set', { key: READ_WHATS_NEW, value: '' });
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
    }
  }
};

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
              {{ t('landing.seeWhatsNew') }}
            </div>
            <a
              class="hand"
              :href="releaseNotesUrl"
              target="_blank"
              rel="noopener noreferrer nofollow"
              @click.stop="showWhatsNew"
            ><span v-clean-html="t('landing.whatsNewLink')" /></a>
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
                  @click.prevent.stop="showUserPrefs"
                ><span v-clean-html="t('landing.landingPrefs.userPrefs')" /></a>
              </Banner>
            </div>
          </div>
          <div class="row panel">
            <div
              v-if="mcm"
              class="col span-12"
            >
              <SortableTable
                :table-actions="false"
                :row-actions="false"
                key-field="id"
                :rows="kubeClusters"
                :headers="clusterHeaders"
                :loading="!kubeClusters"
              >
                <template #header-left>
                  <div class="row table-heading">
                    <h2 class="mb-0">
                      {{ t('landing.clusters.title') }}
                    </h2>
                    <BadgeState
                      v-if="kubeClusters"
                      :label="kubeClusters.length.toString()"
                      color="role-tertiary ml-20 mr-20"
                    />
                  </div>
                </template>
                <template
                  v-if="canCreateCluster || canManageClusters"
                  #header-middle
                >
                  <div class="table-heading">
                    <router-link
                      v-if="canManageClusters"
                      :to="manageLocation"
                      class="btn btn-sm role-secondary"
                      data-testid="cluster-management-manage-button"
                    >
                      {{ t('cluster.manageAction') }}
                    </router-link>
                    <router-link
                      v-if="canCreateCluster"
                      :to="importLocation"
                      class="btn btn-sm role-primary"
                      data-testid="cluster-create-import-button"
                    >
                      {{ t('cluster.importAction') }}
                    </router-link>
                    <router-link
                      v-if="canCreateCluster"
                      :to="createLocation"
                      class="btn btn-sm role-primary"
                      data-testid="cluster-create-button"
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
              </SortableTable>
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
    > ::v-deep .banner__content {
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
