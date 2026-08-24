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
  PINNED_CLUSTERS,
  RECENT_CLUSTERS,
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

    describe('set', () => {
      beforeEach(() => {
        // The setDefinition mutation test overwrites CLUSTER in the shared module-level
        // definitions object. Re-register it here so set action tests see correct asUserPreference.
        create(CLUSTER, '');
      });

      afterEach(async() => {
        // `set` populates the module-level `prefsBeforeLogin` when called while
        // logged out. Drain it via a mock loadServer so it does not leak into
        // subsequent loadServer tests (which would then try to call server.save).
        const mockServer = { data: {}, save: jest.fn().mockResolvedValue(undefined) };
        const drainDispatch = jest.fn().mockResolvedValue([mockServer]);

        await actions.loadServer({
          state: state(), dispatch: drainDispatch, commit: jest.fn(), rootState: {}, rootGetters: {}
        } as any, undefined);
      });

      it('throws when opt.val is used instead of opt.value', async() => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const rootGetters = { 'auth/loggedIn': true };
        const s = state();

        await expect(
          actions.set({
            dispatch, commit, rootGetters, state: s
          } as any, { key: CLUSTER, val: 'test' })
        ).rejects.toThrow('Use value, not val');
      });

      it('commits load with the key and value immediately', async() => {
        const s = state();
        const commit = jest.fn();
        const rootGetters = { 'auth/loggedIn': false };
        const dispatch = jest.fn();

        await actions.set({
          dispatch, commit, rootGetters, state: s
        } as any, { key: CLUSTER, value: 'my-cluster' });

        expect(commit).toHaveBeenCalledWith('load', { key: CLUSTER, value: 'my-cluster' });
      });

      it('stores value in prefsBeforeLogin when not logged in and asUserPreference is true', async() => {
        const s = state();
        const commit = jest.fn();
        const dispatch = jest.fn();
        const rootGetters = { 'auth/loggedIn': false };

        const result = await actions.set({
          dispatch, commit, rootGetters, state: s
        } as any, { key: CLUSTER, value: 'test-cluster' });

        expect(result).toBeUndefined();
        // dispatch should not have been called for loadServer since we returned early
        expect(dispatch).not.toHaveBeenCalled();
      });

      it('commits cookies/set for cookie-based prefs', async() => {
        const s = state();
        const commit = jest.fn();
        const dispatch = jest.fn().mockResolvedValue({ data: {}, save: jest.fn().mockResolvedValue(undefined) });
        const rootGetters = { 'auth/loggedIn': true };

        await actions.set({
          dispatch, commit, rootGetters, state: s
        } as any, { key: THEME, value: 'dark' });

        const cookieSetCall = commit.mock.calls.find(([name]: [string]) => name === 'cookies/set');

        expect(cookieSetCall).toBeDefined();
        expect(cookieSetCall[1]).toMatchObject({ value: 'dark' });
      });

      it('does not commit cookies/set for non-cookie prefs', async() => {
        const s = state();
        const commit = jest.fn();
        const dispatch = jest.fn().mockResolvedValue({ data: {}, save: jest.fn().mockResolvedValue(undefined) });
        const rootGetters = { 'auth/loggedIn': true };

        await actions.set({
          dispatch, commit, rootGetters, state: s
        } as any, { key: CLUSTER, value: 'my-cluster' });

        const cookieSetCall = commit.mock.calls.find(([name]: [string]) => name === 'cookies/set');

        expect(cookieSetCall).toBeUndefined();
      });

      it('dispatches loadServer when logged in and asUserPreference is true', async() => {
        const s = state();
        const commit = jest.fn();
        const serverObj = { data: {}, save: jest.fn().mockResolvedValue(undefined) };
        const dispatch = jest.fn().mockResolvedValue(serverObj);
        const rootGetters = { 'auth/loggedIn': true };

        // ROWS_PER_PAGE: asUserPreference defaults to true, not mutated by other tests
        await actions.set({
          dispatch, commit, rootGetters, state: s
        } as any, { key: ROWS_PER_PAGE, value: 25 });

        expect(dispatch).toHaveBeenCalledWith('loadServer', ROWS_PER_PAGE);
      });

      it('writes mangleWrite-transformed value to server.data, json-stringified due to parseJSON', async() => {
        const s = state();
        const commit = jest.fn();
        const serverData: Record<string, unknown> = {};
        const serverObj = { data: serverData, save: jest.fn().mockResolvedValue(undefined) };
        const dispatch = jest.fn().mockResolvedValue(serverObj);
        const rootGetters = { 'auth/loggedIn': true };

        // THEME has mangleWrite: (x) => `ui-${x}` AND parseJSON:true, so stored as JSON.stringify('ui-light')
        await actions.set({
          dispatch, commit, rootGetters, state: s
        } as any, { key: THEME, value: 'light' });

        expect(serverData[THEME]).toStrictEqual('"ui-light"');
      });

      it('JSON-stringifies value for parseJSON prefs when saving to server', async() => {
        const s = state();
        const commit = jest.fn();
        const serverData: Record<string, unknown> = {};
        const serverObj = { data: serverData, save: jest.fn().mockResolvedValue(undefined) };
        const dispatch = jest.fn().mockResolvedValue(serverObj);
        const rootGetters = { 'auth/loggedIn': true };

        // ROWS_PER_PAGE has parseJSON: true, no mangleWrite
        await actions.set({
          dispatch, commit, rootGetters, state: s
        } as any, { key: ROWS_PER_PAGE, value: 50 });

        expect(serverData[ROWS_PER_PAGE]).toStrictEqual('50');
      });

      it('returns error type and status when loadServer call throws', async() => {
        const s = state();
        const commit = jest.fn();
        const err = Object.assign(new Error('server error'), { type: 'ServerError', status: 503 });
        const dispatch = jest.fn().mockRejectedValue(err);
        const rootGetters = { 'auth/loggedIn': true };

        // ROWS_PER_PAGE: asUserPreference defaults to true
        const result = await actions.set({
          dispatch, commit, rootGetters, state: s
        } as any, { key: ROWS_PER_PAGE, value: 25 });

        expect(result).toStrictEqual({ type: 'ServerError', status: 503 });
      });

      it('returns error info when server save throws', async() => {
        const s = state();
        const commit = jest.fn();
        const mockServer = {
          data: {},
          save: jest.fn().mockRejectedValue({ type: 'error', status: 500 }),
        };
        const dispatch = jest.fn().mockResolvedValue(mockServer);
        const rootGetters = { 'auth/loggedIn': true };

        const result = await actions.set({
          dispatch, commit, rootGetters, state: s
        } as any, { key: CLUSTER, value: 'fail' });

        expect(result).toStrictEqual({ type: 'error', status: 500 });
      });

      it('returns undefined when loadServer returns undefined', async() => {
        const s = state();
        const commit = jest.fn();
        const dispatch = jest.fn().mockResolvedValue(undefined);
        const rootGetters = { 'auth/loggedIn': true };

        const result = await actions.set({
          dispatch, commit, rootGetters, state: s
        } as any, { key: CLUSTER, value: 'x' });

        expect(result).toBeUndefined();
      });
    });

    describe('merge writes (applyPrefsOptimistic + reconcilePrefs)', () => {
      const loggedIn = { 'auth/loggedIn': true };

      beforeEach(() => {
        // Other tests mutate the shared definitions map — re-register the cluster prefs as JSON-parsed
        // user preferences.
        create(PINNED_CLUSTERS, [], { parseJSON: true });
        create(RECENT_CLUSTERS, [], { parseJSON: true });
      });

      afterEach(async() => {
        // A logged-out optimistic write populates module-level prefsBeforeLogin; drain it via loadServer so it
        // doesn't leak into later tests (mirrors the `set` describe).
        const mockServer = { data: {}, save: jest.fn().mockResolvedValue(undefined) };
        const drainDispatch = jest.fn().mockResolvedValue([mockServer]);

        await actions.loadServer({
          state: state(), dispatch: drainDispatch, commit: jest.fn(), rootState: {}, rootGetters: {}
        } as any, undefined);
      });

      const prepend = (item: string) => (arr: string[]) => [item, ...(arr || []).filter((x) => x !== item)];

      // Logged-in run of the two phases (optimistic then reconcile) against a given server value; the writer
      // drives these two directly (optimistic outside the queue, reconcile inside), so that's what we test.
      const run = async(
        clientValue: string[], serverValue: string[], apply: (a: string[]) => string[], key: string = RECENT_CLUSTERS
      ) => {
        const s: any = state();

        s.data[key] = clientValue;

        const commit = jest.fn((name: string, payload: any) => {
          if (name === 'load') {
            s.data[payload.key] = payload.value;
          }
        });
        const server = {
          data: { [key]: JSON.stringify(serverValue) },
          save: jest.fn().mockResolvedValue(undefined),
        };
        const dispatch = jest.fn().mockResolvedValue(server); // loadServer
        const ctx = {
          dispatch, commit, rootGetters: loggedIn, state: s
        } as any;
        const mutations = [{ key, apply }];

        const optimistic = actions.applyPrefsOptimistic(ctx, mutations);

        await actions.reconcilePrefs(ctx, { mutations, optimistic });

        return {
          commit, server, dispatch
        };
      };

      it('phase 1: commits the client-based result immediately, then does one GET', async() => {
        const { commit, dispatch } = await run(['b'], ['b'], prepend('a'));

        expect(commit).toHaveBeenCalledWith('load', { key: RECENT_CLUSTERS, value: ['a', 'b'] });
        expect(dispatch).toHaveBeenCalledWith('loadServer', [RECENT_CLUSTERS]);
      });

      it('phase 2: when client === server, persists the reconciled value with no divergent re-commit', async() => {
        const { commit, server } = await run(['b'], ['b'], prepend('a'));

        const loads = commit.mock.calls.filter((c: any[]) => c[0] === 'load');

        expect(loads).toHaveLength(1);
        expect(server.data[RECENT_CLUSTERS]).toBe(JSON.stringify(['a', 'b']));
        expect(server.save).toHaveBeenCalledTimes(1);
      });

      it('divergence: applies the action to the SERVER value and adopts it (server wins the base)', async() => {
        // Client thinks recent = ['b'], but the server actually holds ['x','y','z'] (another tab / edit).
        const { commit, server } = await run(['b'], ['x', 'y', 'z'], prepend('a'));

        expect(commit).toHaveBeenCalledWith('load', { key: RECENT_CLUSTERS, value: ['a', 'b'] }); // optimistic
        expect(commit).toHaveBeenCalledWith('load', { key: RECENT_CLUSTERS, value: ['a', 'x', 'y', 'z'] }); // adopted
        expect(server.data[RECENT_CLUSTERS]).toBe(JSON.stringify(['a', 'x', 'y', 'z'])); // persisted server-based
        expect(server.save).toHaveBeenCalledTimes(1);
      });

      it('no-op: skips the PUT when the action leaves the server value unchanged', async() => {
        const { server } = await run(['a'], ['a'], prepend('a'));

        expect(server.save).not.toHaveBeenCalled();
      });

      it('logged out: commits optimistically but never touches the server', async() => {
        const s: any = state();

        s.data[PINNED_CLUSTERS] = [];
        const commit = jest.fn();
        const dispatch = jest.fn();
        const ctx = {
          dispatch, commit, rootGetters: { 'auth/loggedIn': false }, state: s
        } as any;
        const mutations = [{ key: PINNED_CLUSTERS, apply: prepend('a') }];

        const optimistic = actions.applyPrefsOptimistic(ctx, mutations);

        await actions.reconcilePrefs(ctx, { mutations, optimistic });

        expect(commit).toHaveBeenCalledWith('load', { key: PINNED_CLUSTERS, value: ['a'] });
        expect(dispatch).not.toHaveBeenCalled();
      });
    });

    describe('loadServer', () => {
      it('returns undefined when management/findAll throws', async() => {
        const s = state();
        const commit = jest.fn();
        const dispatch = jest.fn().mockRejectedValue(new Error('network error'));
        const rootState = { managementReady: false };
        const rootGetters = {};

        const result = await actions.loadServer({
          state: s, dispatch, commit, rootState, rootGetters
        } as any, undefined);

        expect(result).toBeUndefined();
      });

      it('returns undefined when findAll returns empty array', async() => {
        const s = state();
        const commit = jest.fn();
        const dispatch = jest.fn().mockResolvedValue([]);
        const rootState = {};
        const rootGetters = {};

        const result = await actions.loadServer({
          state: s, dispatch, commit, rootState, rootGetters
        } as any, undefined);

        expect(result).toBeUndefined();
      });

      it('returns undefined when server object has no data field', async() => {
        const s = state();
        const commit = jest.fn();
        const dispatch = jest.fn().mockResolvedValue([{ }]);
        const rootState = {};
        const rootGetters = {};

        const result = await actions.loadServer({
          state: s, dispatch, commit, rootState, rootGetters
        } as any, undefined);

        expect(result).toBeUndefined();
      });

      it('commits load for each defined key present in server.data', async() => {
        const s = state();
        const commit = jest.fn();
        const serverObj = { data: { [CLUSTER]: 'c1' } };
        const dispatch = jest.fn().mockResolvedValue([serverObj]);
        const rootState = {};
        const rootGetters = {};

        await actions.loadServer({
          state: s, dispatch, commit, rootState, rootGetters
        } as any, undefined);

        const loadCalls = commit.mock.calls.filter(([name]: [string]) => name === 'load');

        expect(loadCalls.some(([, p]: [string, { key: string; value: string }]) => p.key === CLUSTER && p.value === 'c1')).toBe(true);
      });

      it('skips the ignoreKey even when present in server.data', async() => {
        const s = state();
        const commit = jest.fn();
        const serverObj = { data: { [CLUSTER]: 'c1' } };
        const dispatch = jest.fn().mockResolvedValue([serverObj]);
        const rootState = {};
        const rootGetters = {};

        await actions.loadServer({
          state: s, dispatch, commit, rootState, rootGetters
        } as any, CLUSTER);

        const loadCalls = commit.mock.calls.filter(([name]: [string]) => name === 'load');

        expect(loadCalls.every(([, p]: [string, { key: string }]) => p.key !== CLUSTER)).toBe(true);
      });

      it('applies mangleRead to values that have it defined', async() => {
        const s = state();
        const commit = jest.fn();
        // THEME has mangleRead: (x) => x.replace(/^ui-/, '') and parseJSON:true
        // Server stores JSON-stringified value, so '"ui-dark"' → JSON.parse → 'ui-dark' → mangleRead → 'dark'
        const serverObj = { data: { [THEME]: '"ui-dark"' } };
        const dispatch = jest.fn().mockResolvedValue([serverObj]);
        const rootState = {};
        const rootGetters = {};

        await actions.loadServer({
          state: s, dispatch, commit, rootState, rootGetters
        } as any, undefined);

        const loadCalls = commit.mock.calls.filter(([name]: [string]) => name === 'load');
        const themeCall = loadCalls.find(([, p]: [string, { key: string }]) => p.key === THEME);

        expect(themeCall?.[1].value).toStrictEqual('dark');
      });

      it('parses JSON values for parseJSON prefs', async() => {
        const s = state();
        const commit = jest.fn();
        // ROWS_PER_PAGE has parseJSON: true
        const serverObj = { data: { [ROWS_PER_PAGE]: '25' } };
        const dispatch = jest.fn().mockResolvedValue([serverObj]);
        const rootState = {};
        const rootGetters = {};

        await actions.loadServer({
          state: s, dispatch, commit, rootState, rootGetters
        } as any, undefined);

        const loadCalls = commit.mock.calls.filter(([name]: [string]) => name === 'load');
        const rppCall = loadCalls.find(([, p]: [string, { key: string }]) => p.key === ROWS_PER_PAGE);

        expect(rppCall?.[1].value).toStrictEqual(25);
      });

      it('skips parseJSON value when JSON.parse fails (and does not commit for that key)', async() => {
        const s = state();
        const commit = jest.fn();
        // ROWS_PER_PAGE expects valid JSON; pass invalid JSON
        const serverObj = { data: { [ROWS_PER_PAGE]: 'not-json{{' } };
        const dispatch = jest.fn().mockResolvedValue([serverObj]);
        const rootState = {};
        const rootGetters = {};

        await actions.loadServer({
          state: s, dispatch, commit, rootState, rootGetters
        } as any, undefined);

        const loadCalls = commit.mock.calls.filter(([name]: [string]) => name === 'load');
        const rppCall = loadCalls.find(([, p]: [string, { key: string }]) => p.key === ROWS_PER_PAGE);

        expect(rppCall).toBeUndefined();
      });

      it('falls back to inheritFrom value when primary key is absent in server.data', async() => {
        const s = state();
        const commit = jest.fn();
        // VIEW_IN_API has inheritFrom: DEV; server.data has DEV but not VIEW_IN_API
        const serverObj = { data: { [DEV]: 'true' } };
        const dispatch = jest.fn().mockResolvedValue([serverObj]);
        const rootState = {};
        const rootGetters = {};

        await actions.loadServer({
          state: s, dispatch, commit, rootState, rootGetters
        } as any, undefined);

        const loadCalls = commit.mock.calls.filter(([name]: [string]) => name === 'load');
        const viewInApiCall = loadCalls.find(([, p]: [string, { key: string }]) => p.key === 'view-in-api');

        // VIEW_IN_API is parseJSON so 'true' becomes boolean true
        expect(viewInApiCall?.[1].value).toStrictEqual(true);
      });

      it('returns the server object on success', async() => {
        const s = state();
        const commit = jest.fn();
        const serverObj = { data: {} };
        const dispatch = jest.fn().mockResolvedValue([serverObj]);
        const rootState = {};
        const rootGetters = {};

        const result = await actions.loadServer({
          state: s, dispatch, commit, rootState, rootGetters
        } as any, undefined);

        expect(result).toBe(serverObj);
      });
    });

    describe('loadTheme', () => {
      type MediaResult = { matches: boolean; addListener: (fn: (e: { matches: boolean }) => void) => void };
      type MediaImpl = (query: string) => MediaResult;

      let setTimeoutSpy: jest.SpyInstance;
      let mediaImpl: MediaImpl;

      beforeEach(() => {
        jest.useFakeTimers();
        setTimeoutSpy = jest.spyOn(global, 'setTimeout');
        mediaImpl = () => ({ matches: false, addListener: jest.fn() });
        (window.matchMedia as jest.Mock).mockImplementation((query: string) => mediaImpl(query));
      });

      afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
      });

      it('dispatches set with dark when watchDark.matches is true', () => {
        const dispatch = jest.fn();

        mediaImpl = (query: string) => ({
          matches:     query === '(prefers-color-scheme: dark)',
          addListener: jest.fn(),
        });

        actions.loadTheme({ dispatch } as any);

        expect(dispatch).toHaveBeenCalledWith('set', { key: PREFERS_SCHEME, value: 'dark' });
      });

      it('dispatches set with light when watchLight.matches is true', () => {
        const dispatch = jest.fn();

        mediaImpl = (query: string) => ({
          matches:     query === '(prefers-color-scheme: light)',
          addListener: jest.fn(),
        });

        actions.loadTheme({ dispatch } as any);

        expect(dispatch).toHaveBeenCalledWith('set', { key: PREFERS_SCHEME, value: 'light' });
      });

      it('dispatches set based on clock (daytime → light) when no media query matches', () => {
        const dispatch = jest.fn();
        const dateSpy = jest.spyOn(Date.prototype, 'getHours').mockReturnValue(10);

        actions.loadTheme({ dispatch } as any);

        expect(dispatch).toHaveBeenCalledWith('set', { key: PREFERS_SCHEME, value: 'light' });
        dateSpy.mockRestore();
      });

      it('dispatches set based on clock (nighttime → dark) when no media query matches', () => {
        const dispatch = jest.fn();
        const dateSpy = jest.spyOn(Date.prototype, 'getHours').mockReturnValue(20);

        actions.loadTheme({ dispatch } as any);

        expect(dispatch).toHaveBeenCalledWith('set', { key: PREFERS_SCHEME, value: 'dark' });
        dateSpy.mockRestore();
      });

      it('registers a setTimeout to call loadTheme again at the next half-hour boundary', () => {
        const dispatch = jest.fn();

        actions.loadTheme({ dispatch } as any);

        expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
        const timeoutMs = setTimeoutSpy.mock.calls[0][1] as number;

        expect(timeoutMs).toBeGreaterThan(0);
        expect(timeoutMs).toBeLessThanOrEqual(30 * 60 * 1000);
      });

      it('dispatches loadTheme again when the scheduled timeout fires', () => {
        const dispatch = jest.fn();

        actions.loadTheme({ dispatch } as any);
        jest.runAllTimers();

        expect(dispatch).toHaveBeenCalledWith('loadTheme');
      });

      it('registers dark-preference change listener that dispatches dark', () => {
        const dispatch = jest.fn();
        let darkListener: (e: { matches: boolean }) => void = () => {};

        mediaImpl = (query: string) => ({
          matches:     false,
          addListener: (fn: (e: { matches: boolean }) => void) => {
            if (query === '(prefers-color-scheme: dark)') {
              darkListener = fn;
            }
          },
        });

        actions.loadTheme({ dispatch } as any);
        dispatch.mockClear();

        darkListener({ matches: true });

        expect(dispatch).toHaveBeenCalledWith('set', { key: PREFERS_SCHEME, value: 'dark' });
      });

      it('does not dispatch when dark listener fires with matches false', () => {
        const dispatch = jest.fn();
        let darkListener: (e: { matches: boolean }) => void = () => {};

        mediaImpl = (query: string) => ({
          matches:     false,
          addListener: (fn: (e: { matches: boolean }) => void) => {
            if (query === '(prefers-color-scheme: dark)') {
              darkListener = fn;
            }
          },
        });

        actions.loadTheme({ dispatch } as any);
        dispatch.mockClear();

        darkListener({ matches: false });

        expect(dispatch).not.toHaveBeenCalled();
      });
    });

    describe('setBrandStyle', () => {
      it('does nothing when managementReady is false', () => {
        const addSpy = jest.spyOn(document.body.classList, 'add');
        const rootState = { managementReady: false };
        const rootGetters = { 'management/brand': 'somebrand' };

        actions.setBrandStyle({ rootState, rootGetters } as any);

        expect(addSpy).not.toHaveBeenCalled();
        addSpy.mockRestore();
      });

      it('does nothing when brandSetting is empty string', () => {
        const addSpy = jest.spyOn(document.body.classList, 'add');
        const rootState = { managementReady: true };
        const rootGetters = { 'management/brand': '' };

        actions.setBrandStyle({ rootState, rootGetters } as any);

        expect(addSpy).not.toHaveBeenCalled();
        addSpy.mockRestore();
      });

      it('does not throw when getBrandMeta throws', () => {
        const rootState = { managementReady: true };
        const rootGetters = { 'management/brand': 'throwbrand' };

        // setBrandStyle wraps the inner block in try/catch — must not propagate
        expect(() => {
          actions.setBrandStyle({ rootState, rootGetters } as any);
        }).not.toThrow();
      });
    });
  });
});

