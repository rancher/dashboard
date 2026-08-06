import { COMPAT_SHIM, generateTypeImport, generateDynamicTypeImport } from '@shell/pkg/auto-import';

/**
 * The extension manager. Only 'getPlugins' matters here - the shim uses it as the marker that
 * tells a real manager apart from the empty object the store seeds the root state with.
 */
type Manager = { getPlugins: () => Record<string, unknown> };

type RootState = { $extension?: unknown, $plugin?: unknown };

type GlobalProps = { $extension?: unknown, $plugin?: unknown, $store?: { state: RootState } };

type VueAppElement = HTMLElement & { __vue_app__?: { config?: { globalProperties?: GlobalProps } } };

const makeManager = (): Manager => ({ getPlugins: () => ({}) });

/**
 * COMPAT_SHIM is injected as the first statements of the generated importTypes() function, so it
 * is a valid function body and can be run as-is against a simulated host.
 */
// eslint-disable-next-line no-new-func
const runShim = () => new Function(COMPAT_SHIM)();

/**
 * Stand in for a mounted dashboard: a '#app' element carrying __vue_app__, which is where the
 * shim looks for Vue's globalProperties (and, through those, the Vuex store).
 */
const mountHost = (globalProperties: GlobalProps, mounted = true) => {
  const el = document.createElement('div') as VueAppElement;

  el.id = 'app';

  if (mounted) {
    el.__vue_app__ = { config: { globalProperties } };
  }

  document.body.appendChild(el);

  return el;
};

describe('fx: COMPAT_SHIM', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('given an older host that only sets $plugin', () => {
    it('should alias the manager on both globalProperties and the root state', () => {
      const manager = makeManager();
      const state: RootState = { $plugin: manager };
      const globalProperties: GlobalProps = { $plugin: manager, $store: { state } };

      mountHost(globalProperties);
      runShim();

      expect(globalProperties.$extension).toBe(manager);
      expect(globalProperties.$plugin).toBe(manager);
      expect(state.$extension).toBe(manager);
      expect(state.$plugin).toBe(manager);
    });

    it('should not schedule a retry once everything is patched', () => {
      const manager = makeManager();
      const state: RootState = { $plugin: manager };

      mountHost({ $plugin: manager, $store: { state } });
      runShim();

      expect(jest.getTimerCount()).toBe(0);
    });

    it('should patch globalProperties on the first pass even when the store is not ready', () => {
      const manager = makeManager();
      // What the store seeds the root state with before the 'setPlugin' mutation runs
      const seeded = {};
      const state: RootState = { $plugin: seeded };
      const globalProperties: GlobalProps = { $plugin: manager, $store: { state } };

      mountHost(globalProperties);
      runShim();

      expect(globalProperties.$extension).toBe(manager);
      // Must not bind to the throwaway object - 'setPlugin' rebinds rather than mutates it
      expect(state.$extension).toBeUndefined();
      expect(state.$plugin).toBe(seeded);
    });

    it('should alias the root state on a later tick, once setPlugin has run', () => {
      const manager = makeManager();
      const state: RootState = { $plugin: {} };

      mountHost({ $plugin: manager, $store: { state } });
      runShim();

      // The retry interval plus the 10s safety timeout
      expect(jest.getTimerCount()).toBe(2);

      state.$plugin = manager;
      jest.advanceTimersByTime(100);

      expect(state.$extension).toBe(manager);
      expect(state.$plugin).toBe(manager);
      // Interval cleared, only the safety timeout is left
      expect(jest.getTimerCount()).toBe(1);
    });
  });

  describe('given a host that only sets $extension', () => {
    it('should alias the manager back onto $plugin', () => {
      const manager = makeManager();
      const state: RootState = { $extension: manager };
      const globalProperties: GlobalProps = { $extension: manager, $store: { state } };

      mountHost(globalProperties);
      runShim();

      expect(globalProperties.$plugin).toBe(manager);
      expect(state.$plugin).toBe(manager);
      expect(state.$extension).toBe(manager);
    });
  });

  describe('given a host that already sets both keys', () => {
    it('should be a no-op', () => {
      const manager = makeManager();
      const state: RootState = { $extension: manager, $plugin: manager };
      const globalProperties: GlobalProps = {
        $extension: manager, $plugin: manager, $store: { state }
      };

      mountHost(globalProperties);
      runShim();

      expect(globalProperties.$extension).toBe(manager);
      expect(globalProperties.$plugin).toBe(manager);
      expect(state.$extension).toBe(manager);
      expect(state.$plugin).toBe(manager);
      expect(jest.getTimerCount()).toBe(0);
    });
  });

  describe('given #app is not in the DOM yet', () => {
    it('should not throw', () => {
      expect(() => runShim()).not.toThrow();
    });

    it('should patch once the app mounts', () => {
      const manager = makeManager();
      const state: RootState = { $plugin: manager };
      const globalProperties: GlobalProps = { $plugin: manager, $store: { state } };

      runShim();
      mountHost(globalProperties);
      jest.advanceTimersByTime(100);

      expect(globalProperties.$extension).toBe(manager);
      expect(state.$extension).toBe(manager);
    });
  });

  describe('given #app exists but has not been mounted by Vue', () => {
    it('should not throw and should recover on a later tick', () => {
      const manager = makeManager();
      const state: RootState = { $plugin: manager };
      const globalProperties: GlobalProps = { $plugin: manager, $store: { state } };
      const el = mountHost(globalProperties, false);

      expect(() => runShim()).not.toThrow();
      expect(state.$extension).toBeUndefined();

      el.__vue_app__ = { config: { globalProperties } };
      jest.advanceTimersByTime(100);

      expect(state.$extension).toBe(manager);
    });
  });

  describe('given a host that never exposes $store on globalProperties', () => {
    it('should still patch globalProperties and give up after the 10s ceiling', () => {
      const manager = makeManager();
      const globalProperties: GlobalProps = { $plugin: manager };

      mountHost(globalProperties);

      expect(() => runShim()).not.toThrow();
      expect(globalProperties.$extension).toBe(manager);

      jest.advanceTimersByTime(10000);

      expect(jest.getTimerCount()).toBe(0);
    });
  });
});

describe('fx: generateTypeImport', () => {
  it('should inject the compat shim into the generated importTypes', () => {
    const content = generateTypeImport('test-pkg', '/does/not/exist');

    expect(content).toContain('export function importTypes($extension) {');
    expect(content).toContain(COMPAT_SHIM);
  });
});

describe('fx: generateDynamicTypeImport', () => {
  it('should inject the compat shim into the generated importTypes', () => {
    const content = generateDynamicTypeImport('test-pkg', '/does/not/exist');

    expect(content).toContain('export function importTypes($extension) {');
    expect(content).toContain(COMPAT_SHIM);
  });
});
