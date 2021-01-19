<script>
import AsyncButton from '@/components/AsyncButton';
import Loading from '@/components/Loading';
import Banner from '@/components/Banner';
import SelectIconGrid from '@/components/SelectIconGrid';
import {
  REPO_TYPE, REPO, CHART, VERSION, SEARCH_QUERY, _FLAGGED, CATEGORY
} from '@/config/query-params';
import { ensureRegex, lcFirst } from '@/utils/string';
import { sortBy } from '@/utils/sort';
import { mapGetters } from 'vuex';
import Checkbox from '@/components/form/Checkbox';
import Select from '@/components/form/Select';
import { mapPref, HIDE_REPOS } from '@/store/prefs';
import { removeObject, addObject, findBy } from '@/utils/array';
import { CATALOG } from '@/config/labels-annotations';

import filter from 'lodash/filter';

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
    this.showDeprecated = query['deprecated'] === _FLAGGED;
    this.showHidden = query['hidden'] === _FLAGGED;
    this.category = query[CATEGORY] || '';
    this.allRepos = this.areAllEnabled();
  },

  data() {
    return {
      allRepos:            null,
      catalogOSAnnotation: CATALOG.SUPPORTED_OS,
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
      const clusterProvider = this.currentCluster.status.provider || 'other';
      const { filteredCharts } = this;
      let showSplash = false;

      if (clusterProvider === 'rke.windows' && filteredCharts.length === 0) {
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
      const clusterProvider = this.currentCluster.status.provider || 'other';
      const enabledCharts = (this.enabledCharts || []); // .slice();

      return enabledCharts.filter((c) => {
        const { versions: chartVersions = [] } = c;

        if (clusterProvider === 'rke.windows' && this.getCompatibleVersions(chartVersions, 'windows').length <= 0) {
          // if we have at least one windows
          return false;
        } else if (clusterProvider !== 'rke.windows' && this.getCompatibleVersions(chartVersions, 'linux').length <= 0) { // linux
          // if we have at least one linux
          return false;
        }

        if ( this.category && !c.categories.includes(this.category) ) {
          return false;
        }

        if ( this.searchQuery ) {
          const searchTokens = this.searchQuery.split(/\s*[, ]\s*/).map(x => ensureRegex(x, false));

          for ( const token of searchTokens ) {
            if ( !c.chartName.match(token) && (c.chartDescription && !c.chartDescription.match(token)) ) {
              return false;
            }
          }
        }

        return true;
      });
    },

    arrangedCharts() {
      return sortBy(this.filteredCharts, ['certifiedSort', 'repoName', 'chartDisplayName']);
    },

    categories() {
      const map = {};

      for ( const chart of this.enabledCharts ) {
        for ( const c of chart.categories ) {
          if ( !map[c] ) {
            const exists = this.$store.getters['i18n/exists'];
            const labelKey = `catalog.charts.categories.${ lcFirst(c) }`;

            map[c] = {
              label: exists(labelKey) ? this.t(labelKey) : c,
              value: c,
              count: 0
            };
          }
        }
      }

      for ( const chart of this.arrangedCharts ) {
        for ( const c of chart.categories ) {
          if ( map[c] ) {
            map[c].count++;
          }
        }
      }

      const out = Object.values(map);

      out.unshift({
        label: this.t('catalog.charts.categories.all'),
        value: '',
        count: this.arrangedCharts.length
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
    getCompatibleVersions(versions, os) {
      return filter(versions, (ver) => {
        const osAnnotation = ver?.annotations?.[this.catalogOSAnnotation];

        if (osAnnotation && osAnnotation === os) {
          return true;
        } else if (!osAnnotation) {
          return true;
        }

        return false;
      });
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
      const chartVersions = chart.versions;
      const clusterProvider = this.currentCluster.status.provider || 'other';
      const windowsVersions = this.getCompatibleVersions(chartVersions, 'windows');
      const linuxVersions = this.getCompatibleVersions(chartVersions, 'linux');

      if (clusterProvider === 'rke.windows' && windowsVersions.length > 0) {
        version = windowsVersions[0].version;
      } else if (clusterProvider !== 'rke.windows' && linuxVersions.length > 0) {
        version = linuxVersions[0].version;
      } else {
        version = chartVersions[0].version;
      }

      this.$router.push({
        name:   'c-cluster-apps-install',
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
    <div class="clearfix">
      <h1 class="pull-left">
        {{ t('catalog.charts.header') }}
      </h1>
      <div class="pull-right">
        <input ref="searchQuery" v-model="searchQuery" type="search" class="input-sm" :placeholder="t('catalog.charts.search')">
        <button v-shortkey.once="['/']" class="hide" @shortkey="focusSearch()" />
      </div>
      <div class="pull-right pr-10">
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
      </div>
      <div class="pull-right pr-10">
        <AsyncButton mode="refresh" class="btn-sm" @click="refresh" />
      </div>
    </div>

    <div class="clearfix mt-5">
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

    <Banner v-for="err in loadingErrors" :key="err" color="error" :label="err" />

    <div v-if="allCharts.length">
      <div v-if="arrangedCharts.length === 0 && showWindowsClusterNoAppsSplash" style="width: 100%;">
        <div class="m-50 text-center">
          <h1>{{ t('catalog.charts.noWindows') }}</h1>
        </div>
      </div>
      <SelectIconGrid
        v-else
        :rows="arrangedCharts"
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

</style>
