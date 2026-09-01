import { shallowMount } from '@vue/test-utils';
import Charts from '@shell/pages/c/_cluster/apps/charts/index.vue';
import { UI_PLUGIN_ANNOTATION } from '@shell/config/uiplugins';

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
                'catalog/charts': [],
                'catalog/errors': [],
                'catalog/repos':  [],
                'prefs/get':      jest.fn(),
                currentCluster:   { status: { provider: 'k3s' } },
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
});
