/**
 * Advanced Worker is enabled by performance setting
 * relocates cluster resource sockets off the UI thread and into a webworker
 */

import { SCHEMA, COUNT, POD } from '@shell/config/types';
import ResourceWatcher, { watchKeyFromMessage } from '@shell/plugins/steve/resourceWatcher';
import { EVENT_MESSAGE, EVENT_CONNECT_ERROR, EVENT_DISCONNECT_ERROR } from '@shell/utils/socket';
import { normalizeType, keyFieldFor } from '@shell/plugins/dashboard-store/normalize';
import { addSchemaIndexFields } from '@shell/plugins/steve/resourceUtils/schema';
import cacheClasses from '@shell/plugins/steve/caches';
import ResourceRequest from '@shell/plugins/steve/api/resourceRequest';
import Trace from '@shell/plugins/steve/trace';
import { i18n } from '@shell/plugins/steve/caches/utils/translations';
import { applyMapping, labelForDefaultFn } from '@shell/utils/type-map';
import TempCache from '@shell/plugins/steve/caches/utils/tempCache';
// import { findBy } from '@shell/utils/array';

const caches = {};

// these are caches pulled from the UI thread to satisfy calculatedFields, purged shortly after use.
const tempCaches = {
  management: {},
  rancher:    {},
  'type-map': {},
  plugins:    {},
  prefs:      null,
  catalog:    null,
  root:       {}
};

const uiRequests = {};
const uiRequester = (getter) => {
  const cacheGetter = `${ getter }/cacheRequest`;
  const uiPromise = {};

  uiPromise.promise = new Promise((resolve, reject) => {
    uiPromise.resolves = () => {
      resolve({ index: uiPromise.index, cacheGetter });
    };
    uiPromise.reject = (error) => {
      reject(error);
    };

    if (!uiRequests[cacheGetter] || uiRequests[cacheGetter].length < 1) {
      self.postMessage({ get: cacheGetter });
    }
  });
  uiPromise.index = uiRequests[cacheGetter]?.length || 0;

  uiRequests[cacheGetter] = [...(uiRequests[cacheGetter] || []), uiPromise];

  return uiPromise.promise;
};

