import { SETTING } from '@shell/config/settings';
import { COUNT, MANAGEMENT } from '@shell/config/types';
import { GC_DEFAULTS, GC_PREFERENCES } from './gc-types';

class GarbageCollect {
  private static ENABLE_DEBUG_LOGGING = false;

  /**
   * Don't run GC if it's been run within 5 seconds
   */
  private static GC_RE_RUN_GAP = 1000 * 5;

  private cachedGcPrefs: GC_PREFERENCES = GC_DEFAULTS;

  private cachedGcPrefsStamp = '';

  private debugLog = (...args: any) => {
    if (GarbageCollect.ENABLE_DEBUG_LOGGING) {
      console.debug('GC', ...args); // eslint-disable-line no-console
    }
  };

  /**
   * Time the GC last ran
   */
  private gcLastRun: number | null = 0;

  /**
   * To avoid JSON.parse on the `ui-performance` setting keep a local cache
   */
  private getUiPerfGarbageCollection = (rootState: any) => {
    const uiPerfSetting = rootState.management.types[MANAGEMENT.SETTING]?.list?.find((s: any) => s.id === SETTING.UI_PERFORMANCE);

    if (!uiPerfSetting || !uiPerfSetting.value) {
      // Could be in the process of logging out
      return undefined;
    }
    const stamp = `${ uiPerfSetting.metadata.generation }-${ uiPerfSetting.metadata.resourceVersion }`;

    if (this.cachedGcPrefsStamp !== stamp) {
      this.debugLog(`Updating ${ SETTING.UI_PERFORMANCE } cache`);
      this.cachedGcPrefsStamp = stamp;
      const uiPerfSettingParsed = JSON.parse(uiPerfSetting.value);

      this.cachedGcPrefs = uiPerfSettingParsed.garbageCollection;
    }

    return this.cachedGcPrefs;
  };

  /**
   * The last time a resource was accessed by either find or getters style functions
   */
  private lastAccessedCache: {
    [store: string]: {
      [type: string]: number;
    }
  } = {}

  /**
   * Track when a logged in route changes.
   */
  private lastRouteChange = 0;

  // ------------- GC Enabled ---------------------

  gcEnabledAll(pseudoCtx: any, type: string) {
    return this.gcEnabledForStore(pseudoCtx.state) && this.gcEnabledSetting(pseudoCtx) && this.gcEnabledForType(pseudoCtx, type);
  }

  gcEnabledSetting(pseudoCtx: any) {
    const { rootState } = pseudoCtx;

    // Don't use a getter... as we'll end up triggering ourselves again
    const uiPerfGarbageCollection = this.getUiPerfGarbageCollection(rootState);

    return uiPerfGarbageCollection?.enabled;
  }

  gcEnabledForStore(state: any) {
    return state?.config?.supportsGc;
  }

  /**
   * Store can require certain types are not GC'd (for example `cluster` and `schema`s, `counts`, etc)
   */
  gcEnabledForType(pseudoCtx: any, type: string) {
    const { getters } = pseudoCtx;

    if (!type || getters.gcIgnoreTypes[type]) {
      return false;
    }

    return true;
  }

  gcEnabledInterval(pseudoCtx: any) {
    const { rootState } = pseudoCtx;

    // Don't use a getter... as we'll end up triggering ourselves again
    const uiPerfGarbageCollection = this.getUiPerfGarbageCollection(rootState);

    return {
      enabled:  uiPerfGarbageCollection?.enabledInterval,
      interval: uiPerfGarbageCollection?.interval || 0
    };
  }

  gcEnabledRoute(pseudoCtx: any) {
    const { rootState } = pseudoCtx;

    // Don't use a getter... as we'll end up triggering ourselves again
    const uiPerfGarbageCollection = this.getUiPerfGarbageCollection(rootState);

    return uiPerfGarbageCollection?.enabledOnNavigate;
  }

  // ------------- GC (actual) ---------------------

