<script>
import AsyncButton from '@/components/AsyncButton';
import Loading from '@/components/Loading';
import Banner from '@/components/Banner';
import SelectIconGrid from '@/components/SelectIconGrid';
import {
  REPO_TYPE, REPO, CHART, VERSION, SEARCH_QUERY, _FLAGGED, CATEGORY, DEPRECATED, HIDDEN
} from '@/config/query-params';
import { lcFirst } from '@/utils/string';
import { sortBy } from '@/utils/sort';
import { mapGetters } from 'vuex';
import Checkbox from '@/components/form/Checkbox';
import Select from '@/components/form/Select';
import { mapPref, HIDE_REPOS, SHOW_PRE_RELEASE } from '@/store/prefs';
import { removeObject, addObject, findBy } from '@/utils/array';
import { compatibleVersionsFor, filterAndArrangeCharts } from '@/store/catalog';
import { CATALOG } from '@/config/labels-annotations';

export default {
  components: {
    AsyncButton,
    Banner,
    Loading,
    Checkbox,
    Select,
    SelectIconGrid,
  },

  async fetch() {
    await this.$store.dispatch('catalog/load');

    const query = this.$route.query;

    this.searchQuery = query[SEARCH_QUERY] || '';
    this.showDeprecated = query[DEPRECATED] === _FLAGGED;
    this.showHidden = query[HIDDEN] === _FLAGGED;
    this.category = query[CATEGORY] || '';
    this.allRepos = this.areAllEnabled();
  },

  data() {
    return {
      allRepos:            null,
      category:            null,
      searchQuery:         null,
      showDeprecated:      null,
      showHidden:          null,
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...mapGetters({ allCharts: 'catalog/charts', loadingErrors: 'catalog/errors' }),

    hideRepos: mapPref(HIDE_REPOS),

    showWindowsClusterNoAppsSplash() {
      const isWindows = this.currentCluster.providerOs === 'windows';
      const { filteredCharts } = this;
      let showSplash = false;

      if ( isWindows && filteredCharts.length === 0 ) {
        showSplash = true;
      }

      return showSplash;
    },

    repoOptions() {
      let nextColor = 1;

      let out = this.$store.getters['catalog/repos'].map((r) => {
        return {
          _key:    r._key,
          label:   r.nameDisplay,
          color:   r.color,
          weight:  ( r.isRancher ? 1 : ( r.isPartner ? 2 : 3 ) ),
          enabled: !this.hideRepos.includes(r._key),
        };
      });

      out = sortBy(out, ['weight', 'label']);

      for ( const entry of out ) {
        if ( !entry.color ) {
          entry.color = `color${ nextColor }`;
          if ( nextColor < 8 ) {
            nextColor++;
          }
        }
      }

      return out;
    },

    enabledCharts() {
      return (this.allCharts || []).filter((c) => {
        if ( c.deprecated && !this.showDeprecated ) {
          return false;
        }

        if ( c.hidden && !this.showHidden ) {
          return false;
        }

        if ( this.hideRepos.includes(c.repoKey) ) {
          return false;
        }

        return true;
      });
    },

    filteredCharts() {
      const enabledCharts = (this.enabledCharts || []);

      return filterAndArrangeCharts(enabledCharts, {
        isWindows:      this.currentCluster.providerOs === 'windows',
        category:       this.category,
        searchQuery:    this.searchQuery,
        showDeprecated: this.showDeprecated,
        showHidden:     this.showHidden,
        hideRepos:      this.hideRepos,
        showTypes:      [CATALOG._APP],
        showPrerelease: this.$store.getters['prefs/get'](SHOW_PRE_RELEASE),
      });
    },

    categories() {
      const map = {};

      for ( const chart of this.enabledCharts ) {
        for ( const c of chart.categories ) {
          if ( !map[c] ) {
            const labelKey = `catalog.charts.categories.${ lcFirst(c) }`;

            map[c] = {
              label: this.$store.getters['i18n/withFallback'](labelKey, null, c),
              value: c,
              count: 0
            };
          }

          map[c].count++;
        }
      }

      const out = Object.values(map);

      out.unshift({
        label: this.t('catalog.charts.categories.all'),
        value: '',
        count: this.enabledCharts.length
      });

      return out;
    },
  },

  watch: {
    searchQuery(q) {
      this.$router.applyQuery({ [SEARCH_QUERY]: q || undefined });
    },

    category(cat) {
      this.$router.applyQuery({ [CATEGORY]: cat || undefined });
    },
  },

  mounted() {
    if ( typeof window !== 'undefined' ) {
      window.c = this;
    }
  },

  methods: {
    colorForChart(chart) {
      const repos = this.repoOptions;
      const repo = findBy(repos, '_key', chart.repoKey);

      if ( repo ) {
        return repo.color;
      }

      return null;
    },

    toggleAll(on) {
      for ( const r of this.repoOptions ) {
        this.toggleRepo(r, on, false);
      }

      this.$nextTick(() => {
        this.allRepos = this.areAllEnabled();
      });
    },

    areAllEnabled() {
      const all = this.$store.getters['catalog/repos'];

      for ( const r of all ) {
        if ( this.hideRepos.includes(r._key) ) {
          return false;
        }
      }

      return true;
    },

    toggleRepo(repo, on, updateAll = true) {
      const hidden = this.hideRepos;

      if ( on ) {
        removeObject(hidden, repo._key);
      } else {
        addObject(hidden, repo._key);
      }

      this.hideRepos = hidden;

      if ( updateAll ) {
        this.allRepos = this.areAllEnabled();
      }
    },

    selectChart(chart) {
      let version;
      const isWindows = this.currentCluster.providerOs === 'windows';
      const showPrerelease = this.$store.getters['prefs/get'](SHOW_PRE_RELEASE);
      const windowsVersions = compatibleVersionsFor(chart.versions, 'windows', showPrerelease);
      const linuxVersions = compatibleVersionsFor(chart.versions, 'linux', showPrerelease);
      const allVersions = compatibleVersionsFor(chart.versions, null, showPrerelease);

      if ( isWindows && windowsVersions.length ) {
        version = windowsVersions[0].version;
      } else if ( !isWindows && linuxVersions.length ) {
        version = linuxVersions[0].version;
      } else if ( allVersions.length ) {
        version = allVersions[0].version;
      }

      if ( !version ) {
        console.warn(`Cannot select chart '${ chart.chartName }' (no compatible version available for '${ this.currentCluster.providerOs }')`); // eslint-disable-line no-console

        return;
      }

      this.$router.push({
        name:   'c-cluster-apps-chart',
        params: {
          cluster:  this.$route.params.cluster,
          product:  this.$store.getters['productId'],
        },
        query: {
          [REPO_TYPE]: chart.repoType,
          [REPO]:      chart.repoName,
          [CHART]:     chart.chartName,
          [VERSION]:   version,
        }
      });
    },

    focusSearch() {
      if ( this.$refs.searchQuery ) {
        this.$refs.searchQuery.focus();
        this.$refs.searchQuery.select();
      }
    },

    async refresh(btnCb) {
      try {
        await this.$store.dispatch('catalog/refresh');
        btnCb(true);
      } catch (e) {
        this.$store.dispatch('growl/fromError', e);
        btnCb(false);
      }
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <header>
      <div class="title">
        <h1 class="m-0">
          {{ t('catalog.charts.header') }}
        </h1>
      </div>
    </header>

    <div class="left-right-split">
      <div class="mt-10">
        <Checkbox
          :value="allRepos"
          :label="t('catalog.charts.all')"
          :class="{'pull-left': true, 'repo': true}"
          @input="toggleAll($event)"
        />
        <Checkbox
          v-for="r in repoOptions"
          :key="r.label"
          v-model="r.enabled"
          :label="r.label"
          :class="{'pull-left': true, 'repo': true, [r.color]: true}"
          @input="toggleRepo(r, $event)"
        />
      </div>
      <Select
        v-model="category"
        :clearable="false"
        :searchable="false"
        :options="categories"
        placement="bottom"
        label="label"
        style="min-width: 200px;"
        :reduce="opt => opt.value"
      >
        <template #option="opt">
          {{ opt.label }} ({{ opt.count }})
        </template>
      </Select>

      <input ref="searchQuery" v-model="searchQuery" type="search" class="input-sm" :placeholder="t('catalog.charts.search')">

      <button v-shortkey.once="['/']" class="hide" @shortkey="focusSearch()" />
      <AsyncButton mode="refresh" size="sm" @click="refresh" />
      <!-- </div> -->
    </div>

    <Banner v-for="err in loadingErrors" :key="err" color="error" :label="err" />

    <div v-if="allCharts.length">
      <div v-if="filteredCharts.length === 0 && showWindowsClusterNoAppsSplash" style="width: 100%;">
        <div class="m-50 text-center">
          <h1>{{ t('catalog.charts.noWindows') }}</h1>
        </div>
      </div>
      <SelectIconGrid
        v-else
        :rows="filteredCharts"
        name-field="chartDisplayName"
        description-field="chartDescription"
        :color-for="colorForChart"
        @clicked="(row) => selectChart(row)"
      />
    </div>
    <div v-else class="m-50 text-center">
      <h1>{{ t('catalog.charts.noCharts') }}</h1>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .repo {
    border-radius: var(--border-radius);
    padding: 3px 0 3px 8px;
    margin-right: 5px;

    &.rancher {
      background: var(--app-rancher-bg);
      border: 1px solid var(--app-rancher-accent);
    }

    &.partner {
      background: var(--app-partner-bg);
      border: 1px solid var(--app-partner-accent);
    }

    &.color1 { background: var(--app-color1-bg); border: 1px solid var(--app-color1-accent); }
    &.color2 { background: var(--app-color2-bg); border: 1px solid var(--app-color2-accent); }
    &.color3 { background: var(--app-color3-bg); border: 1px solid var(--app-color3-accent); }
    &.color4 { background: var(--app-color4-bg); border: 1px solid var(--app-color4-accent); }
    &.color5 { background: var(--app-color5-bg); border: 1px solid var(--app-color5-accent); }
    &.color6 { background: var(--app-color6-bg); border: 1px solid var(--app-color6-accent); }
    &.color7 { background: var(--app-color7-bg); border: 1px solid var(--app-color7-accent); }
    &.color8 { background: var(--app-color8-bg); border: 1px solid var(--app-color8-accent); }
  }

  .left-right-split {
      padding: 0 0 20px 0;
      width: 100%;
      z-index: z-index('fixedTableHeader');
      background: transparent;
      display: grid;
      grid-template-columns: 50% auto auto 40px;
      align-content: center;
      grid-column-gap: 10px;

    // .left-half {
    //   background: lavenderblush;
    //   grid-column: 1;
    //   // grid-area: left;
    // }

    // .right-half {
    //   background: darkslateblue;
    //   grid-column: 2;
    //   // grid-area: right;
    // }
  }

</style>
