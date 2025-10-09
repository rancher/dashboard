/**
 * Handles subscriptions to websockets which receive updates to resources
 *
 * Covers three use cases
 * 1) Handles subscription within this file
 * 2) Handles `cluster` subscriptions for some basic types in a web worker (SETTING.UI_PERFORMANCE advancedWorker = false) (is this true??)
 * 2) Handles `cluster` subscriptions and optimisations in an advanced worker (SETTING.UI_PERFORMANCE advancedWorker = true)
 *
 * Very roughly this does...
 *
 * 1. _Subscribes_ to a web socket (v1, v3, v1 cluster)
 * 2. UI --> Rancher: Sends a _watch_ message for a specific resource type (which can have qualifying filters)
 * 3. Rancher --> UI: Rancher can send a number of messages back
 *   - `resource.start`   - watch has started
 *   - `resource.error`   - watch has errored, usually a result of bad data in the resource.start message
 *   - `resource.change`  - a resource has changed, this is it's new value
 *   - `resource.changes` - if in this mode, no resource.change events are sent, instead one debounced message is sent without any resource data
 *   - `resource.stop`    - either we have requested the watch stops, or there has been a resource.error
 * 4. UI --> Rancher: Sends an _unwatch_ request for a matching _watch_ request
 *
 * Below are some VERY brief steps for common flows. Some will link together
 *
 * Successfully flow - watch
 * 1. UI --> Rancher: _watch_ request
 * 2. Rancher --> UI: `resource.start`. UI sets watch as started
 * ...
 * 3. Rancher --> UI: `resource.change` (contains data). UI caches data
 *
 * Successful flow - watch - new mode
 * 1. UI --> Rancher: _watch_ request
 * 2. Rancher --> UI: `resource.start`. UI sets watch as started
 * ...
 * 3. Rancher --> UI: `resource.changes` (contains no data). UI makes a HTTP request to fetch data
 *
 * Successful flow - unwatch
 * 1. UI --> Rancher: _unwatch_ request
 * 2. Rancher --> UI: `resource.stop`. UI sets watch as stopped
 *
 * Successful flow - resource.stop received
 * 1. Rancher --> UI: `resource.stop`. UI sets watch as stopped
 * 2. UI --> Rancher: _watch_ request
 *
 * Successful flow - socket disconnected
 * 1. Socket closes|disconnects (not sure which)
 * 2. UI: reopens socket
 * 3. UI --> Rancher: _watch_ request (for every started watch)
 *
 * Error Flow
 * 1. UI --> Rancher: _watch_ request
 * 2. Rancher --> UI: `resource.start`. UI sets watch as started
 * 3. Rancher --> UI: `resource.error`. UI sets watch as errored.
 *   a) UI: in the event of 'too old' the UI will make a http request to fetch a new revision and re-watch with it. This process is delayed on each call
 * 4. Rancher --> UI: `resource.stop`. UI sets watch as stop (note the resource.stop flow above is avoided given error state)
 *
 * Additionally
 * - if we receive resource.stop, unless the watch is in error, we immediately send back a watch event
 * - if the web socket is disconnected (for steve based sockets it happens every 30 mins, or when there are permission changes)
 *   the ui will re-connect it and re-watch all previous watches using a best effort revision
 */

import { addObject, clear, removeObject } from '@shell/utils/array';
import { get, deepToRaw } from '@shell/utils/object';
import { SCHEMA, MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { CSRF } from '@shell/config/cookies';
import { getPerformanceSetting } from '@shell/utils/settings';
import Socket, {
  EVENT_CONNECTED,
  EVENT_DISCONNECTED,
  EVENT_MESSAGE,
  //  EVENT_FRAME_TIMEOUT,
  EVENT_CONNECT_ERROR,
  EVENT_DISCONNECT_ERROR,
  NO_WATCH,
  NO_SCHEMA,
  REVISION_TOO_OLD,
  NO_PERMS
} from '@shell/utils/socket';
import { normalizeType } from '@shell/plugins/dashboard-store/normalize';
import day from 'dayjs';
import { DATE_FORMAT, TIME_FORMAT } from '@shell/store/prefs';
import { escapeHtml } from '@shell/utils/string';
import { keyForSubscribe } from '@shell/plugins/steve/resourceWatcher';
import { waitFor } from '@shell/utils/async';
import { WORKER_MODES } from './worker';
import acceptOrRejectSocketMessage from './accept-or-reject-socket-message';
import { BLANK_CLUSTER, STORE } from '@shell/store/store-types.js';
import { _MERGE } from '@shell/plugins/dashboard-store/actions';
import { STEVE_WATCH_EVENT_TYPES, STEVE_WATCH_MODE } from '@shell/types/store/subscribe.types';
import paginationUtils from '@shell/utils/pagination-utils';
import backOff from '@shell/utils/back-off';
import { SteveWatchEventListenerManager } from '@shell/plugins/subscribe-events';

// minimum length of time a disconnect notification is shown
const MINIMUM_TIME_NOTIFIED = 3000;

const workerQueues = {};

const supportedStores = [STORE.CLUSTER, STORE.RANCHER, STORE.MANAGEMENT];

const isWaitingForDestroy = (storeName, store) => {
  return store.$workers[storeName]?.waitingForDestroy && store.$workers[storeName].waitingForDestroy();
};

const waitForSettingsSchema = (storeName, store) => {
  return waitFor(() => isWaitingForDestroy(storeName, store) || !!store.getters['management/byId'](SCHEMA, MANAGEMENT.SETTING));
};

const waitForSettings = (storeName, store) => {
  return waitFor(() => isWaitingForDestroy(storeName, store) || !!store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.UI_PERFORMANCE));
};

const isAdvancedWorker = (ctx) => {
  const { rootGetters, getters } = ctx;
  const storeName = getters.storeName;
  const clusterId = rootGetters.clusterId;

  if (!supportedStores.includes(storeName) || (clusterId === BLANK_CLUSTER && storeName === STORE.CLUSTER)) {
    return false;
  }

  const perfSetting = getPerformanceSetting(rootGetters);

  return perfSetting?.advancedWorker.enabled;
};

