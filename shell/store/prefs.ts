import { SETTING } from '@shell/config/settings';
import { MANAGEMENT, STEVE } from '@shell/config/types';
import { clone } from '@shell/utils/object';
import { getBrandMeta } from '@shell/utils/brand';
import { VuexStoreGetters } from '@shell/types/store/vuex';

/**
 * How a single preference behaves, as built by `create` and by the
 * `setDefinition` mutation.
 */
export interface PrefDefinition {
  def?: any;
  options?: any[];
  parseJSON?: boolean;
  asCookie?: boolean;
  asUserPreference?: boolean;
  inheritFrom?: string;
  mangleRead?: (value: any) => any;
  mangleWrite?: (value: any) => any;
}

export type PrefOptions = Omit<PrefDefinition, 'def'>;

export interface PrefsState {
  cookiesLoaded: boolean;
  data: Record<string, any>;
  definitions: Record<string, PrefDefinition>;
  authRedirect: Record<string, any> | null;
}

interface PrefError {
  type?: string;
  status?: number;
}

interface PrefsActionContext {
  state: PrefsState;
  getters: VuexStoreGetters;
  rootState: Record<string, any>;
  rootGetters: VuexStoreGetters;
  commit: (mutation: string, payload?: any, options?: { root?: boolean }) => void;
  dispatch: (action: string, payload?: any, options?: { root?: boolean }) => Promise<any>;
}

/**
 * Preferences are open ended: `create` registers the built-in ones at module
 * load and extensions add their own at runtime, so the keys are not known here.
 */
const definitions: Record<string, PrefDefinition> = {};
/**
 * Key/value of prefrences are stored before login here and cookies due lack of access permission.
 * Once user is logged in while setting asUserPreference, update stored before login Key/value to the backend in loadServer function.
 */
let prefsBeforeLogin: Record<string, any> = {};

export const create = function(name: string, def: any, opt: PrefOptions = {}): string {
  const parseJSON = opt.parseJSON === true;
  const asCookie = opt.asCookie === true;
  const asUserPreference = opt.asUserPreference !== false;
  const options = opt.options;
  const inheritFrom = opt.inheritFrom;

  definitions[name] = {
    def,
    options,
    parseJSON,
    asCookie,
    asUserPreference,
    inheritFrom, // if value is not defined on server, we can default it to another pref
    mangleRead:  opt.mangleRead, // Alter the value read from the API (to match old Rancher expectations)
    mangleWrite: opt.mangleWrite, // Alter the value written back to the API (ditto)
  };

  return name;
};

export const mapPref = function(name: string) {
  return {
    get(this: { $store: { getters: VuexStoreGetters } }) {
      return this.$store.getters['prefs/get'](name);
    },

    set(this: { $store: { dispatch: (action: string, payload?: any) => void } }, value: any) {
      this.$store.dispatch('prefs/set', { key: name, value });
    }
  };
};

// --------------------
const parseJSON = true; // Shortcut for setting it below
const asCookie = true; // Store as a cookie so that it's available before auth + on server-side

