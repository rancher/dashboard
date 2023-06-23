/**
 * Advanced Worker is enabled by performance setting
 * relocates cluster resource sockets off the UI thread and into a webworker
 */

import { SCHEMA, COUNT } from '@shell/config/types';
import ResourceWatcher, { watchKeyFromMessage } from '@shell/plugins/steve/resourceWatcher';
import ResourceCache from '@shell/plugins/steve/caches/resourceCache';
import { EVENT_MESSAGE, EVENT_CONNECT_ERROR, EVENT_DISCONNECT_ERROR } from '@shell/utils/socket';
import { normalizeType, keyFieldFor } from '@shell/plugins/dashboard-store/normalize';
import { addSchemaIndexFields } from '@shell/plugins/steve/schema.utils';

const caches = {};

const state = {
  watcher:      undefined,
  store:        '', // Store name
  /**
   * Store `watch`/`unwatch` events to process when the socket is created
   */
  workerQueue:  [],
  batchChanges: {},
  debugWorker:  false
};

const trace = (...args) => {
  state.debugWorker && console.info('Advanced Worker:', ...args); // eslint-disable-line no-console
};

trace('created');

const maintenanceInterval = setInterval(() => {
  if (Object.keys(state.batchChanges).length) {
    self.postMessage({ batchChanges: state.batchChanges });
    state.batchChanges = {};
  }
}, 5000); // 5 seconds

const makeResourceProps = (msg) => {
  const { resourceType, data: { type }, data } = msg;
  const rawType = resourceType || type;
  const normalizedType = normalizeType(rawType === 'counts' ? COUNT : rawType);
  const keyField = keyFieldFor(normalizedType);

  if ( normalizedType === SCHEMA ) {
    addSchemaIndexFields(data);
  }

  return {
    type: normalizedType,
    id:   data[keyField],
    data
  };
};

/**
 * Pass the EVENT_CONNECT_ERROR / EVENT_DISCONNECT_ERROR back to the UI thread
 */
const handleConnectionError = (eventType, event, watcher) => {
  trace('createWatcher', eventType, event);
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
const removeFromWorkerQueue = (watchKey) => {
  state.workerQueue = state.workerQueue.filter((workerMessage) => {
    const [, msg] = Object.entries(workerMessage)[0];
    const workerMessageWatchKey = watchKeyFromMessage(msg);

    return watchKey !== workerMessageWatchKey;
  });
};

/**
 * These are things that we do when we get a message from the UI thread
 */
const workerActions = {
  // ToDo: SM we'll make a generic loader for all resource types when we need it but it'll be pretty similar to this
  loadSchemas: (collection) => {
    if (!caches[SCHEMA]) {
      caches[SCHEMA] = new ResourceCache(SCHEMA);
    }
    caches[SCHEMA].load(collection);
  },
  createWatcher: (opt) => {
    trace('createWatcher', opt);

    const {
      metadata, maxTries, url, csrf
    } = opt;

    if (!state.watcher) {
      state.watcher = new ResourceWatcher(url, true, null, null, maxTries, csrf);

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

      state.watcher.addEventListener('resync', (e) => {
        self.postMessage({ redispatch: { resyncWatch: e.detail.data } });
      });

      state.watcher.addEventListener(EVENT_CONNECT_ERROR, (e) => {
        handleConnectionError(EVENT_CONNECT_ERROR, e, state.watcher);
      });

      state.watcher.addEventListener(EVENT_DISCONNECT_ERROR, (e) => {
        handleConnectionError(EVENT_DISCONNECT_ERROR, e, state.watcher);
      });

      state.watcher.setDebug(state.debugWorker);

      state.watcher.connect(metadata);

      // Flush the workerQueue
      while (state.workerQueue.length > 0) {
        trace('createWatcher', 'flushing workerQueue', state.workerQueue);

        const workerMessage = state.workerQueue.shift();
        const [action, msg] = Object.entries(workerMessage)[0];

        if (workerActions[action]) {
          workerActions[action](msg);
        } else {
          console.warn('no associated action for:', action); // eslint-disable-line no-console
        }
      }
    }
  },
  watch: (msg) => {
    trace('watch', msg);

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
      state.workerQueue.push({ watch: msg });

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
      selector,
      force: msg.force,
    };

    state.watcher.watch(watchKey, resourceVersion, resourceVersionTime, watchObject, skipResourceVersion);
  },
  unwatch: (watchKey) => {
    trace('unwatch', watchKey);

    removeFromWorkerQueue(watchKey);

    if (!state.watcher) {
      return;
    }

    state.watcher.unwatch(watchKey);
  },
  initWorker: ({ storeName }) => {
    trace('initWorker', storeName);

    state.store = storeName;
  },
  destroyWorker: () => {
    trace('destroyWorker');

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
    state.debugWorker = !!on;
    state.watcher.setDebug(!!on);
  },
  updateBatch(type, id, change) {
    if (!state.batchChanges[type]) {
      state.batchChanges[type] = {};
    }
    state.batchChanges[type][id] = change;
  }
};