export async function createWorker(store, ctx) {
  const { getters, dispatch } = ctx;
  const storeName = getters.storeName;

  store.$workers = store.$workers || {};

  if (!supportedStores.includes(storeName)) {
    return;
  }

  if (!store.$workers[storeName]) {
    // we know we need a worker at this point but we don't know which one so we're creating a mock interface
    // it will simply queue up any messages for the real worker to process when it loads up
    store.$workers[storeName] = {
      postMessage: (msg) => {
        if (Object.keys(msg)?.[0] === 'destroyWorker') {
          // The worker has been destroyed before it's been set up. Flag this so we stop waiting for mgmt settings and then can destroy worker.
          // This can occur when the user is redirected to the log in page
          // - workers created (but waiting)
          // - logout is called
          // - <store>/unsubscribe is dispatched
          // - wait for worker object to be destroyed <-- requires initial wait to be unblocked
          store.$workers[storeName].mode = WORKER_MODES.DESTROY_MOCK;

          return;
        }
        if (workerQueues[storeName]) {
          workerQueues[storeName].push(msg);
        } else {
          workerQueues[storeName] = [msg];
        }
      },
      mode:              WORKER_MODES.WAITING,
      waitingForDestroy: () => {
        return store.$workers[storeName]?.mode === WORKER_MODES.DESTROY_MOCK;
      },
      destroy: () => {
        // Similar to workerActions.destroyWorker
        delete store.$workers[storeName];
      }
    };
  }

  await waitForSettingsSchema(storeName, store);
  await waitForSettings(storeName, store);
  if (store.$workers[storeName].waitingForDestroy()) {
    store.$workers[storeName].destroy();

    return;
  }
  const advancedWorker = isAdvancedWorker(ctx);

  const workerActions = {
    load: (resource) => {
      queueChange(ctx, resource, true, 'Change');
    },
    destroyWorker: () => {
      if (store.$workers) {
        store.$workers[storeName].terminate();
        delete store.$workers[storeName];
      }
    },
    batchChanges: (batch) => {
      dispatch('batchChanges', acceptOrRejectSocketMessage.validateBatchChange(ctx, batch));
    },
    dispatch: (msg) => {
      dispatch(`ws.${ msg.name }`, msg);
    },
    redispatch: (msg) => {
      /**
       * because we had to queue up some messages prior to loading the worker:
       * the basic worker will need to redispatch some of the queued messages back to the UI thread
       */
      Object.entries(msg).forEach(([action, params]) => {
        dispatch(action, params);
      });
    },
    [EVENT_CONNECT_ERROR]: (e) => {
      dispatch('error', e );
    },
    [EVENT_DISCONNECT_ERROR]: (e) => {
      dispatch('error', e );
    },
  };

  if (!store.$workers[storeName] || store.$workers[storeName].mode === WORKER_MODES.WAITING) {
    const workerMode = advancedWorker ? WORKER_MODES.ADVANCED : WORKER_MODES.BASIC;
    const worker = store.steveCreateWorker(workerMode);

    store.$workers[storeName] = worker;

    worker.postMessage({ initWorker: { storeName } });

    /**
     * Covers message from Worker to UI thread
     */
    store.$workers[storeName].onmessage = (e) => {
      /* on the off chance there's more than key in the message, we handle them in the order that they "keys" method provides which is
      // good enough for now considering that we never send more than one message action at a time right now */
      const messageActions = Object.keys(e?.data);

      messageActions.forEach((action) => {
        workerActions[action](e?.data[action]);
      });
    };
  }

  while (workerQueues[storeName]?.length) {
    const message = workerQueues[storeName].shift();
    const safeMessage = deepToRaw(message);

    store.$workers[storeName].postMessage(safeMessage);
  }
}

export function equivalentWatch(a, b) {
  const aResourceType = a.resourceType || a.type;
  const bResourceType = b.resourceType || b.type;

  if ( aResourceType !== bResourceType ) {
    return false;
  }

  if (a.mode !== b.mode && (a.mode || b.mode)) {
    return false;
  }

  if ( a.id !== b.id && (a.id || b.id) ) {
    return false;
  }

  if ( a.namespace !== b.namespace && (a.namespace || b.namespace) ) {
    return false;
  }

  if ( a.selector !== b.selector && (a.selector || b.selector) ) {
    return false;
  }

  return true;
}

function queueChange({ getters, state, rootGetters }, { data, revision }, load, label) {
  const type = getters.normalizeType(data.type);

  const entry = getters.typeEntry(type);

  if ( entry ) {
    entry.revision = Math.max(entry.revision, parseInt(revision, 10));
  } else {
    return;
  }

  // console.log(`${ label } Event [${ state.config.namespace }]`, data.type, data.id); // eslint-disable-line no-console

  if (!acceptOrRejectSocketMessage.validChange({ getters, rootGetters }, type, data)) {
    return;
  }

  if ( load ) {
    state.queue.push({
      action: 'dispatch',
      event:  'load',
      body:   data
    });
  } else {
    const obj = getters.byId(data.type, data.id);

    if ( obj ) {
      state.queue.push({
        action: 'commit',
        event:  'remove',
        body:   obj
      });
    }

    if ( type === SCHEMA ) {
      // Clear the current records in the store when a type disappears
      state.queue.push({
        action: 'commit',
        event:  'forgetType',
        body:   data.id
      });
    }
  }
}

function growlsDisabled(rootGetters) {
  return getPerformanceSetting(rootGetters)?.disableWebsocketNotification;
}

/**
 * clear the provided error, but also ensure any backoff request associated with it is cleared as well
 */
const clearInError = ({ getters, commit }, error) => {
  // for this watch ... get the specific prefix we care about ... reset back-offs related to it
  backOff.resetPrefix(getters.backOffId(error.obj, ''));
  // Clear out stale error state (next time around we can try again with a new revision that was just fetched)
  commit('clearInError', error.obj);
};

