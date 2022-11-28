<script>
import { mapGetters } from 'vuex';
import Loading from '@shell/components/Loading';
import { _FLAGGED, DEPRECATED, HIDDEN, FROM_TOOLS } from '@shell/config/query-params';
import { filterAndArrangeCharts } from '@shell/store/catalog';
import { CATALOG, MANAGEMENT, NORMAN } from '@shell/config/types';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import LazyImage from '@shell/components/LazyImage';
import AppSummaryGraph from '@shell/components/formatter/AppSummaryGraph';
import { sortBy } from '@shell/utils/sort';
import { LEGACY } from '@shell/store/features';
import { isAlternate } from '@shell/utils/platform';
import IconMessage from '@shell/components/IconMessage';
import TypeDescription from '@shell/components/TypeDescription';

export default {
  components: {
    AppSummaryGraph, LazyImage, Loading, IconMessage, TypeDescription
  },

  async fetch() {
    await this.$store.dispatch('catalog/load', { force: true, reset: true });

    const query = this.$route.query;
    const projects = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.PROJECT });

    this.showDeprecated = query[DEPRECATED] === _FLAGGED;
    this.showHidden = query[HIDDEN] === _FLAGGED;

    this.allInstalled = await this.$store.dispatch('cluster/findAll', { type: CATALOG.APP });

    // If legacy feature flag enabled
    if (this.legacyEnabled) {
      const res = await this.$store.dispatch('management/findMatching', {
        type:     MANAGEMENT.CATALOG_TEMPLATE,
        selector: 'catalog.cattle.io/name=system-library'
      });

      if (res) {
        this.v1SystemCatalog = res.reduce((map, template) => {
          map[template.spec.displayName] = template;

          return map;
        }, {});
      } else {
        this.v1SystemCatalog = {};
      }

      // Need the project ID of the system project in order to get the apps
      const systemProject = projects.find(p => p.spec?.displayName === 'System');

      if (systemProject) {
        const id = systemProject.id.replace('/', ':');

        this.systemProject = id;
        await this.$store.dispatch('rancher/findAll', {
          type: NORMAN.APP,
          opt:  { url: `/v3/project/${ id }/apps`, force: true }
        });
      }
    }
  },

  data() {
    const legacyEnabled = this.$store.getters['features/get'](LEGACY);

    return {
      allInstalled:    null,
      v1SystemCatalog: null,
      systemProject:   null,
      legacyEnabled,
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
      return this.$store.getters['catalog/repos'].find(x => x.isRancher);
    },

    installedApps() {
      return this.allInstalled;
    },

    installedAppForChart() {
      const out = {};

      for ( const app of this.installedApps ) {
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

      let charts = filterAndArrangeCharts(enabledCharts, {
        clusterProvider,
        showDeprecated: this.showDeprecated,
        showHidden:     this.showHidden,
        showRepos:      [this.rancherCatalog?._key],
        showTypes:      [CATALOG_ANNOTATIONS._CLUSTER_TOOL],
      });

      charts = charts.filter(c => c.sideLabel !== 'Experimental');

      //  If legacy support is enabled, show V1 charts for some V1 Cluster tools
      if (this.legacyEnabled) {
        charts = charts.concat(this.legacyCharts);
        charts = sortBy(charts, ['certifiedSort', 'chartNameDisplay']);
      }

      let chartsWithApps = charts.map((chart) => {
        return {
          chart,
          app: this.installedAppForChart[chart.id],
        };
      });

      // V1 Legacy support
      if (this.legacyEnabled) {
        chartsWithApps = this.checkLegacyApp(chartsWithApps, this.v1Apps, 'v1-monitoring', 'rancher-monitoring', 'cluster-monitoring', false);
        chartsWithApps = this.checkLegacyApp(chartsWithApps, this.v1Apps, 'v1-istio', 'rancher-istio', 'cluster-istio', true);
        chartsWithApps = this.checkLegacyApp(chartsWithApps, this.v1Apps, 'v1-logging', 'rancher-logging', 'rancher-logging', true);
      }

      return chartsWithApps;
    },

    legacyCharts() {
      // Fake charts for the legacy V1 tools
      return [
        this._legacyChart('monitoring'),
        this._legacyChart('logging'),
        this._legacyChart('istio'),
      ];
    }
  },

  watch: {
    namespaces() {
      // When the namespaces change, check the v1 apps - might indicate add or removal of a v1 app
      if (this.legacyEnabled && this.systemProject) {
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
    _legacyChart(id) {
      return {
        certifiedSort:    1,
        chartNameDisplay: this.t(`v1ClusterTools.${ id }.label`),
        chartDescription: this.t(`v1ClusterTools.${ id }.description`),
        id:               `v1-${ id }`,
        chartName:        `v1-${ id }`,
        key:              `v1-${ id }`,
        versions:         this.getLegacyVersions(`rancher-${ id }`),
        repoKey:          this.rancherCatalog?._key,
        legacy:           true,
        legacyPage:       id,
        iconName:         `icon-${ id }`,
      };
    },

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

    getLegacyVersions(id) {
      const versions = [];
      const c = this.v1SystemCatalog?.[id];

      if (c?.spec?.versions) {
        c.spec.versions.forEach(v => versions.push({ version: v.version }));
      }

      return versions;
    },

    checkLegacyApp(chartsWithApps, v1Apps, v1ChartName, v2ChartName, v1AppName, showOnlyIfInstalled) {
      const v1 = chartsWithApps.find(a => a.chart.chartName === v1ChartName);
      const v2 = chartsWithApps.find(a => a.chart.chartName === v2ChartName);

      if (v1) {
        const v1App = v1Apps.find(a => a.id.indexOf(v1AppName) > 0);

        v1.app = v1App;

        // Add in the upgrade version information for a legacy v1 app
        if (v1.app) {
          v1.app.upgradeAvailable = undefined;
          // Check if an upgrade is available
          if (v1.chart.versions?.length) {
            const latest = v1.chart.versions[0]?.version;

            if (v1.app.currentVersion !== latest) {
              v1.app.upgradeAvailable = latest;
            }
          }
        } else if (showOnlyIfInstalled) {
          // Remove the v1 chart if it is not already installed for charts which we no longer support
          chartsWithApps = chartsWithApps.filter(c => c !== v1);
        }

        if (v2) {
          if (v1.app) {
            v2.app = undefined;
            v2.blocked = true;
          } else if (v2.app) {
            v1.blocked = true;
          }
        }
      }

      return chartsWithApps;
    }
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

        &.legacy {
          background-color: transparent;
        }

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
    <h1 v-html="t('catalog.tools.header')" />
    <TypeDescription
      v-if="!legacyEnabled"
      resource="chart"
    />

    <div class="grid">
      <div
        v-for="opt in options"
        :key="opt.chart.id"
        class="item"
      >
        <div
          class="logo"
          :class="{'legacy': opt.chart.legacy}"
        >
          <i
            v-if="opt.chart.iconName"
            class="icon"
            :class="opt.chart.iconName"
          />
          <LazyImage
            v-else
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
            <template v-if="opt.app && opt.app.upgradeAvailable">
              v{{ opt.app.currentVersion }} <b><i class="icon icon-chevron-right" /> v{{ opt.app.upgradeAvailable }}</b>
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
            class="description-content"
            v-html="opt.chart.chartDescription"
          />
        </div>
        <div
          v-if="opt.app && !opt.chart.legacy"
          class="state"
        >
          <AppSummaryGraph
            :row="opt.app"
            label-key="generic.resourceCount"
            :link-to="opt.app.detailLocation"
          />
        </div>
        <div class="action">
          <template v-if="opt.blocked">
            <button
              disabled="true"
              class="btn btn-sm role-primary"
              v-html="t('catalog.tools.action.install')"
            />
          </template>
          <template v-else-if="opt.app && opt.chart.legacy">
            <button
              class="btn btn-sm role-secondary"
              @click="openV1Tool(opt.chart.legacyPage)"
              v-html="t('catalog.tools.action.manage')"
            />
          </template>
          <template v-else-if="opt.app && opt.upgradeAvailable && !opt.chart.legacy">
            <button
              class="btn btn-sm role-secondary"
              @click="remove(opt.app, $event)"
            >
              <i class="icon icon-delete icon-lg" />
            </button>
            <button
              class="btn btn-sm role-secondary"
              @click="edit(opt.app, opt.app.upgradeAvailable)"
              v-html="t('catalog.tools.action.upgrade')"
            />
          </template>
          <template v-else-if="opt.app">
            <button
              class="btn btn-sm role-secondary"
              @click="remove(opt.app, $event)"
            >
              <i class="icon icon-delete icon-lg" />
            </button>
            <button
              class="btn btn-sm role-secondary"
              @click="edit(opt.app)"
              v-html="t('catalog.tools.action.edit')"
            />
          </template>
          <template v-else-if="opt.chart.legacy">
            <button
              class="btn btn-sm role-primary"
              @click="openV1Tool(opt.chart.legacyPage)"
              v-html="t('catalog.tools.action.install')"
            />
          </template>
          <template v-else>
            <button
              class="btn btn-sm role-primary"
              @click="install(opt.chart)"
              v-html="t('catalog.tools.action.install')"
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
