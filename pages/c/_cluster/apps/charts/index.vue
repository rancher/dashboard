<script>
import AsyncButton from '@/components/AsyncButton';
import Loading from '@/components/Loading';
import Banner from '@/components/Banner';
import SelectIconGrid from '@/components/SelectIconGrid';
import {
  REPO_TYPE, REPO, CHART, VERSION, SEARCH_QUERY, _FLAGGED, CATEGORY, DEPRECATED, HIDDEN, OPERATING_SYSTEM
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
    this.operatingSystem = query[OPERATING_SYSTEM] || this.defaultOperatingSystem;
    this.allRepos = this.areAllEnabled();
  },

  data() {
    return {
      allRepos:            null,
      category:            null,
      operatingSystem:     null,
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
      let nextColor = 0;
      // Colors 3 and 4 match `rancher` and `partner` colors, so just avoid them
      const colors = [1, 2, 5, 6, 7, 8];

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
          entry.color = `color${ colors[nextColor] }`;
          nextColor++;
          if ( nextColor >= colors.length ) {
            nextColor = 0;
          }
        }
      }

      return out;
    },

    repoOptionsForDropdown() {
      return [{
        label: this.t('catalog.repo.all'), all: true, enabled: this.areAllEnabled()
      }, ...this.repoOptions];
    },

    flattenedRepoNames() {
      const allChecked = this.repoOptionsForDropdown.find(repo => repo.all && repo.enabled);

      if (allChecked) {
        return allChecked.label;
      }

      // None checked
      if (!this.repoOptionsForDropdown.find(repo => repo.enabled)) {
        return this.t('generic.none');
      }

      const shownRepos = this.repoOptions.filter(repo => !this.hideRepos.includes(repo._key));
      const reducedRepos = shownRepos.reduce((acc, c, i) => {
        acc += c.label;
        const length = shownRepos.length;

        if (i < length - 1) {
          acc += ', ';
        }

        return acc;
      }, '');

      return reducedRepos;
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
        os:             this.operatingSystem,
        category:       this.category,
        searchQuery:    this.searchQuery,
        showDeprecated: this.showDeprecated,
        showHidden:     this.showHidden,
        hideRepos:      this.hideRepos,
        hideTypes:      [CATALOG._CLUSTER_TPL],
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

    operatingSystemChartCounts() {
      const counts = { linux: 0, windows: 0 };
      const showPrerelease = this.$store.getters['prefs/get'](SHOW_PRE_RELEASE);

      this.enabledCharts.forEach((chart) => {
        const windowsVersions = compatibleVersionsFor(chart.versions, 'windows', showPrerelease);
        const linuxVersions = compatibleVersionsFor(chart.versions, 'linux', showPrerelease);

        if (windowsVersions.length > 0) {
          counts['windows'] += 1;
        }

        if (linuxVersions.length > 0) {
          counts['linux'] += 1;
        }
      });

      return counts;
    },

    operatingSystemOptions() {
      return [
        {
          label: this.t('catalog.charts.operatingSystems.all'),
          value: '',
          count: this.enabledCharts.length
        },
        {
          label: this.t('catalog.charts.operatingSystems.linux'),
          value: 'linux',
          count: this.operatingSystemChartCounts.linux
        },
        {
          label: this.t('catalog.charts.operatingSystems.windows'),
          value: 'windows',
          count: this.operatingSystemChartCounts.windows
        }
      ];
    },

    defaultOperatingSystem() {
      const linuxCount = this.currentCluster.linuxWorkerCount;
      const windowsCount = this.currentCluster.windowsWorkerCount;

      if (linuxCount > windowsCount) {
        return 'linux';
      }

      if (windowsCount > linuxCount) {
        return 'windows';
      }

      return '';
    },

    showOperatingSystemOptions() {
      const linuxCount = this.currentCluster.linuxWorkerCount;
      const windowsCount = this.currentCluster.windowsWorkerCount;

      return linuxCount > 0 && windowsCount > 0;
    }
  },

  watch: {
    searchQuery(q) {
      this.$router.applyQuery({ [SEARCH_QUERY]: q || undefined });
    },

    category(cat) {
      this.$router.applyQuery({ [CATEGORY]: cat || undefined });
    },

    operatingSystem(os) {
      this.$router.applyQuery({ [OPERATING_SYSTEM]: os || undefined });
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
        name:   'c-cluster-apps-charts-chart',
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

    <div class="left-right-split" :class="{'with-os-options': showOperatingSystemOptions}">
      <Select
        :searchable="false"
        :options="repoOptionsForDropdown"
        :value="flattenedRepoNames"
        class="checkbox-select"
        :close-on-select="false"
        @option:selecting="$event.all ? toggleAll(!$event.enabled) : toggleRepo($event, !$event.enabled) "
      >
        <template #selected-option="selected">
          {{ selected.label }}
        </template>
        <template #option="repo">
          <Checkbox
            :value="repo.enabled"
            :label="repo.label"
            class="pull-left repo in-select"
            :class="{ [repo.color]: true}"
            :color="repo.color"
          >
            <template #label>
              <span>{{ repo.label }}</span><i v-if="!repo.all" class=" pl-5 icon icon-dot icon-sm" :class="{[repo.color]: true}" />
            </template>
          </Checkbox>
        </template>
      </Select>

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

      <Select
        v-if="showOperatingSystemOptions"
        v-model="operatingSystem"
        :clearable="false"
        :searchable="false"
        :options="operatingSystemOptions"
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
        name-field="chartNameDisplay"
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
.left-right-split {
    padding: 0 0 20px 0;
    width: 100%;
    z-index: z-index('fixedTableHeader');
    background: transparent;
    display: grid;
    grid-template-columns: 50% auto auto 40px;
    align-content: center;
    grid-column-gap: 10px;

    &.with-os-options {
      grid-template-columns: 50% auto auto auto 40px;
    }
  }

.checkbox-select {
   .vs__search {
    position: absolute;
    right: 0
  }

 .vs__selected-options  {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    display: inline-block;
    line-height: 2.4rem;
  }

}

.checkbox-outer-container.in-select {
  transform: translateX(-5px);
  padding: 7px 0 6px 13px;
  width: calc(100% + 10px);

  ::v-deep.checkbox-label {
    display: flex;
    align-items: center;

    & i {
      line-height: inherit;
    }
  }

  &:first-child {
    &:hover {
      background: var(--input-hover-bg);
    }
  }

  &:hover ::v-deep.checkbox-label {
      color: var(--body-text);
    }

  &.rancher {
      &:hover {
      background: var(--app-rancher-accent);
    }
    &:hover ::v-deep.checkbox-label {
      color: var(--app-rancher-accent-text);
    }
    & i {
      color: var(--app-rancher-accent)
    }
  }

  &.partner {
      &:hover {
      background: var(--app-partner-accent);
    }
    &:hover ::v-deep.checkbox-label {
      color: var(--app-partner-accent-text);
    }
    & i {
      color: var(--app-partner-accent)
    }
  }

  &.color1 {
    &:hover {
      background: var(--app-color1-accent);
    }
    &:hover ::v-deep.checkbox-label {
      color: var(--app-color1-accent-text);
    }
    & i {
      color: var(--app-color1-accent)
    }
  }
  &.color2 {
    &:hover {
      background: var(--app-color2-accent);
    }
    &:hover ::v-deep.checkbox-label {
      color: var(--app-color2-accent-text);
    }
        & i {
      color: var(--app-color2-accent)
    }
  }
  &.color3 {
    &:hover {
      background: var(--app-color3-accent);
    }
    &:hover ::v-deep.checkbox-label {
      color: var(--app-color3-accent-text);
    }
    & i {
      color: var(--app-color3-accent)
    }
  }
  &.color4 {
    &:hover {
      background: var(--app-color4-accent);
    }
    &:hover ::v-deep.checkbox-label {
      color: var(--app-color4-accent-text);
    }
    & i {
      color: var(--app-color4-accent)
    }
  }
  &.color5 {
    &:hover {
      background: var(--app-color5-accent);
    }
    &:hover ::v-deep.checkbox-label {
      color: var(--app-color5-accent-text);
    }
    & i {
      color: var(--app-color5-accent)
    }
  }
  &.color6 {
    &:hover {
      background: var(--app-color6-accent);
    }
    &:hover ::v-deep.checkbox-label {
      color: var(--app-color6-accent-text);
    }
    & i {
      color: var(--app-color6-accent)
    }
  }
  &.color7 {
    &:hover {
      background: var(--app-color7-accent);
    }
    &:hover ::v-deep.checkbox-label {
      color: var(--app-color7-accent-text);
    }
    & i {
      color: var(--app-color7-accent)
    }
  }
  &.color8 {
    &:hover {
      background: var(--app-color8-accent);
    }
    &:hover ::v-deep.checkbox-label {
      color: var(--app-color8-accent-text);
    }
    & i {
      color: var(--app-color8-accent)
    }
  }
}

</style>
