<script>
import { mapPref, AFTER_LOGIN_ROUTE, SEEN_WHATS_NEW, HIDE_HOME_PAGE_CARDS } from '@/store/prefs';
import Banner from '@/components/Banner';
import BannerGraphic from '@/components/BannerGraphic';
import IndentedPanel from '@/components/IndentedPanel';
import RadioGroup from '@/components/form/RadioGroup';
import RadioButton from '@/components/form/RadioButton';
import SortableTable from '@/components/SortableTable';
import BadgeState from '@/components/BadgeState';
import CommunityLinks from '@/components/CommunityLinks';
import SimpleBox from '@/components/SimpleBox';
import { mapGetters } from 'vuex';
import { MANAGEMENT } from '@/config/types';
import { STATE } from '@/config/table-headers';
import { createMemoryFormat, formatSi, parseSi } from '@/utils/units';
import { compare } from '@/utils/version';

export default {
  name:       'Home',
  layout:     'home',
  components: {
    Banner,
    BannerGraphic,
    IndentedPanel,
    RadioGroup,
    RadioButton,
    SortableTable,
    BadgeState,
    CommunityLinks,
    SimpleBox
  },

  async fetch() {
    this.clusters = await this.$store.dispatch('management/findAll', {
      type: MANAGEMENT.CLUSTER,
      opt:  { url: MANAGEMENT.CLUSTER }
    });

    const lastSeenNew = this.$store.getters['prefs/get'](SEEN_WHATS_NEW) ;
    const setting = this.$store.getters['management/byId'](MANAGEMENT.SETTING, 'server-version');
    const fullVersion = setting?.value || 'unknown';

    this.seenWhatsNewAlready = compare(lastSeenNew, fullVersion) >= 0 && !!lastSeenNew;

    // Hide the release notes message - maybe use a close box instead?
    await this.$store.dispatch('prefs/set', { key: SEEN_WHATS_NEW, value: fullVersion });
  },

  data() {
    return {
      HIDE_HOME_PAGE_CARDS, clusters: [], seenWhatsNewAlready: false
    };
  },

  computed: {
    afterLoginRoute: mapPref(AFTER_LOGIN_ROUTE),
    homePageCards:   mapPref(HIDE_HOME_PAGE_CARDS),

    showSidePanel() {
      return !(this.homePageCards.commercialSupportTip && this.homePageCards.communitySupportTip);
    },

    routeFromDropdown: {
      get() {
        if (this.afterLoginRoute !== 'home' && this.afterLoginRoute !== 'last-visited') {
          const out = (this.routeDropdownOptions.filter(opt => opt.value === this.afterLoginRoute) || [])[0];

          return out;
        }

        return this.routeDropdownOptions[0];
      },
      set(neu) {
        this.afterLoginRoute = neu.value;
      }
    },

    routeRadioOptions() {
      return [
        {
          label: this.t('landing.landingPrefs.options.thisScreen'),
          value: 'home'
        },
        {
          label: this.t('landing.landingPrefs.options.lastVisited'),
          value: 'last-visited'
        },
        {
          label: this.t('landing.landingPrefs.options.custom'),
          value: 'dropdown'
        }
      ];
    },

    routeDropdownOptions() {
      const out = [
        {
          label: this.t('landing.landingPrefs.options.appsAndMarketplace'),
          value: 'apps'
        },
        {
          label: this.t('landing.landingPrefs.options.defaultOverview', { cluster: this.defaultClusterId }),
          value: `${ this.defaultClusterId }-dashboard`
        }
      ];

      out.push( );

      return out;
    },

    clusterHeaders() {
      return [
        STATE,
        {
          name:  'name',
          label: 'Name',
          value: 'nameDisplay',
          sort:  ['nameDisplay']
        },
        {
          label: 'Provider',
          value: 'status.provider',
          name:  'Provider'
        },
        {
          label: 'Kubernetes Version',
          value: 'kubernetesVersion',
          name:  'Kubernetes Version'
        },
        {
          label: 'CPU',
          value: '',
          name:  'cpu',
          sort:  ['status.allocatable.cpu', 'status.available.cpu']

        },
        {
          label: 'Memory',
          value: '',
          name:  'memory',
          sort:  ['status.allocatable.memory', 'status.available.memory']

        },
        {
          name:  'pods',
          label: 'Pods',
          value: '',
          sort:  ['status.allocatable.pods', 'status.available.pods']
        }
      ];
    },

    ...mapGetters(['currentCluster', 'defaultClusterId'])
  },

  methods: {
    updateLoginRoute(neu) {
      if (neu) {
        this.afterLoginRoute = neu;
      } else {
        this.afterLoginRoute = this.routeFromDropdown?.value;
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
      this.$router.push({ name: 'release-notes' });
    },
  }
};

</script>
<template>
  <div class="home-page">
    <BannerGraphic :small="true" :title="t('landing.welcomeToRancher')" :pref="HIDE_HOME_PAGE_CARDS" pref-key="welcomeBanner" />
    <IndentedPanel class="mt-20">
      <div v-if="!seenWhatsNewAlready" class="row">
        <div class="col span-12">
          <Banner color="info whats-new">
            <div>{{ t('landing.seeWhatsNew') }}</div>
            <a class="hand" @click.prevent.stop="showWhatsNew"><span v-html="t('landing.whatsNewLink')" /></a>
          </Banner>
        </div>
      </div>
      <div class="row">
        <div :class="{'span-9': showSidePanel, 'span-12': !showSidePanel }" class="col">
          <SimpleBox v-if="false" :title="t('landing.landingPrefs.title')" :pref="HIDE_HOME_PAGE_CARDS" pref-key="setLoginPage" class="panel">
            <RadioGroup id="login-route" :value="afterLoginRoute" name="login-route" :options="routeRadioOptions" @input="updateLoginRoute">
              <template #2="{option, listeners}">
                <div class="row">
                  <div class="col">
                    <RadioButton :label="option.label" :val="false" :value="afterLoginRoute=== 'home' || afterLoginRoute === 'last-visited'" v-on="listeners" />
                  </div>
                  <div class="col span-6">
                    <v-select v-model="routeFromDropdown" :clearable="false" :options="routeDropdownOptions" />
                  </div>
                </div>
              </template>
            </RadioGroup>
          </SimpleBox>
          <SimpleBox
            id="migration"
            class="panel"
            :title="t('landing.migration.title')"
            :pref="HIDE_HOME_PAGE_CARDS"
            pref-key="migrationTip"
          >
            {{ t('landing.migration.body') }}
            <br />
            <!-- Unhide this when docs are added -->
            <a class="hide pull-right" href="#">{{ t('landing.learnMore') }}</a>
          </SimpleBox>
          <div class="row panel">
            <div class="col span-12">
              <SortableTable :table-actions="false" :row-actions="false" key-field="id" :rows="clusters" :headers="clusterHeaders">
                <template #title>
                  <div class="row pb-20 table-heading">
                    <h2 class="mb-0">
                      {{ t('landing.clusters') }}
                    </h2>
                    <BadgeState :label="clusters.length.toString()" color="role-tertiary ml-20 mr-20" />
                  </div>
                </template>
                <template #col:name="{row}">
                  <td>
                    <nuxt-link :to="{name:'c-cluster-explorer', params: {product: 'explorer', cluster: row.id}}">
                      {{ row.nameDisplay }}
                    </nuxt-link>
                  </td>
                </template>
                <template #col:cpu="{row}">
                  <td v-if="cpuAllocatable(row)">
                    {{ `${cpuUsed(row)}/${cpuAllocatable(row)} cores` }}
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
                  <td v-if="row.status.allocatable.pods && row.status.allocatable.pods!== '0'">
                    {{ `${row.status.requested.pods}/${row.status.allocatable.pods}` }}
                  </td>
                  <td v-else>
                    &mdash;
                  </td>
                </template>
              </SortableTable>
            </div>
          </div>
        </div>
        <div v-if="showSidePanel" class="col span-3">
          <CommunityLinks :pref="HIDE_HOME_PAGE_CARDS" pref-key="communitySupportTip" class="mb-20" />
          <SimpleBox :pref="HIDE_HOME_PAGE_CARDS" pref-key="commercialSupportTip" :title="t('landing.commercial.title')">
            <span v-html="t('landing.commercial.body', {}, true)" />
          </SimpleBox>
        </div>
      </div>
    </IndentedPanel>
  </div>
</template>
<style lang='scss' scoped>
  .banner.info.whats-new {
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
  .table-heading {
    align-items: center;
  }
  .panel:not(:first-child) {
    margin-top: 20px;
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
