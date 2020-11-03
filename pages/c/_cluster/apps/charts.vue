<script>
import AsyncButton from '@/components/AsyncButton';
import Loading from '@/components/Loading';
import Banner from '@/components/Banner';
import {
  REPO_TYPE, REPO, CHART, VERSION, SEARCH_QUERY, _FLAGGED, CATEGORY
} from '@/config/query-params';
import { ensureRegex } from '@/utils/string';
import { sortBy } from '@/utils/sort';
import { mapGetters } from 'vuex';
import Checkbox from '@/components/form/Checkbox';
import Select from '@/components/form/Select';
import LazyImage from '@/components/LazyImage';
import { mapPref, HIDE_REPOS } from '@/store/prefs';
import { removeObject, addObject, findBy } from '@/utils/array';

export default {
  components: {
    AsyncButton,
    Banner,
    Loading,
    Checkbox,
    LazyImage,
    Select,
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
      searchQuery:    null,
      showDeprecated: null,
      showHidden:     null,
      category:       null,
      allRepos:       null,
    };
  },

  computed: {
    ...mapGetters({ allCharts: 'catalog/charts', loadingErrors: 'catalog/errors' }),

    hideRepos: mapPref(HIDE_REPOS),

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
      return (this.enabledCharts || []).filter((c) => {
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
      return sortBy(this.filteredCharts, ['certifiedSort', 'repoName', 'chartName']);
    },

    categories() {
      const map = {};

      for ( const chart of this.enabledCharts ) {
        for ( const c of chart.categories ) {
          if ( !map[c] ) {
            map[c] = {
              label: c,
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
        label: 'All Categories',
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
          [VERSION]:   chart.versions[0].version,
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
        label="All"
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
      <div class="charts">
        <div v-for="c in arrangedCharts" :key="c.key" class="chart" :class="{[colorForChart(c)]: true}" @click="selectChart(c)">
          <div class="side-label">
            <label v-if="c.sideLabel">{{ c.sideLabel }}</label>
          </div>
          <div class="logo">
            <LazyImage :src="c.icon" />
          </div>
          <h4 class="name">
            {{ c.chartName }}
          </h4>
          <div class="description">
            {{ c.chartDescription }}
          </div>
        </div>
      </div>
    </div>
    <div v-else class="m-50 text-center">
      <h1>There are no charts available, have you added any repos?</h1>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $chart: 110px;
  $side: 15px;
  $margin: 10px;
  $logo: 60px;

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

  .charts {
    display: flex;
    justify-content: flex-start;
    flex-wrap: wrap;
    margin: 0 -1*$margin;

    @media only screen and (min-width: map-get($breakpoints, '--viewport-4')) {
      .chart {
        width: 100%;
      }
    }
    @media only screen and (min-width: map-get($breakpoints, '--viewport-7')) {
      .chart {
        width: calc(50% - 2 * #{$margin});
      }
    }
    @media only screen and (min-width: map-get($breakpoints, '--viewport-9')) {
      .chart {
        width: calc(33.33333% - 2 * #{$margin});
      }
    }
    @media only screen and (min-width: map-get($breakpoints, '--viewport-12')) {
      .chart {
        width: calc(25% - 2 * #{$margin});
      }
    }

    .chart {
      height: $chart;
      margin: $margin;
      padding: $margin;
      position: relative;
      border-radius: calc( 1.5 * var(--border-radius));

      &:hover {
        box-shadow: 0 0 30px var(--shadow);
        transition: box-shadow 0.1s ease-in-out;
        cursor: pointer;
      }

      .side-label {
        transform: rotate(180deg);
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        min-width: calc(1.5 * var(--border-radius));
        width: $side;
        border-top-right-radius: calc( 1.5 * var(--border-radius));
        border-bottom-right-radius: calc( 1.5 * var(--border-radius));

        label {
          text-align: center;
          writing-mode: tb;
          height: 100%;
          padding: 0 2px;
          display: block;
          white-space: no-wrap;
          text-overflow: ellipsis;
        }
      }

      .logo {
        text-align: center;
        position: absolute;
        left: $side+$margin;
        top: ($chart - $logo)/2;
        width: $logo;
        height: $logo;
        border-radius: calc(2 * var(--border-radius));
        overflow: hidden;
        background-color: white;

        img {
          width: $logo - 4px;
          height: $logo - 4px;
          object-fit: contain;
          position: relative;
          top: 2px;
        }
      }

      .side-label {
        font-size: 10px;
      }

      &.rancher {
        background: var(--app-rancher-bg);

        .side-label {
          background-color: var(--app-rancher-accent);
          color: var(--app-rancher-accent-text);
        }
        &:hover {
          background: var(--app-rancher-accent);
        }
      }

      &.partner {
        background: var(--app-partner-bg);
        .side-label {
          background-color: var(--app-partner-accent);
          color: var(--app-partner-accent-text);
        }
        &:hover {
          background: var(--app-partner-accent);
        }
      }

      // @TODO figure out how to templatize these
      &.color1 {
        background: var(--app-color1-bg);
        .side-label { background-color: var(--app-color1-accent); color: var(--app-color1-accent-text); }
        &:hover { background: var(--app-color1-accent); }
      }
      &.color2 {
        background: var(--app-color2-bg);
        .side-label { background-color: var(--app-color2-accent); color: var(--app-color2-accent-text); }
        &:hover { background: var(--app-color2-accent); }
      }
      &.color3 {
        background: var(--app-color3-bg);
        .side-label { background-color: var(--app-color3-accent); color: var(--app-color3-accent-text); }
        &:hover { background: var(--app-color3-accent); }
      }
      &.color4 {
        background: var(--app-color4-bg);
        .side-label { background-color: var(--app-color4-accent); color: var(--app-color4-accent-text); }
        &:hover { background: var(--app-color4-accent); }
      }
      &.color5 {
        background: var(--app-color5-bg);
        .side-label { background-color: var(--app-color5-accent); color: var(--app-color5-accent-text); }
        &:hover { background: var(--app-color5-accent); }
      }
      &.color6 {
        background: var(--app-color6-bg);
        .side-label { background-color: var(--app-color6-accent); color: var(--app-color6-accent-text); }
        &:hover { background: var(--app-color6-accent); }
      }
      &.color7 {
        background: var(--app-color7-bg);
        .side-label { background-color: var(--app-color7-accent); color: var(--app-color7-accent-text); }
        &:hover { background: var(--app-color7-accent); }
      }
      &.color8 {
        background: var(--app-color8-bg);
        .side-label { background-color: var(--app-color8-accent); color: var(--app-color8-accent-text); }
        &:hover { background: var(--app-color8-accent); }
      }

      &:hover {
        background-position: right center;
      }

      .name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-top: $margin;
        margin-left: $side+$logo+$margin;
      }

      .description {
        margin-top: $margin;
        margin-left: $side+$logo+$margin;
        margin-right: $margin;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
        line-clamp: 3;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--text-muted);
      }
    }
  }

</style>
