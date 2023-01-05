/**
 * Advanced Worker is enabled by performance setting
 * relocates cluster resource sockets off the UI thread and into a webworker
 */
import { SCHEMA, COUNT } from '@shell/config/types';
import ResourceWatcher, { watchKeyFromMessage } from '@shell/plugins/steve/resourceWatcher';
import { EVENT_MESSAGE } from '@shell/utils/socket';
import { normalizeType } from '@shell/plugins/dashboard-store/normalize';
import { waitFor } from '@shell/utils/async';

// import { CSRF } from '@shell/config/cookies';

const state = {
  watcher:      undefined,
  store:        '', // Store name
  workerQueue:  [],
  batchChanges: {},
  fetchConfig:  {}
};

const maintenanceInterval = setInterval(() => {
  if (Object.keys(state.batchChanges).length) {
    self.postMessage({ batchChanges: state.batchChanges });
    state.batchChanges = {};
  }
}, 5000); // 5 seconds

// These are things that we do when we get a message from the UI thread
const workerActions = {
  loadSchemas:   () => {},
  createWatcher: (metadata) => {
    const { connectionMetadata, maxTries, url } = metadata;

    if (!state.watcher) {
      state.watcher = new ResourceWatcher(url, true, null, null, maxTries);
      state.watcher.setConnectionMetadata(connectionMetadata);

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

      while (state.workerQueue.length > 0) {
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
    if (!state.watcher) {
      state.workerQueue.push({ watch: msg });

      return;
    }
    const watchKey = watchKeyFromMessage(msg);

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
    if (!state.watcher) {
      return;
    }

    state.watcher.unwatch(watchKey);
  },
  initWorker: ({ storeName }) => {
    state.store = storeName;
  },
  destroyWorker: () => {
    const watchesEmpty = () => {
      return Object.keys(state.watcher?.watches || {})?.length === 0;
    };
    const watches = Object.keys(state.watcher?.watches || {});

    clearInterval(maintenanceInterval);

    watches.forEach((watchKey) => {
      state.watcher.unwatch(watchKey);
    });

    waitFor(watchesEmpty, 'Closing Watcher')
      .finally(() => {
        // disconnect takes a callback which we'll use to close the webworker
        state.watcher.disconnect(close).then(() => {
          delete self.onmessage;
          self.postMessage({ destroyWorker: true }); // we're only passing the boolean here because the key needs to be something truthy to ensure it's passed on the object.
        });
      });
  },
};

// These are things that we do when we get a message from the resourceWatcher
const resourceWatcherActions = {
  'resource.change': (msg) => {
    const { resourceType, data: { type, id }, data } = msg;
    const rawType = resourceType || type;
    const normalizedType = normalizeType(rawType === 'counts' ? COUNT : rawType);

    if (!state.batchChanges[normalizedType]) {
      state.batchChanges[normalizedType] = {};
    }
    state.batchChanges[normalizedType][id] = data;
  },
  'resource.create': (msg) => {
    const { resourceType, data: { type, id }, data } = msg;
    const rawType = resourceType || type;
    const normalizedType = normalizeType(rawType === 'counts' ? COUNT : rawType);

    if (!state.batchChanges[normalizedType]) {
      state.batchChanges[normalizedType] = {};
    }
    state.batchChanges[normalizedType][id] = data;
  },
  'resource.remove': (msg) => {
    const { resourceType, data: { type, id } } = msg;
    const rawType = resourceType || type;
    const normalizedType = normalizeType(rawType === 'counts' ? COUNT : rawType);

    if (!state.batchChanges[normalizedType]) {
      state.batchChanges[normalizedType] = {};
    }
    state.batchChanges[normalizedType][id] = { remove: true };
  },
  'resource.stop': (msg) => {
    const watchKey = watchKeyFromMessage(msg);

    if (state?.watcher?.watchExists(watchKey)) {
      resourceWatcherActions.dispatch({ ...msg, fromWorker: true });
    }
  },
  'resource.error': (msg) => {
    console.warn(`Resource error [${ state.store }]`, msg.resourceType, ':', msg.data.error); // eslint-disable-line no-console
  },
  dispatch: (msg) => {
    self.postMessage({ dispatch: msg });
  }
};

onmessage = (e) => {
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