/**
 * Actions that cover all cases (see file description)
 */
const sharedActions = {
  async subscribe(ctx, opt) {
    const {
      state, commit, dispatch, getters, rootGetters
    } = ctx;

    // ToDo: need to keep the worker up to date on CSRF cookie

    if (rootGetters['isSingleProduct']?.disableSteveSockets) {
      return;
    }

    let socket = state.socket;

    commit('setWantSocket', true);

    state.debugSocket && console.info(`Subscribe [${ getters.storeName }]`); // eslint-disable-line no-console

    const url = `${ state.config.baseUrl }/subscribe`;
    const maxTries = growlsDisabled(rootGetters) ? null : 3;
    const metadata = get(opt, 'metadata');

    if (isAdvancedWorker(ctx)) {
      if (!this.$workers[getters.storeName]) {
        await createWorker(this, ctx);
      }
      const options = { parseJSON: false };
      const csrf = rootGetters['cookies/get']({ key: CSRF, options });

      // if the worker is in advanced mode then it'll contain it's own socket which it calls a 'watcher'
      this.$workers[getters.storeName].postMessage({
        createWatcher: {
          metadata,
          url: `${ state.config.baseUrl }/subscribe`,
          csrf,
          maxTries
        }
      });
    } else if ( socket ) {
      socket.setAutoReconnect(true);
      socket.setUrl(url);
      socket.connect(metadata);
    } else {
      socket = new Socket(`${ state.config.baseUrl }/subscribe`, true, null, null, maxTries);

      commit('setSocket', socket);
      socket.addEventListener(EVENT_CONNECTED, (e) => {
        dispatch('opened', e);
      });

      socket.addEventListener(EVENT_DISCONNECTED, (e) => {
        dispatch('closed', e);
      });

      socket.addEventListener(EVENT_CONNECT_ERROR, (e) => {
        dispatch('error', e );
      });

      socket.addEventListener(EVENT_DISCONNECT_ERROR, (e) => {
        dispatch('error', e );
      });

      socket.addEventListener(EVENT_MESSAGE, (e) => {
        const event = e.detail;

        if ( event.data) {
          const msg = JSON.parse(event.data);

          if (msg.name) {
            dispatch(`ws.${ msg.name }`, msg);
          }
        }
      });
      socket.connect(metadata);
    }
  },

  async unsubscribe({
    commit, getters, state, dispatch
  }) {
    const socket = state.socket;

    commit('setWantSocket', false);
    const cleanupTasks = [];

    const worker = (this.$workers || {})[getters.storeName];

    if (worker) {
      worker.postMessage({ destroyWorker: true }); // we're only passing the boolean here because the key needs to be something truthy to ensure it's passed on the object.
      cleanupTasks.push(waitFor(() => !this.$workers[getters.storeName], 'Worker is destroyed'));
    }

    if ( socket ) {
      cleanupTasks.push(socket.disconnect());
    }

    await dispatch('resetWatchBackOff');

    return Promise.all(cleanupTasks);
  },

  /**
   * Create a trigger for a specific type of watch event
   *
   * For example if a watch on mgmt clusters exists and a page wants to know when any changes occur
   * @param {} ctx
   * @param {STEVE_WATCH_EVENT_PARAMS} event
   */
  watchEvent(ctx, {
    event = STEVE_WATCH_EVENT_TYPES.CHANGES,
    id,
    callback,
    /**
     * of type @STEVE_WATCH_PARAMS
     */
    params
  }) {
    if (!ctx.getters.listenerManager.isSupportedEventType(event)) {
      console.error(`Unknown event type "${ event }", only ${ Object.keys(ctx.getters.listenerManager.supportedEventTypes).join(',') } are supported`); // eslint-disable-line no-console

      return;
    }

    ctx.getters.listenerManager.addEventListenerCallback({
      callback,
      args: {
        event, params, id
      }
    });

    const hasStandardWatch = ctx.getters.listenerManager.hasStandardWatch({ params });

    if (!hasStandardWatch) {
      // If there's nothing to piggy back on... start a watch to do so.
      ctx.dispatch('watch', {
        ...params,
        standardWatch: false // Ensure that we don't treat this as a standard watch
      });
    }
  },

  /**
   * @param {} ctx
   * @param {STEVE_UNWATCH_EVENT_PARAMS} event
   */
  unwatchEvent(ctx, {
    event = STEVE_WATCH_EVENT_TYPES.CHANGES,
    id,
    /**
     * of type @STEVE_WATCH_PARAMS
     */
    params
  }) {
    if (!ctx.getters.listenerManager.isSupportedEventType(event)) {
      console.info(`Attempted to unwatch for an event "${ event }" but it had no watchers`); // eslint-disable-line no-console

      return;
    }

    ctx.getters.listenerManager.removeEventListenerCallback({
      event, params, id
    });

    // Unwatch the underlying standard watch
    // Note - If we were piggybacking on a watch that previously existed we won't unwatch it
    ctx.dispatch('unwatch', params);
  },

  /**
   * @param {STEVE_WATCH_PARAMS} params
   */
  watch({
    state, dispatch, getters, rootGetters
  }, params) {
    state.debugSocket && console.info(`Watch Request [${ getters.storeName }]`, JSON.stringify(params)); // eslint-disable-line no-console
    let {
      // eslint-disable-next-line prefer-const
      type, selector, id, revision, namespace, stop, force, mode, standardWatch = true
    } = params;

    namespace = acceptOrRejectSocketMessage.subscribeNamespace(namespace);
    type = getters.normalizeType(type);

    if (rootGetters['type-map/isSpoofed'](type)) {
      state.debugSocket && console.info('Will not Watch (type is spoofed)', JSON.stringify(params)); // eslint-disable-line no-console

      return;
    }

    const schema = getters.schemaFor(type, false, false);

    if (!!schema?.attributes?.verbs?.includes && !schema.attributes.verbs.includes('watch')) {
      state.debugSocket && console.info('Will not Watch (type does not have watch verb)', JSON.stringify(params)); // eslint-disable-line no-console

      return;
    }

    // If socket is in error don't try to watch.... unless we `force` it
    const inError = getters.inError(params);

    if ( !stop && !force && inError ) {
      // REVISION_TOO_OLD is a temporary state and will be handled when `resyncWatch` completes
      if (inError !== REVISION_TOO_OLD) {
        console.error(`Aborting Watch Request [${ getters.storeName }]. Watcher in error (${ inError })`, JSON.stringify(params)); // eslint-disable-line no-console
      }

      return;
    }

    const messageMeta = {
      type, id, selector, namespace, mode
    };

    if (!stop && getters.watchStarted(messageMeta)) {
      // eslint-disable-next-line no-console
      state.debugSocket && console.debug(`Already Watching [${ getters.storeName }]`, {
        type, id, selector, namespace, mode
      });

      return;
    }

    // Watch errors mean we make a http request to get latest revision (which is still missing) and try to re-watch with it...
    // etc
    if (typeof revision === 'undefined') {
      revision = getters.nextResourceVersion(type, id);
    }

    const msg = { resourceType: type };

    if (mode) {
      msg.mode = mode;

      if (mode === STEVE_WATCH_MODE.RESOURCE_CHANGES) {
        const debounceMs = paginationUtils.resourceChangesDebounceMs({ rootGetters });

        if (debounceMs) {
          msg.debounceMs = debounceMs;
        }
      }
    }

    if ( revision ) {
      msg.resourceVersion = `${ revision }`;
    }

    if ( namespace ) {
      msg.namespace = namespace;
    }

    if ( stop ) {
      msg.stop = true;
    }

    if ( id ) {
      msg.id = id;
    }

    if ( selector ) {
      msg.selector = selector;
    }

    const worker = this.$workers?.[getters.storeName] || {};

    if (worker.mode === WORKER_MODES.ADVANCED || worker.mode === WORKER_MODES.WAITING) {
      if ( force ) {
        msg.force = true;
      }

      worker.postMessage({ watch: msg });

      return;
    }

    if (!stop && standardWatch) {
      // Track that this watch is just a normal one, not one kicked off by listeners
      // This helps us keep the watch going (for listeners) instead of in unwatch just stopping it
      getters.listenerManager.setStandardWatch({ standardWatch: true, args: { event: msg.mode, params: msg } });
    }

    return dispatch('send', msg);
  },

  /**
   * @param {STEVE_WATCH_PARAMS} params
   */
  unwatch(ctx, {
    type, id, namespace, selector, all, mode
  }) {
    const { commit, getters, dispatch } = ctx;

    if (getters['schemaFor'](type)) {
      namespace = acceptOrRejectSocketMessage.subscribeNamespace(namespace);

      const obj = {
        type,
        id,
        namespace,
        selector,
        mode,
        stop: true, // Stops the watch on a type
      };

      const unwatch = (obj) => {
        // Has this normal watch got listeners? If so
        const hasStandardWatch = ctx.getters.listenerManager.hasStandardWatch({ params: obj });
        const watchHasListeners = ctx.getters.listenerManager.hasEventListeners({ params: obj });

        if (hasStandardWatch) {
          // If we have listeners for this watch... make sure it knows there's now no root standard watch
          ctx.getters.listenerManager.setStandardWatch({ standardWatch: false, args: { params: obj } });
        }

        if (watchHasListeners) {
          // Does this watch have listeners? if so we shouldn't stop it (they still need it)

          return;
        }

        if (getters['watchStarted'](obj)) {
          // Set that we don't want to watch this type
          // Otherwise, the dispatch to unwatch below will just cause a re-watch when we
          // detect the stop message from the backend over the web socket
          commit('setWatchStopped', obj);
          dispatch('watch', obj); // Ask the backend to stop watching the type
          // Make sure anything in the pending queue for the type is removed, since we've now removed the type
          commit('clearFromQueue', type);
        }
      };

      const objKey = keyForSubscribe(obj);
      const reset = [];

      if (isAdvancedWorker(ctx)) {
        dispatch('watch', obj); // Ask the backend to stop watching the type
      } else if (all) {
        reset.push(...getters['watchesOfType'](type));
      } else if (getters['watchStarted'](obj)) {
        reset.push(obj);
      }

      reset.forEach((obj) => {
        unwatch(obj);
        // Ensure anything pinging in the background is stopped
        dispatch('resetWatchBackOff', {
          type,
          compareWatches: (entry) => objKey === keyForSubscribe(entry)
        });
      });
    }
  },

  /**
   * Ensure there's no back-off process waiting to run for
   * - resource.changes fetchResources
   * - resource.error resyncWatches
   */
  resetWatchBackOff({ state, getters, commit }, {
    type, compareWatches, resetInError = true, resetStarted = true
  } = { resetInError: true, resetStarted: true }) {
    // Step 1 - Reset back-offs related to watches that have STARTED
    if (resetStarted && state.started?.length) {
      let entries = state.started;

      if (type || compareWatches) { // Filter out ones for types we're no interested in
        entries = entries
          .filter((obj) => compareWatches ? compareWatches(obj) : obj.type === type);
      }

      entries.forEach((obj) => backOff.resetPrefix(getters.backOffId(obj, '')));
    }

    // Step 2 - Reset back-offs related to watches that are in error (and may not be started)
    if (resetInError && state.inError) {
      // (it would be nicer if we could store backOff state in `state.started`,
      // however resource.stop clears `started` and we need the settings to persist over start-->error-->stop-->start cycles
      let entries = Object.values(state.inError || {});

      if (type || compareWatches) { // Filter out ones for types we're no interested in
        entries = entries
          .filter((error) => compareWatches ? compareWatches(error.obj) : error.obj.type === type);
      }

      entries
        .filter((error) => error.reason === REVISION_TOO_OLD) // Filter out ones for reasons we're not interested in
        .forEach((error) => clearInError({ getters, commit }, error));
    }
  },

  'ws.ping'({ getters, dispatch }, msg) {
    if ( getters.storeName === 'management' ) {
      const version = msg?.data?.version || null;

      dispatch('updateServerVersion', version, { root: true });
      console.info(`Ping [${ getters.storeName }] from ${ version || 'unknown version' }`); // eslint-disable-line no-console
    }
  },
};

