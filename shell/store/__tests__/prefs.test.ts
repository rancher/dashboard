import {
  create,
  mapPref,
  state,
  getters,
  mutations,
  actions,
  THEME,
  CLUSTER,
  AFTER_LOGIN_ROUTE,
  LAST_VISITED,
  PREFERS_SCHEME,
  DEV,
  PLUGIN_DEVELOPER,
  LOCALE,
  ROWS_PER_PAGE,
  EXPANDED_GROUPS,
  NAMESPACE_FILTERS,
} from '@shell/store/prefs';

describe('prefs store', () => {
  describe('create', () => {
    it('returns the preference name', () => {
      const name = 'test-pref-create-return';

      expect(create(name, 'default')).toStrictEqual(name);
    });

    it('registers a definition with the default value', () => {
      const name = 'test-pref-def-value';

      create(name, 42);
      const s = state();

      expect(s.definitions[name]).toBeDefined();
      expect(s.definitions[name].def).toStrictEqual(42);
    });

    it('sets parseJSON to true when opt.parseJSON is true', () => {
      const name = 'test-pref-parsejson';

      create(name, '{}', { parseJSON: true });
      const s = state();

      expect(s.definitions[name].parseJSON).toBe(true);
    });

    it('sets parseJSON to false when opt.parseJSON is not set', () => {
      const name = 'test-pref-no-parsejson';

      create(name, 'val');
      const s = state();

      expect(s.definitions[name].parseJSON).toBe(false);
    });

    it('sets asCookie to true when opt.asCookie is true', () => {
      const name = 'test-pref-ascookie';

      create(name, '', { asCookie: true });
      const s = state();

      expect(s.definitions[name].asCookie).toBe(true);
    });

    it('sets asCookie to false when opt.asCookie is not set', () => {
      const name = 'test-pref-no-ascookie';

      create(name, '');
      const s = state();

      expect(s.definitions[name].asCookie).toBe(false);
    });

    it('sets asUserPreference to true by default', () => {
      const name = 'test-pref-userupref-default';

      create(name, '');
      const s = state();

      expect(s.definitions[name].asUserPreference).toBe(true);
    });

    it('sets asUserPreference to false when opt.asUserPreference is false', () => {
      const name = 'test-pref-no-userupref';

      create(name, '', { asUserPreference: false });
      const s = state();

      expect(s.definitions[name].asUserPreference).toBe(false);
    });

    it('stores mangleRead and mangleWrite functions', () => {
      const name = 'test-pref-mangle';
      const mangleRead = (x: string) => x.toUpperCase();
      const mangleWrite = (x: string) => x.toLowerCase();

      create(name, '', { mangleRead, mangleWrite });
      const s = state();

      expect(s.definitions[name].mangleRead).toBe(mangleRead);
      expect(s.definitions[name].mangleWrite).toBe(mangleWrite);
    });

    it('stores options array', () => {
      const name = 'test-pref-options';
      const options = ['a', 'b', 'c'];

      create(name, 'a', { options });
      const s = state();

      expect(s.definitions[name].options).toStrictEqual(options);
    });

    it('stores inheritFrom', () => {
      const name = 'test-pref-inherit';

      create(name, false, { inheritFrom: DEV } as any);
      const s = state();

      expect(s.definitions[name].inheritFrom).toStrictEqual(DEV);
    });
  });

  describe('mapPref', () => {
    it('get calls the prefs/get getter with the preference name', () => {
      const mockGetFn = jest.fn(() => 'light');
      const ctx = { $store: { getters: { 'prefs/get': mockGetFn } } };
      const mapped = mapPref(THEME);

      const result = mapped.get.call(ctx);

      expect(mockGetFn).toHaveBeenCalledWith(THEME);
      expect(result).toStrictEqual('light');
    });

    it('set dispatches prefs/set with key and value', () => {
      const dispatch = jest.fn();
      const ctx = { $store: { dispatch } };
      const mapped = mapPref(THEME);

      mapped.set.call(ctx, 'dark');

      expect(dispatch).toHaveBeenCalledWith('prefs/set', { key: THEME, value: 'dark' });
    });
  });

  describe('state', () => {
    it('returns cookiesLoaded as false', () => {
      expect(state().cookiesLoaded).toBe(false);
    });

    it('returns empty data object', () => {
      expect(state().data).toStrictEqual({});
    });

    it('returns definitions object containing registered prefs', () => {
      const s = state();

      expect(s.definitions[THEME]).toBeDefined();
      expect(s.definitions[CLUSTER]).toBeDefined();
      expect(s.definitions[LOCALE]).toBeDefined();
    });

    it('returns a fresh data object on each call', () => {
      const s1 = state();
      const s2 = state();

      expect(s1.data).not.toBe(s2.data);
    });

    it('returns null for authRedirect initially', () => {
      expect(state().authRedirect).toBeNull();
    });
  });

  describe('getters', () => {
    let s: ReturnType<typeof state>;

    beforeEach(() => {
      s = state();
    });

    describe('get', () => {
      it('throws for an unknown preference key', () => {
        expect(() => getters.get(s as any)('unknown-pref-xyz-abc')).toThrow('Unknown preference: unknown-pref-xyz-abc');
      });

      it('returns the default value when no user data is set', () => {
        const result = getters.get(s as any)(CLUSTER);

        expect(result).toStrictEqual('');
      });

      it('returns the user value when data is set', () => {
        s.data[CLUSTER] = 'my-cluster';
        const result = getters.get(s as any)(CLUSTER);

        expect(result).toStrictEqual('my-cluster');
      });

      it('returns a clone of an array default, not the original reference', () => {
        // EXPANDED_GROUPS default is an array — clone must produce a different reference
        const result = getters.get(s as any)(EXPANDED_GROUPS);
        const result2 = getters.get(s as any)(EXPANDED_GROUPS);

        expect(result).toStrictEqual(['cluster', 'policy', 'rbac', 'serviceDiscovery', 'storage', 'workload']);
        expect(result).not.toBe(result2);
      });

      it('returns a clone of a user-set object, not the original reference', () => {
        // NAMESPACE_FILTERS default is {} — set a real object so clone produces a new reference
        const obj = { local: ['ns-a'] };

        s.data[NAMESPACE_FILTERS] = obj;
        const r1 = getters.get(s as any)(NAMESPACE_FILTERS);
        const r2 = getters.get(s as any)(NAMESPACE_FILTERS);

        expect(r1).toStrictEqual({ local: ['ns-a'] });
        expect(r1).not.toBe(r2);
      });
    });

    describe('defaultValue', () => {
      it('throws for an unknown preference key', () => {
        expect(() => getters.defaultValue(s as any)('unknown-pref-xyz-default')).toThrow('Unknown preference: unknown-pref-xyz-default');
      });

      it('returns the default value regardless of user data', () => {
        s.data[CLUSTER] = 'my-cluster';
        const result = getters.defaultValue(s as any)(CLUSTER);

        expect(result).toStrictEqual('');
      });

      it('returns a clone not the original def reference', () => {
        // EXPANDED_GROUPS has an array default — clone must produce a different reference
        const r1 = getters.defaultValue(s as any)(EXPANDED_GROUPS);
        const r2 = getters.defaultValue(s as any)(EXPANDED_GROUPS);

        expect(r1).toStrictEqual(['cluster', 'policy', 'rbac', 'serviceDiscovery', 'storage', 'workload']);
        expect(r1).not.toBe(r2);
      });
    });

    describe('options', () => {
      it('throws for an unknown preference key', () => {
        expect(() => getters.options(s as any)('unknown-pref-xyz-opts')).toThrow('Unknown preference: unknown-pref-xyz-opts');
      });

      it('throws when the preference has no options defined', () => {
        expect(() => getters.options(s as any)(CLUSTER)).toThrow('Preference does not have options: cluster');
      });

      it('returns a copy of the options array', () => {
        const result = getters.options(s as any)(ROWS_PER_PAGE);

        expect(result).toStrictEqual([10, 25, 50, 100]);
      });

      it('returns a copy not the original options reference', () => {
        const r1 = getters.options(s as any)(ROWS_PER_PAGE);
        const r2 = getters.options(s as any)(ROWS_PER_PAGE);

        expect(r1).not.toBe(r2);
      });
    });

    describe('theme', () => {
      it('returns the management setting value when it exists', () => {
        const rootGetters = { 'management/byId': jest.fn(() => ({ value: 'dark' })) };
        const localGetters = { get: jest.fn() } as any;

        const result = getters.theme(s as any, localGetters, {} as any, rootGetters as any);

        expect(result).toStrictEqual('dark');
      });

      it.each([
        {
          desc:     'returns pcs when theme is auto and pcs is dark',
          theme:    'auto',
          pcs:      'dark',
          expected: 'dark',
        },
        {
          desc:     'returns pcs when theme is auto and pcs is light',
          theme:    'auto',
          pcs:      'light',
          expected: 'light',
        },
        {
          desc:     'returns dark when theme is auto and pcs is empty',
          theme:    'auto',
          pcs:      '',
          expected: 'dark',
        },
        {
          desc:     'returns the theme directly when not auto',
          theme:    'light',
          pcs:      '',
          expected: 'light',
        },
        {
          desc:     'strips ui- prefix from theme value',
          theme:    'ui-dark',
          pcs:      '',
          expected: 'dark',
        },
      ])('$desc', ({ theme, pcs, expected }) => {
        const rootGetters = { 'management/byId': jest.fn(() => undefined) };
        const localGetters = {
          get: (key: string) => {
            if (key === THEME) return theme;
            if (key === PREFERS_SCHEME) return pcs;

            return '';
          },
        };

        const result = getters.theme(s as any, localGetters as any, {} as any, rootGetters as any);

        expect(result).toStrictEqual(expected);
      });
    });

    describe('afterLoginRoute', () => {
      it.each([
        {
          desc:         'home → route object with name home',
          pref:         'home',
          authRedirect: null,
          lastVisited:  '',
          clusterPref:  '',
          expected:     { name: 'home' },
        },
        {
          desc:         'non-string pref → returns as-is (object)',
          pref:         { name: 'custom-route' },
          authRedirect: null,
          lastVisited:  '',
          clusterPref:  '',
          expected:     { name: 'custom-route' },
        },
        {
          desc:         'last-visited with authRedirect → authRedirect',
          pref:         'last-visited',
          authRedirect: { name: 'my-redirect' },
          lastVisited:  '/some-page',
          clusterPref:  '',
          expected:     { name: 'my-redirect' },
        },
        {
          desc:         'last-visited without authRedirect + lastVisited set → lastVisited',
          pref:         'last-visited',
          authRedirect: null,
          lastVisited:  '/prev-page',
          clusterPref:  '',
          expected:     '/prev-page',
        },
        {
          desc:         'last-visited without authRedirect + no lastVisited → cluster explorer',
          pref:         'last-visited',
          authRedirect: null,
          lastVisited:  '',
          clusterPref:  'local',
          expected:     { name: 'c-cluster-explorer', params: { cluster: 'local' } },
        },
        {
          desc:         'cluster-dashboard pattern → cluster explorer with clusterId',
          pref:         'cluster-abc-dashboard',
          authRedirect: null,
          lastVisited:  '',
          clusterPref:  '',
          expected:     { name: 'c-cluster-explorer', params: { cluster: 'cluster-abc' } },
        },
        {
          desc:         'unknown string → route object with name equal to pref',
          pref:         'some-route-name',
          authRedirect: null,
          lastVisited:  '',
          clusterPref:  '',
          expected:     { name: 'some-route-name' },
        },
      ])('$desc', ({
        pref, authRedirect, lastVisited, clusterPref, expected
      }) => {
        s.authRedirect = authRedirect as any;
        const localGetters = {
          get: (key: string) => {
            if (key === AFTER_LOGIN_ROUTE) return pref;
            if (key === LAST_VISITED) return lastVisited;
            if (key === CLUSTER) return clusterPref;

            return '';
          },
        };

        const result = getters.afterLoginRoute(s as any, localGetters as any);

        expect(result).toStrictEqual(expected);
      });
    });

    describe('dev', () => {
      it('returns PLUGIN_DEVELOPER value when defined', () => {
        s.data[PLUGIN_DEVELOPER] = true;
        const localGetters = {
          get: (key: string) => {
            if (key === PLUGIN_DEVELOPER) return s.data[PLUGIN_DEVELOPER];
            if (key === DEV) return false;

            return undefined;
          },
        };

        const result = getters.dev(s as any, localGetters as any);

        expect(result).toBe(true);
      });

      it('falls back to DEV when PLUGIN_DEVELOPER getter throws', () => {
        const localGetters = {
          get: (key: string) => {
            if (key === PLUGIN_DEVELOPER) throw new Error('Unknown preference: plugin-developer');
            if (key === DEV) return false;

            return undefined;
          },
        };

        const result = getters.dev(s as any, localGetters as any);

        expect(result).toBe(false);
      });
    });
  });

  describe('mutations', () => {
    let s: ReturnType<typeof state>;

    beforeEach(() => {
      s = state();
    });

    describe('load', () => {
      it('sets data[key] to the provided value', () => {
        mutations.load(s as any, { key: CLUSTER, value: 'test-cluster' });

        expect(s.data[CLUSTER]).toStrictEqual('test-cluster');
      });

      it('overwrites an existing value', () => {
        s.data[CLUSTER] = 'old';
        mutations.load(s as any, { key: CLUSTER, value: 'new' });

        expect(s.data[CLUSTER]).toStrictEqual('new');
      });
    });

    describe('cookiesLoaded', () => {
      it('sets cookiesLoaded to true', () => {
        expect(s.cookiesLoaded).toBe(false);
        mutations.cookiesLoaded(s as any);

        expect(s.cookiesLoaded).toBe(true);
      });
    });

    describe('reset', () => {
      it('removes non-cookie prefs from data', () => {
        s.data[CLUSTER] = 'my-cluster';
        mutations.reset(s as any);

        expect(s.data[CLUSTER]).toBeUndefined();
      });

      it('keeps cookie prefs in data after reset', () => {
        s.data[THEME] = 'dark';
        mutations.reset(s as any);

        expect(s.data[THEME]).toStrictEqual('dark');
      });

      it('keeps cookie prefs for LOCALE in data after reset', () => {
        s.data[LOCALE] = 'en-us';
        mutations.reset(s as any);

        expect(s.data[LOCALE]).toStrictEqual('en-us');
      });
    });

    describe('setDefinition', () => {
      it('adds a new definition by name', () => {
        mutations.setDefinition(s as any, { name: 'new-test-def', definition: { def: 'x', asCookie: false } });

        expect(s.definitions['new-test-def']).toStrictEqual({ def: 'x', asCookie: false });
      });

      it('overwrites an existing definition', () => {
        const original = s.definitions[CLUSTER];

        mutations.setDefinition(s as any, { name: CLUSTER, definition: { def: 'override', asCookie: false } });

        expect(s.definitions[CLUSTER]).not.toBe(original);
        expect(s.definitions[CLUSTER]).toStrictEqual({ def: 'override', asCookie: false });
      });
    });

    describe('setAuthRedirect', () => {
      it('sets authRedirect to the provided route', () => {
        mutations.setAuthRedirect(s as any, { name: 'home', params: { cluster: 'local' } });

        expect(s.authRedirect).toStrictEqual({ name: 'home', params: { cluster: 'local' } });
      });

      it('clears authRedirect when passed null', () => {
        s.authRedirect = { name: 'previous' };
        mutations.setAuthRedirect(s as any, null);

        expect(s.authRedirect).toBeNull();
      });
    });
  });

  describe('actions', () => {
    describe('setTheme', () => {
      it('dispatches set with the THEME key and provided value', async() => {
        const dispatch = jest.fn().mockResolvedValue(undefined);

        await actions.setTheme({ dispatch } as any, 'dark');

        expect(dispatch).toHaveBeenCalledWith('set', { key: THEME, value: 'dark' });
      });
    });

    describe('toggleTheme', () => {
      it.each([
        {
          desc:     'light → dispatches dark',
          current:  'light',
          expected: 'dark',
        },
        {
          desc:     'dark → dispatches light',
          current:  'dark',
          expected: 'light',
        },
      ])('$desc', async({ current, expected }) => {
        const dispatch = jest.fn().mockResolvedValue(undefined);
        const localGetters = { [THEME]: current };

        await actions.toggleTheme({ getters: localGetters, dispatch } as any);

        expect(dispatch).toHaveBeenCalledWith('set', { key: THEME, value: expected });
      });
    });

    describe('setLastVisited', () => {
      it('returns early when route is falsy', async() => {
        const dispatch = jest.fn();
        const localGetters = { get: jest.fn(() => 'last-visited') };

        const result = await actions.setLastVisited({
          state: state(), dispatch, getters: localGetters
        } as any, null);

        expect(dispatch).not.toHaveBeenCalled();
        expect(result).toBeUndefined();
      });

      it('returns early when afterLoginRoute is not last-visited', async() => {
        const dispatch = jest.fn();
        const localGetters = { get: jest.fn(() => 'home') };

        const result = await actions.setLastVisited({
          state: state(), dispatch, getters: localGetters
        } as any, '/some-page');

        expect(dispatch).not.toHaveBeenCalled();
        expect(result).toBeUndefined();
      });

      it('dispatches set with LAST_VISITED when afterLoginRoute is last-visited', async() => {
        const dispatch = jest.fn().mockResolvedValue(undefined);
        const localGetters = { get: jest.fn(() => 'last-visited') };

        await actions.setLastVisited({
          state: state(), dispatch, getters: localGetters
        } as any, '/current-page');

        expect(dispatch).toHaveBeenCalledWith('set', {
          key:   LAST_VISITED,
          value: '/current-page',
        });
      });

      it('returns early when afterLoginRoute is a non-string (object)', async() => {
        const dispatch = jest.fn();
        const localGetters = { get: jest.fn(() => ({ name: 'some-object-route' })) };

        const result = await actions.setLastVisited({
          state: state(), dispatch, getters: localGetters
        } as any, '/some-page');

        expect(dispatch).not.toHaveBeenCalled();
        expect(result).toBeUndefined();
      });
    });

    describe('loadCookies', () => {
      it('returns early when cookiesLoaded is already true', () => {
        const s = state();

        s.cookiesLoaded = true;
        const commit = jest.fn();
        const rootGetters = { 'cookies/get': jest.fn() };

        actions.loadCookies({
          state: s, commit, rootGetters
        } as any);

        expect(commit).not.toHaveBeenCalled();
      });

      it('commits cookiesLoaded after loading', () => {
        const s = state();
        const commit = jest.fn();
        const rootGetters = { 'cookies/get': jest.fn(() => undefined) };

        actions.loadCookies({
          state: s, commit, rootGetters
        } as any);

        expect(commit).toHaveBeenCalledWith('cookiesLoaded');
      });

      it('commits load for cookie-based prefs with a non-undefined value', () => {
        const s = state();
        const commit = jest.fn();
        const rootGetters = {
          'cookies/get': jest.fn(({ key }: { key: string }) => {
            if (key === 'R_THEME'.toUpperCase()) return 'dark';

            return undefined;
          }),
        };

        actions.loadCookies({
          state: s, commit, rootGetters
        } as any);

        const loadCalls = commit.mock.calls.filter(([name]: [string]) => name === 'load');

        expect(loadCalls.some(([, payload]: [string, { key: string; value: string }]) => payload.key === THEME && payload.value === 'dark')).toBe(true);
      });

      it('does not commit load for cookie-based prefs when cookie value is undefined', () => {
        const s = state();
        const commit = jest.fn();
        const rootGetters = { 'cookies/get': jest.fn(() => undefined) };

        actions.loadCookies({
          state: s, commit, rootGetters
        } as any);

        const loadCalls = commit.mock.calls.filter(([name]: [string]) => name === 'load');

        expect(loadCalls).toHaveLength(0);
      });

      it('does not commit load for non-cookie prefs', () => {
        const s = state();
        const commit = jest.fn();
        const rootGetters = {
          'cookies/get': jest.fn(({ key }: { key: string }) => {
            // Return something for any key to confirm non-cookie prefs are not committed
            return 'some-value';
          }),
        };

        actions.loadCookies({
          state: s, commit, rootGetters
        } as any);

        // CLUSTER is not asCookie, so no load commit should reference it
        const loadCalls = commit.mock.calls.filter(([name]: [string]) => name === 'load');
        const clusterLoaded = loadCalls.some(([, payload]: [string, { key: string }]) => payload.key === CLUSTER);

        expect(clusterLoaded).toBe(false);
      });
    });
  });
});
