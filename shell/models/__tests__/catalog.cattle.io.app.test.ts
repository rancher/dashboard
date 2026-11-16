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

// Simulates the chart data fetched from the repository where the home URL has changed in newer versions
// AND the older installed version has been dropped/replaced from the repository index.
const certManagerOfficialMatchingChartNewHomeOnly = {
  name:     chartName,
  repoName: certManagerOfficial.repoName,
  versions: [{
    version:     latestVersion,
    home:        certManagerOfficial.home,
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
      [installedCertManagerOfficialFromRancherUI, [certManagerOfficialMatchingChart1, certManagerOfficialMatchingChart2], APP_UPGRADE_STATUS.MULTIPLE_UPGRADES],
      [installedCertManagerOfficialFromRancherUI, [certManagerOfficialMatchingChartNewHomeOnly], APP_UPGRADE_STATUS.SINGLE_UPGRADE]
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

  describe('valuesLoaded', () => {
    it('should be false if data is missing (e.g. secret)', () => {
      const catalogApp = new CatalogApp({});

      jest.spyOn(catalogApp, '_secret', 'get').mockReturnValue(null);

      expect(catalogApp.valuesLoaded).toBe(false);
    });

    it('should be false if part of the data is missing', () => {
      const catalogApp = new CatalogApp({});

      jest.spyOn(catalogApp, '_secret', 'get').mockReturnValue({ data: {} });

      expect(catalogApp.valuesLoaded).toBe(false);
    });

    it('should be true if all required data is present', () => {
      const catalogApp = new CatalogApp({});

      jest.spyOn(catalogApp, '_secret', 'get').mockReturnValue({
        data: {
          release: {
            config: { foo: 'bar' },
            chart:  { values: { baz: 'qux' } }
          }
        }
      });

      expect(catalogApp.valuesLoaded).toBe(true);
    });
  });

  describe('relatedResourcesToRemove', () => {
    const notFound = { status: 404, code: 'NotFound' };

    const createApp = (dispatch: jest.Mock, namespace = 'compliance-operator-system') => new CatalogApp({
      metadata: { name: 'rancher-compliance', namespace },
      spec:     { chart: { metadata: { annotations: { [CATALOG_ANNOTATIONS.AUTO_INSTALL]: 'rancher-compliance-crd=match' } } } }
    }, { dispatch });

    it('should look up the CRD app named by the auto-install annotation, in the namespace of the app', async() => {
      const dispatch = jest.fn().mockResolvedValue({});

      await createApp(dispatch).relatedResourcesToRemove();

      expect(dispatch).toHaveBeenCalledWith('find', { type: 'catalog.cattle.io.app', id: 'compliance-operator-system/rancher-compliance-crd' });
    });

    it('should resolve to the CRD app when it exists', async() => {
      const crdApp = { id: 'compliance-operator-system/rancher-compliance-crd' };
      const dispatch = jest.fn().mockResolvedValue(crdApp);

      const res = await createApp(dispatch).relatedResourcesToRemove();

      expect(res).toBe(crdApp);
    });

    it('should resolve to a stand-in for the CRD app when it has already been removed', async() => {
      const dispatch = jest.fn().mockRejectedValue(notFound);

      const res = await createApp(dispatch).relatedResourcesToRemove();

      expect(res).toStrictEqual(expect.objectContaining({
        id: 'compliance-operator-system/rancher-compliance-crd', type: 'catalog.cattle.io.app', nameDisplay: 'rancher-compliance-crd'
      }));
    });

    it('should resolve to the same stand-in each time, so it can be found again to be taken back out', async() => {
      const dispatch = jest.fn().mockRejectedValue(notFound);

      const first = await createApp(dispatch).relatedResourcesToRemove();
      const second = await createApp(dispatch).relatedResourcesToRemove();

      expect(second).toBe(first);
    });

    it('should resolve to a stand-in of its own for an app in another namespace', async() => {
      const dispatch = jest.fn().mockRejectedValue(notFound);

      await createApp(dispatch).relatedResourcesToRemove();
      const other = await createApp(dispatch, 'other-namespace').relatedResourcesToRemove();

      expect(other.id).toBe('other-namespace/rancher-compliance-crd');
    });

    it('should resolve when the stand-in is removed', async() => {
      const dispatch = jest.fn().mockRejectedValue(notFound);
      const standIn = await createApp(dispatch).relatedResourcesToRemove();

      await expect(standIn.remove()).resolves.toBeUndefined();
    });

    it.each([
      ['forbidden', { status: 403, code: 'Forbidden' }],
      ['a network failure', new Error('Network Error')],
      ['no error at all', undefined],
    ])('should reject when finding the CRD app fails with %s', async(_, error) => {
      const dispatch = jest.fn().mockRejectedValue(error);

      await expect(createApp(dispatch).relatedResourcesToRemove()).rejects.toBe(error);
    });
  });
});