/**
 * Mutations that cover all cases (both subscriptions here and in advanced worker)
 */
const sharedMutations = {
  debug(state, on, store) {
    state.debugSocket = on !== false;
    if (store && this.$workers[store]) {
      this.$workers[store].postMessage({ toggleDebug: on !== false });
    }
  },
};

/**
 * Actions that cover cases 1 & 2 (see file description)
 */
const defaultActions = {

  async flush({
    state, commit, dispatch, getters
  }) {
    const queue = state.queue;
    let toLoad = [];

    if ( !queue.length ) {
      return;
    }

    const started = new Date().getTime();

    state.queue = [];

    state.debugSocket && console.debug(`Subscribe Flush [${ getters.storeName }]`, queue.length, 'items'); // eslint-disable-line no-console

    for ( const { action, event, body } of queue ) {
      if ( action === 'dispatch' && event === 'load' ) {
        // Group loads into one loadMulti when possible
        toLoad.push(body);
      } else {
        // When we hit a different kind of event, process all the previous loads, then the other event.
        if ( toLoad.length ) {
          await dispatch('loadMulti', toLoad);
          toLoad = [];
        }

        if ( action === 'dispatch' ) {
          await dispatch(event, body);
        } else if ( action === 'commit' ) {
          commit(event, body);
        } else {
          throw new Error('Invalid queued action');
        }
      }
    }

    // Process any remaining loads
    if ( toLoad.length ) {
      await dispatch('loadMulti', toLoad);
    }

    state.debugSocket && console.debug(`Subscribe Flush [${ getters.storeName }] finished`, (new Date().getTime()) - started, 'ms'); // eslint-disable-line no-console
  },

  rehydrateSubscribe({ state, dispatch }) {
    if ( state.wantSocket && !state.socket ) {
      dispatch('subscribe');
    }
  },

  reconnectWatches({
    state, getters, commit, dispatch
  }) {
    const promises = [];

    for ( const entry of state.started.slice() ) {
      console.info(`Reconnect [${ getters.storeName }]`, JSON.stringify(entry)); // eslint-disable-line no-console

      if ( getters.schemaFor(entry.type) ) {
        commit('setWatchStopped', entry);
        // Delete the cached socket revision, forcing the watch to get latest revision from cached resources instead
        delete entry.revision;
        promises.push(dispatch('watch', entry));
      }
    }

    return Promise.all(promises);
  },

  /**
   * Socket has been closed, restart afresh (make http request, ensure we re-watch)
   */
  async resyncWatch({ getters, dispatch }, params) {
    console.info(`Resync [${ getters.storeName }]`, params); // eslint-disable-line no-console

    await dispatch('fetchResources', {
      ...params,
      opt: { force: true, forceWatch: true }
    });
  },

  async fetchResources({
    state, getters, dispatch, commit
  }, { opt, ...params }) {
    const {
      resourceType, namespace, id, selector, mode
    } = params;

    if (!resourceType) {
      console.error(`A socket message has prompted a request to fetch a resource but no resource type was supplied`); // eslint-disable-line no-console

      return;
    }

    if ( id ) {
      await dispatch('find', {
        type: resourceType,
        id,
        opt:  {
          ...opt,
          // Pass the namespace so `find` can construct the url correctly
          namespaced: namespace,
          // Ensure that find calls watch with no revision (otherwise it'll use the revision from the resource which is probably stale)
          revision:   null
        },
      });

      return;
    }
    let have = []; let want = [];

    if ( selector ) {
      have = getters['matching'](resourceType, selector).slice();
      want = await dispatch('findMatching', {
        type: resourceType,
        selector,
        opt,
      });
    } else {
      if (mode === STEVE_WATCH_MODE.RESOURCE_CHANGES) {
        // Other findX use options (id/ns/selector) from the messages received over socket.
        // However paginated requests have more complex params so grab them from store from the store.
        // of type @StorePagination
        const storePagination = getters['havePage'](resourceType);

        if (!!storePagination) {
          have = []; // findPage removes stale entries, so we don't need to rely on below process to remove them

          // This could have been kicked off given a resource.changes message
          // If the messages come in quicker than findPage completes (resource.changes debounce time >= http request time),
          // and the request is the same, only the first request will be processed. all others until it finishes will be ignored
          // (see deferred process - `waiting.push(later);` - in request action).
          // If this becomes an issue we need to debounce and work around the deferred issue within request
          want = await dispatch('findPage', {
            type: resourceType,
            opt:  {
              ...opt,
              namespaced: namespace,
              // This brings in page, page size, filter, etc
              ...storePagination.request
            }
          });
        }

        // Should any listeners be notified of this request for them to kick off their own event handling?
        getters.listenerManager.triggerEventListener({ event: STEVE_WATCH_MODE.RESOURCE_CHANGES, params });
      } else {
        have = getters['all'](resourceType).slice();

        if ( namespace ) {
          have = have.filter((x) => x.metadata?.namespace === namespace);
        }

        want = await dispatch('findAll', {
          type:           resourceType,
          watchNamespace: namespace,
          opt
        });
      }
    }

    const wantMap = {};

    for ( const obj of want ) {
      wantMap[obj.id] = true;
    }

    for ( const obj of have ) {
      if ( !wantMap[obj.id] ) {
        state.debugSocket && console.info(`Remove stale [${ getters.storeName }]`, resourceType, obj.id); // eslint-disable-line no-console

        commit('remove', obj);
      }
    }
  },

  async opened({
    commit, dispatch, state, getters, rootGetters
  }, event) {
    state.debugSocket && console.info(`WebSocket Opened [${ getters.storeName }]`); // eslint-disable-line no-console
    const socket = event.currentTarget;
    const tries = event?.detail?.tries; // have to pull it off of the event because the socket's tries is already reset to 0
    const t = rootGetters['i18n/t'];
    const disableGrowl = growlsDisabled(rootGetters);

    this.$socket = socket;

    if ( !state.queue ) {
      state.queue = [];
    }

    if ( !state.queueTimer ) {
      state.flushQueue = async() => {
        if ( state.queue.length ) {
          await dispatch('flush');
        }

        state.queueTimer = setTimeout(state.flushQueue, 1000);
      };

      state.flushQueue();
    }

    if ( socket.hasReconnected ) {
      await dispatch('reconnectWatches');
      // Check for disconnect notifications and clear them
      const growlErr = rootGetters['growl/find']({ key: 'url', val: socket.url });

      if (growlErr) {
        dispatch('growl/remove', growlErr.id, { root: true });
      }
      if (tries > 1 && !disableGrowl) {
        dispatch('growl/success', {
          title:   t('growl.reconnected.title'),
          message: t('growl.reconnected.message', { url: this.$socket.url, tries }),
        }, { root: true });
      }
    }

    // Try resending any frames that were attempted to be sent while the socket was down, once.
    for ( const obj of state.pendingFrames.slice() ) {
      commit('dequeuePendingFrame', obj);
      dispatch('sendImmediate', obj);
    }
  },

  async closed({ state, getters, dispatch }) {
    state.debugSocket && console.info(`WebSocket Closed [${ getters.storeName }]`); // eslint-disable-line no-console

    await dispatch('resetWatchBackOff');
    clearTimeout(state.queueTimer);
    state.queueTimer = null;
  },

  async error({
    getters, state, dispatch, rootGetters
  }, e) {
    state.debugSocket && console.info(`WebSocket Error [${ getters.storeName }]`); // eslint-disable-line no-console

    await dispatch('resetWatchBackOff');
    clearTimeout(state.queueTimer);
    state.queueTimer = null;

    // determine if websocket notifications are disabled
    const disableGrowl = growlsDisabled(rootGetters);

    if (!disableGrowl) {
      const dateFormat = escapeHtml( rootGetters['prefs/get'](DATE_FORMAT));
      const timeFormat = escapeHtml( rootGetters['prefs/get'](TIME_FORMAT));
      const time = e?.srcElement?.disconnectedAt || Date.now();

      const timeFormatted = `${ day(time).format(`${ dateFormat } ${ timeFormat }`) }`;
      const url = e?.srcElement?.url;
      const tries = state?.socket?.tries;

      const t = rootGetters['i18n/t'];

      const growlErr = rootGetters['growl/find']({ key: 'url', val: url });

      if (e.type === EVENT_CONNECT_ERROR) { // if this occurs, then we're at least retrying to connect
        if (growlErr) {
          dispatch('growl/remove', growlErr.id, { root: true });
        }
        dispatch('growl/error', {
          title:   t('growl.connectError.title'),
          message: t('growl.connectError.message', {
            url, time: timeFormatted, tries
          }, { raw: true }),
          icon:          'error',
          earliestClose: time + MINIMUM_TIME_NOTIFIED,
          url
        }, { root: true });
      } else if (e.type === EVENT_DISCONNECT_ERROR) { // if this occurs, we've given up on trying to reconnect
        if (growlErr) {
          dispatch('growl/remove', growlErr.id, { root: true });
        }
        dispatch('growl/error', {
          title:   t('growl.disconnectError.title'),
          message: t('growl.disconnectError.message', {
            url, time: timeFormatted, tries
          }, { raw: true }),
          icon:          'error',
          earliestClose: time + MINIMUM_TIME_NOTIFIED,
          url
        }, { root: true });
      } else {
        // if the error is not a connect error or disconnect error, the socket never worked: log whether the current browser is safari
        console.error(`WebSocket Connection Error [${ getters.storeName }]`, e.detail); // eslint-disable-line no-console
      }
    }
  },

  send({ state, commit }, obj) {
    if ( state.socket ) {
      const ok = state.socket.send(JSON.stringify(obj));

      if ( ok ) {
        return;
      }
    }

    commit('enqueuePendingFrame', obj);
  },

  sendImmediate({ state }, obj) {
    if ( state.socket ) {
      return state.socket.send(JSON.stringify(obj));
    }
  },

  /**
   * Steve only event
   */
  'ws.resource.start'({
    state, getters, commit, dispatch
  }, msg) {
    state.debugSocket && console.info(`Resource start: [${ getters.storeName }]`, msg); // eslint-disable-line no-console

    const newWatch = {
      type:      msg.resourceType,
      namespace: msg.namespace,
      id:        msg.id,
      selector:  msg.selector,
      mode:      msg.mode,
    };

    // Unwatch watches that are incompatible with the new type
    // This is mainly to prevent the cache being polluted with resources that aren't compatible with it's aim
    // For instance if the store/cache for pods contains a namespace X and we watch another namespace Y... we don't want ns X resources added to cache

    // Unwatch incompatible watches
    state.started.filter((entry) => {
      if (
        (entry.type === newWatch.type) &&
        (entry.namespace !== newWatch.namespace) &&
        (!entry.mode && !newWatch.mode) // mode watches will be handled when they become an issue
      ) {
        return true;
      }
    }).forEach((entry) => {
      dispatch('unwatch', entry);
    });

    commit('setWatchStarted', newWatch);
  },

  'ws.resource.error'({ getters, commit, dispatch }, msg) {
    console.warn(`Resource error [${ getters.storeName }]`, msg.resourceType, ':', msg.data.error); // eslint-disable-line no-console

    const err = msg.data?.error?.toLowerCase();

    if ( err.includes('watch not allowed') ) {
      commit('setInError', { msg, reason: NO_WATCH });
    } else if ( err.includes('failed to find schema') ) {
      commit('setInError', { msg, reason: NO_SCHEMA });
    } else if ( err.includes('too old') ) {
      // Set an error for (all) subs of this type. This..
      // 1) blocks attempts by resource.stop to resub (as type is in error)
      // 2) will be cleared when resyncWatch --> watch (with force) --> resource.start completes
      commit('setInError', { msg, reason: REVISION_TOO_OLD });

      // See Scenario 1 from https://github.com/rancher/dashboard/issues/14974
      // The watch that results from resyncWatch will fail and end up here if the revision isn't (yet) known
      // So re-retry resyncWatch until it does OR
      // - we're already re-retrying
      //   - early exist from `execute`
      // - we give up (exceed max retries)
      //   - early exist from `execute`
      // - we need to stop (socket is disconnected or closed, type is 'forgotten', watch is unwatched)
      //   - `reset` called asynchronously
      //   - Note - we won't need to clear the id outside of the above scenarios because `too old` only occurs on fresh watches (covered by above scenarios)
      backOff.execute({
        id:          getters.backOffId(msg, REVISION_TOO_OLD),
        description: `Invalid watch revision, re-syncing`,
        canFn:       () => getters.canBackoff(this.$socket),
        delayedFn:   () => dispatch('resyncWatch', msg),
      });
    } else if ( err.includes('the server does not allow this method on the requested resource')) {
      commit('setInError', { msg, reason: NO_PERMS });
    }
  },

  /**
   * Steve only event
   *
   * Steve has stopped watching this resource. This happens for a couple of reasons
   * - We have requested that the resource watch should be stopped (and we receive this event as confirmation)
   * - Steve tells us that the resource watch has been stopped. Possible reasons
   *   - The rancher <--> k8s socket closed (happens every ~30 mins on mgmt socket)
   *   - Permissions has changed for the subscribed resource, so rancher closes socket
   */
  'ws.resource.stop'({
    state, getters, commit, dispatch
  }, msg) {
    const type = msg.resourceType;
    const obj = {
      type,
      id:        msg.id,
      namespace: msg.namespace,
      selector:  msg.selector,
      mode:      msg.mode
    };

    state.debugSocket && console.info(`Resource Stop [${ getters.storeName }]`, type, msg); // eslint-disable-line no-console

    if (!type) {
      console.error(`Resource Stop [${ getters.storeName }]. Received resource.stop with an empty resourceType, aborting`, msg); // eslint-disable-line no-console

      return;
    }

    // If we're trying to watch this event, attempt to re-watch
    //
    // To make life easier in the advanced worker `resource.stop` --> `watch` is handled here (basically for access to getters.nextResourceVersion)
    // This means the concept of resource sub watch state needs massaging
    const advancedWorker = msg.advancedWorker;
    const localState = !advancedWorker;
    const watchStarted = localState ? getters['watchStarted'](obj) : advancedWorker;

    if ( getters['schemaFor'](type) && watchStarted) {
      if (localState) {
        commit('setWatchStopped', obj);
      }

      // Now re-watch
      const hasEventListeners = getters.listenerManager.hasEventListeners({ params: obj });
      const hasStandardWatch = getters.listenerManager.hasStandardWatch({ params: obj });

      dispatch('watch', {
        ...obj,
        // hasEventListeners && !hasStandardWatch ? false : true
        // if this watch isn't associated with a normal watch... (there are no listeners, or there are listeners but also a normal watch)
        standardWatch: !(hasEventListeners && !hasStandardWatch)
      });

      if (hasEventListeners) {
        // If there's event listeners always kick them off
        // - The re-watch associated with normal watches will watch from a revision from it's own cache
        // - The revision in that cache might be ahead of the state the listeners have, so the watch won't ping something for the listeners to trigger on
        // - so to work around this whenever we start the watches again trigger off the changes for it
        // Improvement - we only do one event here (currently the only one supported), could expand to others
        getters.listenerManager.triggerEventListener({ event: STEVE_WATCH_EVENT_TYPES.CHANGES, params: obj });
      }
    }
  },

  'ws.resource.create'(ctx, msg) {
    ctx.state.debugSocket && console.info(`Resource Create [${ ctx.getters.storeName }]`, msg.resourceType, msg); // eslint-disable-line no-console
    queueChange(ctx, msg, true, 'Create');
  },

  'ws.resource.change'(ctx, msg) {
    const data = msg.data;
    const type = data.type;

    // Work-around for ws.error messages being sent as change events
    // These have no id (or other metadata) which breaks lots if they are processed as change events
    if (data.message && !data.id) {
      return;
    }

    // Web worker can process schemas to check that they are actually changing and
    // only load updates if the schema did actually change
    if (type === SCHEMA) {
      const worker = (this.$workers || {})[ctx.getters.storeName];

      if (worker) {
        worker.postMessage({ updateSchema: data });

        // No further processing - let the web worker check the schema updates
        return;
      }
    }

    const havePage = ctx.getters['havePage'](type);

    if (havePage) {
      console.warn(`Prevented watch \`resource.change\` data from polluting the cache for type "${ type }" (currently represents a page). To prevent any further issues the watch has been stopped.`, data); // eslint-disable-line no-console
      ctx.dispatch('unwatch', data);

      return;
    }

    queueChange(ctx, msg, true, 'Change');

    const typeOption = ctx.rootGetters['type-map/optionsFor'](type);

    if (typeOption?.alias?.length > 0) {
      const alias = typeOption?.alias || [];

      alias.map((type) => {
        ctx.state.queue.push({
          action: 'dispatch',
          event:  'load',
          body:   {
            ...data,
            type,
          },
        });
      });
    }
  },

  'ws.resource.changes'({ dispatch }, msg) {
    dispatch('fetchResources', {
      ...msg,
      opt: { force: true, load: _MERGE }
    } );
  },

  'ws.resource.remove'(ctx, msg) {
    const data = msg.data;
    const type = data.type;

    ctx.state.debugSocket && console.info(`Resource Remove [${ ctx.getters.storeName }]`, type, msg); // eslint-disable-line no-console

    if (type === SCHEMA) {
      const worker = (this.$workers || {})[ctx.getters.storeName];

      if (worker) {
        worker.postMessage({ removeSchema: data.id });
      }
    }

    queueChange(ctx, msg, false, 'Remove');

    const typeOption = ctx.rootGetters['type-map/optionsFor'](type);

    if (typeOption?.alias?.length > 0) {
      const alias = typeOption?.alias || [];

      alias.map((type) => {
        const obj = ctx.getters.byId(type, data.id);

        ctx.state.queue.push({
          action: 'commit',
          event:  'remove',
          body:   obj,
        });
      });
    }
  },
};

