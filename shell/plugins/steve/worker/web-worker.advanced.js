/**
 * Advanced Worker is enabled by performance setting
 * relocates cluster resource sockets off the UI thread and into a webworker
 */

import {
  SCHEMA, COUNT, POD, WORKLOAD, WORKLOAD_TYPES
} from '@shell/config/types';
import ResourceWatcher, { watchKeyFromMessage } from '@shell/plugins/steve/resourceWatcher';
import { EVENT_MESSAGE, EVENT_CONNECT_ERROR, EVENT_DISCONNECT_ERROR } from '@shell/utils/socket';
import { normalizeType, keyFieldFor } from '@shell/plugins/dashboard-store/normalize';
import { addSchemaIndexFields } from '@shell/plugins/steve/resourceUtils/schema';
import cacheClasses from '@shell/plugins/steve/caches';
import ResourceRequest from '@shell/plugins/steve/api/resourceRequest';
import Trace from '@shell/plugins/steve/trace';
import { CACHE_STATES } from '@shell/plugins/steve/caches/base-cache';
import { hashObj } from '~/shell/utils/crypto/browserHashUtils';

const caches = {};

// TODO: RC TEST - workloads. each pods
// TODO: RC TEST - configmap search --> crt
// TODO: RC TEST - run through all cluster models and check for super?
// TODO: RC TEST - everything turned off
// TODO: RC test podsByNamespace
// TODO: RC test Work with intermedate loading / manual / project&ns forced filtering
// TODO: RC test resourceUtils vs place they come from. Includes
// - getters, etc.
// - caches in calculated fields correct
// TODO: RC test resourceUti

const uiRequests = {};
const uiApi = (getter) => {
  const cacheGetter = `${ getter }/cacheRequest`;
  const cacheAge = Date.now() - caches[getter].loadedTimestamp || 0;
  const uiPromise = {};

  uiPromise.promise = new Promise((resolve, reject) => {
    uiPromise.resolves = ({ cache }) => {
      resolve({ data: { data: cache } });
    };
    uiPromise.reject = (error) => {
      reject(error);
    };

    if (cacheAge > 500 && (uiRequests[cacheGetter] || []).length < 1) {
      // TODO: RC question If the cache of non-cluster resources changes... do we ned to bump anything that depends on them?
      self.postMessage({ get: cacheGetter });

      uiPromise.index = uiRequests[cacheGetter]?.length || 0;
      uiRequests[cacheGetter] = [...(uiRequests[cacheGetter] || []), uiPromise];
    } else {
      uiPromise.resolves({ cache: caches[getter].resources });
    }
  });

  return uiPromise.promise;
};

/**
 * Creates a resourceCache with the appropriate type
 */
const resourceCache = (type) => {
  const CacheClass = cacheClasses[type] || cacheClasses.resourceCache;
  const instance = new CacheClass(type, getters, rootGetters, state.api, uiApi, workerActions.createCache);

  instance.setDebug(state.debugWorker.cache);

  return instance;
};

const rootGetters = {};

const getters = {
  all:       type => caches[type]?.all()?.data?.data,
  byId:      (type, id) => caches[type]?.byId(id),
  findByIds: (type, ids) => {
    return caches[type]?.find({ ids });
  },
  matching:           (type, selector, namespace) => caches[type]?.matching(selector, namespace),
  schemaFor:          type => caches[SCHEMA]?.getSchema(type),
  pathExistsInSchema: (type, path) => caches[SCHEMA]?.pathExistsInSchema(type, path),
  apiCache:           type => caches[type]?.source === 'api',
  podsByNamespace:    namespace => caches[POD]?.byNamespace(namespace).data.data,
  caches
};

const state = {
  config:       {},
  watcher:      undefined,
  api:          undefined,
  store:        '', // Store name
  /**
   * Store `watch`/`unwatch` events to process when the socket is created
   */
  watcherQueue: [],
  apiQueue:     [],
  batchChanges: {},
  debugWorker:  {
    trace:   false,
    watch:   false,
    request: false,
    cache:   false,
  }
};

