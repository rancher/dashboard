import { normalizeType } from './normalize';

const NO_WATCHING = ['schema'];

export default {
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

    return dispatch('ws.send', { resourceType: type, revision });
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

  async 'ws.open'({ commit, dispatch }, event) {
    commit('updateSocket', { status: 'connected', count: 0 });
    console.log('WebSocket Opened');
    const socket = event.currentTarget;

    this.$socket = socket;

    await dispatch('watchHaveAllTypes');
  },

  'ws.close'({ commit }, event) {
    commit('updateSocket', { status: 'disconnected', count: 0 });
    console.log('WebSocket Closed');
  },

  'ws.error'({ commit }, event) {
    commit('updateSocket', { status: 'error' });
    console.log('WebSocket Error');
  },

  'ws.reconnect'({ commit }, count) {
    commit('updateSocket', { status: 'disconnected', count });
    console.log(`WebSocket Reconnect Attempt #${ count }`);
  },

  'ws.reconnect-error'({ commit }) {
    commit('updateSocket', { status: 'failed' });
    console.error('WebSocket Reconnect Failed');
  },

  async 'ws.send'(ctx, obj) {
    if ( this.$socket ) {
      await this.$socket.send(JSON.stringify(obj));
    } else {
      console.log('Socket is not up yet');
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

  'ws.resource.create'({ getters, commit }, { data }) {
    const type = getters.normalizeType(data.type);

    if ( !getters.hasType(type) ) {
      commit('registerType', type);
    }

    console.log('Load', data.type, data.id);
    commit('load', data);
  },

  'ws.resource.change'({ getters, commit }, { data }) {
    const type = getters.normalizeType(data.type);

    if ( !getters.hasType(type) ) {
      commit('registerType', type);
    }

    console.log('Load', data.type, data.id);
    commit('load', data);
  },

  'ws.resource.remove'({ getters, commit }, { data }) {
    const type = getters.normalizeType(data.type);

    if ( getters.hasType(type) ) {
      commit('remove', { type, id: data.id });
    }
  },
};
