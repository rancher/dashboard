/**
 * Handles subscriptions to websockets which receive updates to resources
 *
 * Covers three use cases
 * 1) Handles subscription within this file
 * 2) Handles `cluster` subscriptions for some basic types in a web worker (SETTING.UI_PERFORMANCE advancedWorker = false)
 * 2) Handles `cluster` subscriptions and optimisations in an advanced worker (SETTING.UI_PERFORMANCE advancedWorker = true)
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
import paginationUtils from '@shell/utils/pagination-utils';

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
          // This can occurr when the user is redirected to the log in page
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
  const aresourceType = a.resourceType || a.type;
  const bresourceType = b.resourceType || b.type;

  if ( aresourceType !== bresourceType ) {
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

      // if the worker is in advanced mode then it'll contain it's own socket which it calls a 'watcher'
      this.$workers[getters.storeName].postMessage({
        createWatcher: {
          metadata,
          url:  `${ state.config.baseUrl }/subscribe`,
          csrf: this.$cookies.get(CSRF, { parseJSON: false }),
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

  unsubscribe({ commit, getters, state }) {
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

    return Promise.all(cleanupTasks);
  },

  watch({
    state, dispatch, getters, rootGetters
  }, params) {
    state.debugSocket && console.info(`Watch Request [${ getters.storeName }]`, JSON.stringify(params)); // eslint-disable-line no-console

    let {
      // eslint-disable-next-line prefer-const
      type, selector, id, revision, namespace, stop, force
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

    if ( !stop && getters.watchStarted({
      type, id, selector, namespace
    }) ) {
      // eslint-disable-next-line no-console
      state.debugSocket && console.debug(`Already Watching [${ getters.storeName }]`, {
        type, id, selector, namespace
      });

      return;
    }

    // isSteveCacheEnabled check is temporary and will be removed once Part 3 of https://github.com/rancher/dashboard/pull/10349 is resolved by backend
    // Steve cache backed api does not return a revision, so `revision` here is always undefined
    // Which means we find a revision within a resource itself and use it in the watch
    // That revision is probably too old and results in a watch error
    // Watch errors mean we make a http request to get latest revision (which is still missing) and try to re-watch with it...
    // etc
    if (typeof revision === 'undefined' && !paginationUtils.isSteveCacheEnabled({ rootGetters })) {
      revision = getters.nextResourceVersion(type, id);
    }

    const msg = { resourceType: type };

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

    return dispatch('send', msg);
  },

  unwatch(ctx, {
    type, id, namespace, selector, all
  }) {
    const { commit, getters, dispatch } = ctx;

    if (getters['schemaFor'](type)) {
      namespace = acceptOrRejectSocketMessage.subscribeNamespace(namespace);

      const obj = {
        type,
        id,
        namespace,
        selector,
        stop: true, // Stops the watch on a type
      };

      const unwatch = (obj) => {
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

      if (isAdvancedWorker(ctx)) {
        dispatch('watch', obj); // Ask the backend to stop watching the type
      } else if (all) {
        getters['watchesOfType'](type).forEach((obj) => {
          unwatch(obj);
        });
      } else if (getters['watchStarted'](obj)) {
        unwatch(obj);
      }
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
        delete entry.revision;
        promises.push(dispatch('watch', entry));
      }
    }

    return Promise.all(promises);
  },

  async resyncWatch({
    state, getters, dispatch, commit
  }, params) {
    const {
      resourceType, namespace, id, selector
    } = params;

    console.info(`Resync [${ getters.storeName }]`, params); // eslint-disable-line no-console

    const opt = { force: true, forceWatch: true };

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
    let have, want;

    if ( selector ) {
      have = getters['matching'](resourceType, selector).slice();
      want = await dispatch('findMatching', {
        type: resourceType,
        selector,
        opt,
      });
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

  closed({ state, getters }) {
    state.debugSocket && console.info(`WebSocket Closed [${ getters.storeName }]`); // eslint-disable-line no-console
    clearTimeout(state.queueTimer);
    state.queueTimer = null;
  },

  error({
    getters, state, dispatch, rootGetters
  }, e) {
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
      selector:  msg.selector
    };

    state.started.filter((entry) => {
      if (
        entry.type === newWatch.type &&
        entry.namespace !== newWatch.namespace
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
      dispatch('resyncWatch', msg);
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
      selector:  msg.selector
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

      dispatch('watch', obj);
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

    state.inError[key] = reason;
  },

  clearInError(state, msg) {
    const key = keyForSubscribe(msg);

    delete state.inError[key];
  },

  resetSubscriptions(state) {
    // Clear out socket state. This is only ever called from reset... which is always called after we `disconnect` above.
    // This could probably be folded in to there
    clear(state.started);
    clear(state.pendingFrames);
    clear(state.queue);
    clearTimeout(state.queueTimer);
    state.deferredRequests = {};
    state.queueTimer = null;
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
  inError: (state) => (obj) => {
    return state.inError[keyForSubscribe(obj)];
  },

  watchesOfType: (state) => (type) => {
    return state.started.filter((entry) => type === (entry.resourceType || entry.type));
  },

  watchStarted: (state) => (obj) => {
    return !!state.started.find((entry) => equivalentWatch(obj, entry));
  },

  nextResourceVersion: (state, getters) => (type, id) => {
    type = normalizeType(type);
    let revision = 0;

    if ( id ) {
      const existing = getters['byId'](type, id);

      revision = parseInt(existing?.metadata?.resourceVersion, 10);
    }

    if ( !revision ) {
      const cache = state.types[type];

      if ( !cache ) {
        return null;
      }

      revision = cache.revision; // This is always zero.....

      for ( const obj of cache.list ) {
        if ( obj && obj.metadata ) {
          const neu = parseInt(obj.metadata.resourceVersion, 10);

          revision = Math.max(revision, neu);
        }
      }
    }

    if ( revision ) {
      return revision;
    }

    return null;
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
