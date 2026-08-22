import {
  onExtensionsReady,
  getLatestExtensionVersion,
  installHelmChart,
} from '@shell/utils/uiplugins';

import { isSupportedChartVersion } from '@shell/config/uiplugins';

// Mock dependencies with no real disk/network I/O
jest.mock('@shell/config/uiplugins', () => ({
  UI_PLUGIN_BASE_URL:      '/v1/uiplugins',
  isSupportedChartVersion: jest.fn(),
  UI_PLUGIN_LABELS:        { CATALOG_IMAGE: 'catalog.cattle.io/ui-catalog-image' },
}));

jest.mock('@shell/utils/string', () => ({ matchesSomeRegex: jest.fn() }));

jest.mock('@shell/config/labels-annotations', () => ({
  CATALOG: {
    SOURCE_REPO_TYPE: 'catalog.cattle.io/ui-source-repo-type',
    SOURCE_REPO_NAME: 'catalog.cattle.io/ui-source-repo',
  },
}));

jest.mock('@shell/config/types', () => ({ CATALOG: { CLUSTER_REPO: 'catalog.cattle.io.clusterrepo' } }));

const mockIsSupportedChartVersion = isSupportedChartVersion as jest.Mock;

describe('shell/utils/uiplugins', () => {
  describe('onExtensionsReady', () => {
    it('returns early when already ready', async() => {
      const store = {
        getters:  { 'uiplugins/ready': true, 'uiplugins/plugins': [] },
        dispatch: jest.fn(),
      };

      await onExtensionsReady(store);

      expect(store.dispatch).not.toHaveBeenCalled();
    });

    it('dispatches setReady when not yet ready and no plugins', async() => {
      const store = {
        getters:  { 'uiplugins/ready': false, 'uiplugins/plugins': [] },
        dispatch: jest.fn(),
      };

      await onExtensionsReady(store);

      expect(store.dispatch).toHaveBeenCalledWith('uiplugins/setReady', true);
    });

    it('calls onLogIn on each plugin', async() => {
      const onLogIn1 = jest.fn().mockResolvedValue(undefined);
      const onLogIn2 = jest.fn().mockResolvedValue(undefined);
      const store = {
        getters: {
          'uiplugins/ready':   false,
          'uiplugins/plugins': [
            { name: 'ext1', onLogIn: onLogIn1 },
            { name: 'ext2', onLogIn: onLogIn2 },
          ],
        },
        dispatch: jest.fn(),
      };

      await onExtensionsReady(store);

      expect(onLogIn1).toHaveBeenCalledWith(store);
      expect(onLogIn2).toHaveBeenCalledWith(store);
      expect(store.dispatch).toHaveBeenCalledWith('uiplugins/setReady', true);
    });

    it('continues to next plugin and dispatches setReady even when onLogIn throws', async() => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const onLogIn1 = jest.fn().mockRejectedValue(new Error('ext error'));
      const onLogIn2 = jest.fn().mockResolvedValue(undefined);
      const store = {
        getters: {
          'uiplugins/ready':   false,
          'uiplugins/plugins': [
            { name: 'failing-ext', onLogIn: onLogIn1 },
            { name: 'working-ext', onLogIn: onLogIn2 },
          ],
        },
        dispatch: jest.fn(),
      };

      await onExtensionsReady(store);

      expect(onLogIn2).toHaveBeenCalled();
      expect(store.dispatch).toHaveBeenCalledWith('uiplugins/setReady', true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('failing-ext'),
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });

    it('treats null plugins getter as empty array', async() => {
      const store = {
        getters:  { 'uiplugins/ready': false, 'uiplugins/plugins': null },
        dispatch: jest.fn(),
      };

      await onExtensionsReady(store);

      expect(store.dispatch).toHaveBeenCalledWith('uiplugins/setReady', true);
    });
  });

  describe('getLatestExtensionVersion', () => {
    it('returns the first compatible version', async() => {
      mockIsSupportedChartVersion.mockImplementation(({ version }) => version.version !== '1.0.0');

      const store = {
        dispatch: jest.fn().mockResolvedValue(undefined),
        getters:  {
          'catalog/chart': () => ({
            versions: [
              { version: '1.0.0' },
              { version: '2.0.0' },
              { version: '3.0.0' },
            ],
          }),
        },
      };

      const result = await getLatestExtensionVersion(store, 'my-chart', '2.13.0', '1.26.0');

      expect(result).toBe('2.0.0');
    });

    it('returns undefined when no compatible versions exist', async() => {
      mockIsSupportedChartVersion.mockReturnValue(false);

      const store = {
        dispatch: jest.fn().mockResolvedValue(undefined),
        getters:  { 'catalog/chart': () => ({ versions: [{ version: '1.0.0' }] }) },
      };

      const result = await getLatestExtensionVersion(store, 'my-chart', '2.13.0', '1.26.0');

      expect(result).toBeUndefined();
    });

    it('returns undefined when chart is not found', async() => {
      const store = {
        dispatch: jest.fn().mockResolvedValue(undefined),
        getters:  { 'catalog/chart': () => undefined },
      };

      const result = await getLatestExtensionVersion(store, 'missing-chart', '2.13.0', '1.26.0');

      expect(result).toBeUndefined();
    });

    it('dispatches catalog/load with provided options', async() => {
      const store = {
        dispatch: jest.fn().mockResolvedValue(undefined),
        getters:  { 'catalog/chart': () => ({ versions: [] }) },
      };

      const opt = { reset: false, force: false };

      await getLatestExtensionVersion(store, 'my-chart', '2.13.0', '1.26.0', opt);

      expect(store.dispatch).toHaveBeenCalledWith('catalog/load', opt);
    });
  });

  describe('installHelmChart', () => {
    it('calls doAction with install by default', async() => {
      const mockResult = { id: 'install-123' };
      const repo = { doAction: jest.fn().mockResolvedValue(mockResult) };
      const chart = {
        name:     'my-extension',
        version:  '1.2.3',
        repoType: 'helm',
        repoName: 'rancher-ui-plugins',
      };

      const result = await installHelmChart(repo, chart);

      expect(repo.doAction).toHaveBeenCalledWith('install', expect.objectContaining({
        charts: expect.arrayContaining([
          expect.objectContaining({
            chartName:   'my-extension',
            version:     '1.2.3',
            releaseName: 'my-extension',
          }),
        ]),
        namespace: 'default',
        wait:      true,
      }));
      expect(result).toStrictEqual(mockResult);
    });

    it('calls doAction with upgrade action when specified', async() => {
      const repo = { doAction: jest.fn().mockResolvedValue({}) };
      const chart = {
        name:     'my-extension',
        version:  '2.0.0',
        repoType: 'helm',
        repoName: 'rancher-ui-plugins',
      };

      await installHelmChart(repo, chart, {}, 'default', 'upgrade');

      expect(repo.doAction).toHaveBeenCalledWith('upgrade', expect.any(Object));
    });

    it('uses provided namespace', async() => {
      const repo = { doAction: jest.fn().mockResolvedValue({}) };
      const chart = {
        name:     'my-extension',
        version:  '1.0.0',
        repoType: 'helm',
        repoName: 'rancher-ui-plugins',
      };

      await installHelmChart(repo, chart, {}, 'cattle-ui-plugin-system');

      expect(repo.doAction).toHaveBeenCalledWith('install', expect.objectContaining({ namespace: 'cattle-ui-plugin-system' }));
    });

    it('includes annotations with repo type and name from chart', async() => {
      const repo = { doAction: jest.fn().mockResolvedValue({}) };
      const chart = {
        name:     'my-extension',
        version:  '1.0.0',
        repoType: 'helm',
        repoName: 'official',
      };

      await installHelmChart(repo, chart);

      const [, installRequest] = repo.doAction.mock.calls[0];
      const chartInstall = installRequest.charts[0];

      expect(chartInstall.annotations).toStrictEqual({
        'catalog.cattle.io/ui-source-repo-type': 'helm',
        'catalog.cattle.io/ui-source-repo':      'official',
      });
    });

    it('passes provided values to the chart install', async() => {
      const repo = { doAction: jest.fn().mockResolvedValue({}) };
      const chart = {
        name:     'my-extension',
        version:  '1.0.0',
        repoType: 'helm',
        repoName: 'official',
      };
      const values = { global: { cattle: { systemDefaultRegistry: 'myregistry.example' } } };

      await installHelmChart(repo, chart, values);

      const [, installRequest] = repo.doAction.mock.calls[0];

      expect(installRequest.charts[0].values).toStrictEqual(values);
    });
  });
});