/**
 * Mutations that cover cases 1 & 2 (see file description)
 */
const defaultMutations = {
  setSocket(state, socket) {
    state.socket = socket;
  },

  setWantSocket(state, want) {
    state.wantSocket = want;
  },

  enqueuePendingFrame(state, obj) {
    state.pendingFrames.push(obj);
  },

  dequeuePendingFrame(state, obj) {
    removeObject(state.pendingFrames, obj);
  },

  setWatchStarted(state, obj) {
    const existing = state.started.find((entry) => equivalentWatch(obj, entry));

    if ( !existing ) {
      addObject(state.started, obj);
    }

    delete state.inError[keyForSubscribe(obj)];
  },

  setWatchStopped(state, obj) {
    const existing = state.started.find((entry) => equivalentWatch(obj, entry));

    if ( existing ) {
      removeObject(state.started, existing);
    } else {
      console.warn("Tried to remove a watch that doesn't exist", obj); // eslint-disable-line no-console
    }
  },

  setInError(state, { msg, reason }) {
    const key = keyForSubscribe(msg);

    const { data, resourceType, ...obj } = msg;

    obj.type = msg.resourceType || msg.type;

    state.inError[key] = { obj, reason };
  },

  clearInError(state, msg) {
    // Callers of this should consider using local clearInError instead

    const key = keyForSubscribe(msg);

    delete state.inError[key];
  },

  /**
   * Clear out socket state
   */
  resetSubscriptions(state) {
    clear(state.started);
    clear(state.pendingFrames);
    clear(state.queue);
    // Note - we clear async operations here (like queueTimer) and we should also do so for backoff requests via
    // resetWatchBackOff, however can't because this is a mutation and it's an action
    // We shouldn't need to though given resetSubscription is called from store reset, which includes forgetType
    // on everything in the store, which resets backoff requests.
    // Additionally this is probably called on a cluster store, so we also call resetWatchBackOff when the socket disconnects
    clearTimeout(state.queueTimer);
    state.deferredRequests = {};
    state.queueTimer = null;
    state.socketListenerManager = new SteveWatchEventListenerManager(state.config.namespace);
  },

  clearFromQueue(state, type) {
    // Remove anything in the queue that is a resource update for the given type
    state.queue = state.queue.filter((item) => {
      return item.body?.type !== type;
    });
  },
};

