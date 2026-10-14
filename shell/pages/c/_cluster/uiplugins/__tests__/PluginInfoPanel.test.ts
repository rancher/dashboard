import { shallowMount, mount, flushPromises, VueWrapper } from '@vue/test-utils';
import PluginInfoPanel from '@shell/pages/c/_cluster/uiplugins/PluginInfoPanel.vue';
import { getPluginChartVersion } from '@shell/utils/uiplugins';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';

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

  const createStore = () => ({
    dispatch: jest.fn().mockResolvedValue({ readme: 'README' }),
    getters:  { 'prefs/theme': 'light' },
  });

  const mountComponent = (info: Record<string, any> = {}) => {
    return shallowMount(PluginInfoPanel, { props: { info: { label: 'My Extension', ...info } }, global: { mocks: { t, $store: createStore() } } });
  };

  const chartRef = {
    repoType: 'cluster', repoName: 'repo', chartName: 'my-extension'
  };
  const chart = { ...chartRef, versions: [] };

  const mountDrawer = (info: Record<string, any> = {}) => {
    const store = createStore();

    const drawer = mount(PluginInfoPanel, {
      props: {
        info: {
          label: 'My Extension', description: 'Does things', versions: [], ...info
        }
      },
      global: {
        provide:    { store },
        mocks:      { t, $store: store },
        stubs:      { ChartReadme: true, LazyImage: true },
        directives: { cleanTooltip: () => {} },
      },
    });

    return { drawer, store };
  };

  describe('drawer', () => {
    it('should render in the standard drawer, titled with the extension name', () => {
      const { drawer } = mountDrawer();

      expect(drawer.attributes('role')).toBe('dialog');
      expect(drawer.attributes('aria-label')).toBe('My Extension');
      expect(drawer.find('[data-testid="extension-details-title"]').text()).toBe('My Extension');
    });

    it('should emit close when the drawer is closed', async() => {
      const { drawer } = mountDrawer();

      await drawer.find('[data-testid="rc-drawer-close"]').trigger('click');

      expect(drawer.emitted('close')).toHaveLength(1);
    });

    it('should offer the actions as buttons in the footer, ending on the primary one', async() => {
      const { drawer } = mountDrawer({
        installed: true, builtin: false, installedVersion: '1.0.0'
      });

      await drawer.setData({ infoVersion: '1.1.0' });

      expect(drawer.findAll('.footer button').map((b) => b.text())).toStrictEqual([
        'component.drawer.chrome.close',
        'plugins.uninstall.label',
        'catalog.chart.chartButton.action.upgrade',
      ]);
    });

    it('should emit the action for the extension and then close', async() => {
      const info = { installed: true, builtin: false };
      const { drawer } = mountDrawer(info);

      await drawer.findAll('.footer button')[1].trigger('click');

      expect(drawer.emitted('action')?.[0]).toStrictEqual([{
        label: 'plugins.uninstall.label', action: 'uninstall', role: 'secondary', plugin: drawer.props('info')
      }]);
      expect(drawer.emitted('close')).toHaveLength(1);
    });
  });

  describe('version info', () => {
    beforeEach(() => {
      (getPluginChartVersion as jest.Mock).mockReturnValue('1.0.0');
    });

    it('should load the readme of the extension it is opened for', async() => {
      const { drawer, store } = mountDrawer({ chart });

      await flushPromises();

      expect(store.dispatch).toHaveBeenCalledWith('catalog/getVersionInfo', { ...chartRef, versionName: '1.0.0' });
      expect(drawer.vm.versionInfo).toStrictEqual({ readme: 'README' });
    });

    it('should show the readme once it has loaded', async() => {
      const { drawer } = mountDrawer({ chart });

      await flushPromises();

      expect(drawer.findComponent({ name: 'ChartReadme' }).exists()).toBe(true);
    });

    it('should not show a detail section for a version without a readme', async() => {
      const { drawer, store } = mountDrawer({ chart });

      store.dispatch.mockResolvedValue({ chart: {} });
      await drawer.vm.loadPluginVersionInfo('1.0.0');
      await flushPromises();

      expect(drawer.findComponent({ name: 'ChartReadme' }).exists()).toBe(false);
    });

    it('should not load anything for an extension without a chart', async() => {
      const { store } = mountDrawer();

      await flushPromises();

      expect(store.dispatch).not.toHaveBeenCalledWith('catalog/getVersionInfo', expect.anything());
    });
  });

  describe('panelActions', () => {
    it('should show install action if not installed and installable versions exist', () => {
      wrapper = mountComponent({ installed: false, installableVersions: [{ version: '1.0.0' }] });
      wrapper.vm.infoVersion = '1.0.0';
      const actions = wrapper.vm.panelActions;

      expect(actions).toHaveLength(1);
      expect(actions[0].action).toBe('install');
    });

    it('should be empty if not installed and no installable versions exist', () => {
      wrapper = mountComponent({ installed: false, installableVersions: [] });
      const actions = wrapper.vm.panelActions;

      expect(actions).toHaveLength(0);
    });

    it('should show uninstall action if installed and not builtin', () => {
      wrapper = mountComponent({ installed: true, builtin: false });
      const actions = wrapper.vm.panelActions;

      expect(actions.some((action: any) => action.action === 'uninstall')).toBe(true);
    });

    it('should show upgrade action for a higher active version', () => {
      wrapper = mountComponent({ installed: true, installedVersion: '1.0.0' });
      wrapper.vm.infoVersion = '1.1.0';
      const actions = wrapper.vm.panelActions;

      expect(actions.some((action: any) => action.action === 'upgrade')).toBe(true);
    });

    it('should show downgrade action for a lower active version', () => {
      wrapper = mountComponent({ installed: true, installedVersion: '1.0.0' });
      wrapper.vm.infoVersion = '0.9.0';
      const actions = wrapper.vm.panelActions;

      expect(actions.some((action: any) => action.action === 'downgrade')).toBe(true);
    });

    it('should not show upgrade/downgrade if active version is same as installed', () => {
      wrapper = mountComponent({ installed: true, installedVersion: '1.0.0' });
      wrapper.vm.infoVersion = '1.0.0';
      const actions = wrapper.vm.panelActions;

      expect(actions.some((action: any) => action.action === 'upgrade')).toBe(false);
      expect(actions.some((action: any) => action.action === 'downgrade')).toBe(false);
    });
  });

  describe('getVersionLabel', () => {
    it('should return the version label', () => {
      wrapper = mountComponent({ installed: false });
      const version = { version: '1.0.0' };
      const label = wrapper.vm.getVersionLabel(version);

      expect(label).toBe('1.0.0');
    });

    it('should append (current) for the installed version', () => {
      wrapper = mountComponent({ installed: true, installedVersion: '1.0.0' });
      const version = { version: '1.0.0' };
      const label = wrapper.vm.getVersionLabel(version);

      expect(label).toBe('1.0.0 (plugins.labels.current)');
    });
  });

  describe('versions list', () => {
    const makeVersions = (versions: string[]) => versions.map((version) => ({
      version, appVersion: version, isVersionCompatible: true, versionIncompatibilityData: {}
    }));
    const allVersions = makeVersions(['4.1.3', '4.1.2', '4.1.1', '4.1.0', '3.0.11', '3.0.8', '2.2.0', '2.1.12', '2.0.0']);
    const versionStrings = (versions: any[]) => versions.map((v) => v.version);

    beforeEach(() => {
      (getPluginChartVersion as jest.Mock).mockReset();
    });

    describe('currentVersion', () => {
      it('should resolve the installed version to its chart version', () => {
        wrapper = mountComponent({
          installed:        true,
          installedVersion: '4.1.0',
          versions:         [{
            version: '0.4.10', appVersion: '4.1.0', isVersionCompatible: true, versionIncompatibilityData: {}
          }]
        });

        expect(wrapper.vm.currentVersion).toBe('0.4.10');
      });

      it('should fall back to the installed version if no chart version matches it', () => {
        wrapper = mountComponent({
          installed: true, installedVersion: '4.1.0', versions: allVersions.slice(0, 1)
        });

        expect(wrapper.vm.currentVersion).toBe('4.1.0');
      });

      it('should use the pre-selected version if the extension is not installed', () => {
        (getPluginChartVersion as jest.Mock).mockReturnValue('4.1.3');
        wrapper = mountComponent({ installed: false, versions: allVersions });

        expect(wrapper.vm.currentVersion).toBe('4.1.3');
      });
    });

    describe('displayedVersions', () => {
      it('should only keep the latest version per minor around the installed version', () => {
        wrapper = mountComponent({
          installed: true, installedVersion: '4.1.0', versions: allVersions
        });

        expect(versionStrings(wrapper.vm.displayedVersions)).toStrictEqual(['4.1.3', '4.1.0', '3.0.11', '2.2.0']);
      });

      it('should always keep the selected version, even when it would be trimmed', () => {
        wrapper = mountComponent({
          installed: true, installedVersion: '4.1.0', versions: allVersions
        });
        wrapper.vm.infoVersion = '2.0.0';

        expect(versionStrings(wrapper.vm.displayedVersions)).toStrictEqual(['4.1.3', '4.1.0', '3.0.11', '2.2.0', '2.0.0']);
      });

      it('should keep every version once all versions are shown', () => {
        wrapper = mountComponent({
          installed: true, installedVersion: '4.1.0', versions: allVersions
        });
        wrapper.vm.showAllVersions = true;

        expect(versionStrings(wrapper.vm.displayedVersions)).toStrictEqual(versionStrings(allVersions));
      });

      it('should be empty if the extension has no versions', () => {
        wrapper = mountComponent({ installed: false, versions: [] });

        expect(wrapper.vm.displayedVersions).toStrictEqual([]);
      });
    });

    describe('hasHiddenVersions', () => {
      it('should be true when versions were trimmed out of the list', () => {
        wrapper = mountComponent({
          installed: true, installedVersion: '4.1.0', versions: allVersions
        });

        expect(wrapper.vm.hasHiddenVersions).toBe(true);
      });

      it('should be false when there was nothing to trim', () => {
        wrapper = mountComponent({
          installed: true, installedVersion: '2.0.0', versions: makeVersions(['2.2.0', '2.1.12', '2.0.0'])
        });

        expect(wrapper.vm.hasHiddenVersions).toBe(false);
      });

      it('should be false once all versions are shown', () => {
        wrapper = mountComponent({
          installed: true, installedVersion: '4.1.0', versions: allVersions
        });
        wrapper.vm.showAllVersions = true;

        expect(wrapper.vm.hasHiddenVersions).toBe(false);
      });
    });

    it('should start with the list collapsed each time the panel is opened', () => {
      wrapper = mountComponent({
        installed: true, installedVersion: '4.1.0', versions: allVersions
      });
      wrapper.vm.showAllVersions = true;

      wrapper = mountComponent({
        installed: true, installedVersion: '4.1.0', versions: allVersions
      });

      expect(wrapper.vm.showAllVersions).toBe(false);
      expect(versionStrings(wrapper.vm.displayedVersions)).toStrictEqual(['4.1.3', '4.1.0', '3.0.11', '2.2.0']);
    });
  });

  describe('errorMessage', () => {
    it('should return installedError if present', () => {
      wrapper = mountComponent({ installedError: 'install error' });

      expect(wrapper.vm.errorMessage).toBe('install error');
    });

    it('should return translated helmError if present', () => {
      wrapper = mountComponent({ helmError: true });

      expect(wrapper.vm.errorMessage).toBe('plugins.helmError');
    });

    it('should return null if no error', () => {
      wrapper = mountComponent({});

      expect(wrapper.vm.errorMessage).toBeNull();
    });
  });

  describe('warningMessages', () => {
    it('should include deprecated message if the extension chart has the deprecated annotation', () => {
      wrapper = mountComponent({ chart: { versions: [{ annotations: { [CATALOG_ANNOTATIONS.DEPRECATED]: 'true' } }] } });

      expect(wrapper.vm.warningMessages).toContain('plugins.deprecatedExtension');
    });

    it('should include incompatibilityMessage if present', () => {
      wrapper = mountComponent({ incompatibilityMessage: 'incompatibility error' });

      expect(wrapper.vm.warningMessages).toContain('incompatibility error');
    });

    it('should include both deprecated and incompatibility messages if both are present', () => {
      wrapper = mountComponent({
        chart:                  { versions: [{ annotations: { [CATALOG_ANNOTATIONS.DEPRECATED]: 'true' } }] },
        incompatibilityMessage: 'incompatibility error'
      });

      expect(wrapper.vm.warningMessages).toStrictEqual([
        'plugins.deprecatedExtension',
        'incompatibility error'
      ]);
    });

    it('should return an empty array if neither is present', () => {
      wrapper = mountComponent({ chart: { versions: [{ annotations: { [CATALOG_ANNOTATIONS.CERTIFIED]: 'rancher' } }] } });

      expect(wrapper.vm.warningMessages).toStrictEqual([]);
    });
  });
});
