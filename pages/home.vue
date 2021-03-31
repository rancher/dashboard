<script>
import { mapPref, AFTER_LOGIN_ROUTE, SEEN_WHATS_NEW } from '@/store/prefs';
import RadioGroup from '@/components/form/RadioGroup';
import RadioButton from '@/components/form/RadioButton';
import SimpleBox from '@/components/SimpleBox';
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
    SimpleBox,
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
  },

  data() {
    const lastSeenNew = this.$store.getters['prefs/get'](SEEN_WHATS_NEW) ;
    const setting = this.$store.getters['management/byId'](MANAGEMENT.SETTING, 'server-version');
    const fullVersion = setting?.value || 'unknown';

    const seenWhatsNewAlready = compare(lastSeenNew, fullVersion) >= 0;

    const isDev = isDevBuild(fullVersion);

    // if (!isDev) {
    this.$store.dispatch('prefs/set', { key: SEEN_WHATS_NEW, value: fullVersion });
    // }

    return {
      clusters: [], seenWhatsNewAlready, isDev, showCommunity: true, showCommercial: true, showMigration: true
    };
  },

  computed:   {
    afterLoginRoute: mapPref(AFTER_LOGIN_ROUTE),

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
          label: 'Take me to where I last was last login',
          value: 'last-visited'
        },
        {
          label: 'Make my home screen',
          value: 'dropdown'
        }
      ];
    },

    routeDropdownOptions() {
      /*
      TODO check if management cluster is available to this user and offer that as an option
      IF the redirect logic is good if user loses permission to see something while logged out
      */
      const out = [
        {
          label: 'Apps and Marketplace',
          value: 'apps'
        }
      ];

      out.push( {
        label: `Overview for this Cluster (${ this.currentCluster.id }) `,
        value: `${ this.currentCluster.id }-dashboard`
      });

      if (this.currentCluster.id !== this.defaultClusterId) {
        out.push( {
          label: `Overview for the Default Cluster (${ this.defaultClusterId })`,
          value: `${ this.defaultClusterId }-dashboard`
        });
      }

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
    }
  }
};
</script>

<template>
  <form>
    <img class="mb-20" src="~/assets/images/pl/farm-banner.svg" />

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
            <SimpleBox title="What do you want to see when you log in?">
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
          </div>
          <div class="col span-6">
            <SimpleBox v-if="showMigration" id="migration" closeable title="Migration Assistance" @close="showMigration=false">
              Read the migration guide for Cluster Manager users - everything you need to take advantage of the expanded Cluster Explorer.
              <br />
              <a class="pull-right" href="#">Learn More</a>
            </SimpleBox>
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
        <CommunityLinks v-if="showCommunity" @close="showCommunity = false">
          <SimpleBox v-if="showCommercial" closeable :title="t('landing.commercial.title')" @close="showCommercial=false">
            <span v-html="t('landing.commercial.body', {}, true)" />
          </SimpleBox>
        </communitylinks>
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

</style>
