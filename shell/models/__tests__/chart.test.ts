import Chart from '@shell/models/chart';
import { APP_UPGRADE_STATUS } from '@shell/store/catalog';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';

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
    upgradeAvailable
  };
}

describe('class Chart', () => {
  describe('matchingInstalledApps', () => {
    it('matches by name, repo, and home in latest version', () => {
      const installedApp = makeInstalledApp();

      const chart = new Chart(base, { rootGetters: { 'cluster/all': () => [installedApp] } });

      expect(chart.matchingInstalledApps).toHaveLength(1);
    });

    it('does not match if name is different', () => {
      const installedApp = makeInstalledApp();

      installedApp.spec.chart.metadata.name = 'different-app';

      const chart = new Chart(base, { rootGetters: { 'cluster/all': () => [installedApp] } });

      expect(chart.matchingInstalledApps).toHaveLength(0);
    });

    it('does not match if repo is different', () => {
      const installedApp = makeInstalledApp();

      installedApp.spec.chart.metadata.annotations[CATALOG_ANNOTATIONS.SOURCE_REPO_NAME] = 'different-repo';

      const chart = new Chart(base, { rootGetters: { 'cluster/all': () => [installedApp] } });

      expect(chart.matchingInstalledApps).toHaveLength(0);
    });

    it('matches by version+home when not latest', () => {
      const installedApp = makeInstalledApp();

      installedApp.spec.chart.metadata.version = '1.2.3'; // not the latest in base

      const chart = new Chart(base, { rootGetters: { 'cluster/all': () => [installedApp] } });

      expect(chart.matchingInstalledApps).toHaveLength(1);
    });

    it('can use fallback repo from metadata labels', () => {
      const installedApp = makeInstalledApp();

      installedApp.spec.chart.metadata.annotations = {}; // remove SOURCE_REPO_NAME
      installedApp.metadata = { labels: { [CATALOG_ANNOTATIONS.CLUSTER_REPO_NAME]: 'my-repo' } };

      const chart = new Chart(base, { rootGetters: { 'cluster/all': () => [installedApp] } });

      expect(chart.matchingInstalledApps).toHaveLength(1);
    });
  });

  describe('isInstalled', () => {
    it('is true when one app matches', () => {
      const installedApp = {
        spec: {
          chart: {
            metadata: {
              name:        'my-app',
              version:     '1.2.3',
              home:        'https://example.com',
              annotations: { [CATALOG_ANNOTATIONS.SOURCE_REPO_NAME]: 'my-repo' }
            }
          }
        }
      };

      const chart = new Chart(base, { rootGetters: { 'cluster/all': () => [installedApp] } });

      expect(chart.isInstalled).toBe(true);
    });

    it('is false when no apps match', () => {
      const chart = new Chart(base, { rootGetters: { 'cluster/all': () => [] } });

      expect(chart.isInstalled).toBe(false);
    });

    it('is false when multiple apps match', () => {
      const appTemplate = {
        spec: {
          chart: {
            metadata: {
              name:        'my-app',
              version:     '1.2.3',
              home:        'https://example.com',
              annotations: { [CATALOG_ANNOTATIONS.SOURCE_REPO_NAME]: 'my-repo' }
            }
          }
        }
      };

      const chart = new Chart(base, { rootGetters: { 'cluster/all': () => [appTemplate, appTemplate] } });

      expect(chart.isInstalled).toBe(false);
    });
  });

  describe('upgradeable', () => {
    it('is true when installed and upgradeAvailable is SINGLE_UPGRADE', () => {
      const installedApp = {
        spec: {
          chart: {
            metadata: {
              name:        'my-app',
              version:     '1.2.3',
              home:        'https://example.com',
              annotations: { [CATALOG_ANNOTATIONS.SOURCE_REPO_NAME]: 'my-repo' }
            }
          }
        },
        upgradeAvailable: APP_UPGRADE_STATUS.SINGLE_UPGRADE
      };

      const chart = new Chart(base, { rootGetters: { 'cluster/all': () => [installedApp] } });

      expect(chart.upgradeable).toBe(true);
    });

    it('is false if upgradeAvailable is different', () => {
      const installedApp = {
        spec: {
          chart: {
            metadata: {
              name:        'my-app',
              version:     '1.2.3',
              home:        'https://example.com',
              annotations: { [CATALOG_ANNOTATIONS.SOURCE_REPO_NAME]: 'my-repo' }
            }
          }
        },
        upgradeAvailable: APP_UPGRADE_STATUS.NO_UPGRADE
      };

      const chart = new Chart(base, { rootGetters: { 'cluster/all': () => [installedApp] } });

      expect(chart.upgradeable).toBe(false);
    });

    it('is false when not installed', () => {
      const chart = new Chart(base, { rootGetters: { 'cluster/all': () => [] } });

      expect(chart.upgradeable).toBe(false);
    });
  });

  describe('cardContent', () => {
    it('includes correct subHeader and footer info', () => {
      const chart = new Chart(base, { rootGetters: { 'cluster/all': () => [] } });

      const result = chart.cardContent;

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
      }, { rootGetters: { 'cluster/all': () => [] } });

      const result = chart.cardContent;

      expect(result.footerItems).toHaveLength(3);

      const categoryItem = result.footerItems.find((i) => i.icon === 'icon-category-alt');

      expect(categoryItem).toBeDefined();
      expect(categoryItem.labels).toContain('database');

      const tagItem = result.footerItems.find((i) => i.icon === 'icon-tag-alt');

      expect(tagItem).toBeDefined();
      expect(tagItem.labels).toStrictEqual(expect.arrayContaining(['linux', 'experimentl']));
    });

    it('includes deprecated status when deprecated is true', () => {
      const chart = new Chart({ ...base, deprecated: true }, { rootGetters: { 'cluster/all': () => [] } });

      const result = chart.cardContent;

      const deprecatedStatus = result.statuses.find((s) => s.tooltip.key === 'generic.deprecated');

      expect(deprecatedStatus).toBeDefined();
      expect(deprecatedStatus.color).toBe('error');
    });

    it('includes installed status when app is installed', () => {
      const installedApp = makeInstalledApp();

      const chart = new Chart(base, { rootGetters: { 'cluster/all': () => [installedApp] } });

      const result = chart.cardContent;

      const installedStatus = result.statuses.find((s) => s.tooltip.key === 'generic.installed');

      expect(installedStatus).toBeDefined();
      expect(installedStatus.color).toBe('success');
    });

    it('includes upgradeable status when upgrade is available', () => {
      const installedApp = makeInstalledApp(APP_UPGRADE_STATUS.SINGLE_UPGRADE);

      const chart = new Chart(base, { rootGetters: { 'cluster/all': () => [installedApp] } });

      const result = chart.cardContent;

      const upgradeableStatus = result.statuses.find((s) => s.tooltip.key === 'generic.upgradeable');

      expect(upgradeableStatus).toBeDefined();
      expect(upgradeableStatus.color).toBe('info');
    });

    it('shows all statuses together when all conditions are met', () => {
      const installedApp = makeInstalledApp(APP_UPGRADE_STATUS.SINGLE_UPGRADE);

      const chart = new Chart({ ...base, deprecated: true }, { rootGetters: { 'cluster/all': () => [installedApp] } });

      const result = chart.cardContent;

      const keys = result.statuses.map((s) => s.tooltip.key);

      expect(keys).toStrictEqual(expect.arrayContaining([
        'generic.deprecated',
        'generic.upgradeable',
        'generic.installed'
      ]));
    });
  });
});
