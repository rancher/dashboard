import { DEVELOPER_LOAD_NAME_SUFFIX } from '@shell/core/extension-manager-impl';

// Mock external dependencies
jest.mock('@shell/store/type-map', () => ({ productsLoaded: jest.fn().mockReturnValue(true) }));

jest.mock('@shell/plugins/dashboard-store/model-loader', () => ({ clearModelCache: jest.fn() }));

jest.mock('@shell/config/uiplugins', () => ({ UI_PLUGIN_BASE_URL: '/api/v1/uiplugins' }));

jest.mock('@shell/plugins/clean-html', () => ({
  addLinkInterceptor:    jest.fn(),
  removeLinkInterceptor: jest.fn(),
}));

// Mock the Plugin class
jest.mock('@shell/core/plugin', () => {
  return {
    Plugin: jest.fn().mockImplementation((id) => ({
      id,
      name:            id,
      types:           {},
      uiConfig:        {},
      l10n:            {},
      modelExtensions: {},
      stores:          [],
      locales:         [],
      routes:          [],
      validators:      {},
      uninstallHooks:  [],
      productNames:    [],
    })),
    EXT_IDS: {
      MODELS:          'models',
      MODEL_EXTENSION: 'model-extension'
    },
    ExtensionPoint: { EDIT_YAML: 'edit-yaml' }
  };
});

// Mock PluginRoutes
jest.mock('@shell/core/plugin-routes', () => {
  return { PluginRoutes: jest.fn().mockImplementation(() => ({ addRoutes: jest.fn() })) };
});

describe('extension Manager', () => {
  let mockStore;
  let mockApp;
  let context;

  // These variables will be assigned the fresh functions inside beforeEach
  let initExtensionManager;
  let getExtensionManager;

  beforeEach(() => {
    // singleton instance for every test run, preventing mock store leaks.
    jest.resetModules();

    // Re-require the System Under Test (SUT)
    const extensionManagerModule = require('../extension-manager-impl');

    initExtensionManager = extensionManagerModule.initExtensionManager;
    getExtensionManager = extensionManagerModule.getExtensionManager;

    jest.clearAllMocks();

    // Setup Mock Context
    mockStore = {
      getters:  { 'i18n/t': jest.fn() },
      dispatch: jest.fn(),
      commit:   jest.fn(),
    };

    mockApp = { router: {} };

    context = {
      app:      mockApp,
      store:    mockStore,
      $axios:   {},
      redirect: jest.fn(),
    };

    // Clean up DOM from previous tests
    document.head.innerHTML = '';
  });

  describe('singleton Pattern', () => {
    it('initializes and returns the same instance', () => {
      const instance1 = initExtensionManager(context);
      const instance2 = getExtensionManager();
      const instance3 = initExtensionManager(context);

      expect(instance1).toBeDefined();
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(instance3);
    });
  });

  describe('registration (Dynamic)', () => {
    it('registers and retrieves a dynamic component', () => {
      const manager = initExtensionManager(context);
      const mockFn = jest.fn();

      manager.register('component', 'my-component', mockFn);

      const retrieved = manager.getDynamic('component', 'my-component');

      expect(retrieved).toBe(mockFn);
    });

    it('unregisters a dynamic component', () => {
      const manager = initExtensionManager(context);
      const mockFn = jest.fn();

      manager.register('component', 'my-component', mockFn);
      manager.unregister('component', 'my-component');

      const retrieved = manager.getDynamic('component', 'my-component');

      expect(retrieved).toBeUndefined();
    });
  });

  describe('loadPluginAsync (URL Generation)', () => {
    let manager;

    beforeEach(() => {
      manager = initExtensionManager(context);
      // Mock the internal loadAsync so we only test URL generation here
      jest.spyOn(manager, 'loadAsync').mockImplementation().mockResolvedValue();
    });

    it('generates correct URL for standard plugin', async() => {
      const pluginData = { name: 'elemental', version: '1.0.0' };
      const expectedId = 'elemental-1.0.0';
      const expectedUrl = `/api/v1/uiplugins/elemental/1.0.0/plugin/elemental-1.0.0.umd.min.js`;

      await manager.loadPluginAsync(pluginData);

      expect(manager.loadAsync).toHaveBeenCalledWith(expectedId, expectedUrl);
    });

    it('handles "direct" metadata plugins', async() => {
      const pluginData = {
        name:     'direct-plugin',
        version:  '1.0.0',
        endpoint: 'http://localhost:8000/plugin.js',
        metadata: { direct: 'true' }
      };

      await manager.loadPluginAsync(pluginData);

      expect(manager.loadAsync).toHaveBeenCalledWith('direct-plugin-1.0.0', 'http://localhost:8000/plugin.js');
    });

    it('removes developer suffix from ID but keeps it for internal logic', async() => {
      const pluginData = {
        name:    `my-plugin${ DEVELOPER_LOAD_NAME_SUFFIX }`,
        version: `1.0.0`
      };

      await manager.loadPluginAsync(pluginData);

      // Expected ID passed to loadAsync should NOT have the suffix
      const expectedIdWithoutSuffix = 'my-plugin-1.0.0';

      expect(manager.loadAsync).toHaveBeenCalledWith(
        expectedIdWithoutSuffix,
        expect.any(String)
      );
    });
  });

  describe('loadAsync (Script Injection)', () => {
    let manager;

    beforeEach(() => {
      manager = initExtensionManager(context);
    });

    it('resolves immediately if element already exists', async() => {
      const id = 'existing-plugin';
      const script = document.createElement('script');

      script.id = id;
      document.body.appendChild(script);

      await expect(manager.loadAsync(id, 'url.js')).resolves.toBeUndefined();

      document.body.removeChild(script);
    });

    it('injects script tag and initializes plugin on load', async() => {
      const pluginId = 'test-plugin';
      const pluginUrl = 'http://test.com/plugin.js';

      // Mock the window object to simulate the plugin loading into global scope
      const mockPluginInit = jest.fn();

      window[pluginId] = { default: mockPluginInit };

      // Start the load
      const loadPromise = manager.loadAsync(pluginId, pluginUrl);

      // Find the injected script tag in the DOM
      const script = document.head.querySelector(`script[id="${ pluginId }"]`);

      expect(script).toBeTruthy();
      expect(script.src).toBe(pluginUrl);

      // Manually trigger the onload event
      script.onload();

      // Await the promise
      await loadPromise;

      // Assertions
      expect(mockPluginInit).toHaveBeenCalledWith(expect.objectContaining({ id: pluginId }), expect.objectContaining({ ...context }));
      expect(mockStore.dispatch).toHaveBeenCalledWith('uiplugins/addPlugin', expect.objectContaining({ id: pluginId }));

      // Cleanup
      delete window[pluginId];
    });

    it('rejects if script load fails', async() => {
      const pluginId = 'fail-plugin';
      const loadPromise = manager.loadAsync(pluginId, 'bad-url.js');

      const script = document.head.querySelector(`script[id="${ pluginId }"]`);

      // Trigger error
      script.onerror({ target: { src: 'bad-url.js' } });

      await expect(loadPromise).rejects.toThrow('Failed to load script');
    });
  });
});
