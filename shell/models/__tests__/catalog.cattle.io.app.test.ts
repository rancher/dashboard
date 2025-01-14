import CatalogApp from '@shell/models/catalog.cattle.io.app';
import { APP_UPGRADE_STATUS } from '@shell/store/catalog';

const latestVersion = '1.16.2';
const secondLatestVersion = '1.16.1';
const chartName = 'cert-manager';

const appCo = {
  repoName: 'appCo',
  home:     'https://apps.rancher.io/applications/cert-manager'
};

const certManagerFromCli = { home: 'https://github.com/jetstack/cert-manager' };

const certManagerOfficial = {
  repoName: 'certManagerOfficial',
  home:     'https://cert-manager.io'
};

// cert-manager chart from application collection OCI repo
const matchingChart1 = {
  name:     chartName,
  repoName: appCo.repoName,
  versions: [{
    version:     latestVersion,
    home:        appCo.home,
    repoName:    appCo.repoName,
    annotations: {}
  }]
};

// cert-manager chart from its official helm repo 'https://cert-manager.io' added to Rancher UI repositories
const matchingChart2 = {
  name:     chartName,
  repoName: certManagerOfficial.repoName,
  versions: [{
    version:     latestVersion,
    home:        certManagerOfficial.home,
    repoName:    certManagerOfficial.repoName,
    annotations: {},
  }]
};

const installedChartFromCli = {
  metadata: {
    name:    chartName,
    home:    certManagerFromCli.home,
    version: secondLatestVersion
  }
};

const installedChartFromRancherUI = {
  metadata: {
    name:    chartName,
    home:    certManagerOfficial.home,
    version: secondLatestVersion
  }
};

// // home is not set
// const installedCustomChartFromRancherUI = {
//   metadata: {
//     name:    chartName,
//     version: secondLatestVersion
//   }
// };

describe('class CatalogApp', () => {
  describe('upgradeAvailable', () => {
    // TODO: more test cases
    const testCases = [
      [installedChartFromCli, [matchingChart1, matchingChart2], APP_UPGRADE_STATUS.NO_UPGRADE],
      [installedChartFromRancherUI, [matchingChart1, matchingChart2], APP_UPGRADE_STATUS.SINGLE_UPGRADE]
    ];

    it.each(testCases)('should return the correct upgrade status', (installedChart: Object, matchingCharts: any, expected: any) => {
      const catalogApp = new CatalogApp({ spec: { chart: installedChart } }, {
        rootGetters: {
          'catalog/chart': () => matchingCharts,
          currentCluster:  { workerOSs: ['linux'] },
          'prefs/get':     () => false
        }
      });

      expect(catalogApp.upgradeAvailable).toBe(expected);
    });
  });
});
