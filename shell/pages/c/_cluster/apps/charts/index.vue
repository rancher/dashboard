<script>
import AsyncButton from '@shell/components/AsyncButton';
import Loading from '@shell/components/Loading';
import { Banner } from '@components/Banner';
import Carousel from '@shell/components/Carousel';
import ButtonGroup from '@shell/components/ButtonGroup';
import SelectIconGrid from '@shell/components/SelectIconGrid';
import TypeDescription from '@shell/components/TypeDescription';
import {
  REPO_TYPE, REPO, CHART, VERSION, SEARCH_QUERY, _FLAGGED, CATEGORY, DEPRECATED as DEPRECATED_QUERY, HIDDEN, OPERATING_SYSTEM
} from '@shell/config/query-params';
import { lcFirst } from '@shell/utils/string';
import { sortBy } from '@shell/utils/sort';
import { mapGetters } from 'vuex';
import { Checkbox } from '@components/Form/Checkbox';
import Select from '@shell/components/form/Select';
import { mapPref, HIDE_REPOS, SHOW_PRE_RELEASE, SHOW_CHART_MODE } from '@shell/store/prefs';
import { removeObject, addObject, findBy } from '@shell/utils/array';
import { compatibleVersionsFor, filterAndArrangeCharts } from '@shell/store/catalog';
import { CATALOG } from '@shell/config/labels-annotations';
import { isUIPlugin } from '@shell/config/uiplugins';
import TabTitle from '@shell/components/TabTitle';

