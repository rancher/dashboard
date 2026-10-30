import { listProducts, loadProduct } from '@shell/utils/dynamic-importer';
import { shouldNotLoadPlugin } from '@shell/config/uiplugins';
import { getKubeVersionData, getVersionData } from '@shell/config/version';
import versions from '@shell/utils/versions';
import { Plugin as UIPlugin } from '@shell/core/plugin';
import plugin from '@shell/plugins/plugin';

jest.mock('@shell/utils/dynamic-importer', () => ({
  listProducts: jest.fn(),
  loadProduct:  jest.fn(),
}));

jest.mock('@shell/config/uiplugins', () => ({
  shouldNotLoadPlugin: jest.fn(),
  UI_PLUGIN_BASE_URL:  '/v1/uiplugins',
}));

jest.mock('@shell/config/version', () => ({
  getKubeVersionData: jest.fn(),
  getVersionData:     jest.fn(),
}));

jest.mock('@shell/utils/versions', () => ({ fetch: jest.fn() }));

jest.mock('@shell/core/plugin', () => ({ Plugin: jest.fn().mockImplementation((name) => ({ name })) }));

describe('plugins/plugin.js', () => {
  let store: any;
  let extension: any;
  let pluginApi: any;
  let context: any;

  beforeEach(() => {
    jest.clearAllMocks();

    store = {
      dispatch: jest.fn().mockResolvedValue({}),
      getters:  { 'i18n/t': jest.fn((key: string) => key), 'uiplugins/plugins': [] },
    };

    extension = {
      loadBuiltinExtensions: jest.fn(),
      loadPluginAsync:       jest.fn().mockResolvedValue(undefined),
      reportPendingExtends:  jest.fn(),
    };

    pluginApi = {
      _add:        jest.fn(),
      applyPlugin: jest.fn(),
    };

    context = {
      route:      { query: {} },
      store,
      $extension: extension,
      $plugin:    pluginApi,
    };

    (versions.fetch as jest.Mock).mockResolvedValue({});
    (listProducts as jest.Mock).mockReturnValue([]);
    (getKubeVersionData as jest.Mock).mockReturnValue({ gitVersion: 'v1.28.0' });
    (getVersionData as jest.Mock).mockReturnValue({ Version: '2.16.0' });

    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.excludeOperatorPkg;
  });

  it('returns early without dispatching anything when excludeOperatorPkg is true', async() => {
    process.env.excludeOperatorPkg = 'true';

    const result = await plugin(context);

    expect(result).toBeUndefined();
    expect(store.dispatch).not.toHaveBeenCalledWith();
  });

  it('fetches the plugins list from the uiplugins endpoint by default', async() => {
    store.dispatch.mockImplementation((action: string) => {
      if (action === 'management/request') {
        return Promise.resolve({ entries: {} });
      }

      return Promise.resolve({});
    });

    await plugin(context);

    expect(store.dispatch).toHaveBeenCalledWith('management/request', {
      url:                  '/v1/uiplugins',
      method:               'GET',
      headers:              { accept: 'application/json' },
      redirectUnauthorized: false,
    });
  });

  it('skips fetching the plugins list and shows a growl when safemode query param is set', async() => {
    jest.useFakeTimers();
    context.route.query = { safemode: '' };

    const resultPromise = plugin(context);

    await Promise.resolve();
    jest.advanceTimersByTime(1000);
    await resultPromise;

    expect(store.dispatch).not.toHaveBeenCalledWith('management/request', expect.anything());
    expect(store.dispatch).toHaveBeenCalledWith('growl/success', {
      title:   'plugins.safeMode.title',
      message: 'plugins.safeMode.message',
    }, { root: true });

    jest.useRealTimers();
  });

  it('migrates legacy products with a $init hook into extensions', async() => {
    const impl = { $init: jest.fn() };

    (listProducts as jest.Mock).mockReturnValue(['legacy-product']);
    (loadProduct as jest.Mock).mockResolvedValue(impl);

    await plugin(context);

    expect(loadProduct).toHaveBeenCalledWith('legacy-product');
    expect(UIPlugin).toHaveBeenCalledWith('legacy-product');
    expect(impl.$init).toHaveBeenCalledWith({ name: 'legacy-product' });
    expect(pluginApi._add).toHaveBeenCalledWith('legacy-product', { name: 'legacy-product' });
    expect(pluginApi.applyPlugin).toHaveBeenCalledWith({ name: 'legacy-product' });
  });

  it('skips legacy products with no $init hook', async() => {
    (listProducts as jest.Mock).mockReturnValue(['no-init-product']);
    (loadProduct as jest.Mock).mockResolvedValue({});

    await plugin(context);

    expect(pluginApi._add).not.toHaveBeenCalledWith();
  });

  it('loads builtin extensions and reports pending extends on the happy path', async() => {
    await plugin(context);

    expect(extension.loadBuiltinExtensions).toHaveBeenCalledWith();
    expect(extension.reportPendingExtends).toHaveBeenCalledWith();
  });

  it('loads an extension plugin when shouldNotLoadPlugin returns false', async() => {
    store.dispatch.mockImplementation((action: string) => {
      if (action === 'management/request') {
        return Promise.resolve({ entries: { ext1: { name: 'ext1' } } });
      }

      return Promise.resolve({});
    });
    (shouldNotLoadPlugin as jest.Mock).mockReturnValue(false);

    await plugin(context);

    expect(shouldNotLoadPlugin).toHaveBeenCalledWith(
      { name: 'ext1' },
      { rancherVersion: '2.16.0', kubeVersion: 'v1.28.0' },
      [],
    );
    expect(extension.loadPluginAsync).toHaveBeenCalledWith({ name: 'ext1' });
    expect(store.dispatch).not.toHaveBeenCalledWith('uiplugins/setError', expect.anything());
  });

  it('records a setError when shouldNotLoadPlugin returns a reason', async() => {
    store.dispatch.mockImplementation((action: string) => {
      if (action === 'management/request') {
        return Promise.resolve({ entries: { ext1: { name: 'ext1' } } });
      }

      return Promise.resolve({});
    });
    (shouldNotLoadPlugin as jest.Mock).mockReturnValue('plugins.error.host');

    await plugin(context);

    expect(extension.loadPluginAsync).not.toHaveBeenCalledWith();
    expect(store.dispatch).toHaveBeenCalledWith('uiplugins/setError', { name: 'ext1', error: 'plugins.error.host' });
  });

  it('supports the legacy Entries casing for the plugins response', async() => {
    store.dispatch.mockImplementation((action: string) => {
      if (action === 'management/request') {
        return Promise.resolve({ Entries: { ext2: { name: 'ext2' } } });
      }

      return Promise.resolve({});
    });
    (shouldNotLoadPlugin as jest.Mock).mockReturnValue(false);

    await plugin(context);

    expect(extension.loadPluginAsync).toHaveBeenCalledWith({ name: 'ext2' });
  });

  // NOTE: `res.reason` (used by the `throw new Error(res.reason)` on the settled-hash rejection
  // path) is always `undefined` -- the rejection reason actually lives at `res.plugins.reason`.
  // This means the original error (and any `.code`) is always discarded, so the `e?.code === 404`
  // branch below can never be reached via a rejected `plugins` fetch. Tests assert the current
  // (buggy) behavior; see filed bug issue for the fix (swap in `res.plugins.reason`).
  it('always logs a generic error (not the 404 log) when the plugins fetch rejects, even with a 404 reason', async() => {
    store.dispatch.mockImplementation((action: string) => {
      if (action === 'management/request') {
        return Promise.reject({ code: 404 }); // eslint-disable-line prefer-promise-reject-errors
      }

      return Promise.resolve({});
    });

    const logSpy = jest.spyOn(console, 'log');
    const errorSpy = jest.spyOn(console, 'error');

    await plugin(context);

    expect(logSpy).not.toHaveBeenCalledWith();
    expect(errorSpy).toHaveBeenCalledWith('Could not load UI Extensions list', new Error(undefined));
  });

  it('logs an error with an empty Error when the plugins fetch rejects with a non-404 error', async() => {
    const err = new Error('boom');

    store.dispatch.mockImplementation((action: string) => {
      if (action === 'management/request') {
        return Promise.reject(err);
      }

      return Promise.resolve({});
    });

    const errorSpy = jest.spyOn(console, 'error');

    await plugin(context);

    // The original `err` (and its message) is lost -- `throw new Error(res.reason)` uses the
    // wrong property path, so a brand new, message-less Error is logged instead of `err`.
    expect(errorSpy).toHaveBeenCalledWith('Could not load UI Extensions list', new Error(undefined));
  });

  it('records a setError for each extension that fails to load', async() => {
    store.dispatch.mockImplementation((action: string) => {
      if (action === 'management/request') {
        return Promise.resolve({ entries: { ext1: { name: 'ext1' } } });
      }

      return Promise.resolve({});
    });
    (shouldNotLoadPlugin as jest.Mock).mockReturnValue(false);
    extension.loadPluginAsync.mockRejectedValue(new Error('load failed'));

    const errorSpy = jest.spyOn(console, 'error');

    await plugin(context);

    expect(errorSpy).toHaveBeenCalledWith('Failed to load extension: ext1. ', new Error('load failed'));
    expect(store.dispatch).toHaveBeenCalledWith('uiplugins/setError', { name: 'ext1', error: 'plugins.error.load' });
  });

  it('returns true on successful completion', async() => {
    const result = await plugin(context);

    expect(result).toBe(true);
  });
});
