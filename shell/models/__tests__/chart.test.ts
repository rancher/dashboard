import Chart from '@shell/models/chart';
import { APP_UPGRADE_STATUS } from '@shell/store/catalog';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import { ZERO_TIME } from '@shell/config/types';

type MockChartContext = {
  rootGetters: {
    'cluster/all': () => any[];
    'i18n/t': (key: string) => string;
  };
  dispatch?: jest.Mock;
};

interface CardContent {
  subHeaderItems: { label: string }[];
  footerItems: { labels: string[]; icon?: string }[];
  statuses: { tooltip: { key: string }; color: string }[];
}

const t = jest.fn((key) => key); // mock translation function
const dispatch = jest.fn();

const base = {
  chartName:       'my-app',
  repoName:        'my-repo',
  repoNameDisplay: 'My Repo',
  versions:        [
    {
      version: '1.3.0', home: 'https://example.com', created: '2024-03-10T12:00:00Z'
    },
    { version: '1.2.3', home: 'https://example.com' }
  ],
  categories: [],
  tags:       [],
  deprecated: false
};

function makeInstalledApp(upgradeAvailable = APP_UPGRADE_STATUS.NO_UPGRADE) {
  return {
    spec: {
      chart: {
        metadata: {
          name:        'my-app',
          version:     '1.3.0',
          home:        'https://example.com',
          annotations: { [CATALOG_ANNOTATIONS.SOURCE_REPO_NAME]: 'my-repo' }
        }
      }
    },
    metadata: {},
    upgradeAvailable
  };
}

