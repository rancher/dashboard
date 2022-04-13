<script>
import { mapPref, AFTER_LOGIN_ROUTE, READ_WHATS_NEW, HIDE_HOME_PAGE_CARDS } from '@shell/store/prefs';
import Banner from '@shell/components/Banner';
import BannerGraphic from '@shell/components/BannerGraphic';
import IndentedPanel from '@shell/components/IndentedPanel';
import SortableTable from '@shell/components/SortableTable';
import BadgeState from '@shell/components/BadgeState';
import CommunityLinks from '@shell/components/CommunityLinks';
import SimpleBox from '@shell/components/SimpleBox';
import SingleClusterInfo from '@shell/components/SingleClusterInfo';
import { mapGetters, mapState } from 'vuex';
import { MANAGEMENT, CAPI } from '@shell/config/types';
import { NAME as MANAGER } from '@shell/config/product/manager';
import { STATE } from '@shell/config/table-headers';
import { MODE, _IMPORT } from '@shell/config/query-params';
import { createMemoryFormat, formatSi, parseSi } from '@shell/utils/units';
import { getVersionInfo, readReleaseNotes, markReadReleaseNotes, markSeenReleaseNotes } from '@shell/utils/version';
import PageHeaderActions from '@shell/mixins/page-actions';
import { getVendor } from '@shell/config/private-label';
import { mapFeature, MULTI_CLUSTER } from '@shell/store/features';
import { SETTING } from '@shell/config/settings';
import { BLANK_CLUSTER } from '@shell/store';
import { filterOnlyKubernetesClusters } from '@shell/utils/cluster';

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
    SimpleBox,
    SingleClusterInfo
  },

  mixins: [PageHeaderActions],

  async fetch() {
    this.clusters = await this.$store.dispatch('management/findAll', {
      type: MANAGEMENT.CLUSTER,
      opt:  { url: MANAGEMENT.CLUSTER }
    });
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
      HIDE_HOME_PAGE_CARDS, clusters: [], fullVersion, pageActions, vendor: getVendor(),
    };
  },

  computed: {
    ...mapState(['managementReady']),
    ...mapGetters(['currentCluster']),
    mcm: mapFeature(MULTI_CLUSTER),

    canCreateCluster() {
      const schema = this.$store.getters['management/schemaFor'](CAPI.RANCHER_CLUSTER);

      return !!schema?.collectionMethods.find(x => x.toLowerCase() === 'post');
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

    showSidePanel() {
      return this.showCommercialSupport || this.showCommunityLinks;
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
        },
        {
          label: this.t('landing.clusters.provider'),
          value: 'status.provider',
          name:  'Provider',
          sort:  ['status.provider'],
        },
        {
          label: this.t('landing.clusters.kubernetesVersion'),
          value: 'kubernetesVersion',
          name:  'Kubernetes Version'
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
          label: this.t('tableHeaders.pods'),
          name:  'pods',
          value: '',
          sort:  ['status.allocatable.pods', 'status.available.pods']
        },
        // {
        //   name:  'explorer',
        //   label:  this.t('landing.clusters.explorer')
        // }
      ];
    },

    showCommercialSupport() {
      const canEditSettings = (this.$store.getters['management/schemaFor'](MANAGEMENT.SETTING)?.resourceMethods || []).includes('PUT');

      const hasSupport = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.SUPPORTED) || {};

      return !this.homePageCards.commercialSupportTip && hasSupport.value !== 'true' && canEditSettings;
    },

    showCommunityLinks() {
      const uiIssuesSetting = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.UI_ISSUES) || {};
      const communityLinksSetting = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.COMMUNITY_LINKS) || {};

      const hasSomethingToShow = communityLinksSetting?.value !== 'false' || !!( uiIssuesSetting.value && uiIssuesSetting.value !== '');
      const hiddenByPreference = this.homePageCards.communitySupportTip === true;

      return hasSomethingToShow && !hiddenByPreference;
    },

    ...mapGetters(['currentCluster', 'defaultClusterId']),

    kubeClusters() {
      return filterOnlyKubernetesClusters(this.clusters);
    }
  },

  async created() {
    // Update last visited on load
    await this.$store.dispatch('prefs/setLastVisited', { name: 'home' });
    markSeenReleaseNotes(this.$store);
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

    memoryUsed(cluster) {
      const parsedUsed = (parseSi(cluster.status.requested?.memory) || 0).toString();
      const format = createMemoryFormat(parsedUsed);

      return formatSi(parsedUsed, format);
    },

    memoryAllocatable(cluster) {
      const parsedAllocatable = (parseSi(cluster.status.allocatable?.memory) || 0).toString();
      const format = createMemoryFormat(parsedAllocatable);

      return formatSi(parsedAllocatable, format);
    },

    showWhatsNew() {
      // Update the value, so that the message goes away
      markReadReleaseNotes(this.$store);
      this.$router.push({ name: 'docs-doc', params: { doc: 'whats-new' } });
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
  <div v-if="managementReady" class="home-page">
    <BannerGraphic :small="true" :title="t('landing.welcomeToRancher', {vendor})" :pref="HIDE_HOME_PAGE_CARDS" pref-key="welcomeBanner" />
    <IndentedPanel class="mt-20 mb-20">
      <div v-if="!readWhatsNewAlready" class="row">
        <div class="col span-12">
          <Banner color="info whats-new">
            <div>{{ t('landing.seeWhatsNew') }}</div>
            <a class="hand" @click.prevent.stop="showWhatsNew"><span v-html="t('landing.whatsNewLink')" /></a>
          </Banner>
        </div>
      </div>

      <div class="row">
        <div :class="{'span-9': showSidePanel, 'span-12': !showSidePanel }" class="col">
          <SimpleBox
            id="migration"
            class="panel"
            :title="t('landing.gettingStarted.title')"
            :pref="HIDE_HOME_PAGE_CARDS"
            pref-key="migrationTip"
          >
            <div class="getting-started">
              <span>
                {{ t('landing.gettingStarted.body') }}
              </span>
              <nuxt-link :to="{name: 'docs-doc', params: {doc: 'getting-started'}}" class="getting-started-btn">
                {{ t('landing.learnMore') }}
              </nuxt-link>
            </div>
          </SimpleBox>

          <div v-if="!showSetLoginBanner" class="mt-5 mb-10 row">
            <div class="col span-12">
              <Banner color="set-login-page" :closable="true" @close="closeSetLoginBanner()">
                <div>{{ t('landing.landingPrefs.title') }}</div>
                <a class="hand mr-20" @click.prevent.stop="showUserPrefs"><span v-html="t('landing.landingPrefs.userPrefs')" /></a>
              </Banner>
            </div>
          </div>

          <div class="row panel">
            <div v-if="mcm" class="col span-12">
              <SortableTable :table-actions="false" :row-actions="false" key-field="id" :rows="kubeClusters" :headers="clusterHeaders">
                <template #header-left>
                  <div class="row table-heading">
                    <h2 class="mb-0">
                      {{ t('landing.clusters.title') }}
                    </h2>
                    <BadgeState :label="clusters.length.toString()" color="role-tertiary ml-20 mr-20" />
                  </div>
                </template>
                <template v-if="canCreateCluster" #header-middle>
                  <n-link
                    :to="importLocation"
                    class="btn btn-sm role-primary"
                  >
                    {{ t('cluster.importAction') }}
                  </n-link>
                  <n-link
                    :to="createLocation"
                    class="btn btn-sm role-primary"
                  >
                    {{ t('generic.create') }}
                  </n-link>
                </template>
                <template #col:name="{row}">
                  <td>
                    <span>
                      <n-link v-if="row.isReady" :to="{ name: 'c-cluster-explorer', params: { cluster: row.id }}">
                        {{ row.nameDisplay }}
                      </n-link>
                      <span v-else>{{ row.nameDisplay }}</span>
                    </span>
                  </td>
                </template>
                <template #col:cpu="{row}">
                  <td v-if="cpuAllocatable(row)">
                    {{ `${cpuUsed(row)}/${cpuAllocatable(row)} ${t('landing.clusters.cores', {count:cpuAllocatable(row) })}` }}
                  </td>
                  <td v-else>
                    &mdash;
                  </td>
                </template>
                <template #col:memory="{row}">
                  <td v-if="memoryAllocatable(row) && !memoryAllocatable(row).match(/^0 [a-zA-z]/)">
                    {{ `${memoryUsed(row)}/${memoryAllocatable(row)}` }}
                  </td>
                  <td v-else>
                    &mdash;
                  </td>
                </template>
                <template #col:pods="{row}">
                  <td v-if="row.status.allocatable && row.status.allocatable.pods!== '0'">
                    {{ `${row.status.requested.pods}/${row.status.allocatable.pods}` }}
                  </td>
                  <td v-else>
                    &mdash;
                  </td>
                </template>
                <!-- <template #cell:explorer="{row}">
                  <n-link v-if="row && row.isReady" class="btn btn-sm role-primary" :to="{name: 'c-cluster', params: {cluster: row.id}}">
                    {{ t('landing.clusters.explore') }}
                  </n-link>
                  <button v-else :disabled="true" class="btn btn-sm role-primary">
                    {{ t('landing.clusters.explore') }}
                  </button>
                </template> -->
              </SortableTable>
            </div>
            <div v-else class="col span-12">
              <SingleClusterInfo />
            </div>
          </div>
        </div>
        <div v-if="showSidePanel" class="col span-3">
          <CommunityLinks v-if="showCommunityLinks" :pref="HIDE_HOME_PAGE_CARDS" pref-key="communitySupportTip" class="mb-20" />
          <SimpleBox v-if="showCommercialSupport" :pref="HIDE_HOME_PAGE_CARDS" pref-key="commercialSupportTip" :title="t('landing.commercial.title')">
            <nuxt-link :to="{ path: 'support'}">
              {{ t('landing.commercial.body') }}
            </nuxt-link>
          </SimpleBox>
        </div>
      </div>
    </IndentedPanel>
  </div>
</template>
<style lang='scss' scoped>
  .banner.info.whats-new, .banner.set-login-page {
    border: 0;
    margin-top: 10px;
    display: flex;
    align-items: center;
    flex-direction: row;
    > div {
      flex: 1;
    }
    > a {
      align-self: flex-end;
    }
  }
  .banner.set-login-page {
    border: 1px solid var(--border);
  }
  .table-heading {
    align-items: center;
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
</style>
<style lang="scss">
.home-page {
  .search > INPUT {
    background-color: transparent;
    padding: 8px;
  }

  h2 {
    font-size: 16px;
  }
}
</style>
