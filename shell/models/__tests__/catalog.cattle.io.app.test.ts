import CatalogApp from '@shell/models/catalog.cattle.io.app';
import { APP_UPGRADE_STATUS } from '@shell/store/catalog';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';

const latestVersion = '1.16.2';
const secondLatestVersion = '1.16.1';
const chartName = 'cert-manager';

const appCo = {
  repoName: 'appCo',
  home:     'https://apps.rancher.io/applications/cert-manager'
};

const certManagerOfficial = {
  repoName: 'certManagerOfficial',
  home:     'https://cert-manager.io',
  oldHome:  'https://github.com/jetstack/cert-manager' // older versions of cert-manager used to have this home url(e.g. 1.7.1)
};

// cert-manager chart from application collection OCI repo
const appCoMatchingChart1 = {
  name:     chartName,
  repoName: appCo.repoName,
  versions: [{
    version:     latestVersion,
    home:        appCo.home,
    repoName:    appCo.repoName,
    annotations: {}
  },
  {
    version:     secondLatestVersion,
    home:        appCo.home,
    repoName:    appCo.repoName,
    annotations: {}
  }]
};

const appCoMatchingChart2 = {
  name:     chartName,
  repoName: appCo.repoName,
  versions: [{
    version:     latestVersion,
    home:        appCo.home,
    repoName:    appCo.repoName,
    annotations: {}
  },
  {
    version:     secondLatestVersion,
    home:        appCo.home,
    repoName:    appCo.repoName,
    annotations: {}
  }]
};

// cert-manager chart from its official helm repo 'https://cert-manager.io' added to Rancher UI repositories
const certManagerOfficialMatchingChart1 = {
  name:     chartName,
  repoName: certManagerOfficial.repoName,
  versions: [{
    version:     latestVersion,
    home:        certManagerOfficial.home,
    repoName:    certManagerOfficial.repoName,
    annotations: {},
  },
  {
    version:     secondLatestVersion,
    home:        certManagerOfficial.oldHome,
    repoName:    certManagerOfficial.repoName,
    annotations: {},
  }]
};

const certManagerOfficialMatchingChart2 = {
  name:     chartName,
  repoName: certManagerOfficial.repoName,
  versions: [{
    version:     latestVersion,
    home:        certManagerOfficial.home,
    repoName:    certManagerOfficial.repoName,
    annotations: {},
  },
  {
    version:     secondLatestVersion,
    home:        certManagerOfficial.oldHome,
    repoName:    certManagerOfficial.repoName,
    annotations: {},
  }]
};

const installedCertManagerAppCoFromRancherUI = {
  metadata: {
    annotations: { [CATALOG_ANNOTATIONS.SOURCE_REPO_NAME]: appCo.repoName },
    name:        chartName,
    home:        appCo.home,
    version:     secondLatestVersion
  }
};

const installedCertManagerOfficialFromCli = {
  metadata: {
    name:    chartName,
    home:    certManagerOfficial.oldHome,
    version: secondLatestVersion
  }
};

const installedCertManagerOfficialFromRancherUI = {
  metadata: {
    annotations: { [CATALOG_ANNOTATIONS.SOURCE_REPO_NAME]: certManagerOfficial.repoName },
    name:        chartName,
    home:        certManagerOfficial.oldHome,
    version:     secondLatestVersion
  }
};

describe('class CatalogApp', () => {
  describe('upgradeAvailable', () => {
    const testCases = [
      // when you follow Rancher Installation docs to install cert-manager through CLI
      [installedCertManagerOfficialFromCli, [], APP_UPGRADE_STATUS.NO_UPGRADE],
      [installedCertManagerOfficialFromCli, [appCoMatchingChart1], APP_UPGRADE_STATUS.NO_UPGRADE],
      [installedCertManagerOfficialFromCli, [appCoMatchingChart1, appCoMatchingChart2], APP_UPGRADE_STATUS.NO_UPGRADE],
      [installedCertManagerOfficialFromCli, [appCoMatchingChart1, appCoMatchingChart2, certManagerOfficialMatchingChart1], APP_UPGRADE_STATUS.SINGLE_UPGRADE],
      // when you add application collection OCI repo through UI
      [installedCertManagerAppCoFromRancherUI, [], APP_UPGRADE_STATUS.NO_UPGRADE],
      [installedCertManagerAppCoFromRancherUI, [appCoMatchingChart1], APP_UPGRADE_STATUS.SINGLE_UPGRADE],
      [installedCertManagerAppCoFromRancherUI, [appCoMatchingChart1, certManagerOfficialMatchingChart1], APP_UPGRADE_STATUS.SINGLE_UPGRADE],
      [installedCertManagerAppCoFromRancherUI, [appCoMatchingChart1, appCoMatchingChart2], APP_UPGRADE_STATUS.MULTIPLE_UPGRADES],
      // when you add cert-manager official helm repo through UI
      [installedCertManagerOfficialFromRancherUI, [], APP_UPGRADE_STATUS.NO_UPGRADE],
      [installedCertManagerOfficialFromRancherUI, [certManagerOfficialMatchingChart1], APP_UPGRADE_STATUS.SINGLE_UPGRADE],
      [installedCertManagerOfficialFromRancherUI, [certManagerOfficialMatchingChart1, appCoMatchingChart1], APP_UPGRADE_STATUS.SINGLE_UPGRADE],
      [installedCertManagerOfficialFromRancherUI, [certManagerOfficialMatchingChart1, certManagerOfficialMatchingChart2], APP_UPGRADE_STATUS.MULTIPLE_UPGRADES]
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
