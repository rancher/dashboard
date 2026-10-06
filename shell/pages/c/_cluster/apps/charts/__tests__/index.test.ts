import { shallowMount } from '@vue/test-utils';
import Charts from '@shell/pages/c/_cluster/apps/charts/index.vue';
import AsyncButton from '@shell/components/AsyncButton';
import FailWhale from '@shell/components/FailWhale.vue';
import { UI_PLUGIN_ANNOTATION } from '@shell/config/uiplugins';
import { SETTING } from '@shell/config/settings';
import { CATALOG } from '@shell/config/types';

describe('page: Charts Index', () => {
  describe('computed: tagOptions', () => {
    it('should gather tags exclusively from enabledCharts, omitting tags from hidden or extension charts present in allCharts (e.g., primeOnly)', () => {
      const thisContext = {
        // allCharts contains a UI plugin/extension chart with the 'primeOnly' tag.
        allCharts: [
          { tags: ['appTag1'] },
          { tags: ['primeOnly'], annotations: { [UI_PLUGIN_ANNOTATION.NAME]: UI_PLUGIN_ANNOTATION.VALUE } },
        ],
        // enabledCharts has already filtered out the extension chart.
        enabledCharts: [
          { tags: ['appTag1'] },
        ]
      };

      const result = (Charts.computed!.tagOptions as () => any[]).call(thisContext);

      expect(result).toStrictEqual([
        { value: 'apptag1', label: 'appTag1' },
      ]);

      const hasPrimeOnly = result.some((tag) => tag.value === 'primeonly');

      expect(hasPrimeOnly).toBe(false);
    });
  });

  describe('computed: categoryOptions', () => {
    it('should gather categories exclusively from enabledCharts, omitting categories from hidden or extension charts present in allCharts', () => {
      const thisContext = {
        allCharts: [
          { categories: ['category1'] },
          { categories: ['categoryFromExtension1'], annotations: { [UI_PLUGIN_ANNOTATION.NAME]: UI_PLUGIN_ANNOTATION.VALUE } },
        ],
        enabledCharts: [
          { categories: ['category1'] },
        ],
        $store: { getters: { 'i18n/withFallback': (key: string, fallback: any, c: string) => c } }
      };

      const result = (Charts.computed!.categoryOptions as () => any[]).call(thisContext);

      expect(result).toStrictEqual([
        { value: 'category1', label: 'category1' },
      ]);

      const hasExtensionCategory = result.some((cat) => cat.value === 'categoryFromExtension1');

      expect(hasExtensionCategory).toBe(false);
    });
  });

  describe('method: loadMore', () => {
    const createContext = (overrides: Record<string, any> = {}) => ({
      isLoadingMore:             false,
      visibleChartsCount:        30,
      initialVisibleChartsCount: 30,
      filteredCharts:            new Array(100),
      _loadMoreTimer:            null,
      $nextTick:                 (cb: () => void) => cb(),
      ...overrides,
    });

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should set isLoadingMore, then increment visibleChartsCount and clear the flag after the delay', () => {
      const ctx = createContext();

      (Charts.methods!.loadMore as () => void).call(ctx);

      expect(ctx.isLoadingMore).toBe(true);
      expect(ctx.visibleChartsCount).toBe(30);
      expect(ctx._loadMoreTimer).not.toBeNull();

      jest.runAllTimers();

      expect(ctx.visibleChartsCount).toBe(60);
      expect(ctx.isLoadingMore).toBe(false);
      expect(ctx._loadMoreTimer).toBeNull();
    });

    it('should do nothing when already loading', () => {
      const ctx = createContext({ isLoadingMore: true });

      (Charts.methods!.loadMore as () => void).call(ctx);

      expect(ctx._loadMoreTimer).toBeNull();
      expect(ctx.visibleChartsCount).toBe(30);
    });

    it('should do nothing when all charts are already visible', () => {
      const ctx = createContext({ visibleChartsCount: 100 });

      (Charts.methods!.loadMore as () => void).call(ctx);

      expect(ctx.isLoadingMore).toBe(false);
      expect(ctx._loadMoreTimer).toBeNull();
    });
  });

  describe('progressive loading', () => {
    const mountCharts = (pending: boolean) => shallowMount(Charts, {
      global: {
        mocks: {
          t:           (key: string) => key,
          $fetchState: { pending },
          $route:      { params: { cluster: 'c-1' }, query: {} },
          $store:      {
            getters: {
              currentCluster:      { status: { provider: 'other' }, workerOSs: [] },
              'cluster/canList':   () => true,
              'catalog/charts':    [],
              'catalog/errors':    [],
              'catalog/repos':     [],
              'prefs/get':         () => false,
              'i18n/withFallback': (_key: string, _fallback: any, val: string) => val,
              clusterId:           'c-1',
              productId:           'apps',
            },
          },
        },
        directives: { shortkey: () => {} },
      },
    });

    it('should render the header, search bar and refresh button while fetching', () => {
      const wrapper = mountCharts(true);

      expect(wrapper.find('[data-testid="charts-header-title"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="charts-filter-input"]').exists()).toBe(true);
      expect(wrapper.findComponent(AsyncButton).exists()).toBe(true);
    });

    it('should disable the search bar and refresh button and show the loading indicator while fetching', () => {
      const wrapper = mountCharts(true);

      expect(wrapper.find('[data-testid="charts-filter-input"]').attributes('disabled')).toBeDefined();
      expect(wrapper.findComponent(AsyncButton).props('disabled')).toBe(true);
      expect(wrapper.find('[data-testid="charts-loading"]').exists()).toBe(true);
    });

    it('should enable the controls and hide the loading indicator once fetching completes', () => {
      const wrapper = mountCharts(false);

      expect(wrapper.find('[data-testid="charts-filter-input"]').attributes('disabled')).toBeUndefined();
      expect(wrapper.findComponent(AsyncButton).props('disabled')).toBe(false);
      expect(wrapper.find('[data-testid="charts-loading"]').exists()).toBe(false);
    });
  });

  describe('when the user cannot list apps', () => {
    const mountCharts = (canList: boolean) => shallowMount(Charts, {
      global: {
        mocks: {
          t:           (key: string) => key,
          $fetchState: { pending: false },
          $route:      { params: { cluster: 'c-1' }, query: {} },
          $store:      {
            getters: {
              currentCluster:      { status: { provider: 'other' }, workerOSs: [] },
              'cluster/canList':   () => canList,
              'catalog/charts':    [],
              'catalog/errors':    [],
              'catalog/repos':     [],
              'prefs/get':         () => false,
              'i18n/withFallback': (_key: string, _fallback: any, val: string) => val,
              clusterId:           'c-1',
              productId:           'apps',
            },
          },
        },
        directives: { shortkey: () => {} },
      },
    });

    it('should show the error instead of the charts list', () => {
      const wrapper = mountCharts(false);
      const failWhale = wrapper.findComponent(FailWhale);

      expect(failWhale.exists()).toBe(true);
      expect(failWhale.props('error')).toStrictEqual(new Error('catalog.charts.cannotListApps'));
      expect(wrapper.find('[data-testid="charts-header-title"]').exists()).toBe(false);
    });

    it('should show the charts list when the user can list apps', () => {
      const wrapper = mountCharts(true);

      expect(wrapper.findComponent(FailWhale).exists()).toBe(false);
      expect(wrapper.find('[data-testid="charts-header-title"]').exists()).toBe(true);
    });

    it('should not fetch charts or apps', async() => {
      const dispatch = jest.fn();
      const ctx = {
        cannotListAppsError: new Error('catalog.charts.cannotListApps'),
        $store:              { dispatch },
      };

      await (Charts as any).fetch.call(ctx);

      expect(dispatch).not.toHaveBeenCalledWith('catalog/load');
      expect(dispatch).not.toHaveBeenCalledWith('cluster/findAll', { type: CATALOG.APP });
    });
  });

  describe('method: resetLazyLoadState', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should reset state and cancel a pending loadMore so visibleChartsCount is not incremented after reset', () => {
      const ctx: Record<string, any> = {
        isLoadingMore:             false,
        visibleChartsCount:        30,
        initialVisibleChartsCount: 30,
        observerInitialized:       true,
        hasOverflow:               true,
        filteredCharts:            new Array(100),
        _loadMoreTimer:            null,
        $nextTick:                 (cb: () => void) => cb(),
      };

      (Charts.methods!.loadMore as () => void).call(ctx);
      expect(ctx._loadMoreTimer).not.toBeNull();

      (Charts.methods!.resetLazyLoadState as () => void).call(ctx);

      expect(ctx.visibleChartsCount).toBe(30);
      expect(ctx.observerInitialized).toBe(false);
      expect(ctx.hasOverflow).toBe(false);
      expect(ctx.isLoadingMore).toBe(false);
      expect(ctx._loadMoreTimer).toBeNull();

      jest.runAllTimers();

      // The cancelled timer must not have fired — count stays at the reset value.
      expect(ctx.visibleChartsCount).toBe(30);
    });
  });

  describe('template: catalog search input', () => {
    // type="search" already exposes the implicit searchbox role, so no
    // explicit role should be written over it.
    it('should leave the search input its implicit searchbox role', () => {
      const wrapper = shallowMount(Charts, {
        global: {
          // Only what the page reads while rendering: its three mapGetters,
          // the prefs the template checks, and $fetchState for the Loading
          // guard.
          mocks: {
            $store: {
              getters: {
                'cluster/canList': () => true,
                'catalog/charts':  [],
                'catalog/errors':  [],
                'catalog/repos':   [],
                'prefs/get':       jest.fn(),
                currentCluster:    { status: { provider: 'k3s' } },
              }
            },
            $fetchState: { pending: false },
            $route:      { query: {}, params: {} },
          },
          // Registered globally by the app, so absent under a bare mount.
          stubs:      { RouterLink: true },
          directives: { shortkey: {} }
        }
      });

      const search = wrapper.find('[data-testid="charts-filter-input"]');

      expect(search.exists()).toBe(true);
      expect(search.attributes('role')).toBeUndefined();
    });
  });

  describe('computed: suseAppCollectionEnabled', () => {
    const createContext = (settings: Record<string, string>) => ({ $store: { getters: { 'management/byId': (_type: string, id: string) => (settings[id] !== undefined ? { value: settings[id] } : undefined) } } });

    // `ui-appco-enabled` wins when set, otherwise `system-catalog` of `bundled` (airgap / bundled charts only) disables it.
    it.each([
      [{}, true],
      [{ [SETTING.SYSTEM_CATALOG]: 'external' }, true],
      [{ [SETTING.SYSTEM_CATALOG]: 'bundled' }, false],
      [{ [SETTING.UI_APPCO_ENABLED]: 'true', [SETTING.SYSTEM_CATALOG]: 'bundled' }, true],
      [{ [SETTING.UI_APPCO_ENABLED]: 'false', [SETTING.SYSTEM_CATALOG]: 'external' }, false],
    ])('reflects the settings (%p)', (settings, expected) => {
      const ctx = createContext(settings);

      expect((Charts.computed!.suseAppCollectionEnabled as () => boolean).call(ctx)).toBe(expected);
    });
  });

  describe('computed: showAppCollectionBannerLogic', () => {
    const baseContext = {
      hasSuseAppCollectionRepo: false,
      canCreateRepos:           true,
      showAppCollectionBanner:  true,
      hideBannerPref:           false,
      isPrime:                  true,
      suseAppCollectionEnabled: true,
    };

    it('is truthy when all conditions including the setting are met', () => {
      const result = (Charts.computed!.showAppCollectionBannerLogic as () => unknown).call(baseContext);

      expect(!!result).toBe(true);
    });

    it('is falsy when the SUSE Application Collection integration is disabled', () => {
      const ctx = { ...baseContext, suseAppCollectionEnabled: false };
      const result = (Charts.computed!.showAppCollectionBannerLogic as () => unknown).call(ctx);

      expect(!!result).toBe(false);
    });
  });
});