  /**
   * Remove stale resource types from the store and stop watching them for changes
   */
  garbageCollect(ctx: any, ignoreTypes: {[type: string]: boolean} = {}) {
    const now = new Date().getTime();

    // Is gc currently running OR has run in the past GC_RE_RUN_GAP return early
    if (this.gcLastRun === null || now - this.gcLastRun < GarbageCollect.GC_RE_RUN_GAP) {
      this.debugLog('Skipping (running or recently run)', this.gcLastRun ? new Date(this.gcLastRun) : 'running');

      return;
    }

    this.gcLastRun = null;
    const gcd: {[type: string]: number} = {};

    try {
      const { getters, rootState, dispatch } = ctx;

      if (!rootState.clusterReady) {
        this.debugLog('Skipping (cluster not ready)');
        this.gcLastRun = new Date().getTime();

        return ;
      }
      this.debugLog(`------ Started ------`);

      const uiPerfGarbageCollection = this.getUiPerfGarbageCollection(rootState);

      if (!uiPerfGarbageCollection) {
        return ;
      }
      const maxAge = uiPerfGarbageCollection.ageThreshold * 1000;
      const maxCount = uiPerfGarbageCollection.countThreshold;

      this.debugLog(`Max Age: ${ maxAge }. Max Count: ${ maxCount }`);// , 'Cache', this.lastAccessedCache

      const store = ctx.state.config.namespace;

      // this.debugLog('Cache', this.lastAccessedCache);

      Object.entries((this.lastAccessedCache[store] || {})).forEach(([type, lastAccessed]) => {
        if (!lastAccessed) {
          // There's no last accessed time... gc is probably disabled in another way
          this.debugLog(`${ type }: Skipping (no accessed time)`);

          return;
        }

        if (!this.gcEnabledForType(ctx, type)) {
          // This specific store is telling us to ignore the type (for example `cluster` store will not GC schema's, counts, etc)
          this.debugLog(`${ type }: Skipping (type ignored by store)`);

          return;
        }

        if (ignoreTypes[type]) {
          // We're going to a place that needs the resource
          this.debugLog(`${ type }: Skipping (navigating to type)`);

          return;
        }

        if (now - lastAccessed <= maxAge) {
          // The resource was recently accessed

          this.debugLog(`${ type }: Skipping (recently accessed)`);

          return;
        }

        if (this.lastRouteChange !== undefined && this.lastRouteChange < lastAccessed ) {
          // The resource is being used in the current route/page
          this.debugLog(`${ type }: Skipping (used in current route/page)`);

          return;
        }

        const countFromResource = getters.all(COUNT)[0].counts[type]?.summary.count;
        const currentCount = countFromResource ?? 0;

        if (currentCount === undefined || currentCount < maxCount) {
          // There's too few resources, we might as well keep them to avoid a network request when we need them again
          this.debugLog(`${ type }: Skipping (too few of resource)`);

          return;
        }

        this.debugLog(`${ type }: Removing from store`);
        dispatch('forgetType', type);
        gcd[type] = currentCount;
      });

      this.gcLastRun = new Date().getTime();
    } catch (e) {
      this.debugLog(`: Error`, e);
      this.gcLastRun = new Date().getTime();
    }

    if (Object.keys(gcd).length > 0) {
      console.info('Garbage Collected Resources', gcd); // eslint-disable-line no-console
    }

    this.debugLog(`------ Finished ------`);
  }

  // ------------- GC Update local cache ---------------------

  /**
   * Update the time that the resource type was accessed
   * This needs to run after any type initialisation (aka registerType)
   */
  gcUpdateLastAccessed(pseudoCtx: any, type: string) {
    if (!this.gcEnabledAll(pseudoCtx, type)) {
      return;
    }
    const store = pseudoCtx.state.config.namespace;

    if (!this.lastAccessedCache[store]) {
      this.lastAccessedCache[store] = {};
    }

    this.lastAccessedCache[store][type] = new Date().getTime();
  }

  /**
   * Update the time the user last changed routes
   */
  gcUpdateRouteChanged() {
    this.lastRouteChange = new Date().getTime();
  }

  // ------------- GC reset ---------------------

  /**
   * Remove all cached access times for the given store
   */
  gcResetStore(state: any) {
    const store = state.config.namespace;

    delete this.lastAccessedCache[store];

    this.debugLog('Forgetting Store:', store);
  }

  /**
   * Remove cached access time for the given resource type
   */
  gcResetType(state: any, type: string) {
    const store = state.config.namespace;

    if (!this.lastAccessedCache[store]) {
      return;
    }
    delete this.lastAccessedCache[store][type];

    this.debugLog('Forgetting Type:', store, type);
  }
}

const gc = new GarbageCollect();

export default gc;
