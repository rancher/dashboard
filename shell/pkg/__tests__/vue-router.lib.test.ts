import {
  getCurrentInstance, isReactive, nextTick, shallowRef, watch
} from 'vue';
import * as vueRouter from 'vue-router';

jest.mock('vue', () => ({
  ...jest.requireActual('vue'),
  getCurrentInstance: jest.fn()
}));

const mockGetCurrentInstance = getCurrentInstance as unknown as jest.Mock;

// 'default' is added by the interop of `import * as`, it isn't something vue-router exports.
const RUNTIME_EXPORTS = Object.keys(vueRouter).filter((key) => key !== 'default');

const isFunctionExport = (key: string) => typeof (vueRouter as Record<string, any>)[key] === 'function';

const FUNCTION_EXPORTS = RUNTIME_EXPORTS.filter(isFunctionExport);
const VALUE_EXPORTS = RUNTIME_EXPORTS.filter((key) => !isFunctionExport(key));

const loadStub = (): Record<string, any> => {
  let stub: Record<string, any> = {};

  // RouterLink/RouterView resolve when the module is first evaluated, so each test needs a
  // fresh copy of the stub against whatever host it has set up.
  jest.isolateModules(() => {
    stub = require('@shell/pkg/vue-router.lib');
  });

  return stub;
};

const fakeHost = (): Record<string, any> => RUNTIME_EXPORTS.reduce((host, key) => {
  host[key] = isFunctionExport(key) ? jest.fn(() => `${ key }-result`) : (vueRouter as Record<string, any>)[key];

  return host;
}, {} as Record<string, any>);

const withHost = (): { host: Record<string, any>, stub: Record<string, any> } => {
  const host = fakeHost();

  (window as any).__vueRouter = host;

  return { host, stub: loadStub() };
};

describe('fx: the extension build stub for vue-router', () => {
  afterEach(() => {
    delete (window as any).__vueRouter;
    jest.clearAllMocks();
  });

  it('should export everything vue-router exports at runtime', () => {
    // Anything missing here compiles to "export 'X' was not found in 'vue-router'" and blows up
    // at runtime for an extension that imports it.
    const stubbed = Object.keys(loadStub());
    const missing = RUNTIME_EXPORTS.filter((key) => !stubbed.includes(key));

    expect(missing).toStrictEqual([]);
  });

  describe('given a host that provides window.__vueRouter (Rancher >= 2.15)', () => {
    it.each(FUNCTION_EXPORTS)('should forward %s() to the host', (key) => {
      const { host, stub } = withHost();

      expect(stub[key]('an-argument')).toBe(`${ key }-result`);
      expect(host[key]).toHaveBeenCalledWith('an-argument');
    });

    it.each(VALUE_EXPORTS)('should hand over the host\'s own %s', (key) => {
      const { host, stub } = withHost();

      expect(stub[key]).toBe(host[key]);
    });

    it('should not touch the component instance for useRoute or useRouter', () => {
      const { stub } = withHost();

      stub.useRoute();
      stub.useRouter();

      expect(mockGetCurrentInstance).not.toHaveBeenCalledWith();
    });
  });

  describe('given a host without window.__vueRouter (Rancher <= 2.14)', () => {
    const route = { name: 'fallback-route', query: { page: '1' } };
    const router = { push: jest.fn() };
    let currentRoute: any;
    let proxy: any;

    beforeEach(() => {
      // vue-router defines $route as a getter over the router's currentRoute ref, and replaces
      // that ref's value on every navigation. Model it the same way, or nothing is tracked.
      currentRoute = shallowRef(route);

      proxy = {
        get $route() {
          return currentRoute.value;
        },
        $router: router
      };

      mockGetCurrentInstance.mockReturnValue({ proxy });
    });

    it('should read the route from the component proxy', () => {
      const result = loadStub().useRoute();

      expect(result.name).toBe('fallback-route');
      expect(result.query).toStrictEqual({ page: '1' });
    });

    it('should stay live as the route changes, rather than snapshotting it', () => {
      const result = loadStub().useRoute();

      currentRoute.value = { name: 'next-route', query: {} };

      expect(result.name).toBe('next-route');
    });

    it('should behave like a plain object for keys, spread and `in`', () => {
      const result = loadStub().useRoute();

      expect(Object.keys(result)).toStrictEqual(['name', 'query']);
      expect({ ...result }).toStrictEqual(route);
      expect('name' in result).toBe(true);
      expect('nope' in result).toBe(false);
    });

    it('should return a reactive route, so that watchers accept it', async() => {
      const result = loadStub().useRoute();
      const onChange = jest.fn();

      expect(isReactive(result)).toBe(true);

      watch(result, onChange, { deep: true });

      currentRoute.value = { name: 'next-route', query: {} };
      await nextTick();

      expect(onChange).toHaveBeenCalledWith(result, result, expect.any(Function));
    });

    it('should return undefined from useRoute outside of a component', () => {
      mockGetCurrentInstance.mockReturnValue(null);

      expect(loadStub().useRoute()).toBeUndefined();
    });

    it('should return the router from the component proxy', () => {
      expect(loadStub().useRouter()).toStrictEqual(router);
    });

    it('should return undefined from useRouter outside of a component', () => {
      mockGetCurrentInstance.mockReturnValue(null);

      expect(loadStub().useRouter()).toBeUndefined();
    });

    it('should fall back to the globally registered router components', () => {
      const stub = loadStub();

      expect(stub.RouterLink).toBe('router-link');
      expect(stub.RouterView).toBe('router-view');
    });

    it('should explain itself for the exports it cannot provide', () => {
      expect(() => loadStub().onBeforeRouteUpdate(() => {})).toThrow(
        "vue-router's onBeforeRouteUpdate() is not available to extensions on this Rancher version (requires 2.15 or later)"
      );
    });
  });
});
