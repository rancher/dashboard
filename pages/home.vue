<script>
import { mapPref, AFTER_LOGIN_ROUTE, SEEN_WHATS_NEW, SHOW_LANDING_TIPS } from '@/store/prefs';
import RadioGroup from '@/components/form/RadioGroup';
import RadioButton from '@/components/form/RadioButton';
import SortableTable from '@/components/SortableTable';
import Banner from '@/components/Banner';
import BadgeState from '@/components/BadgeState';
import CommunityLinks from '@/components/CommunityLinks';
import { mapGetters } from 'vuex';
import { MANAGEMENT } from '@/config/types';
import { STATE } from '@/config/table-headers';
import { createMemoryFormat, formatSi, parseSi } from '@/utils/units';
import { compare, isDevBuild } from '@/utils/version';

export default {
  name:            'Home',
  layout:          'default',
  components:      {
    RadioGroup,
    RadioButton,
    SortableTable,
    Banner,
    BadgeState,
    CommunityLinks
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
    this.isDev = isDevBuild(fullVersion);

    // if (!this.isDev) {
    await this.$store.dispatch('prefs/set', { key: SEEN_WHATS_NEW, value: fullVersion });
    // re-show migration, community, commercial help boxes on upgrade
    if (!this.seenWhatsNewAlready) {
      this.$store.dispatch('prefs/set', {
        key:   SHOW_LANDING_TIPS,
        value: {
          migration: true, community: true, commercial: true
        }
      });
    }
    // }
  },

  data() {
    return {
      clusters: [], seenWhatsNewAlready: false, isDev: false,
    };
  },

  computed:   {
    afterLoginRoute: mapPref(AFTER_LOGIN_ROUTE),
    showLandingTips: mapPref(SHOW_LANDING_TIPS),

    showMigration: {
      get() {
        return this.showLandingTips.migration;
      },
      set(neu) {
        this.showLandingTips = { ...this.showLandingTips, migration: neu };
      }
    },

    showCommunity: {
      get() {
        return this.showLandingTips.community;
      },
      set(neu) {
        this.showLandingTips = { ...this.showLandingTips, community: neu };
      }
    },

    showCommercial: {
      get() {
        return this.showLandingTips.commercial;
      },
      set(neu) {
        this.showLandingTips = { ...this.showLandingTips, commercial: neu };
      }
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

  watch: {},

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
    }
  }
};
</script>

<template>
  <form>
    <div id="title-banner">
      <img class="mb-20" src="~/assets/images/pl/farm-banner.svg" />
      <h2>{{ t('landing.welcomeToRancher') }}</h2>
    </div>
    <div v-if="!seenWhatsNewAlready" class="row">
      <div class="col span-12">
        <Banner color="info">
          {{ t('landing.seeWhatsNew') }}
          <a @click.prevent.stop="showWhatsNew"><span v-html="t('landing.whatsNewLink')" /></a>
        </Banner>
      </div>
    </div>
    <div class="row">
      <div :class="{'span-10':showCommercial || showCommunity, 'span-12': !showCommercial && !showCommunity }" class="col">
        <div class="row mb-20">
          <div class="col span-6">
            <div class="box">
              <h2>{{ t('landing.landingPrefs.title') }}</h2>

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
            </div>
          </div>
          <div class="col span-6">
            <div
              v-if="showMigration"
              id="migration"
              class="box"
              closeable
              title="Migration Assistance"
            >
              <h2>{{ t('landing.migration.title') }}</h2>
              <button type="button" class="role-link" @click="showMigration = false">
                <i class="icon icon-x icon-lg text-primary" />
              </button>
              <div>
                {{ t('landing.migration.body') }}
                <br />
                <a class="pull-right" href="#">Learn More</a>
              </div>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col span-12">
            <SortableTable :table-actions="false" :row-actions="false" key-field="id" :rows="clusters" :headers="clusterHeaders">
              <template #title>
                <div class="row pb-20">
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
      <div v-if="showCommercial || showCommunity" class="col span-2">
        <CommunityLinks v-if="showCommunity" can-close class="mb-20" @close="showCommunity = false" />
        <div v-if="showCommercial" class="box">
          <h2>{{ t('landing.commercial.title') }}</h2>
          <button type="button" class="role-link" @click="showCommercial = false">
            <i class="icon icon-x icon-lg text-primary" />
          </button>
          <div>
            <span v-html="t('landing.commercial.body', {}, true)" />
          </div>
        </div>
      </div>
    </div>
  </form>
</template>

<style lang='scss'>
#login-route .radio-group{
    padding: 5px;
    &>DIV {
        margin: 5px;
    }
}

.release-notes .v--modal-box.v--modal {
  padding: 20px 40px 20px 40px;
}

#migration {
  height: 100%;
  position: relative;
  & A {
    position: absolute;
    bottom: 15px;
    right: 15px
  }
}

#title-banner {
  position: relative;
  text-align: center;
  &>h2{
    position: absolute;
    top: 30%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
}

  .box {
    padding: 20px;
    border: 1px solid #d8d8d8;
    position: relative;

    > h2 {
      font-size: 20px;
      font-weight: 300;
    }
    > div {
      font-weight: 300;
      line-height: 18px;
      opacity: 0.8;
    }

    > button {
      padding: 0;
      position: absolute;
      top: 0;
      right: 10px;
    }
  }
</style>