// Keys must be lowercase and valid dns label (a-z 0-9 -)
export const CLUSTER = create('cluster', '');
export const LAST_NAMESPACE = create('last-namespace', '');
export const NAMESPACE_FILTERS = create('ns-by-cluster', {}, { parseJSON });
export const WORKSPACE = create('workspace', '');
export const EXPANDED_GROUPS = create('open-groups', ['cluster', 'policy', 'rbac', 'serviceDiscovery', 'storage', 'workload'], { parseJSON });
export const FAVORITE_TYPES = create('fav-type', [], { parseJSON });
export const PINNED_CLUSTERS = create('pinned-clusters', [], { parseJSON });
export const RECENT_CLUSTERS = create('recent-clusters', [], { parseJSON });
export const GROUP_RESOURCES = create('group-by', 'namespace');
export const DIFF = create('diff', 'unified', { options: ['unified', 'split'] });
export const THEME = create('theme', 'auto', {
  options:     ['light', 'auto', 'dark'],
  asCookie,
  parseJSON,
  mangleRead:  (x) => x.replace(/^ui-/, ''),
  mangleWrite: (x) => `ui-${ x }`,
});
export const PREFERS_SCHEME = create('pcs', '', { asCookie, asUserPreference: false });
export const LOCALE = create('locale', 'en-us', { asCookie });
export const KEYMAP = create('keymap', 'sublime', { options: ['sublime', 'emacs', 'vim'] });
export const ROWS_PER_PAGE = create('per-page', 100, { options: [10, 25, 50, 100], parseJSON });
export const LOGS_WRAP = create('logs-wrap', true, { parseJSON });
export const LOGS_TIME = create('logs-time', true, { parseJSON });
export const LOGS_RANGE = create('logs-range', '30 minutes', { parseJSON });
export const HIDE_REPOS = create('hide-repos', [], { parseJSON });
export const HIDE_DESC = create('hide-desc', [], { parseJSON });
export const HIDE_SENSITIVE = create('hide-sensitive', true, { options: [true, false], parseJSON });
export const SHOW_PRE_RELEASE = create('show-pre-release', false, { options: [false, true], parseJSON });

export const DATE_FORMAT = create('date-format', 'ddd, MMM D YYYY', {
  options: [
    'ddd, MMM D YYYY',
    'ddd, D MMM YYYY',
    'D/M/YYYY',
    'M/D/YYYY',
    'YYYY-MM-DD'
  ]
});

export const TIME_FORMAT = create('time-format', 'h:mm:ss a', {
  options: [
    'h:mm:ss a',
    'HH:mm:ss'
  ]
});

export const TIME_ZONE = create('time-zone', 'local');
// DEV will be deprecated on v2.7.0, but is needed so that we can grab the value for the new settings that derived from it
// such as: VIEW_IN_API, ALL_NAMESPACES, THEME_SHORTCUT
export const DEV = create('dev', false, { parseJSON });
export const VIEW_IN_API = create('view-in-api', false, { parseJSON, inheritFrom: DEV });
export const ALL_NAMESPACES = create('all-namespaces', false, { parseJSON, inheritFrom: DEV });
export const THEME_SHORTCUT = create('theme-shortcut', false, { parseJSON, inheritFrom: DEV });
export const LAST_VISITED = create('last-visited', 'home', { parseJSON });
export const SEEN_WHATS_NEW = create('seen-whatsnew', '', { parseJSON });
export const READ_WHATS_NEW = create('read-whatsnew', '', { parseJSON });
export const AFTER_LOGIN_ROUTE = create('after-login-route', 'home', { parseJSON } );
export const HIDE_HOME_PAGE_CARDS = create('home-page-cards', {}, { parseJSON } );
export const PLUGIN_DEVELOPER = create('plugin-developer', false, { parseJSON, inheritFrom: DEV }); // Is the user a plugin developer?

export const _RKE1 = 'rke1';
export const _RKE2 = 'rke2';
export const PROVISIONER = create('provisioner', _RKE2, { options: [_RKE1, _RKE2] });

// Maximum number of clusters to show in the slide-in menu
export const MENU_MAX_CLUSTERS = 10;
// Page size for the cluster-switcher flyout's ALL CLUSTERS directory and its search results. Bigger than
// MENU_MAX_CLUSTERS because the flyout now runs the full height of the viewport — one page should be
// enough to fill it, rather than leaning on the top-up fetch.
export const SWITCHER_PAGE_SIZE = 20;
// Maximum number of recently-visited clusters kept / shown in the app-bar shelf
export const MENU_MAX_RECENT_CLUSTERS = 10;
// Max chars of the echoed search term in the "no clusters match …" message; shared by the
// expanded nav and the flyout so the two surfaces cannot drift.
export const SEARCH_ECHO_MAX = 30;
// Prompt for confirm when scaling down node pool in GUI and save the pref
export const SCALE_POOL_PROMPT = create('scale-pool-prompt', null, { parseJSON });