/**
 * Getters that cover cases 1 & 2 (see file description)
 */
const defaultGetters = {
  /**
   * Get a unique id that can be used to track a process that can be backed-off
   *
   * @param obj - the usual id/namespace/selector, etc,
   * @param postFix - something else to uniquely id this back-off
   */
  backOffId: () => (obj, postFix) => {
    return `${ keyForSubscribe(obj) }${ postFix ? `:${ postFix }` : '' }`;
  },

  /**
   * Can the back off process run?
   *
   * If we're not connected no.
   */
  canBackoff: () => ($socket) => {
    return $socket.state === EVENT_CONNECTED;
  },

  inError: (state) => (obj) => {
    return state.inError[keyForSubscribe(obj)]?.reason;
  },

  watchesOfType: (state) => (type) => {
    return state.started.filter((entry) => type === (entry.resourceType || entry.type));
  },

  watchStarted: (state) => (obj) => {
    const existing = state.started.find((entry) => equivalentWatch(obj, entry));

    return !!existing;
  },

  /**
   * Try to determine the latest revision to use in a watch request.
   *
   * It does some dodgy revision comparisons (revisions are not guaranteed to be numerical or equate higher to newer)
   *
   * If we have an id - and that resource has a revision - use it
   * If we have a list - and the store has a revision - and it's a string - use it straight away
   * If we have a list - and the store has a revision - and it's a number - compare it to the revisions in the list and use overall highest
   *
   * Note - This used to use parseInt which does stuff like `abc-123` --> NaN, `123-abc` --> 123
   *
   * Returns string, non-zero number or null
   */
  nextResourceVersion: (state, getters) => (type, id) => {
    type = normalizeType(type);
    let revision = 0;

    if ( id ) {
      const existing = getters['byId'](type, id);

      revision = existing?.metadata?.resourceVersion;
    }

    if ( !revision ) {
      const cache = state.types[type];

      // No Cache, nothing to compare to, return early
      if ( !cache ) {
        return null;
      }

      revision = Number(cache.revision);

      // Cached LIST revision isn't a number, cannot compare to, return early
      if (Number.isNaN(revision)) {
        return cache.revision || null;
      }

      for ( const obj of cache.list || [] ) {
        if ( obj && obj.metadata ) {
          const neu = Number(obj.metadata.resourceVersion);

          if (Number.isNaN(neu)) {
            continue;
          }

          revision = Math.max(revision, neu);
        }
      }
    }

    return revision || null;
  },

  /**
   * Get the watch listener manager for this store
   *
   * Instance of @SteveWatchEventListenerManager . See it's description for more info
   */
  listenerManager: (state) => {
    return state.socketListenerManager;
  },
};

export const actions = {
  ...sharedActions,
  ...defaultActions,
};

export const mutations = {
  ...sharedMutations,
  ...defaultMutations,
};

export const getters = { ...defaultGetters };