describe('class Chart', () => {
  let ctx: MockChartContext;

  beforeEach(() => {
    ctx = {
      rootGetters: {
        'cluster/all': () => [],
        'i18n/t':      t
      },
      dispatch
    };
  });

  describe('matchingInstalledApps', () => {
    it('matches by name, repo, and home in latest version', () => {
      const installedApp = makeInstalledApp();

      ctx.rootGetters['cluster/all'] = () => [installedApp];

      const chart = new Chart(base, ctx);

      expect(chart.matchingInstalledApps).toHaveLength(1);
    });

    it('does not match if name is different', () => {
      const installedApp = makeInstalledApp();

      installedApp.spec.chart.metadata.name = 'different-app';
      ctx.rootGetters['cluster/all'] = () => [installedApp];

      const chart = new Chart(base, ctx);

      expect(chart.matchingInstalledApps).toHaveLength(0);
    });

    it('does not match if repo is different', () => {
      const installedApp = makeInstalledApp();

      installedApp.spec.chart.metadata.annotations[CATALOG_ANNOTATIONS.SOURCE_REPO_NAME] = 'different-repo';
      ctx.rootGetters['cluster/all'] = () => [installedApp];

      const chart = new Chart(base, ctx);

      expect(chart.matchingInstalledApps).toHaveLength(0);
    });

    it('matches by version+home when not latest', () => {
      const installedApp = makeInstalledApp();

      installedApp.spec.chart.metadata.version = '1.2.3';
      ctx.rootGetters['cluster/all'] = () => [installedApp];

      const chart = new Chart(base, ctx);

      expect(chart.matchingInstalledApps).toHaveLength(1);
    });

    it('can use fallback repo from metadata labels', () => {
      const installedApp = makeInstalledApp();

      installedApp.spec.chart.metadata.annotations = {};
      installedApp.metadata = { labels: { [CATALOG_ANNOTATIONS.CLUSTER_REPO_NAME]: 'my-repo' } };
      ctx.rootGetters['cluster/all'] = () => [installedApp];

      const chart = new Chart(base, ctx);

      expect(chart.matchingInstalledApps).toHaveLength(1);
    });
  });

  describe('isInstalled', () => {
    it('is true when one app matches', () => {
      const installedApp = makeInstalledApp();

      installedApp.spec.chart.metadata.version = '1.2.3';
      ctx.rootGetters['cluster/all'] = () => [installedApp];

      const chart = new Chart(base, ctx);

      expect(chart.isInstalled).toBe(true);
    });

    it('is false when no apps match', () => {
      const chart = new Chart(base, ctx);

      expect(chart.isInstalled).toBe(false);
    });

    it('is false when multiple apps match', () => {
      const app = makeInstalledApp();

      app.spec.chart.metadata.version = '1.2.3';
      ctx.rootGetters['cluster/all'] = () => [app, app];

      const chart = new Chart(base, ctx);

      expect(chart.isInstalled).toBe(false);
    });
  });

  describe('upgradeable', () => {
    it('is true when installed and upgradeAvailable is SINGLE_UPGRADE', () => {
      const installedApp = makeInstalledApp(APP_UPGRADE_STATUS.SINGLE_UPGRADE);

      installedApp.spec.chart.metadata.version = '1.2.3';
      ctx.rootGetters['cluster/all'] = () => [installedApp];

      const chart = new Chart(base, ctx);

      expect(chart.upgradeable).toBe(true);
    });

    it('is false if upgradeAvailable is different', () => {
      const installedApp = makeInstalledApp(APP_UPGRADE_STATUS.NO_UPGRADE);

      installedApp.spec.chart.metadata.version = '1.2.3';
      ctx.rootGetters['cluster/all'] = () => [installedApp];

      const chart = new Chart(base, ctx);

      expect(chart.upgradeable).toBe(false);
    });

    it('is false when not installed', () => {
      const chart = new Chart(base, ctx);

      expect(chart.upgradeable).toBe(false);
    });
  });

  describe('cardContent', () => {
    it('includes correct subHeader and footer info', () => {
      const chart = new Chart(base, ctx);

      const result = chart.cardContent as CardContent;

      expect(result.subHeaderItems).toHaveLength(2);
      expect(result.subHeaderItems[0].label).toBe('1.3.0');
      expect(result.subHeaderItems[1].label).toBe('Mar 10, 2024');

      expect(result.footerItems).toHaveLength(1);
      expect(result.footerItems[0].labels).toContain('My Repo');

      expect(result.statuses).toHaveLength(0);
    });

    it('includes category and tag items when present', () => {
      const chart = new Chart({
        ...base,
        categories: ['database'],
        tags:       ['linux', 'experimentl']
      }, ctx);

      const result = chart.cardContent as CardContent;

      expect(result.footerItems).toHaveLength(3);

      const categoryItem = result.footerItems.find((i) => i.icon === 'icon-category-alt');

      expect(categoryItem).toBeDefined();
      expect(categoryItem?.labels).toContain('database');

      const tagItem = result.footerItems.find((i) => i.icon === 'icon-tag-alt');

      expect(tagItem).toBeDefined();
      expect(tagItem?.labels).toStrictEqual(expect.arrayContaining(['linux', 'experimentl']));
    });

    it('includes deprecated status when deprecated is true', () => {
      const chart = new Chart({ ...base, deprecated: true }, ctx);

      const result = chart.cardContent as CardContent;

      const deprecatedStatus = result.statuses.find((s) => s.tooltip.key === 'generic.deprecated');

      expect(deprecatedStatus).toBeDefined();
      expect(deprecatedStatus?.color).toBe('error');
    });

    it('includes installed status when app is installed', () => {
      const installedApp = makeInstalledApp();

      ctx.rootGetters['cluster/all'] = () => [installedApp];

      const chart = new Chart(base, ctx);

      const result = chart.cardContent as CardContent;

      const installedStatus = result.statuses.find((s) => s.tooltip.key === 'generic.installed');

      expect(installedStatus).toBeDefined();
      expect(installedStatus?.color).toBe('success');
    });

    it('includes upgradeable status when upgrade is available', () => {
      const installedApp = makeInstalledApp(APP_UPGRADE_STATUS.SINGLE_UPGRADE);

      ctx.rootGetters['cluster/all'] = () => [installedApp];

      const chart = new Chart(base, ctx);

      const result = chart.cardContent as CardContent;

      const upgradeableStatus = result.statuses.find((s) => s.tooltip.key === 'generic.upgradeable');

      expect(upgradeableStatus).toBeDefined();
      expect(upgradeableStatus?.color).toBe('info');
    });

    it('shows all statuses together when all conditions are met', () => {
      const installedApp = makeInstalledApp(APP_UPGRADE_STATUS.SINGLE_UPGRADE);

      ctx.rootGetters['cluster/all'] = () => [installedApp];

      const chart = new Chart({ ...base, deprecated: true }, ctx);

      const result = chart.cardContent as CardContent;

      const keys = result.statuses.map((s) => s.tooltip.key);

      expect(keys).toStrictEqual(expect.arrayContaining([
        'generic.deprecated',
        'generic.upgradeable',
        'generic.installed'
      ]));
    });

    it('handles zero time for last updated date', () => {
      const chartWithZeroTime = {
        ...base,
        versions: [{
          ...base.versions[0],
          created: ZERO_TIME,
        }]
      };
      const chart = new Chart(chartWithZeroTime, {
        rootGetters: {
          'cluster/all': () => [],
          'i18n/t':      (key) => key
        },
      });

      const result = chart.cardContent;
      const lastUpdatedItem = result.subHeaderItems[1];

      expect(lastUpdatedItem.label).toBe('generic.na');
      expect(lastUpdatedItem.labelTooltip).toBe('catalog.charts.appChartCard.subHeaderItem.missingVersionDate');
    });
  });
});
