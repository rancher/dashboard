<script>
import { mapGetters } from 'vuex';
import Loading from '@shell/components/Loading';
import { _FLAGGED, DEPRECATED as DEPRECATED_QUERY, HIDDEN, FROM_TOOLS } from '@shell/config/query-params';
import { filterAndArrangeCharts } from '@shell/store/catalog';
import { CATALOG, NORMAN } from '@shell/config/types';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import LazyImage from '@shell/components/LazyImage';
import { isAlternate } from '@shell/utils/platform';
import IconMessage from '@shell/components/IconMessage';
import TypeDescription from '@shell/components/TypeDescription';
import TabTitle from '@shell/components/TabTitle';

export default {
  components: {
    LazyImage, Loading, IconMessage, TypeDescription, TabTitle
  },

  async fetch() {
    await this.$store.dispatch('catalog/load', { force: true, reset: true });

    const query = this.$route.query;

    this.showDeprecated = query[DEPRECATED_QUERY] === 'true' || query[DEPRECATED_QUERY] === _FLAGGED;
    this.showHidden = query[HIDDEN] === _FLAGGED;

    this.allInstalled = await this.$store.dispatch('cluster/findAll', { type: CATALOG.APP });
  },

  data() {
    return {
      allInstalled:    null,
      v1SystemCatalog: null,
      systemProject:   null,
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...mapGetters({ allCharts: 'catalog/charts', loadingErrors: 'catalog/errors' }),
    ...mapGetters({ t: 'i18n/t' }),

    v1Apps() {
      return this.$store.getters['rancher/all'](NORMAN.APP);
    },

    namespaces() {
      return this.$store.getters['activeNamespaceCache'];
    },

    rancherCatalog() {
      return this.$store.getters['catalog/repos'].find((x) => x.isRancher);
    },

    installedApps() {
      return this.allInstalled;
    },

    installedAppForChart() {
      const out = {};

      for (const app of (this.installedApps || [])) {
        const matching = app.matchingCharts()[0];

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

      let charts = filterAndArrangeCharts(enabledCharts, {
        clusterProvider,
        showDeprecated: this.showDeprecated,
        showHidden:     this.showHidden,
        showRepos:      [this.rancherCatalog?._key],
        showTypes:      [CATALOG_ANNOTATIONS._CLUSTER_TOOL],
      });

      charts = charts.filter((c) => c.sideLabel !== 'Experimental');

      const chartsWithApps = charts.map((chart) => {
        return {
          chart,
          app: this.installedAppForChart[chart.id],
        };
      });

      return chartsWithApps;
    },
  },

  watch: {
    namespaces() {
      // When the namespaces change, check the v1 apps - might indicate add or removal of a v1 app
      if (this.systemProject) {
        this.$store.dispatch('rancher/findAll', {
          type: NORMAN.APP,
          opt:  { url: `/v3/project/${ this.systemProject }/apps`, force: true }
        });
      }
    }
  },

  mounted() {
    window.c = this;
  },

  methods: {
    edit(app, version) {
      app.goToUpgrade(version, true);
    },

    remove(app, event) {
      const alt = isAlternate(event);

      if (!alt) {
        app.promptRemove();
      } else {
        // User held alt key, so don't prompt
        app.remove();
      }
    },

    install(chart) {
      chart.goToInstall(FROM_TOOLS);
    },

    openV1Tool(id) {
      const cluster = this.$store.getters['currentCluster'];
      const route = {
        name:   'c-cluster-explorer-tools-pages-page',
        params: {
          cluster: cluster.id,
          product: 'explorer',
          page:    id,
        }
      };

      this.$router.replace(route);
    },
  }
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

        > i {
          background-color: var(--box-bg);
          border-radius: 50%;
          font-size: 32px;
          line-height: 50px;
          width: 50px;
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

      .os-label {
        position: absolute;
        top: 10px;
        right: 10px;
        padding: 3px;
        font-size: 12px;
        line-height: 12px;
        background-color: var(--primary);
        color: var(--primary-text);
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

        button {
          height: 30px;
        }
      }
    }
  }
</style>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else-if="options.length">
    <h1>
      <TabTitle>{{ t('catalog.tools.header') }}</TabTitle>
    </h1>
    <TypeDescription
      resource="chart"
    />

    <div class="grid">
      <div
        v-for="opt in options"
        :key="opt.chart.id"
        class="item"
        :data-testid="`cluster-tools-app-${opt.chart.id}`"
      >
        <div
          class="logo"
        >
          <i
            v-if="opt.chart.iconName"
            class="icon"
            :class="opt.chart.iconName"
            :alt="t('catalog.tools.iconAlt', { app: opt.chart.chartNameDisplay })"
          />
          <LazyImage
            v-else
            :alt="t('catalog.tools.iconAlt', { app: opt.chart.chartNameDisplay })"
            :src="opt.chart.icon"
          />
        </div>
        <div class="name-version">
          <div>
            <h3 class="name">
              {{ opt.chart.chartNameDisplay }}
            </h3>
            <label
              v-if="opt.chart.deploysOnWindows"
              class="os-label"
            >{{ t('catalog.charts.deploysOnWindows') }}</label>
          </div>
          <div class="version">
            <template v-if="opt.app && opt.app.upgradeAvailableVersion">
              v{{ opt.app.currentVersion }} <b><i class="icon icon-chevron-right" /> v{{ opt.app.upgradeAvailableVersion }}</b>
            </template>
            <template v-else-if="opt.app">
              v{{ opt.app.currentVersion }}
            </template>
            <template v-else-if="opt.chart.versions.length">
              v{{ opt.chart.versions[0].version }}
            </template>
          </div>
        </div>
        <div class="description">
          <div
            v-clean-html="opt.chart.chartDescription"
            class="description-content"
          />
        </div>
        <div class="action">
          <template v-if="opt.blocked">
            <button
              v-clean-html="t('catalog.tools.action.install')"
              role="button"
              :aria-label="t('catalog.tools.action.install')"
              disabled="true"
              class="btn btn-sm role-primary"
            />
          </template>
          <template v-else-if="opt.app">
            <button
              class="btn btn-sm role-secondary"
              role="button"
              :aria-label="t('catalog.tools.action.remove')"
              @click="remove(opt.app, $event)"
            >
              <i
                class="icon icon-delete icon-lg"
                :alt="t('catalog.tools.action.remove')"
              />
            </button>
            <button
              v-clean-html="t('catalog.tools.action.edit')"
              role="button"
              :aria-label="t('catalog.tools.action.edit')"
              class="btn btn-sm role-secondary"
              @click="edit(opt.app)"
            />
          </template>
          <template v-else>
            <button
              v-clean-html="t('catalog.tools.action.install')"
              role="button"
              :aria-label="t('catalog.tools.action.install')"
              class="btn btn-sm role-primary"
              @click="install(opt.chart)"
            />
          </template>
        </div>
      </div>
    </div>
  </div>
  <div v-else>
    <IconMessage
      icon="icon-warning"
      message-key="catalog.tools.noTools"
    />
  </div>
</template>
