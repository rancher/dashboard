import { shallowMount, VueWrapper } from '@vue/test-utils';
import PluginInfoPanel from '@shell/pages/c/_cluster/uiplugins/PluginInfoPanel.vue';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import { getPluginChartVersion } from '@shell/utils/uiplugins';

jest.mock('@shell/config/uiplugins', () => ({
  ...jest.requireActual('@shell/config/uiplugins'),
  isChartVersionHigher: jest.fn((v1: string, v2: string) => v1 > v2),
}));

jest.mock('@shell/utils/uiplugins', () => ({
  ...jest.requireActual('@shell/utils/uiplugins'),
  getPluginChartVersionLabel: jest.fn((v) => v.version),
  getPluginChartVersion:      jest.fn(),
}));

const t = (key: string): string => key;

describe('component: PluginInfoPanel', () => {
  let wrapper: VueWrapper<any>;

  const mountComponent = () => {
    return shallowMount(PluginInfoPanel, { global: { mocks: { t } } });
  };

  describe('panelActions', () => {
    beforeEach(() => {
      wrapper = mountComponent();
    });

    it('should be empty if no info is provided', () => {
      expect(wrapper.vm.panelActions).toStrictEqual([]);
    });

    it('should show install action if not installed and installable versions exist', () => {
      wrapper.vm.info = { installed: false, installableVersions: [{ version: '1.0.0' }] };
      wrapper.vm.infoVersion = '1.0.0';
      const actions = wrapper.vm.panelActions;

      expect(actions).toHaveLength(1);
      expect(actions[0].action).toBe('install');
    });

    it('should be empty if not installed and no installable versions exist', () => {
      wrapper.vm.info = { installed: false, installableVersions: [] };
      const actions = wrapper.vm.panelActions;

      expect(actions).toHaveLength(0);
    });

    it('should show uninstall action if installed and not builtin', () => {
      wrapper.vm.info = { installed: true, builtin: false };
      const actions = wrapper.vm.panelActions;

      expect(actions.some((action: any) => action.action === 'uninstall')).toBe(true);
    });

    it('should show upgrade action for a higher active version', () => {
      wrapper.vm.info = { installed: true, installedVersion: '1.0.0' };
      wrapper.vm.infoVersion = '1.1.0';
      const actions = wrapper.vm.panelActions;

      expect(actions.some((action: any) => action.action === 'upgrade')).toBe(true);
    });

    it('should show downgrade action for a lower active version', () => {
      wrapper.vm.info = { installed: true, installedVersion: '1.0.0' };
      wrapper.vm.infoVersion = '0.9.0';
      const actions = wrapper.vm.panelActions;

      expect(actions.some((action: any) => action.action === 'downgrade')).toBe(true);
    });

    it('should not show upgrade/downgrade if active version is same as installed', () => {
      wrapper.vm.info = { installed: true, installedVersion: '1.0.0' };
      wrapper.vm.infoVersion = '1.0.0';
      const actions = wrapper.vm.panelActions;

      expect(actions.some((action: any) => action.action === 'upgrade')).toBe(false);
      expect(actions.some((action: any) => action.action === 'downgrade')).toBe(false);
    });

    it('should not show upgrade/downgrade for the installed version when the chart version differs from the app version', () => {
      wrapper.vm.info = {
        installed:        true,
        installedVersion: '4.1.0',
        versions:         [{ version: '0.4.10', appVersion: '4.1.0' }]
      };
      wrapper.vm.infoVersion = '0.4.10';
      const actions = wrapper.vm.panelActions;

      expect(actions.some((action: any) => action.action === 'upgrade')).toBe(false);
      expect(actions.some((action: any) => action.action === 'downgrade')).toBe(false);
    });
  });

  describe('getVersionLabel', () => {
    beforeEach(() => {
      wrapper = mountComponent();
    });

    it('should return the version label', () => {
      wrapper.vm.info = { installed: false };
      const version = { version: '1.0.0' };
      const label = wrapper.vm.getVersionLabel(version);

      expect(label).toBe('1.0.0');
    });

    it('should append (current) for the installed version', () => {
      wrapper.vm.info = { installed: true, installedVersion: '1.0.0' };
      const version = { version: '1.0.0' };
      const label = wrapper.vm.getVersionLabel(version);

      expect(label).toBe('1.0.0 (plugins.labels.current)');
    });

    it('should append (current) to the chart version carrying the installed app version', () => {
      wrapper.vm.info = {
        installed:        true,
        installedVersion: '4.1.0',
        versions:         [{ version: '0.4.10', appVersion: '4.1.0' }]
      };
      const label = wrapper.vm.getVersionLabel({ version: '0.4.10', appVersion: '4.1.0' });

      expect(label).toBe('0.4.10 (plugins.labels.current)');
    });
  });

  describe('versions list', () => {
    const makeVersions = (versions: string[]) => versions.map((version) => ({
      version, appVersion: version, isVersionCompatible: true, versionIncompatibilityData: {}
    }));
    const allVersions = makeVersions(['4.1.3', '4.1.2', '4.1.1', '4.1.0', '3.0.11', '3.0.8', '2.2.0', '2.1.12', '2.0.0']);
    const versionStrings = (versions: any[]) => versions.map((v) => v.version);

    beforeEach(() => {
      wrapper = mountComponent();
      (getPluginChartVersion as jest.Mock).mockReset();
    });

    describe('currentVersion', () => {
      it('should resolve the installed version to its chart version', () => {
        wrapper.vm.info = {
          installed:        true,
          installedVersion: '4.1.0',
          versions:         [{
            version: '0.4.10', appVersion: '4.1.0', isVersionCompatible: true, versionIncompatibilityData: {}
          }]
        };

        expect(wrapper.vm.currentVersion).toBe('0.4.10');
      });

      it('should fall back to the installed version if no chart version matches it', () => {
        wrapper.vm.info = {
          installed: true, installedVersion: '4.1.0', versions: allVersions.slice(0, 1)
        };

        expect(wrapper.vm.currentVersion).toBe('4.1.0');
      });

      it('should use the pre-selected version if the extension is not installed', () => {
        (getPluginChartVersion as jest.Mock).mockReturnValue('4.1.3');
        wrapper.vm.info = { installed: false, versions: allVersions };

        expect(wrapper.vm.currentVersion).toBe('4.1.3');
      });
    });

    describe('displayedVersions', () => {
      it('should only keep the latest version per minor around the installed version', () => {
        wrapper.vm.info = {
          installed: true, installedVersion: '4.1.0', versions: allVersions
        };

        expect(versionStrings(wrapper.vm.displayedVersions)).toStrictEqual(['4.1.3', '4.1.0', '3.0.11', '2.2.0']);
      });

      it('should always keep the selected version, even when it would be trimmed', () => {
        wrapper.vm.info = {
          installed: true, installedVersion: '4.1.0', versions: allVersions
        };
        wrapper.vm.infoVersion = '2.0.0';

        expect(versionStrings(wrapper.vm.displayedVersions)).toStrictEqual(['4.1.3', '4.1.0', '3.0.11', '2.2.0', '2.0.0']);
      });

      it('should keep every version once all versions are shown', () => {
        wrapper.vm.info = {
          installed: true, installedVersion: '4.1.0', versions: allVersions
        };
        wrapper.vm.showAllVersions = true;

        expect(versionStrings(wrapper.vm.displayedVersions)).toStrictEqual(versionStrings(allVersions));
      });

      it('should be empty if the extension has no versions', () => {
        wrapper.vm.info = { installed: false, versions: [] };

        expect(wrapper.vm.displayedVersions).toStrictEqual([]);
      });
    });

    describe('hasHiddenVersions', () => {
      it('should be true when versions were trimmed out of the list', () => {
        wrapper.vm.info = {
          installed: true, installedVersion: '4.1.0', versions: allVersions
        };

        expect(wrapper.vm.hasHiddenVersions).toBe(true);
      });

      it('should be false when there was nothing to trim', () => {
        wrapper.vm.info = {
          installed: true, installedVersion: '2.0.0', versions: makeVersions(['2.2.0', '2.1.12', '2.0.0'])
        };

        expect(wrapper.vm.hasHiddenVersions).toBe(false);
      });

      it('should be false once all versions are shown', () => {
        wrapper.vm.info = {
          installed: true, installedVersion: '4.1.0', versions: allVersions
        };
        wrapper.vm.showAllVersions = true;

        expect(wrapper.vm.hasHiddenVersions).toBe(false);
      });
    });

    it('should collapse the list again when the panel is opened for another extension', () => {
      wrapper.vm.info = {
        installed: true, installedVersion: '4.1.0', versions: allVersions
      };
      wrapper.vm.showAllVersions = true;

      wrapper.vm.show({
        installed: true, installedVersion: '4.1.0', versions: allVersions
      });

      expect(wrapper.vm.showAllVersions).toBe(false);
      expect(versionStrings(wrapper.vm.displayedVersions)).toStrictEqual(['4.1.3', '4.1.0', '3.0.11', '2.2.0']);
    });
  });

  describe('loadPluginVersionInfo', () => {
    const dispatch = jest.fn();
    const chart = {
      repoType: 'cluster', repoName: 'rancher-charts', chartName: 'my-plugin', versions: []
    };
    const versionInfoArgs = {
      repoType: 'cluster', repoName: 'rancher-charts', chartName: 'my-plugin'
    };
    const chartVersion = (version: string, appVersion: string, isVersionCompatible = true) => ({
      version, appVersion, isVersionCompatible, versionIncompatibilityData: {}
    });
    const compatibleVersions = [chartVersion('2.0.0', '2.0.0'), chartVersion('1.0.0', '1.0.0')];

    beforeEach(() => {
      dispatch.mockReset();
      dispatch.mockResolvedValue({});
      (getPluginChartVersion as jest.Mock).mockReset();

      // opening the panel renders it, so the store needs the getters the template reads
      wrapper = shallowMount(PluginInfoPanel, { global: { mocks: { t, $store: { dispatch, getters: { 'prefs/theme': 'light' } } } } });
    });

    it('should select the installed version when the panel opens', () => {
      wrapper.vm.show({
        installed: true, installedVersion: '1.0.0', chart, versions: compatibleVersions
      });

      expect(wrapper.vm.infoVersion).toBe('1.0.0');
      expect(dispatch).toHaveBeenCalledWith('catalog/getVersionInfo', { ...versionInfoArgs, versionName: '1.0.0' });
    });

    it('should select the installed chart version when it differs from the app version', () => {
      wrapper.vm.show({
        installed:        true,
        installedVersion: '4.1.0',
        chart,
        versions:         [chartVersion('0.4.11', '4.1.1'), chartVersion('0.4.10', '4.1.0')]
      });

      expect(wrapper.vm.infoVersion).toBe('0.4.10');
    });

    it('should keep the installed version selected when it is no longer compatible', () => {
      wrapper.vm.show({
        installed:        true,
        installedVersion: '1.0.0',
        chart,
        versions:         [chartVersion('2.0.0', '2.0.0'), chartVersion('1.0.0', '1.0.0', false)]
      });

      expect(wrapper.vm.infoVersion).toBe('1.0.0');
    });

    it('should select the version that would be installed when the extension is not installed', () => {
      (getPluginChartVersion as jest.Mock).mockReturnValue('2.0.0');

      wrapper.vm.show({
        installed: false, chart, versions: compatibleVersions
      });

      expect(wrapper.vm.infoVersion).toBe('2.0.0');
    });

    it('should select nothing when the extension is not installed and its latest version is incompatible', () => {
      (getPluginChartVersion as jest.Mock).mockReturnValue('2.0.0');

      wrapper.vm.show({
        installed: false, chart, versions: [chartVersion('2.0.0', '2.0.0', false)]
      });

      expect(wrapper.vm.infoVersion).toBeUndefined();
      expect(dispatch).toHaveBeenCalledTimes(0);
    });

    it('should select the version the user picks from the list', () => {
      wrapper.vm.show({
        installed: true, installedVersion: '1.0.0', chart, versions: compatibleVersions
      });
      wrapper.vm.loadPluginVersionInfo('2.0.0');

      expect(wrapper.vm.infoVersion).toBe('2.0.0');
      expect(dispatch).toHaveBeenCalledWith('catalog/getVersionInfo', { ...versionInfoArgs, versionName: '2.0.0' });
    });
  });

  describe('errorMessage', () => {
    beforeEach(() => {
      wrapper = mountComponent();
    });

    it('should return installedError if present', () => {
      wrapper.vm.info = { installedError: 'install error' };

      expect(wrapper.vm.errorMessage).toBe('install error');
    });

    it('should return translated helmError if present', () => {
      wrapper.vm.info = { helmError: true };

      expect(wrapper.vm.errorMessage).toBe('plugins.helmError');
    });

    it('should return null if no error', () => {
      wrapper.vm.info = {};

      expect(wrapper.vm.errorMessage).toBeNull();
    });
  });

  describe('warningMessages', () => {
    beforeEach(() => {
      wrapper = mountComponent();
    });

    it('should include deprecated message if the extension chart has the deprecated annotation', () => {
      wrapper.vm.info = { chart: { versions: [{ annotations: { [CATALOG_ANNOTATIONS.DEPRECATED]: 'true' } }] } };

      expect(wrapper.vm.warningMessages).toContain('plugins.deprecatedExtension');
    });

    it('should include incompatibilityMessage if present', () => {
      wrapper.vm.info = { incompatibilityMessage: 'incompatibility error' };

      expect(wrapper.vm.warningMessages).toContain('incompatibility error');
    });

    it('should include both deprecated and incompatibility messages if both are present', () => {
      wrapper.vm.info = {
        chart:                  { versions: [{ annotations: { [CATALOG_ANNOTATIONS.DEPRECATED]: 'true' } }] },
        incompatibilityMessage: 'incompatibility error'
      };

      expect(wrapper.vm.warningMessages).toStrictEqual([
        'plugins.deprecatedExtension',
        'incompatibility error'
      ]);
    });

    it('should return an empty array if neither is present', () => {
      wrapper.vm.info = { chart: { versions: [{ annotations: { [CATALOG_ANNOTATIONS.CERTIFIED]: 'rancher' } }] } };

      expect(wrapper.vm.warningMessages).toStrictEqual([]);
    });
  });
});