/**
 * These are things that we do when we get a message from the resourceWatcher
 */
const resourceWatcherActions = {
  'resource.change': (msg) => {
    const { type, id, data } = makeResourceProps(msg);

    if (caches[type]) {
      caches[type].change(data, () => workerActions.updateBatch(type, id, data));
    } else {
      workerActions.updateBatch(type, id, data);
    }
  },
  // ToDo: SM create is functionally identical to change in the cache but the worker isn't supposed to know that hence the near-duplicate code
  'resource.create': (msg) => {
    const { type, id, data } = makeResourceProps(msg);

    if (caches[type]) {
      caches[type].create(data, () => workerActions.updateBatch(type, id, data));
    } else {
      workerActions.updateBatch(type, id, data);
    }
  },
  'resource.start': (msg) => {
    // State is handled in the resourceWatcher, no need to bubble out to UI thread
  },
  'resource.remove': (msg) => {
    const { type, id } = makeResourceProps(msg);

    if (caches[type]) {
      caches[type].remove(id, () => workerActions.updateBatch(type, id, {}));
    } else {
      workerActions.updateBatch(type, id, {});
    }
  },
  'resource.stop': (msg) => {
    trace('resource.stop', msg);

    // State is handled in the resourceWatcher....
    const watchKey = watchKeyFromMessage(msg);

    removeFromWorkerQueue(watchKey);

    // ... however we still want to bubble out to UI thread
    // We'll save some hassle and ignore any resource.stop bubble if we're in error. the only thing that will clear that is a resync
    if (!state.watcher?.watches[watchKey]?.error) {
      // See comment in resourceWatcher 'resource.stop' handler, until we can resolve the resourceVersion within the resourceWatcher
      // internally, we'll want to bubble this out to the UI thread. When that's resolved this won't be needed
      resourceWatcherActions.dispatch({
        ...msg,
        advancedWorker: true,
      });
    }
  },
  'resource.error': (msg) => {
    // State is handled in the resourceWatcher, no need to bubble out to UI thread
    console.warn(`Resource error [${ state.store }]`, msg.resourceType, ':', msg.data.error); // eslint-disable-line no-console
  },
  dispatch: (msg) => {
    self.postMessage({ dispatch: msg });
  }
};

/**
 * Covers message from UI Thread to Worker
 */
self.onmessage = (e) => {
  /* on the off chance there's more than key in the message, we handle them in the order that they "keys" method provides which is
  // good enough for now considering that we never send more than one message action at a time right now */
  const messageActions = Object.keys(e?.data);

  messageActions.forEach((action) => {
    if (workerActions[action]) {
      workerActions[action](e?.data[action]);
    } else {
      console.warn('no associated action for:', action); // eslint-disable-line no-console
    }
  });
}; // bind everything to the worker's onmessage handler via the workerActions
