import { normalizeType } from './normalize';
import { get } from '@/utils/object';
import Socket, {
  EVENT_CONNECTED,
  EVENT_DISCONNECTED,
  EVENT_MESSAGE,
  //  EVENT_FRAME_TIMEOUT,
  EVENT_CONNECT_ERROR
} from '@/utils/socket';

const NO_WATCHING = ['schema'];

export const actions = {
  subscribe(ctx, opt) {
    const { state, commit, dispatch } = ctx;
    let socket = state.socket;

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

    if ( socket ) {
      socket.disconnect();
    }
  },

  watchType({ dispatch, getters }, { type, revision }) {
    if ( !process.client ) {
      return;
    }

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

  async opened({ commit, dispatch }, event) {
    console.log('WebSocket Opened');
    const socket = event.currentTarget;

    this.$socket = socket;

    await dispatch('watchHaveAllTypes');
  },

  closed({ commit }, event) {
    console.log('WebSocket Closed');
  },

  error({ commit }, event) {
    console.log('WebSocket Error', event);
  },

  send({ state }, obj) {
    if ( state.socket ) {
      return state.socket.send(JSON.stringify(obj));
    } else {
      console.log('Socket is not up yet', obj);
    }
  },

  'ws.ping'() {
    console.log('WebSocket Ping');
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
    dispatch('load', data);
  },

  'ws.resource.change'({ dispatch }, { data }) {
    // console.log('Change', data.type, data.id);
    dispatch('load', data);
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
