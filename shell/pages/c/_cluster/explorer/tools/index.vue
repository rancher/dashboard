<script>
import { mapGetters } from 'vuex';
import Loading from '@shell/components/Loading';
import { _FLAGGED, DEPRECATED as DEPRECATED_QUERY, HIDDEN, FROM_TOOLS } from '@shell/config/query-params';
import { filterAndArrangeCharts, APP_UPGRADE_STATUS } from '@shell/store/catalog';
import { CATALOG, NORMAN } from '@shell/config/types';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import { isAlternate } from '@shell/utils/platform';
import IconMessage from '@shell/components/IconMessage';
import TabTitle from '@shell/components/TabTitle';
import { get } from '@shell/utils/object';
import { RcItemCard } from '@components/RcItemCard';
import AppChartCardSubHeader from '@shell/pages/c/_cluster/apps/charts/AppChartCardSubHeader';
import AppChartCardFooter from '@shell/pages/c/_cluster/apps/charts/AppChartCardFooter';

export default {
  components: {
    Loading, IconMessage, TabTitle, RcItemCard, AppChartCardSubHeader, AppChartCardFooter
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

    appChartCards() {
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

      return charts.map((chart) => {
        const installedApp = this.installedAppForChart[chart.id];
        const card = {
          id:     chart.id,
          header: {
            title:    { text: chart.chartNameDisplay },
            statuses: chart.cardContent.statuses
          },
          subHeaderItems: chart.cardContent.subHeaderItems,
          footerItems:    chart.deploysOnWindows ? [{
            icon:        'icon-tag-alt',
            iconTooltip: { key: 'generic.tags' },
            labels:      [this.t('catalog.charts.deploysOnWindows')],
          }] : [],
          image:    { src: chart.versions[0].icon, alt: { text: this.t('catalog.charts.iconAlt', { app: get(chart, 'chartNameDisplay') }) } },
          content:  { text: chart.chartDescription },
          rawChart: chart,
          installedApp,
        };

        return card;
      });
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
    handleCardAction(payload, card) {
      switch (payload?.action) {
      case 'upgrade':
        this.upgrade(card.installedApp, card.rawChart);
        break;
      case 'downgrade':
        this.downgrade(card.installedApp, card.rawChart);
        break;
      case 'edit':
        this.edit(card.installedApp);
        break;
      case 'remove':
        this.remove(card.installedApp, payload.event);
        break;
      case 'install':
        this.install(card.rawChart);
        break;
      default:
        console.warn(`Unknown card action: ${ payload?.action }`); // eslint-disable-line no-console
      }
    },

    getCardActions(card) {
      const { installedApp, rawChart } = card;

      if (installedApp) {
        const actions = [];
        const upgradeAvailable = installedApp.upgradeAvailable === APP_UPGRADE_STATUS.SINGLE_UPGRADE;

        if (upgradeAvailable) {
          actions.push({
            label:  this.t('catalog.tools.action.upgrade'),
            icon:   'icon-upgrade-alt',
            action: 'upgrade',
          });
        }

        actions.push({
          label:  this.t('catalog.tools.action.edit'),
          icon:   'icon-edit',
          action: 'edit',
        });

        const currentVersion = installedApp.spec?.chart?.metadata?.version;
        const versions = rawChart.versions;
        const currentIndex = versions.findIndex((v) => v.version === currentVersion);

        if (currentIndex !== -1 && currentIndex < versions.length - 1) {
          actions.push({
            label:  this.t('catalog.tools.action.downgrade'),
            icon:   'icon-downgrade-alt',
            action: 'downgrade',
          });
        }

        actions.push({ divider: true });

        actions.push({
          label:  this.t('catalog.tools.action.remove'),
          icon:   'icon-delete',
          action: 'remove',
        });

        return actions;
      }

      return [
        {
          label:   this.t('catalog.tools.action.install'),
          action:  'install',
          icon:    'icon-plus',
          enabled: !rawChart.blocked
        }
      ];
    },
    upgrade(app, chart) {
      const latestVersion = chart.versions[0].version;

      this.edit(app, latestVersion);
    },

    downgrade(app, chart) {
      const currentVersion = app.spec?.chart?.metadata?.version;
      const versions = chart.versions;
      const currentIndex = versions.findIndex((v) => v.version === currentVersion);

      if (currentIndex !== -1 && currentIndex < versions.length - 1) {
        const downgradeVersion = versions[currentIndex + 1].version;

        this.edit(app, downgradeVersion);
      }
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
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else-if="appChartCards.length">
    <h1 class="mmb-6">
      <TabTitle>{{ t('catalog.tools.header') }}</TabTitle>
    </h1>

    <div
      class="tools-app-chart-cards"
      data-testid="tools-app-chart-cards"
    >
      <rc-item-card
        v-for="card in appChartCards"
        :id="card.id"
        :key="card.id"
        :header="card.header"
        :image="card.image"
        :content="card.content"
        :actions="getCardActions(card)"
        :class="{ 'single-card': appChartCards.length === 1 }"
        @action-invoked="(payload) => handleCardAction(payload, card)"
      >
        <template
          v-once
          #item-card-sub-header
        >
          <AppChartCardSubHeader :items="card.subHeaderItems" />
        </template>
        <template
          v-once
          #item-card-footer
        >
          <AppChartCardFooter :items="card.footerItems" />
        </template>
      </rc-item-card>
    </div>
  </div>
  <div v-else>
    <IconMessage
      icon="icon-warning"
      message-key="catalog.tools.noTools"
    />
  </div>
</template>

<style lang="scss" scoped>
  .tools-app-chart-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    grid-gap: var(--gap-md);
    width: 100%;
    height: max-content;
    overflow: hidden;

    .single-card {
      max-width: 500px;
    }
  }
</style>