// Dynamic content
export const READ_NEW_RELEASE = create('read-new-release', '', { parseJSON });
export const READ_SUPPORT_NOTICE = create('read-support-notice', '', { parseJSON });
export const READ_UPCOMING_SUPPORT_NOTICE = create('read-upcoming-support-notice', '', { parseJSON });
export const READ_ANNOUNCEMENTS = create('read-announcements', '', { parseJSON });

// Hidden banners
export const HIDE_SUSE_APP_COLLECTION_REPO_BANNER = create('hide-suse-app-collection-repo-banner', false);

// --------------------

const cookiePrefix = 'R_';
const cookieOptions = {
  maxAge:   365 * 86400,
  path:     '/',
  sameSite: true,
  secure:   true,
};

/**
 * `definitions` is the module level object itself, not a copy, so every store instance
 * shares what `create` adds at module load and `setDefinition` adds at runtime.
 */
export const state = function(): PrefsState {
  return {
    cookiesLoaded: false,
    data:          {},
    definitions,
    authRedirect:  null
  };
};

export const getters = {
  get: (state: PrefsState) => (key: string) => {
    const definition = state.definitions[key];

    if (!definition) {
      throw new Error(`Unknown preference: ${ key }`);
    }

    const user = state.data[key];

    if (user !== undefined) {
      return clone(user);
    }

    const def = clone(definition.def);

    return def;
  },

  defaultValue: (state: PrefsState) => (key: string) => {
    const definition = state.definitions[key];

    if (!definition) {
      throw new Error(`Unknown preference: ${ key }`);
    }

    return clone(definition.def);
  },

  options: (state: PrefsState) => (key: string) => {
    const definition = state.definitions[key];

    if (!definition) {
      throw new Error(`Unknown preference: ${ key }`);
    }

    if (!definition.options) {
      throw new Error(`Preference does not have options: ${ key }`);
    }

    return definition.options.slice();
  },

  theme: (state: PrefsState, getters: VuexStoreGetters, rootState: unknown, rootGetters: VuexStoreGetters) => {
    const setting = rootGetters['management/byId'](MANAGEMENT.SETTING, SETTING.THEME);

    if (setting?.value) {
      return setting?.value;
    }

    let theme = getters['get'](THEME);
    const pcs = getters['get'](PREFERS_SCHEME);

    // console.log('Get Theme', theme, pcs);

    // Ember UI uses this prefix
    if ( theme.startsWith('ui-') ) {
      theme = theme.substr(3);
    }

    if ( theme === 'auto' ) {
      if ( pcs === 'light' || pcs === 'dark' ) {
        return pcs;
      }

      return 'dark';
    }

    return theme;
  },

  afterLoginRoute: (state: PrefsState, getters: VuexStoreGetters) => {
    const afterLoginRoutePref = getters['get'](AFTER_LOGIN_ROUTE);

    if (typeof afterLoginRoutePref !== 'string') {
      return afterLoginRoutePref;
    }

    switch (true) {
    case (afterLoginRoutePref === 'home'):
      return { name: 'home' };
    case (afterLoginRoutePref === 'last-visited'): {
      if (state.authRedirect) {
        return state.authRedirect;
      }
      const lastVisitedPref = getters['get'](LAST_VISITED);

      if (lastVisitedPref) {
        return lastVisitedPref;
      }
      const clusterPref = getters['get'](CLUSTER);

      return { name: 'c-cluster-explorer', params: { cluster: clusterPref } };
    }
    case (!!afterLoginRoutePref.match(/.+-dashboard$/)):
    {
      const clusterId = afterLoginRoutePref.split('-dashboard')[0];

      return { name: 'c-cluster-explorer', params: { cluster: clusterId } };
    }
    default:
      return { name: afterLoginRoutePref };
    }
  },

  dev: (state: PrefsState, getters: VuexStoreGetters) => {
    try {
      return getters['get'](PLUGIN_DEVELOPER);
    } catch {
      return getters['get'](DEV);
    }
  }
};