const tracer = new Trace('Advanced Worker');
const watchTracer = new Trace('Advanced Worker: Watch');
const requestTracer = new Trace('Advanced Worker: Request');

tracer.setDebug(state.debugWorker.trace);
tracer.trace('created');

const makeResourceProps = (msg) => {
  const { resourceType, data: { type: rawType }, data } = msg;
  const eitherType = resourceType || rawType;
  const type = normalizeType(eitherType === 'counts' ? COUNT : eitherType);
  const keyField = keyFieldFor(type);

  if ( type === SCHEMA ) {
    addSchemaIndexFields(data);
  }

  return {
    type,
    id: data[keyField],
    data
  };
};

/**
 * Pass the EVENT_CONNECT_ERROR / EVENT_DISCONNECT_ERROR back to the UI thread
 */
const handleConnectionError = (eventType, event, watcher) => {
  watchTracer.trace('createWatcher', eventType, event);

  self.postMessage({
    [eventType]: {
      type:       event.type,
      detail:     event.detail,
      srcElement: {
        disconnectedAt: watcher.disconnectedAt,
        url:            watcher.url,
      }
    }
  });
};

/**
 * Remove any pending messages related to this resource from the queue
 */
const removeFromWatcherQueue = (watchKey) => {
  state.watcherQueue = state.watcherQueue.filter((workerMessage) => {
    const [, msg] = Object.entries(workerMessage)[0];
    const workerMessageWatchKey = watchKeyFromMessage(msg);

    return watchKey !== workerMessageWatchKey;
  });
};

// TODO: RC test - error handling
/**
 * Errors sent over the thread boundary must be clonable. The response to `fetch` isn't, so cater for that before we send it over
 */
// const parseRequestError = (e) => {
//   const res = e?.cause?.response;

//   if (res) {
//     return {
//       response: {
//         status:     res.status,
//         statusText: res.statusText,
//       }
//     };
//   }

//   return e;
// };

/**
 * These are things that we do when we get a message from the UI thread
 */
