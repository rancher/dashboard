import { addObject, clear, removeObject } from '@shell/utils/array';
import { get } from '@shell/utils/object';
import { COUNT, SCHEMA } from '@shell/config/types';
import { getPerformanceSetting } from '@shell/config/settings';
import Socket, {
  EVENT_CONNECTED,
  EVENT_DISCONNECTED,
  EVENT_MESSAGE,
  //  EVENT_FRAME_TIMEOUT,
  EVENT_CONNECT_ERROR,
  EVENT_DISCONNECT_ERROR
} from '@shell/utils/socket';
import { normalizeType } from '@shell/plugins/dashboard-store/normalize';
import day from 'dayjs';
import { DATE_FORMAT, TIME_FORMAT } from '@shell/store/prefs';
import { escapeHtml } from '@shell/utils/string';

// eslint-disable-next-line
import webworker from './web-worker.steve-sub-worker.js';

export const NO_WATCH = 'NO_WATCH';
export const NO_SCHEMA = 'NO_SCHEMA';

// minimum length of time a disconnect notification is shown
const MINIMUM_TIME_NOTIFIED = 3000;

// We only create a worker for the cluster store
export function createWorker(store, ctx) {
  const { getters } = ctx;
  const storeName = getters.storeName;

  store.$workers = store.$workers || {};

  if (storeName !== 'cluster') {
    return;
  }

  const workerActions = {
    load: (resource) => {
      queueChange(ctx, resource, true, 'Change');
    },
    destroyWorker: () => {
      delete this.$workers[storeName];
    }
  };

  if (!store.$workers[storeName]) {
    const worker = new webworker();

    store.$workers[storeName] = worker;

    worker.postMessage({ initWorker: { storeName } });

    store.$workers[storeName].onmessage = (e) => {
      /* on the off chance there's more than key in the message, we handle them in the order that they "keys" method provides which is
      // good enough for now considering that we never send more than one message action at a time right now */
      const messageActions = Object.keys(e?.data);

      messageActions.forEach((action) => {
        workerActions[action](e?.data[action]);
      });
    };
  }
}

export function keyForSubscribe({
  resourceType, type, namespace, id, selector
} = {}) {
  return `${ resourceType || type || '' }/${ namespace || '' }/${ id || '' }/${ selector || '' }`;
}