const cacheFieldGetters = {
  translate:             (key, args, language) => caches['i18n']?.translate(key, args, language),
  translateWithFallback: (key, args, fallback, fallbackIsKey) => caches['i18n']?.translateWithFallback(key, args, fallback, fallbackIsKey),
  exists:                (key, language) => caches['i18n']?.exists(key, language),
  all:                   type => caches[type]?.all(),
  byId:                  (type, id) => caches[type]?.byId(id),
  findByIds:             (type, ids) => caches[type]?.find({ ids }),
  matching:              (type, selector, namespace) => caches[type]?.matching(selector, namespace),
  schemaFor:             type => caches[SCHEMA]?.getSchema(type),
  podsByNamespace:       (namespace) => {
    return caches[POD]?.byNamespace(namespace) || [];
  },
  pathExistsInSchema: (type, path) => caches[SCHEMA]?.pathExistsInSchema(type, path),
  mgmtAll:            type => tempCaches['management'][type]?.all(),
  mgmtById:           (type, id) => tempCaches['management'][type]?.byId(id),
  rancherById:        (type, id) => tempCaches['management'][type]?.byId(id),
  prefGet:            pref => tempCaches['prefs']?.get(pref),
  labelFor:           (schema) => {
    const label = applyMapping(schema, tempCaches['type-map']?.cache || [], 'id', false, labelForDefaultFn(schema, undefined, undefined, caches['i18n']));

    return label;
  },
  rowValueGetter: (schema, colName) => resource => 'a value from a column/row pair', // ToDo: SM gets from type-map store
  findChart:      opt => tempCaches['catalog'].findChart(opt), // ToDo: SM just need to build out the catalog tempCache with "findChart" built in now
  isRancher:      caches['root']?.isRancher,
  currentCluster: caches['root']?.currentCluster,
  clusterId:      caches['root']?.clusterId,
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

/**
 * Creates a resourceCache with the appropriate type
 */
const resourceCache = (type) => {
  const CacheClass = cacheClasses[type] || cacheClasses.resourceCache;
  const instance = new CacheClass(type, params => state.api?.request({ ...params, type }), cacheFieldGetters);

  instance.setDebug(state.debugWorker.cache);

  return instance;
};

/**
 * Errors sent over the thread boundary must be clonable. The response to `fetch` isn't, so cater for that before we send it over
 */
const parseRequestError = (e) => {
  const res = e?.cause?.response;

  if (res) {
    return {
      response: {
        status:     res.status,
        statusText: res.statusText,
      }
    };
  }

  return e;
};

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
    workerActions.loadIntoCache(SCHEMA, data, {}); // This will create caches[SCHEMA]
    workerActions.flushApiQueue();
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
      state.api = new ResourceRequest(state.config, {
        loadIntoCache: workerActions.loadIntoCache,
        getSchema:     (id) => {
          return caches[SCHEMA].getSchema(id);
        }
      });
      state.api.setDebug(state.debugWorker.request);

      for (const [resourceKey, resourceCache] of Object.entries(caches)) {
        if (resourceCache?.loadWorkerMethods) {
          resourceCache.loadWorkerMethods({ resourceRequest: params => state.api?.request({ ...params, type: resourceKey }) });
        }
      }
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

  cacheResponse: (response) => {
    const cacheName = response.getter.replace('/cacheRequest', '');

    tempCaches[cacheName] = new TempCache(response.cache);
    uiRequests[response.getter].forEach((request) => {
      request.resolves(response.cache);
    });
  },

  /**
   * Starting point for requests for resources
   */
  waitingForResponse: (request) => {
    requestTracer.trace('waitingForResponse', request);

    if (!caches[SCHEMA]) {
      state.apiQueue.push({ waitingForResponse: request });

      return;
    }
    const { params, requestHash } = request;

    workerActions.request(params, (response, error) => self.postMessage({
      awaitedResponse: {
        response, requestHash, error
      }
    }));
  },

  /**
   * Either setup the resource type and make the request for the given params... or find the resource in the cache for the given params
   */
  request: (params, resolver = () => {}) => {
    const { type } = params;

    requestTracer.trace('waitingForResponse --> request', params);

    if (!caches[type] || caches[type].cacheIsInvalid(params)) {
    // if (!caches[type]) {
      requestTracer.trace('waitingForResponse --> request. No Cache, created and requesting resources');
      const type = params.type;

      caches[type] = resourceCache(type);
      const dependencyRequests = caches[type].calculatedFields
        .filter(field => (field.cache && !caches[field.cache]) || field.tempCache)
        .map((field) => {
          const requests = [];

          // ToDo: SM potentially add in filter criteria here if I can map it so I can cut down on response payload
          if (field.cache) {
            requests.concat(field.cache.map((fieldCache) => {
              return state.api.request({ type: fieldCache })
                .then(() => {
                  return true;
                }).catch((e) => {
                  resolver(undefined, parseRequestError(e));
                });
            }));
          }
          if (field.tempCache) {
            requests.concat(field.tempCache.map((tempFieldCache) => {
              return uiRequester(field.tempFieldCache)
                .then((res) => {
                  uiRequests[res.cacheGetter] = uiRequests[res.cacheGetter]
                    .filter(prom => prom.index !== res.index);

                  return true;
                });
            }));
          }

          return requests;
        })
        .reduce((acc, requests) => [...acc, ...requests]);

      Promise.all([
        state.api.request(params).catch((e) => {
          resolver(undefined, parseRequestError(e));
        }),
        ...dependencyRequests
      ])
        .then(() => {
          resolver(caches[type].find(params, { noRequest: true }));
        });
    } else {
      requestTracer.trace('waitingForResponse --> Direct lookup in cache');
      const results = caches[type].find(params);

      resolver(results);
    }
  },
  /**
   * @param {[]} payload
   * Accepts an array of JSON objects representing resources
   * types the array and constructs a cache if none exists and then loads each resource in the array into the cache
   */
  loadIntoCache: (type, payload, params = {}, detail = false) => {
    const rawResources = detail ? [payload] : payload;

    if (!caches[type]) {
      caches[type] = resourceCache(type);
    }

    return caches[type].load(rawResources, params, detail);
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
    caches['i18n'] = i18n(config.i18nConfig);
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
  updateBatch(type, id, change) {
    if (!state.batchChanges[type]) {
      state.batchChanges[type] = {};
    }
    state.batchChanges[type][id] = change;
  },
  sendBatch(requestHash) {
    if (Object.keys(state.batchChanges).length) {
      const batchPayload = { batchChanges: state.batchChanges };

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
      caches[type] = resourceCache(type);
    }

    caches[type].change(data, () => workerActions.updateBatch(type, id, data));
  },
  // ToDo: SM create is functionally identical to change in the cache but the worker isn't supposed to know that hence the near-duplicate code
  'resource.create': (msg) => {
    const { type, id, data } = makeResourceProps(msg);

    if (!caches[type]) {
      caches[type] = resourceCache(type);
    }

    caches[type].create(data, () => workerActions.updateBatch(type, id, data));
  },
  'resource.start': (msg) => {
    // State is handled in the resourceWatcher, no need to bubble out to UI thread
  },
  'resource.remove': (msg) => {
    const { type, id } = makeResourceProps(msg);

    if (!caches[type]) {
      caches[type] = resourceCache(type);
    }

    caches[type].remove(id, () => workerActions.updateBatch(type, id, {}));
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
  }
};

const maintenanceInterval = setInterval(workerActions.sendBatch, 5000); // 5 seconds

const actionPrecedence = {
  configure:     1,
  loadSchemas:   2,
  createWatcher: 3,
  createApi:     3
};

/**
 * Covers message from UI Thread to Worker
 */
// ToDo: SM intermittent error 'Uncaught (in promise) SyntaxError: Unexpected token '<', "<!doctype "... is not valid JSON' on a watch action
// ToDo: SM navlink is using the singular noun for a get-list request...
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
