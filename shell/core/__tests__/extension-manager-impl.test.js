import { DEVELOPER_LOAD_NAME_SUFFIX, createExtensionManager } from '@shell/core/extension-manager-impl';

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
      builtin:         false,
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
      products:        [],
    })),
    EXT_IDS: {
      MODELS:          'models',
      MODEL_EXTENSION: 'model-extension'
    }
  };
});

// Mock ExtensionPoint
jest.mock('@shell/core/types', () => ({ ExtensionPoint: { EDIT_YAML: 'edit-yaml' } }));

// Mock PluginRoutes
jest.mock('@shell/core/plugin-routes', () => {
  return { PluginRoutes: jest.fn().mockImplementation(() => ({ addRoutes: jest.fn() })) };
});

describe('extension Manager', () => {
  let mockStore;
  let mockApp;
  let context;
  let manager;

  beforeEach(() => {
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
    document.body.innerHTML = '';

    // Create a fresh extension manager for each test
    manager = createExtensionManager(context);
  });

  describe('factory Pattern', () => {
    it('creates independent manager instances', () => {
      const instance1 = createExtensionManager(context);
      const instance2 = createExtensionManager(context);

      expect(instance1).toBeDefined();
      expect(instance2).toBeDefined();
      expect(instance1).not.toBe(instance2);
    });

    it('provides access to internal context', () => {
      const internal = manager.internal();

      expect(internal).toBeDefined();
      expect(internal.app).toBe(mockApp);
      expect(internal.store).toBe(mockStore);
      expect(internal.$axios).toBeDefined();
      expect(internal.redirect).toBeDefined();
      expect(internal.plugins).toBe(manager);
    });
  });

  describe('registration (Dynamic)', () => {
    it('registers and retrieves a dynamic component', () => {
      const mockFn = jest.fn();

      manager.register('component', 'my-component', mockFn);

      const retrieved = manager.getDynamic('component', 'my-component');

      expect(retrieved).toBe(mockFn);
    });

    it('unregisters a dynamic component', () => {
      const mockFn = jest.fn();

      manager.register('component', 'my-component', mockFn);
      manager.unregister('component', 'my-component');

      const retrieved = manager.getDynamic('component', 'my-component');

      expect(retrieved).toBeUndefined();
    });

    it('accumulates l10n resources', () => {
      const mockFn1 = jest.fn();
      const mockFn2 = jest.fn();

      manager.register('l10n', 'en-us', mockFn1);
      manager.register('l10n', 'en-us', mockFn2);

      const retrieved = manager.getDynamic('l10n', 'en-us');

      expect(Array.isArray(retrieved)).toBe(true);
      expect(retrieved).toHaveLength(2);
      expect(retrieved).toContain(mockFn1);
      expect(retrieved).toContain(mockFn2);
    });

    it('lists dynamic registrations by type', () => {
      manager.register('component', 'comp1', jest.fn());
      manager.register('component', 'comp2', jest.fn());
      manager.register('edit', 'edit1', jest.fn());

      const components = manager.listDynamic('component');
      const edits = manager.listDynamic('edit');

      expect(components).toHaveLength(2);
      expect(components).toContain('comp1');
      expect(components).toContain('comp2');
      expect(edits).toHaveLength(1);
      expect(edits).toContain('edit1');
    });
  });

  describe('loadPluginAsync (URL Generation)', () => {
    beforeEach(() => {
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

    it('handles custom main file from metadata', async() => {
      const pluginData = {
        name:     'custom-plugin',
        version:  '2.0.0',
        metadata: { main: 'custom.js' }
      };
      const expectedUrl = `/api/v1/uiplugins/custom-plugin/2.0.0/plugin/custom.js`;

      await manager.loadPluginAsync(pluginData);

      expect(manager.loadAsync).toHaveBeenCalledWith('custom-plugin-2.0.0', expectedUrl);
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

    it('removes developer suffix from ID', async() => {
      const pluginData = {
        name:    `my-plugin${ DEVELOPER_LOAD_NAME_SUFFIX }`,
        version: '1.0.0'
      };

      await manager.loadPluginAsync(pluginData);

      const expectedIdWithoutSuffix = 'my-plugin-1.0.0';

      expect(manager.loadAsync).toHaveBeenCalledWith(
        expectedIdWithoutSuffix,
        expect.any(String)
      );
    });
  });

  describe('loadAsync (Script Injection)', () => {
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
      expect(script.dataset.purpose).toBe('extension');

      // Manually trigger the onload event
      script.onload();

      // Await the promise
      await loadPromise;

      // Assertions
      expect(mockPluginInit).toHaveBeenCalledWith(
        expect.objectContaining({ id: pluginId }),
        expect.objectContaining({
          app:      mockApp,
          store:    mockStore,
          $axios:   {},
          redirect: expect.any(Function),
          plugins:  manager
        })
      );
      expect(mockStore.dispatch).toHaveBeenCalledWith('uiplugins/addPlugin', expect.objectContaining({ id: pluginId }));

      // Cleanup
      delete window[pluginId];
    });

    it('rejects if plugin code is not available', async() => {
      const pluginId = 'missing-plugin';
      const loadPromise = manager.loadAsync(pluginId, 'test.js');

      const script = document.head.querySelector(`script[id="${ pluginId }"]`);

      // Don't set window[pluginId], simulate missing plugin
      script.onload();

      await expect(loadPromise).rejects.toThrow('Could not load plugin code');
    });

    it('rejects if plugin initialization fails', async() => {
      const pluginId = 'error-plugin';
      const mockPluginInit = jest.fn().mockImplementation(() => {
        throw new Error('Init error');
      });

      window[pluginId] = { default: mockPluginInit };

      const loadPromise = manager.loadAsync(pluginId, 'test.js');

      const script = document.head.querySelector(`script[id="${ pluginId }"]`);

      script.onload();

      await expect(loadPromise).rejects.toThrow('Could not initialize plugin');

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

  describe('builtin extensions', () => {
    it('registers and loads builtin extensions', () => {
      const mockModule = {
        default: jest.fn().mockImplementation((plugin) => {
          plugin.types.models = { TestModel: jest.fn() };
        })
      };

      manager.registerBuiltinExtension('builtin-test', mockModule);
      manager.loadBuiltinExtensions();

      expect(mockModule.default).toHaveBeenCalledWith(expect.objectContaining({ builtin: true }), expect.any(Object));
      expect(mockStore.dispatch).toHaveBeenCalledWith('uiplugins/addPlugin', expect.objectContaining({
        id:      'builtin-test',
        builtin: true
      }));
    });

    it('handles builtin extension that returns false', () => {
      const mockModule = { default: jest.fn().mockReturnValue(false) };

      manager.registerBuiltinExtension('skip-test', mockModule);
      manager.loadBuiltinExtensions();

      expect(mockModule.default).toHaveBeenCalledWith(expect.objectContaining({ builtin: true }), expect.any(Object));
      expect(mockStore.dispatch).not.toHaveBeenCalledWith('uiplugins/addPlugin', expect.anything());
    });

    it('handles errors in builtin extension initialization', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockModule = {
        default: jest.fn().mockImplementation(() => {
          throw new Error('Init failed');
        })
      };

      manager.registerBuiltinExtension('error-builtin', mockModule);
      manager.loadBuiltinExtensions();

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.objectContaining({}));
      expect(mockStore.dispatch).not.toHaveBeenCalledWith('uiplugins/addPlugin', expect.anything());

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getValidator', () => {
    it('retrieves registered validator', () => {
      const mockValidator = jest.fn();

      manager.register('validator', 'test-validator', mockValidator);

      // Validators are stored separately, simulate applyPlugin behavior
      const plugin = {
        types:           {},
        uiConfig:        {},
        l10n:            {},
        modelExtensions: {},
        stores:          [],
        locales:         [],
        routes:          [],
        validators:      { 'test-validator': mockValidator },
        productNames:    [],
      };

      manager.applyPlugin(plugin);

      const validator = manager.getValidator('test-validator');

      expect(validator).toBe(mockValidator);
    });
  });

  describe('lastLoad timestamp', () => {
    it('updates lastLoad after plugin load', async() => {
      const initialLastLoad = manager.lastLoad;
      const pluginId = 'timestamp-test';

      window[pluginId] = { default: jest.fn() };

      const loadPromise = manager.loadAsync(pluginId, 'test.js');
      const script = document.head.querySelector(`script[id="${ pluginId }"]`);

      script.onload();
      await loadPromise;

      expect(manager.lastLoad).toBeGreaterThan(initialLastLoad);

      delete window[pluginId];
    });
  });

  describe('getUIConfig', () => {
    it('returns UI config for specific type and area', () => {
      const mockAction = { label: 'Test Action' };
      const plugin = {
        types:           {},
        uiConfig:        { 'edit-yaml': { header: [mockAction] } },
        l10n:            {},
        modelExtensions: {},
        stores:          [],
        locales:         [],
        routes:          [],
        validators:      {},
        productNames:    [],
      };

      manager.applyPlugin(plugin);

      const config = manager.getUIConfig('edit-yaml', 'header');

      expect(config).toHaveLength(1);
      expect(config[0]).toBe(mockAction);
    });

    it('returns empty array for non-existent area in valid type', () => {
      // Use a valid ExtensionPoint type that exists in uiConfig
      const config = manager.getUIConfig('edit-yaml', 'non-existent-area');

      expect(config).toStrictEqual([]);
    });
  });
});