export const mutations = {
  load(state: PrefsState, { key, value }: { key: string, value: any }) {
    state.data[key] = value;
  },

  cookiesLoaded(state: PrefsState) {
    state.cookiesLoaded = true;
  },

  reset(state: PrefsState) {
    for (const key in state.definitions) {
      if ( state.definitions[key]?.asCookie ) {
        continue;
      }
      delete state.data[key];
    }
  },

  setDefinition(state: PrefsState, { name, definition = {} }: { name: string, definition?: PrefDefinition }) {
    state.definitions[name] = definition;
  },

  setAuthRedirect(state: PrefsState, route: Record<string, any> | null) {
    state.authRedirect = route;
  }
};

export const actions = {
  async set({
    dispatch, commit, rootGetters, state
  }: PrefsActionContext, opt: { key: string, value?: any, val?: any }): Promise<PrefError | undefined> {
    let { key, value } = opt; // eslint-disable-line prefer-const
    const definition = state.definitions[key];
    let server;

    if ( opt.val ) {
      throw new Error('Use value, not val');
    }

    commit('load', { key, value });

    if ( definition.asCookie ) {
      const options = {
        ...cookieOptions,
        parseJSON: definition.parseJSON === true
      };

      const computedKey = `${ cookiePrefix }${ key }`.toUpperCase();

      commit('cookies/set', {
        key: computedKey, value, options
      }, { root: true });
    }

    if ( definition.asUserPreference ) {
      const checkLogin = rootGetters['auth/loggedIn'];

      // Check for login status
      if (!checkLogin) {
        prefsBeforeLogin[key] = value;

        return;
      }

      try {
        server = await dispatch('loadServer', key); // There's no watch on prefs, so get before set...

        if ( server?.data ) {
          if ( definition.mangleWrite ) {
            value = definition.mangleWrite(value);
          }

          if ( definition.parseJSON ) {
            server.data[key] = JSON.stringify(value);
          } else {
            server.data[key] = value;
          }

          await server.save({ redirectUnauthorized: false });
        }
      } catch (e) {
        // Well it failed, but not much to do about it...
        const error = e as PrefError;

        // Return the error
        return { type: error.type, status: error.status };
      }
    }
  },

  // A merge-write is a read-modify-write of a preference via a PURE apply(currentValue) => newValue, split
  // into two phases so the UI can feel instant: applyPrefsOptimistic commits against the client value now
  // (outside any write queue), and reconcilePrefs does the one GET-then-PUT against the server's live value.
  // Callers serialize reconcile (overlapping writes on the shared Preference would 409), never the optimistic phase.

  // Phase 1 — optimistic. SYNC (no awaits) so the commits land in the same tick; returns the committed
  // values so reconcilePrefs can detect server drift without re-deriving the wrong base.
  applyPrefsOptimistic(
    { commit, rootGetters, state }: PrefsActionContext,
    mutations: Array<{ key: string, apply: (value: any) => any }>
  ): Record<string, any> {
    const list = Array.isArray(mutations) ? mutations.filter((m) => m && m.key && typeof m.apply === 'function') : [];
    const optimistic: Record<string, any> = {};

    const currentValue = (key: string) => {
      const v = state.data[key];

      return v === undefined ? state.definitions[key]?.def : v;
    };

    // A merge-write persists to the server only — it doesn't maintain the cookie mirror that `set` does,
    // so a cookie-backed pref would leave the cookie holding the old value. Reject the whole batch before
    // committing anything, rather than half-applying it.
    const cookieBacked = list.find(({ key }) => state.definitions[key]?.asCookie);

    if (cookieBacked) {
      throw new Error(`Preference "${ cookieBacked.key }" is cookie-backed and cannot be merge-written`);
    }

    list.forEach(({ key, apply }) => {
      const next = apply(currentValue(key));

      optimistic[key] = next;
      commit('load', { key, value: next });
    });

    // Before login there's no server to reconcile against — stash so loadServer replays them post-login.
    if (!rootGetters['auth/loggedIn']) {
      list.forEach(({ key }) => {
        if (state.definitions[key]?.asUserPreference) {
          prefsBeforeLogin[key] = optimistic[key];
        }
      });
    }

    return optimistic;
  },

  // Phase 2 — reconcile + persist. Re-runs the transforms against the server's live value and adopts that
  // result if it drifted from what we optimistically committed, so an external change (another tab / manual
  // edit) is merged, not clobbered. Persists only the keys a transform actually changed.
  async reconcilePrefs(
    {
      dispatch, commit, rootGetters, state
    }: PrefsActionContext,
    { mutations, optimistic }: { mutations: Array<{ key: string, apply: (value: any) => any }>, optimistic?: Record<string, any> }
  ): Promise<PrefError | undefined> {
    const list = Array.isArray(mutations) ? mutations.filter((m) => m && m.key && typeof m.apply === 'function') : [];
    const serverEntries = list.filter(({ key }) => state.definitions[key]?.asUserPreference);

    if (!serverEntries.length || !rootGetters['auth/loggedIn']) {
      return;
    }

    const keys = serverEntries.map(({ key }) => key);

    try {
      const server = await dispatch('loadServer', keys);

      if ( !server?.data ) {
        return;
      }

      let dirty = false;

      serverEntries.forEach(({ key, apply }) => {
        const definition = state.definitions[key];
        let base = server.data[key];

        if (base === undefined) {
          base = definition.def;
        } else if (definition.parseJSON) {
          try {
            base = JSON.parse(base);
          } catch {
            base = definition.def;
          }
        }
        if (definition.mangleRead) {
          base = definition.mangleRead(base);
        }

        const reconciled = apply(base);

        // Server drifted from what we optimistically committed → adopt the server-based result.
        if (JSON.stringify(reconciled) !== JSON.stringify(optimistic?.[key])) {
          commit('load', { key, value: reconciled });
        }

        // Skip the write for a key the action left unchanged (e.g. a duplicate visit / already-pinned).
        if (JSON.stringify(reconciled) !== JSON.stringify(base)) {
          const toWrite = definition.mangleWrite ? definition.mangleWrite(reconciled) : reconciled;

          server.data[key] = definition.parseJSON ? JSON.stringify(toWrite) : toWrite;
          dirty = true;
        }
      });

      if (dirty) {
        await server.save({ redirectUnauthorized: false });
      }
    } catch (e) {
      // Every caller is fire-and-forget, so an unlogged failure here is invisible: the optimistic
      // commit stays in the client and the server never got it.
      console.error('Error reconciling preferences', keys, e); // eslint-disable-line no-console

      const error = e as PrefError;

      return { type: error.type, status: error.status };
    }
  },

  async setTheme({ dispatch }: PrefsActionContext, val: string) {
    await dispatch('set', { key: THEME, value: val });
  },

  loadCookies({ state, commit, rootGetters }: PrefsActionContext) {
    if ( state.cookiesLoaded ) {
      return;
    }

    for (const key in state.definitions) {
      const definition = state.definitions[key];

      if ( !definition.asCookie ) {
        continue;
      }

      const options = { parseJSON: definition.parseJSON === true };
      const computedKey = `${ cookiePrefix }${ key }`.toUpperCase();
      const value = rootGetters['cookies/get']({ key: computedKey, options });

      if (value !== undefined) {
        commit('load', { key, value });
      }
    }

    commit('cookiesLoaded');
  },

  loadTheme({ dispatch }: PrefsActionContext) {
    const watchDark = window.matchMedia('(prefers-color-scheme: dark)');
    const watchLight = window.matchMedia('(prefers-color-scheme: light)');
    const watchNone = window.matchMedia('(prefers-color-scheme: no-preference)');

    const interval = 30 * 60 * 1000;
    const nextHalfHour = interval - Math.round(new Date().getTime()) % interval;

    setTimeout(() => {
      dispatch('loadTheme');
    }, nextHalfHour);
    // console.log('Update theme in', nextHalfHour, 'ms');

    if ( watchDark.matches ) {
      changed('dark');
    } else if ( watchLight.matches ) {
      changed('light');
    } else {
      changed(fromClock());
    }

    watchDark.addListener((e) => {
      if ( e.matches ) {
        changed('dark');
      }
    });

    watchLight.addListener((e) => {
      if ( e.matches ) {
        changed('light');
      }
    });

    watchNone.addListener((e) => {
      if ( e.matches ) {
        changed(fromClock());
      }
    });

    function changed(value: string) {
      // console.log('Prefers Theme:', value);
      dispatch('set', { key: PREFERS_SCHEME, value });
    }

    function fromClock() {
      const hour = new Date().getHours();

      if ( hour < 7 || hour >= 18 ) {
        return 'dark';
      }

      return 'light';
    }
  },

  async loadServer( {
    state, dispatch, commit, rootState, rootGetters
  }: PrefsActionContext, ignoreKey?: string | string[]) {
    // `ignoreKey` may be a single key or an array of keys (a batched merge write ignores all its keys,
    // so the get-before-set doesn't re-commit — and thus revert — a sibling that was just set locally).
    const ignoreKeys = Array.isArray(ignoreKey) ? ignoreKey : [ignoreKey];
    let server: any = { data: {} };

    try {
      const all = await dispatch('management/findAll', {
        type: STEVE.PREFERENCE,
        opt:  {
          url:                  'userpreferences',
          force:                true,
          watch:                false,
          redirectUnauthorized: false,
          stream:               false,
        }
      }, { root: true });

      server = all?.[0];
    } catch (e) {
      console.error('Error loading preferences', e); // eslint-disable-line no-console

      return;
    }

    if ( !server?.data ) {
      return;
    }

    // if prefsBeforeLogin has values from login page, update the backend
    if (Object.keys(prefsBeforeLogin).length > 0) {
      Object.keys(prefsBeforeLogin).forEach((key) => {
        server.data[key] = prefsBeforeLogin[key];
      });

      await server.save({ redirectUnauthorized: false });

      // Clear prefsBeforeLogin, as we have now saved theses
      prefsBeforeLogin = {};
    }

    for (const key in state.definitions) {
      const definition = state.definitions[key];
      let value = clone(server.data[key]);

      if (value === undefined && definition.inheritFrom) {
        value = clone(server.data[definition.inheritFrom]);
      }

      if ( value === undefined || ignoreKeys.includes(key)) {
        continue;
      }

      if ( definition.parseJSON ) {
        try {
          value = JSON.parse(value);
        } catch (err) {
          console.error('Error parsing server pref', key, value, err); // eslint-disable-line no-console
          continue;
        }
      }

      if ( definition.mangleRead ) {
        value = definition.mangleRead(value);
      }

      commit('load', { key, value });
    }

    return server;
  },

  setLastVisited({ state, dispatch, getters }: PrefsActionContext, route: any) {
    if (!route) {
      return;
    }

    // Only save the last visited page if the user has that set as the login route preference
    const afterLoginRoutePref = getters['get'](AFTER_LOGIN_ROUTE);
    const doNotTrackLastVisited = typeof afterLoginRoutePref !== 'string' || afterLoginRoutePref !== 'last-visited';

    if (doNotTrackLastVisited) {
      return;
    }

    return dispatch('set', { key: LAST_VISITED, value: route });
  },

  toggleTheme({ getters, dispatch }: PrefsActionContext) {
    const value = getters[THEME] === 'light' ? 'dark' : 'light';

    return dispatch('set', { key: THEME, value });
  },

  setBrandStyle({ rootState, rootGetters }: PrefsActionContext, dark = false) {
    if (rootState.managementReady) {
      try {
        const brandSetting = rootGetters['management/brand'];

        if (brandSetting !== '') {
          const brandMeta = getBrandMeta(brandSetting);
          const hasStylesheet = brandMeta.hasStylesheet === 'true';

          if (hasStylesheet) {
            // `brandMeta` is an object, so this has always added `[object Object]` and thrown
            // into the catch below. Spelled out to keep that behaviour while typing the call.
            document.body.classList.add(String(brandMeta));
          } else {
            // TODO option apply color at runtime
          }
        }
      } catch {}
    }
  }
};
