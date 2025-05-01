import Chart from '@shell/models/chart';
import { APP_UPGRADE_STATUS } from '@shell/store/catalog';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';

const base = {
  chartName: 'my-app',
  repoName:  'my-repo',
  versions:  [
    { version: '1.3.0', home: 'https://example.com' },
    { version: '1.2.3', home: 'https://example.com' }
  ]
};

describe('class Chart', () => {
  describe('matchingInstalledApps', () => {
    it('matches by name, repo, and home in latest version', () => {
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

      expect(chart.matchingInstalledApps).toHaveLength(1);
    });

    it('does not match if name is different', () => {
      const installedApp = {
        spec: {
          chart: {
            metadata: {
              name:        'different-app',
              version:     '1.2.3',
              home:        'https://example.com',
              annotations: { [CATALOG_ANNOTATIONS.SOURCE_REPO_NAME]: 'my-repo' }
            }
          }
        }
      };

      const chart = new Chart(base, { rootGetters: { 'cluster/all': () => [installedApp] } });

      expect(chart.matchingInstalledApps).toHaveLength(0);
    });

    it('does not match if repo is different', () => {
      const installedApp = {
        spec: {
          chart: {
            metadata: {
              name:        'my-app',
              version:     '1.2.3',
              home:        'https://example.com',
              annotations: { [CATALOG_ANNOTATIONS.SOURCE_REPO_NAME]: 'different-repo' }
            }
          }
        }
      };

      const chart = new Chart(base, { rootGetters: { 'cluster/all': () => [installedApp] } });

      expect(chart.matchingInstalledApps).toHaveLength(0);
    });

    it('matches by version+home when not latest', () => {
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

      expect(chart.matchingInstalledApps).toHaveLength(1);
    });

    it('can use fallback repo from metadata labels', () => {
      const installedApp = {
        spec: {
          chart: {
            metadata: {
              name:        'my-app',
              version:     '1.2.3',
              home:        'https://example.com',
              annotations: {} // No SOURCE_REPO_NAME
            }
          }
        },
        metadata: { labels: { [CATALOG_ANNOTATIONS.CLUSTER_REPO_NAME]: 'my-repo' } }
      };

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

  describe('versionDisplay', () => {
    it('returns currentVersion when installed and upgradeable', () => {
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
        upgradeAvailable: APP_UPGRADE_STATUS.SINGLE_UPGRADE,
        currentVersion:   '1.0.0'
      };

      const chart = new Chart(base, { rootGetters: { 'cluster/all': () => [installedApp] } });

      expect(chart.versionDisplay).toBe('1.0.0');
    });

    it('returns latest version if not upgradeable', () => {
      const chart = new Chart(base, { rootGetters: { 'cluster/all': () => [] } });

      expect(chart.versionDisplay).toBe('1.3.0');
    });
  });
});
