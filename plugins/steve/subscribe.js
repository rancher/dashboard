import { normalizeType } from './normalize';
import { get } from '@/utils/object';
import Socket, {
  EVENT_CONNECTED,
  EVENT_DISCONNECTED,
  EVENT_MESSAGE,
  //  EVENT_FRAME_TIMEOUT,
  EVENT_CONNECT_ERROR
} from '@/utils/socket';

const NO_WATCHING = ['schema', 'apigroups'];

export const actions = {
  subscribe(ctx, opt) {
    const { state, commit, dispatch } = ctx;
    let socket = state.socket;

    commit('setWantSocket', true);

    if ( process.server ) {
      return;
    }

    if ( !socket ) {
      socket = new Socket(`${ state.config.baseUrl }/subscribe`);

      commit('setSocket', socket);

      socket.addEventListener(EVENT_CONNECTED, (e) => {
        dispatch('opened', e);
      });

      socket.addEventListener(EVENT_DISCONNECTED, (e) => {
        dispatch('closed', e);
      });

      socket.addEventListener(EVENT_CONNECT_ERROR, (e) => {
        dispatch('error', e.detail);
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

    socket.connect(get(opt, 'metadata'));
  },

  unsubscribe({ state, commit }) {
    const socket = state.socket;

    commit('setWantSocket', false);

    if ( socket ) {
      socket.disconnect();
    }
  },

  rehydrateSubscribe({ state, dispatch }) {
    if ( process.client && state.wantSocket && !state.socket ) {
      dispatch('subscribe');
    }
  },

  watchType({ dispatch, getters }, { type, revision }) {
    type = normalizeType(type);

    if ( NO_WATCHING.includes(type) ) {
      return;
    }

    if ( typeof revision === 'undefined' ) {
      revision = getters.nextResourceVersion(type);
    }

    return dispatch('send', { resourceType: type, revision });
  },

  watchHaveAllTypes({ state, dispatch }) {
    const promises = [];
    const cache = state.types;

    for ( const type in cache ) {
      if ( cache[type].haveAll ) {
        promises.push(dispatch('watchType', { type }));
      }
    }

    return Promise.all(promises);
  },

  async opened({ commit, dispatch, state }, event) {
    console.log('WebSocket Opened');
    const socket = event.currentTarget;

    this.$socket = socket;

    if ( socket.hasReconnected ) {
      console.log('Reconnect, re-watching types');
      await dispatch('watchHaveAllTypes');
    }

    // Try resending any frames that were attempted to be sent while the socket was down, once.
    if ( !process.server ) {
      for ( const obj of state.pendingSends.slice() ) {
        commit('dequeuePending', obj);
        dispatch('sendImmediate', obj);
      }
    }
  },

  closed({ commit }, event) {
    console.log('WebSocket Closed');
  },

  error({ commit }, event) {
    console.log('WebSocket Error', event);
  },

  send({ state, commit }, obj) {
    if ( state.socket ) {
      return state.socket.send(JSON.stringify(obj));
    } else if ( state.wantSocket ) {
      commit('enqueuePending', obj);
    }
  },

  sendImmediate({ state, commit }, obj) {
    if ( state.socket ) {
      return state.socket.send(JSON.stringify(obj));
    }
  },

  'ws.ping'() {
    // console.log('WebSocket Ping');
  },

  'ws.resource.start'(_, msg) {
    console.log('Resource start:', msg.resourceType);
  },

  'ws.resource.error'(_, msg) {
    console.log('Resource error for', msg.resourceType, ':', msg.data.error);
  },

  'ws.resource.stop'(_, msg) {
    console.log('Resource stop:', msg.resourceType);
  },

  'ws.resource.create'({ dispatch }, { data }) {
    // console.log('Create', data.type, data.id);
    dispatch('load', { data });
  },

  'ws.resource.change'({ dispatch }, { data }) {
    // console.log('Change', data.type, data.id);
    dispatch('load', { data });
  },

  'ws.resource.remove'({ getters, commit }, { data }) {
    const type = getters.normalizeType(data.type);

    if ( getters.hasType(type) ) {
      // console.log('Remove', data.type, data.id);
      const obj = getters.byId(data.type, data.id);

      if ( obj ) {
        commit('remove', obj);
      }
    }
  },
};

export const mutations = {
  setSocket(state, socket) {
    state.socket = socket;
  }
};
