<script>
import { mapGetters } from 'vuex';
import Loading from '@/components/Loading';
import { _FLAGGED, DEPRECATED, HIDDEN } from '@/config/query-params';
import { filterAndArrangeCharts } from '@/store/catalog';
import { CATALOG } from '@/config/types';
import LazyImage from '@/components/LazyImage';
import AppSummaryGraph from '@/components/formatter/AppSummaryGraph';

export default {
  components: {
    AppSummaryGraph, LazyImage, Loading
  },

  async fetch() {
    await this.$store.dispatch('catalog/load');

    const query = this.$route.query;

    this.showDeprecated = query[DEPRECATED] === _FLAGGED;
    this.showHidden = query[HIDDEN] === _FLAGGED;

    this.allInstalled = await this.$store.dispatch('cluster/findAll', { type: CATALOG.APP });
  },

  data() {
    return { allInstalled: null };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...mapGetters({ allCharts: 'catalog/charts', loadingErrors: 'catalog/errors' }),

    rancherCatalog() {
      return this.$store.getters['catalog/repos'].find(x => x.isRancher);
    },

    installedAppForChart() {
      const out = {};

      for ( const app of this.allInstalled ) {
        const matching = app.matchingChart();

        if ( !matching ) {
          continue;
        }

        out[matching.id] = app;
      }

      return out;
    },

    options() {
      const clusterProvider = this.currentCluster.status.provider || 'other';
      const enabledCharts = (this.allCharts || []);

      const charts = filterAndArrangeCharts(enabledCharts, {
        clusterProvider,
        showDeprecated: this.showDeprecated,
        showHidden:     this.showHidden,
        showRepos:      [this.rancherCatalog._key],
      });

      return charts.map((chart) => {
        return {
          chart,
          app: this.installedAppForChart[chart.id],
        };
      });
    },
  },

  mounted() {
    window.c = this;
  },

  methods: {
    edit(app, version) {
      app.goToUpgrade(version, true);
    },

    remove(app) {
      app.promptRemove();
    },

    install(chart) {
      chart.goToInstall(true);
    },
  },
};
</script>

<style lang="scss" scoped>
  $margin: 10px;
  $logo: 50px;

  .grid {
    display: flex;
    justify-content: flex-start;
    flex-wrap: wrap;
    margin: 0 -1*$margin;

    @media only screen and (min-width: map-get($breakpoints, '--viewport-4')) {
      .item {
        width: 100%;
      }
    }
    @media only screen and (min-width: map-get($breakpoints, '--viewport-7')) {
      .item {
        width: 100%;
      }
    }
    @media only screen and (min-width: map-get($breakpoints, '--viewport-9')) {
      .item {
        width: calc(50% - 2 * #{$margin});
      }
    }
    @media only screen and (min-width: map-get($breakpoints, '--viewport-12')) {
      .item {
        width: calc(33.33333% - 2 * #{$margin});
      }
    }

    .item {
      display: grid;
      grid-template-areas:  "logo name-version name-version"
                            "description description description"
                            "state state action";
      grid-template-columns: $logo auto min-content;
      grid-template-rows: 50px 55px 35px;
      row-gap: $margin;
      column-gap: $margin;

      margin: $margin;
      padding: $margin;
      position: relative;
      border: 1px solid var(--border);
      border-radius: calc( 1.5 * var(--border-radius));

      .logo {
        grid-area: logo;
        text-align: center;
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

      .name-version {
        grid-area: name-version;
        padding: 10px 0 0 0;
      }

      .name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin: 0;
      }

      .version {
        color: var(--muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 0.9em;
        margin-top: 4px;
      }

      .description {
        grid-area: description;
      }

      .description-content {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
        line-clamp: 3;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--text-muted);
      }

      .state {
        grid-area: state;
      }

      .action {
        grid-area: action;
        white-space: nowrap;
      }
    }
  }
</style>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <h1 v-html="t('catalog.tools.header')" />

    <div v-if="options.length" class="grid">
      <div
        v-for="opt in options"
        :key="opt.chart.id"
        class="item"
      >
        <div class="logo">
          <LazyImage :src="opt.chart.icon" />
        </div>
        <div class="name-version">
          <h3 class="name">
            {{ opt.chart.chartDisplayName }}
          </h3>
          <div class="version">
            <template v-if="opt.app && opt.app.upgradeAvailable">
              v{{ opt.app.currentVersion }} <b><i class="icon icon-chevron-right" /> v{{ opt.app.upgradeAvailable }}</b>
            </template>
            <template v-else-if="opt.app">
              v{{ opt.app.currentVersion }}
            </template>
            <template v-else>
              v{{ opt.chart.versions[0].version }}
            </template>
          </div>
        </div>
        <div class="description">
          <div class="description-content">
            {{ opt.chart.chartDescription }}
          </div>
        </div>
        <div v-if="opt.app" class="state">
          <AppSummaryGraph :row="opt.app" label-key="generic.resourceCount" :link-to="opt.app.detailLocation" />
        </div>
        <div class="action">
          <template v-if="opt.app && opt.app.upgradeAvailable">
            <button class="btn btn-sm role-secondary" @click="remove(opt.app)">
              <i class="icon icon-delete icon-lg" />
            </button>
            <button class="btn btn-sm role-secondary" @click="edit(opt.app, opt.app.upgradeAvailable)" v-html="t('catalog.tools.action.upgrade')" />
          </template>
          <template v-else-if="opt.app">
            <button class="btn btn-sm role-secondary" @click="remove(opt.app)">
              <i class="icon icon-delete icon-lg" />
            </button>
            <button class="btn btn-sm role-secondary" @click="edit(opt.app)" v-html="t('catalog.tools.action.edit')" />
          </template>
          <template v-else>
            <button class="btn btn-sm role-primary" @click="install(opt.chart)" v-html="t('catalog.tools.action.install')" />
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
