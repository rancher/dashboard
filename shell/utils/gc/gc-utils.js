import { SETTING } from '@shell/config/settings';
import { COUNT, MANAGEMENT } from '@shell/config/types';

export const GC_DEFAULTS = {
  enabled:        false,
  ageThreshold:   1000 * 10, // Ten seconds // TODO: RC PR
  countThreshold: 5, // TODO: RC PR
};

// TODO: RC 3x Prefs?

/**
 * Don't run GC if it's been run within 5 seconds
 */
const GC_RE_RUN_GAP = 1000 * 5;

/**
 * Execute GC when the route changes
 */
export const GC_RUN_ON_ROUTE_CHANGE = true;

/**
 * Execute GC at a given interval
 */
export const GC_RUN_ON_INTERVAL = true;

/**
 * Run GC at this cadence
 */
export const GC_INTERVAL = 1000 * 10;

let gcLastRun;
let uiPerfGarbageCollection;
let uiPerfGarbageCollectionStamp;

const ENABLE_DEBUG_LOGGING = true; // TODO: RC PR

const debugLog = (...args) => {
  if (ENABLE_DEBUG_LOGGING) {
    console.debug('GC', ...args);
  }
};

/**
 * To avoid JSON.parse on the `ui-performance` setting keep a local cache
 */
const getUiPerfGarbageCollection = (rootState) => {
  const uiPerfSetting = rootState.management.types[MANAGEMENT.SETTING].list.find(s => s.id === SETTING.UI_PERFORMANCE);

  if (!uiPerfSetting) {
    // Could be in the process of logging out
    return false;
  }
  const stamp = `${ uiPerfSetting.metadata.generation }-${ uiPerfSetting.metadata.resourceVersion }`;

  if (uiPerfGarbageCollectionStamp !== stamp) {
    debugLog(`Updating ${ SETTING.UI_PERFORMANCE } cache`);
    uiPerfGarbageCollectionStamp = stamp;
    uiPerfGarbageCollection = JSON.parse(uiPerfSetting.value);
  }

  return uiPerfGarbageCollection.garbageCollection;
};

export function gcEnabledAll(pseudoCtx, type) {
  return gcEnabledForStore(pseudoCtx.state) && gcEnabledSetting(pseudoCtx) && gcEnabledForType(pseudoCtx, type);
}

export function gcEnabledSetting(pseudoCtx) {
  const { rootState } = pseudoCtx;

  // Don't use a getter... as we'll end up triggering ourselves again
  const uiPerfGarbageCollection = getUiPerfGarbageCollection(rootState);

  return uiPerfGarbageCollection?.enabled;
}

export function gcEnabledForStore(state) {
  return state?.config?.supportsGc;
}

/**
 * Store can require certain types are not GC'd (for example `cluster` and `schema`s, `counts`, etc)
 */
export function gcEnabledForType(pseudoCtx, type) {
  const { getters } = pseudoCtx;

  if (!type || getters.gcIgnoreTypes[type]) {
    return false;
  }

  return true;
}

/**
 * Update the time that the resource type was accessed
 * This needs to run after any type initialisation (aka registerType)
 */
export function gcUpdateLastAccessed(pseudoCtx, type) {
  const { state } = pseudoCtx;

  if (!gcEnabledAll(pseudoCtx, type)) {
    return;
  }

  const cache = state.types[type];

  cache.gcLastAccessed = new Date().getTime();
}

/**
 * Remove stale resource types from the store and stop watching them for changes
 */
export function garbageCollect(ctx, ignoreTypes = {}) {
  const now = new Date().getTime();

  // Is gc currently running OR has run in the past GC_RE_RUN_GAP return early
  if (gcLastRun === null || now - gcLastRun < GC_RE_RUN_GAP) {
    debugLog('Skipping (running or recently run)', gcLastRun);

    return;
  }

  gcLastRun = null;
  const gcd = {};

  try {
    const {
      getters, rootState, dispatch, state
    } = ctx;

    if (!rootState.clusterReady) {
      debugLog('Skipping (cluster not ready)');
      gcLastRun = new Date().getTime();

      return ;
    }
    debugLog(`------ Started ------`);

    const uiPerfGarbageCollection = getUiPerfGarbageCollection(rootState);
    const maxAge = uiPerfGarbageCollection.ageThreshold;
    const maxCount = uiPerfGarbageCollection.countThreshold;

    const routeChange = rootState.gcRouteChanged;

    debugLog(`Max Age: ${ maxAge }. Max Count: ${ maxCount }`);

    // dispatch('forgetType', type);

    Object.entries(state.types).forEach(([type, cache]) => {
      if (!cache.gcLastAccessed) {
        // There's no last accessed time... gc is probably disabled in another way
        debugLog(`${ type }: Skipping (no accessed time)`);

        return;
      }

      if (!gcEnabledForType(ctx, type)) {
        // This specific store is telling us to ignore the type (for example `cluster` store will not GC schema's, counts, etc)
        debugLog(`${ type }: Skipping (type ignored by store)`);

        return;
      }

      if (ignoreTypes[type]) {
      // We're going to a place that needs the resource
        debugLog(`${ type }: Skipping (navigating to type)`);

        return;
      }

      if (now - cache.gcLastAccessed <= maxAge) {
      // The resource was recently accessed

        debugLog(`${ type }: Skipping (recently accessed)`);

        return;
      }

      if (routeChange < cache.gcLastAccessed ) {
        // The resource is being used in the current route/page
        debugLog(`${ type }: Skipping (used in current route/page)`);

        return;
      }

      const countFromResource = getters.all(COUNT)[0].counts[type]?.summary.count;
      const currentCount = countFromResource?.summary?.count ?? cache.list.length;

      if (currentCount === undefined || currentCount < maxCount) {
        // There's too few resources, we might as well keep them to avoid a network request when we need them again
        debugLog(`${ type }: Skipping (too few of resource)`);

        return;
      }

      debugLog(`${ type }: Removed from store`);
      dispatch('forgetType', type);
      gcd[type] = currentCount;
    });

    gcLastRun = new Date().getTime();
  } catch {
    gcLastRun = new Date().getTime();
  }

  if (Object.keys(gcd).length > 0) {
    console.info('Garbage Collected Resources', gcd);
  }

  debugLog(`------ Finished ------`);
}

export function garbageCollectReset(state) {
  Object.values(state.types).forEach((cache) => {
    cache.gcLastAccessed = null;
  });
}