const workerActions = {
  /**
   * The UI thread is responsible for supply all schemas, including spoofed ones.
   *
   * This should be the first action called
   */
  loadSchemas: (data) => {
    caches[SCHEMA] = resourceCache(SCHEMA, getters, rootGetters, state.api, uiApi, workerActions.createCache);
    caches[SCHEMA].load(data, workerActions.flushApiQueue);
  },

  /**
   * Create the object that will make all api requests
   */
  createApi: () => {
    if (!state.api) {
      if (!caches[SCHEMA]) {
        console.error('No schema cache. `loadSchemas` should be called before `createApi`'); // eslint-disable-line no-console

        return;
      }

      // the apiClient can only exist after schemas are loaded so we build it here.
      state.api = new ResourceRequest(state.config);
      state.api.setDebug(state.debugWorker.request);
    }
  },
  createWatcher: (metadata) => {
    watchTracer.trace('createWatcher', metadata);

    const { connectionMetadata, maxTries } = metadata;
    const { url, csrf } = state.config;

    if (!state.watcher) {
      const watcherUrl = `${ url }/subscribe`;

      state.watcher = new ResourceWatcher(watcherUrl, true, null, null, maxTries, csrf);

      state.watcher.addEventListener(EVENT_MESSAGE, (e) => {
        const event = e.detail;

        if (event.data) {
          const msg = JSON.parse(event.data);

          if (msg.name) {
            if (resourceWatcherActions[msg.name]) {
              resourceWatcherActions[msg.name](msg);
            } else {
              resourceWatcherActions.dispatch(msg);
            }
          }
        }
      });

      state.watcher.addEventListener(EVENT_CONNECT_ERROR, (e) => {
        handleConnectionError(EVENT_CONNECT_ERROR, e, state.watcher);
      });

      state.watcher.addEventListener(EVENT_DISCONNECT_ERROR, (e) => {
        handleConnectionError(EVENT_DISCONNECT_ERROR, e, state.watcher);
      });

      state.watcher.setDebug(state.debugWorker.watch);

      state.watcher.connect(connectionMetadata);

      // Flush the watcherQueue
      workerActions.flushWatcherQueue();
    }
  },

  uiResponse: (response) => {
    while ((uiRequests[response.getter] || []).length > 0) {
      uiRequests[response.getter].pop().resolves(response);
    }
  },

  /**
   * Starting point for requests for resources
   */
  waitingForResponse: (request) => {
    requestTracer.trace('waitingForResponse', request);

    if (caches[SCHEMA].state !== CACHE_STATES.READY) {
      state.apiQueue.push({ waitingForResponse: request });

      return;
    }
    const { params, requestHash } = request;

    workerActions.request(params, (response, error) => {
      self.postMessage({
        awaitedResponse: {
          response, requestHash, error
        }
      });
    });
  },

  /**
   * Either setup the resource type and make the request for the given params... or find the resource in the cache for the given params
   */
  request: async(params, resolver = () => {}) => {
    const { type } = params;

    requestTracer.trace('waitingForResponse --> request', type, params);

    if (!caches[type]) {
      caches[type] = workerActions.createCache(type);
      requestTracer.trace('waitingForResponse --> request.', type, 'no Cache existed so one was created.');
    }

    await caches[type].request(params);

    let res;

    if (!!params.id) {
      res = caches[type].byId(params);
    } else if (!!params.page) {
      res = caches[type].byPage(params);
    } else {
      res = caches[type].all();
    }

    requestTracer.trace('waitingForResponse --> request', type, 'res', res);

    resolver(res);
  },

  /**
   * @param {[]} payload
   * Accepts an array of JSON objects representing resources
   * types the array and constructs a cache if none exists and then loads each resource in the array into the cache
   */
  createCache: (type) => {
    if (type && !caches[type]) {
      caches[type] = resourceCache(type, getters, rootGetters, state.api, uiApi, workerActions.createCache);
      caches[type].createSubCaches();
    }

    return caches[type];
  },

  flushWatcherQueue: () => {
    while (state.watcherQueue.length > 0) {
      watchTracer.trace('createWatcher', 'flushing watcherQueue', state.watcherQueue);

      const workerMessage = state.watcherQueue.shift();
      const [action, msg] = Object.entries(workerMessage)[0];

      if (workerActions[action]) {
        workerActions[action](msg);
      } else {
        console.warn('no associated action for:', action); // eslint-disable-line no-console
      }
    }
  },

  flushApiQueue: () => {
    requestTracer.trace('flushApiQueue', 'flushing apiQueue', state.apiQueue);

    while (state.apiQueue.length > 0) {
      const workerMessage = state.apiQueue.shift();
      const [action, msg] = Object.entries(workerMessage)[0];

      if (workerActions[action]) {
        workerActions[action](msg);
      } else {
        console.warn('no associated action for:', action); // eslint-disable-line no-console
      }
    }
  },
  initWorker: (config) => {
    state.config = config;
    workerActions.createCache('i18n').load(config.i18nConfig);
  },
  updateWorker: (partialConfig) => {
    // TODO: RC sean - this was the fix (uncommented) i added to get sockets working. initial state.config.url needed to be updated
    // state.config = {
    //   ...state.config,
    //   ...partialConfig
    // };
  },
  watch: (msg) => {
    watchTracer.trace('watch', msg);

    const watchKey = watchKeyFromMessage(msg);

    if (msg.stop) {
      workerActions.unwatch(watchKey);

      return;
    }

    // If socket is in error don't try to watch.... unless we `force` it
    if (!msg.force && !!state.watcher?.watches[watchKey]?.error) {
      return;
    }

    if (!state.watcher) {
      state.watcherQueue.push({ watch: msg });

      return;
    }

    if (msg.resourceType === WORKLOAD) {
      const { namespace, selector, id } = msg;

      Object.values(WORKLOAD_TYPES).forEach((resourceType) => {
        const workloadTypeRequest = caches[resourceType].__requests[hashObj({
          namespace, selector, id
        })];
        const resourceVersion = workloadTypeRequest.revision;
        const watchMsg = {
          ...msg,
          resourceType,
          resourceVersion
        };
        const resourceVersionTime = resourceVersion ? Date.now() : undefined;
        const skipResourceVersion = [SCHEMA, COUNT].includes(resourceType);
        const watchKey = watchKeyFromMessage(watchMsg);

        const watchObject = {
          resourceType,
          id,
          namespace,
          selector
        };

        state.watcher.watch(watchKey, resourceVersion, resourceVersionTime, watchObject, skipResourceVersion);
      });
    } else {
      const {
        resourceType,
        namespace,
        id,
        selector,
        resourceVersion
      } = msg;
      const resourceVersionTime = resourceVersion ? Date.now() : undefined;
      const skipResourceVersion = [SCHEMA, COUNT].includes(resourceType);

      const watchObject = {
        resourceType,
        id,
        namespace,
        selector
      };

      state.watcher.watch(watchKey, resourceVersion, resourceVersionTime, watchObject, skipResourceVersion);
    }
  },
  unwatch: (watchKey) => {
    watchTracer.trace('unwatch', watchKey);

    removeFromWatcherQueue(watchKey);

    if (!state.watcher) {
      return;
    }

    state.watcher.unwatch(watchKey);
  },
  destroyWorker: () => {
    tracer.trace('destroyWorker');

    clearInterval(maintenanceInterval);

    function destroyWorkerComplete() {
      delete self.onmessage;
      self.postMessage({ destroyWorker: true }); // we're only passing the boolean here because the key needs to be something truthy to ensure it's passed on the object.
    }

    // disconnect takes a callback which we'll use to close the webworker
    if (state.watcher) {
      state.watcher?.disconnect().then(destroyWorkerComplete);
    } else {
      destroyWorkerComplete();
    }
  },
  toggleDebug: ({ on }) => {
    console.debug('Setting Advanced Worker debug levels: ', on); // eslint-disable-line no-console

    // Could be boolean... or object
    const defaultDebug = Object.keys(on).length ? false : on;

    const {
      trace = defaultDebug, watch = defaultDebug, request = defaultDebug, cache = defaultDebug
    } = on;

    state.debugWorker = {
      trace, watch, request, cache
    };

    tracer.setDebug(trace);

    watchTracer.setDebug(watch);
    state.watcher?.setDebug(watch);

    requestTracer.setDebug(request);
    state.api?.setDebug(request);

    Object.values(caches).forEach(c => c.setDebug(cache));
  },
  singleUpdateBatch(type, id, change) {
    if (!state.batchChanges[type]) {
      state.batchChanges[type] = {};
    }
    state.batchChanges[type][id] = change;
  },
  sendBatch(requestHash) {
    if (Object.keys(state.batchChanges).length) {
      const relevantCaches = Object.keys(caches).filter((cacheKey) => {
        const cache = caches[cacheKey];
        const currentPageResources = cache.__currentPageResources;

        if (!currentPageResources) {
          return false;
        }
        const matchingResourceTypes = Object.keys(state.batchChanges).filter((batchResource) => {
          return Object.keys(currentPageResources).includes(batchResource);
        });

        if (matchingResourceTypes.length === 0) {
          return false;
        }

        return true;
      });

      const filteredBatchChanges = relevantCaches.map((cacheKey) => {
        const cache = caches[cacheKey];
        const currentPageResourceTypes = Object.keys(cache.__currentPageResources);
        const cachePageResources = currentPageResourceTypes.reduce((pageResourceMap, pageResourceType) => {
          const resourcePageIds = cache.__currentPageResources[pageResourceType];
          const changeResourceTypeIdMap = state.batchChanges[pageResourceType];

          if (changeResourceTypeIdMap) {
            const resourceBatchChangeIds = Object.keys(changeResourceTypeIdMap);

            return {
              ...pageResourceMap,
              [pageResourceType]: resourceBatchChangeIds
                .filter(changeId => resourcePageIds.includes(changeId)) // so we know the remaining ids are in the currentPage somewhere
                .reduce((resourceProperties, changeId) => {
                  return {
                    ...resourceProperties,
                    [changeId]: state.batchChanges[pageResourceType][changeId]
                  };
                }, {})
            };
          }

          return { ...pageResourceMap };
        }, {});

        return cachePageResources;
      }).reduce((newBatchChanges, batchChangesPerCache) => {
        const batchChangeKeys = Object.keys(batchChangesPerCache);
        const batchChanges = { ...newBatchChanges };

        batchChangeKeys.forEach((batchChangeKey) => {
          batchChanges[batchChangeKey] = {
            ...batchChanges[batchChangeKey],
            ...batchChangesPerCache[batchChangeKey]
          };
        });

        return batchChanges;
      }, {});

      const batchPayload = {
        batchChanges: {
          ...filteredBatchChanges,
          ...state.batchChanges.count ? { count: state.batchChanges.count } : {}
        }
      };

      if (requestHash) {
        self.postMessage({ awaitedResponse: { ...batchPayload, requestHash } });
      } else {
        self.postMessage(batchPayload);
      }
      state.batchChanges = {};
    }
  }
};