export function equivalentWatch(a, b) {
  if ( a.type !== b.type ) {
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

function queueChange({ getters, state }, { data, revision }, load, label) {
  const type = getters.normalizeType(data.type);

  const entry = getters.typeEntry(type);

  if ( entry ) {
    entry.revision = Math.max(entry.revision, parseInt(revision, 10));
  } else {
    return;
  }

  // console.log(`${ label } Event [${ state.config.namespace }]`, data.type, data.id); // eslint-disable-line no-console

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

export const actions = {
  subscribe(ctx, opt) {
    const {
      state, commit, dispatch, getters, rootGetters
    } = ctx;

    if (rootGetters['isSingleProduct']?.disableSteveSockets) {
      return;
    }

    let socket = state.socket;

    commit('setWantSocket', true);

    if ( process.server ) {
      return;
    }

    state.debugSocket && console.info(`Subscribe [${ getters.storeName }]`); // eslint-disable-line no-console

    const url = `${ state.config.baseUrl }/subscribe`;

    if ( socket ) {
      socket.setAutoReconnect(true);
      socket.setUrl(url);
    } else {
      const maxTries = growlsDisabled(rootGetters) ? null : 3;

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
    }

    socket.connect(get(opt, 'metadata') );
  },

  unsubscribe({ commit, getters, state }) {
    const socket = state.socket;
    const worker = (this.$workers || {})[getters.storeName];

    commit('setWantSocket', false);

    if (worker) {
      worker.postMessage({ destroyWorker: true }); // we're only passing the boolean here because the key needs to be something truthy to ensure it's passed on the object.
    }

    if ( socket ) {
      return socket.disconnect();
    }
  },

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
    if ( process.client && state.wantSocket && !state.socket ) {
      dispatch('subscribe');
    }
  },

  watch({
    state, dispatch, getters, rootGetters
  }, params) {
    state.debugSocket && console.info(`Watch Request [${ getters.storeName }]`, JSON.stringify(params)); // eslint-disable-line no-console

    let {
      // eslint-disable-next-line prefer-const
      type, selector, id, revision, namespace, stop, force
    } = params;

    type = getters.normalizeType(type);

    if (rootGetters['type-map/isSpoofed'](type)) {
      state.debugSocket && console.info('Will not Watch (type is spoofed)', JSON.stringify(params)); // eslint-disable-line no-console

      return;
    }

    if ( !stop && !force && !getters.canWatch(params) ) {
      console.error(`Cannot Watch [${ getters.storeName }]`, JSON.stringify(params)); // eslint-disable-line no-console

      return;
    }

    if ( !stop && getters.watchStarted({
      type, id, selector, namespace
    }) ) {
      state.debugSocket && console.debug(`Already Watching [${ getters.storeName }]`, JSON.stringify(params)); // eslint-disable-line no-console

      return;
    }

    if ( typeof revision === 'undefined' ) {
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

    return dispatch('send', msg);
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
        opt,
      });
      commit('clearInError', params);

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
        have = have.filter(x => x.metadata?.namespace === namespace);
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
    if ( !process.server ) {
      for ( const obj of state.pendingFrames.slice() ) {
        commit('dequeuePendingFrame', obj);
        dispatch('sendImmediate', obj);
      }
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
          title:         t('growl.connectError.title'),
          message:       t('growl.connectError.message', {
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
          title:         t('growl.disconnectError.title'),
          message:       t('growl.disconnectError.message', {
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

  'ws.ping'({ getters, dispatch }, msg) {
    if ( getters.storeName === 'management' ) {
      const version = msg?.data?.version || null;

      dispatch('updateServerVersion', version, { root: true });
      console.info(`Ping [${ getters.storeName }] from ${ version || 'unknown version' }`); // eslint-disable-line no-console
    }
  },

  'ws.resource.start'({ state, getters, commit }, msg) {
    state.debugSocket && console.info(`Resource start: [${ getters.storeName }]`, msg); // eslint-disable-line no-console
    commit('setWatchStarted', {
      type:      msg.resourceType,
      namespace: msg.namespace,
      id:        msg.id,
      selector:  msg.selector
    });
  },

  'ws.resource.error'({ getters, commit, dispatch }, msg) {
    console.warn(`Resource error [${ getters.storeName }]`, msg.resourceType, ':', msg.data.error); // eslint-disable-line no-console

    const err = msg.data?.error?.toLowerCase();

    if ( err.includes('watch not allowed') ) {
      commit('setInError', { type: msg.resourceType, reason: NO_WATCH });
    } else if ( err.includes('failed to find schema') ) {
      commit('setInError', { type: msg.resourceType, reason: NO_SCHEMA });
    } else if ( err.includes('too old') ) {
      dispatch('resyncWatch', msg);
    }
  },

  'ws.resource.stop'({ getters, commit, dispatch }, msg) {
    const type = msg.resourceType;
    const obj = {
      type,
      id:        msg.id,
      namespace: msg.namespace,
      selector:  msg.selector
    };

    // console.warn(`Resource stop: [${ getters.storeName }]`, msg); // eslint-disable-line no-console

    if ( getters['schemaFor'](type) && getters['watchStarted'](obj) ) {
      // Try reconnecting once

      commit('setWatchStopped', obj);

      setTimeout(() => {
        // Delay a bit so that immediate start/error/stop causes
        // only a slow infinite loop instead of a tight one.
        dispatch('watch', obj);
      }, 5000);
    }
  },

  'ws.resource.create'(ctx, msg) {
    queueChange(ctx, msg, true, 'Create');
  },

  'ws.resource.change'(ctx, msg) {
    const data = msg.data;
    const type = data.type;

    // Debounce count changes so we send at most 1 every 5 seconds
    if (type === COUNT) {
      const worker = (this.$workers || {})[ctx.getters.storeName];

      if (worker) {
        worker.postMessage({ countsUpdate: msg });

        // No further processing - let the web worker debounce the counts
        return;
      }
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

export const mutations = {
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
    const existing = state.started.find(entry => equivalentWatch(obj, entry));

    if ( !existing ) {
      addObject(state.started, obj);
    }

    delete state.inError[keyForSubscribe(obj)];
  },

  setWatchStopped(state, obj) {
    const existing = state.started.find(entry => equivalentWatch(obj, entry));

    if ( existing ) {
      removeObject(state.started, existing);
    } else {
      console.warn("Tried to remove a watch that doesn't exist", obj); // eslint-disable-line no-console
    }
  },

  setInError(state, msg) {
    const key = keyForSubscribe(msg);

    state.inError[key] = msg.reason;
  },

  clearInError(state, msg) {
    const key = keyForSubscribe(msg);

    delete state.inError[key];
  },

  debug(state, on) {
    state.debugSocket = on !== false;
  },

  resetSubscriptions(state) {
    clear(state.started);
    clear(state.pendingFrames);
    clear(state.queue);
    clearTimeout(state.queueTimer);
    state.deferredRequests = {};
    state.queueTimer = null;
  }
};

export const getters = {
  canWatch: state => (obj) => {
    return !state.inError[keyForSubscribe(obj)];
  },

  watchStarted: state => (obj) => {
    return !!state.started.find(entry => equivalentWatch(obj, entry));
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

      revision = cache.revision;

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

  currentGeneration: state => (type) => {
    type = normalizeType(type);

    const cache = state.types[type];

    if ( !cache ) {
      return null;
    }

    return cache.generation;
  },
};