export default {
  name:       'Charts',
  components: {
    AsyncButton,
    Banner,
    Carousel,
    ButtonGroup,
    Loading,
    Checkbox,
    Select,
    SelectIconGrid,
    TypeDescription,
    TabTitle
  },

  async fetch() {
    await this.$store.dispatch('catalog/load');

    const query = this.$route.query;

    this.searchQuery = query[SEARCH_QUERY] || '';
    this.showDeprecated = query[DEPRECATED_QUERY] === 'true' || query[DEPRECATED_QUERY] === _FLAGGED;
    this.showHidden = query[HIDDEN] === _FLAGGED;
    this.category = query[CATEGORY] || '';
    this.allRepos = this.areAllEnabled();
  },

  data() {
    return {
      allRepos:        null,
      category:        null,
      operatingSystem: null,
      searchQuery:     null,
      showDeprecated:  null,
      showHidden:      null,
      chartOptions:    [
        {
          label:     this.t('catalog.charts.browseBtn'),
          value:     'browse',
          ariaLabel: this.t('catalog.charts.browseAriaLabel')
        },
        {
          label:     this.t('catalog.charts.featuredBtn'),
          value:     'featured',
          ariaLabel: this.t('catalog.charts.featuredAriaLabel')
        }
      ]
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...mapGetters({ allCharts: 'catalog/charts', loadingErrors: 'catalog/errors' }),

    chartMode: mapPref(SHOW_CHART_MODE),

    hideRepos: mapPref(HIDE_REPOS),

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
      const allChecked = this.repoOptionsForDropdown.find((repo) => repo.all && repo.enabled);

      if (allChecked) {
        return allChecked.label;
      }

      // None checked
      if (!this.repoOptionsForDropdown.find((repo) => repo.enabled)) {
        return this.t('generic.none');
      }

      const shownRepos = this.repoOptions.filter((repo) => !this.hideRepos.includes(repo._key));
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

    /**
     * Filter allll charts by invalid entries (deprecated, hidden and ui plugin).
     *
     * This does not include any user provided filters (like selected repos, categories and text query)
     */
    enabledCharts() {
      return (this.allCharts || []).filter((c) => {
        if ( c.deprecated && !this.showDeprecated ) {
          return false;
        }

        if ( c.hidden && !this.showHidden ) {
          return false;
        }

        if (isUIPlugin(c)) {
          return false;
        }

        return true;
      });
    },

    /**
     * Filter enabled charts allll filters. These are what the user will see in the list
     */
    filteredCharts() {
      return this.filterCharts({
        category:    this.category,
        searchQuery: this.searchQuery,
        hideRepos:   this.hideRepos
      });
    },

    /**
     * Filter valid charts (alll filters minus user provided ones) by whether they are featured or not
     *
     * This will power the carousel
     */
    featuredCharts() {
      const filteredCharts = this.filterCharts({});

      const featuredCharts = filteredCharts.filter((value) => value.featured).sort((a, b) => a.featured - b.featured);

      return featuredCharts.slice(0, 5);
    },

    categories() {
      const map = {};

      // Filter charts by everything except itself
      const charts = this.filterCharts({
        searchQuery: this.searchQuery,
        hideRepos:   this.hideRepos
      });

      for ( const chart of charts ) {
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
        count: charts.length
      });

      return sortBy(out, ['label']);
    },

    showCarousel() {
      return this.chartMode === 'featured' && this.featuredCharts.length;
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

    showDeprecated(neu) {
      this.$router.applyQuery({ [DEPRECATED_QUERY]: neu || undefined });
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
      const OSs = this.currentCluster.workerOSs;
      const showPrerelease = this.$store.getters['prefs/get'](SHOW_PRE_RELEASE);
      const compatibleVersions = compatibleVersionsFor(chart, OSs, showPrerelease);
      const versions = chart.versions;

      if (compatibleVersions.length > 0) {
        version = compatibleVersions[0].version;
      } else {
        version = versions[0].version;
      }

      const query = {
        [REPO_TYPE]: chart.repoType,
        [REPO]:      chart.repoName,
        [CHART]:     chart.chartName,
        [VERSION]:   version
      };

      if (chart.deprecated && this.showDeprecated) {
        query[DEPRECATED_QUERY] = 'true';
      }

      this.$router.push({
        name:   'c-cluster-apps-charts-chart',
        params: {
          cluster: this.$route.params.cluster,
          product: this.$store.getters['productId'],
        },
        query
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

    filterCharts({ category, searchQuery, hideRepos }) {
      const enabledCharts = (this.enabledCharts || []);
      const clusterProvider = this.currentCluster.status.provider || 'other';

      return filterAndArrangeCharts(enabledCharts, {
        clusterProvider,
        category,
        searchQuery,
        showDeprecated: this.showDeprecated,
        showHidden:     this.showHidden,
        hideRepos,
        hideTypes:      [CATALOG._CLUSTER_TPL],
        showPrerelease: this.$store.getters['prefs/get'](SHOW_PRE_RELEASE),
      });
    }
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <header>
      <div class="title">
        <h1
          data-testid="charts-header-title"
          class="m-0"
        >
          <TabTitle>{{ t('catalog.charts.header') }}</TabTitle>
        </h1>
      </div>
      <div
        v-if="featuredCharts.length > 0"
        class="actions-container"
      >
        <ButtonGroup
          v-model:value="chartMode"
          :options="chartOptions"
        />
      </div>
    </header>
    <div v-if="showCarousel">
      <h3>{{ t('catalog.charts.featuredCharts') }}</h3>
      <Carousel
        :sliders="featuredCharts"
        data-testid="charts-carousel"
        @clicked="(row) => selectChart(row)"
      />
    </div>

    <TypeDescription resource="chart" />
    <div class="left-right-split">
      <Select
        :searchable="false"
        :options="repoOptionsForDropdown"
        :value="flattenedRepoNames"
        class="checkbox-select"
        :close-on-select="false"
        data-testid="charts-filter-repos"
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
              <span>{{ repo.label }}</span><i
                v-if="!repo.all"
                class=" pl-5 icon icon-dot icon-sm"
                :class="{[repo.color]: true}"
              />
            </template>
          </Checkbox>
        </template>
      </Select>

      <Select
        v-model:value="category"
        :clearable="false"
        :searchable="false"
        :options="categories"
        placement="bottom"
        label="label"
        style="min-width: 200px;"
        :reduce="opt => opt.value"
        data-testid="charts-filter-category"
      >
        <template #option="opt">
          {{ opt.label }} ({{ opt.count }})
        </template>
      </Select>

      <div class="filter-block">
        <input
          ref="searchQuery"
          v-model="searchQuery"
          type="search"
          class="input-sm"
          :placeholder="t('catalog.charts.search')"
          data-testid="charts-filter-input"
          :aria-label="t('catalog.charts.search')"
          role="textbox"
        >

        <button
          v-shortkey.once="['/']"
          class="hide"
          @shortkey="focusSearch()"
        />
        <AsyncButton
          role="button"
          :aria-label="t('catalog.charts.refresh')"
          class="refresh-btn"
          mode="refresh"
          size="sm"
          @click="refresh"
        />
      </div>

      <div class="mt-10">
        <Checkbox
          v-model:value="showDeprecated"
          :label="t('catalog.charts.deprecatedChartsFilter.label')"
          data-testid="charts-show-deprecated-filter"
        />
      </div>
    </div>

    <Banner
      v-for="(err, i) in loadingErrors"
      :key="i"
      color="error"
      :label="err"
    />

    <div v-if="allCharts.length">
      <div
        v-if="filteredCharts.length === 0"
        style="width: 100%;"
      >
        <div class="m-50 text-center">
          <h1>{{ t('catalog.charts.noCharts') }}</h1>
        </div>
      </div>
      <SelectIconGrid
        v-else
        data-testid="chart-selection-grid"
        component-test-id="chart-selection"
        :rows="filteredCharts"
        name-field="chartNameDisplay"
        description-field="chartDescription"
        :color-for="colorForChart"
        @clicked="(row) => selectChart(row)"
      />
    </div>
    <div
      v-else
      class="m-50 text-center"
    >
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
    grid-template-columns: 40% auto auto;
    align-content: center;
    grid-column-gap: 10px;

    .filter-block {
      display: flex;
    }
    .refresh-btn {
      margin-left: 10px;
    }

    &.with-os-options {
      grid-template-columns: 40% auto auto auto;
    }

    @media only screen and (max-width: map-get($breakpoints, '--viewport-12')) {
      &{
        grid-template-columns: auto auto !important;
        grid-template-rows: 40px 40px;
        grid-row-gap: 20px;
      }
    }

    @media only screen and (max-width: map-get($breakpoints, '--viewport-7')) {
      &{
        &{
          grid-template-columns: auto !important;
          grid-template-rows: 40px 40px 40px !important;

          &.with-os-options {
            grid-template-rows: 40px 40px 40px 40px !important;
          }
        }
      }
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

  :deep() .checkbox-label {
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

  &:hover :deep() .checkbox-label {
      color: var(--body-text);
    }

  &.rancher {
      &:hover {
      background: var(--app-rancher-accent);
    }
    &:hover :deep() .checkbox-label {
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
    &:hover :deep() .checkbox-label {
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
    &:hover :deep() .checkbox-label {
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
    &:hover :deep() .checkbox-label {
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
    &:hover :deep() .checkbox-label {
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
    &:hover :deep().checkbox-label {
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
    &:hover :deep() .checkbox-label {
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
    &:hover :deep() .checkbox-label {
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
    &:hover :deep() .checkbox-label {
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
    & i {
      color: var(--app-color8-accent)
    }
  }
}

</style>