workerActions.toggleDebug({ on: state.debugWorker });

/**
 * These are things that we do when we get a message from the resourceWatcher
 */
const resourceWatcherActions = {
  'resource.change': (msg) => {
    const { type, id, data } = makeResourceProps(msg);

    if (!caches[type]) {
      caches[type] = resourceCache(type, getters, rootGetters, state.api, uiApi, workerActions.createCache);
    }

    caches[type].change(data, () => workerActions.singleUpdateBatch(type, id, data));
  },
  'resource.create': (msg) => {
    const { type, id, data } = makeResourceProps(msg);

    if (!caches[type]) {
      caches[type] = resourceCache(type, getters, rootGetters, state.api, uiApi, workerActions.createCache);
    }

    caches[type].create(data, () => workerActions.singleUpdateBatch(type, id, data));
  },
  'resource.start': (msg) => {
    // State is handled in the resourceWatcher, no need to bubble out to UI thread
  },
  'resource.remove': (msg) => {
    const { type, id } = makeResourceProps(msg);

    if (!caches[type]) {
      caches[type] = resourceCache(type, getters, rootGetters, state.api, uiApi, workerActions.createCache);
    }

    caches[type].remove(id, () => workerActions.singleUpdateBatch(type, id, {}));
  },
  'resource.stop': (msg) => {
    // State is handled in the resourceWatcher, no need to bubble out to UI thread
    const watchKey = watchKeyFromMessage(msg);

    removeFromWatcherQueue(watchKey);
  },
  'resource.error': (msg) => {
    // State is handled in the resourceWatcher, no need to bubble out to UI thread
    console.warn(`Resource error [${ state.store }]`, msg.resourceType, ':', msg.data.error); // eslint-disable-line no-console
  },
  dispatch: (msg) => {
    self.postMessage({ dispatch: msg });
  },
  resync: () => {
    // TODO: RC this should be covered by https://github.com/rancher/dashboard/issues/8296
  }
};

const maintenanceInterval = setInterval(workerActions.sendBatch, 5000); // 5 seconds

const actionPrecedence = {
  initWorker:    1,
  updateWorker:  2,
  loadTypeMap:   3,
  loadSchemas:   4,
  createWatcher: 5,
  createApi:     6
};

/**
 * Covers message from UI Thread to Worker
 */
onmessage = (e) => {
  /* on the off chance there's more than key in the message, we handle them in the order that they "keys" method provides which is
  // good enough for now considering that we never send more than one message action at a time right now */
  const messageActions = Object.keys(e?.data).sort((actionA, actionB) => {
    const aPrecedence = actionPrecedence[actionA] || 3;
    const bPrecedence = actionPrecedence[actionB] || 3;

    return aPrecedence - bPrecedence;
  });

  messageActions.forEach((action) => {
    if (workerActions[action]) {
      workerActions[action](e?.data[action]);
    } else {
      console.warn('no associated action for:', action); // eslint-disable-line no-console
    }
  });
}; // bind everything to the worker's onmessage handler via the workerActions
