import Vue from 'vue';
import urlOptions from './urloptions';
import { clear, addObject, addObjects, removeObject } from '@/utils/array';
import { sortableNumericSuffix } from '@/utils/sort';
import { COUNT, SCHEMA } from '@/utils/types';

const KEY_FIELD_FOR = {
  [SCHEMA]:  '_id',
  default:  'id',
};

export const Norman = {
  namespaced: true,

  state() {
    return {
      config: { baseUrl: '/v1' },
      types:   {},
      socket:    {
        status: 'disconnected',
        count:  0,
      }
    };
  },

  getters: {
    all: (state, getters) => (type) => {
      type = getters.normalizeType(type);

      if ( getters.hasType(type) ) {
        return state.types[type].list;
      } else {
        throw new Error(`All of ${ type } is not loaded`);
      }
    },

    byId: (state, getters) => (type, id) => {
      type = getters.normalizeType(type);
      const entry = state.types[type];

      if ( entry ) {
        return entry.map.get(id);
      }
    },

    schemaName: (state, getters) => (type) => {
      type = getters.normalizeType(type);
      const schemas = state.types[SCHEMA];
      const keyField = KEY_FIELD_FOR[SCHEMA] || KEY_FIELD_FOR['default'];
      const entry = schemas.list.find((x) => {
        const thisOne = getters.normalizeType(x[keyField]);

        return thisOne === type || thisOne.endsWith(`.${ type }`);
      });

      if ( entry ) {
        return entry[keyField];
      }
    },

    // Fuzzy is only for plugins/lookup, do not use in real code
    schemaFor: (state, getters) => (type, fuzzy = false) => {
      const schemas = state.types[SCHEMA];

      type = normalizeType(type);

      if ( !schemas ) {
        throw new Error("Schemas aren't loaded yet");
      }

      const out = schemas.map.get(type);

      if ( !out && fuzzy ) {
        const close = getters.schemaName(type);

        if ( close ) {
          return getters.schemaFor(close);
        }
      }

      return out;
    },

    hasType: (state, getters) => (type) => {
      type = getters.normalizeType(type);

      return !!state.types[type];
    },

    haveAll: (state, getters) => (type) => {
      type = getters.normalizeType(type);
      const entry = state.types[type];

      if ( entry ) {
        return entry.haveAll;
      }

      return false;
    },

    normalizeType: () => (type) => {
      return normalizeType(type);
    },

    urlFor: (state, getters) => (type, id, opt) => {
      opt = opt || {};
      type = getters.normalizeType(type);

      let url = opt.url;

      if ( !url ) {
        const schema = getters.schemaFor(type);

        if ( !schema ) {
          throw new Error(`Unknown schema for type: ${ type }`);
        }

        url = schema.links.collection;
        if ( id ) {
          url += `/${ id }`;
        }
      }

      if ( !url.startsWith('/') && !url.startsWith('http') ) {
        const baseUrl = state.config.baseUrl.replace(/\/$/, '');

        url = `${ baseUrl }/${ url }`;
      }

      url = urlOptions(url, opt);

      return url;
    },

    counts(state, getters) {
      const obj = getters['all'](COUNT)[0].counts;
      const out = Object.keys(obj).map((id) => {
        const schema = getters['schemaFor'](id);

        if ( !schema ) {
          console.log('Unknown schema, id');

          return null;
        }

        const attrs = schema.attributes || {};
        const entry = obj[id];

        return {
          id,
          label:       attrs.kind,
          group:       attrs.group,
          version:     attrs.version,
          namespaced:  attrs.namespaced,
          verbs:       attrs.verbs,
          count:       entry.count,
          byNamespace: entry.namespaces,
          revision:    entry.revision
        };
      });

      return out.filter(x => !!x);
    },
  },

  mutations: {
    updateSocket(state, obj) {
      state.socket.status = obj.status;
      state.socket.count = obj.count || 0;
    },

    rehydrateProxies(state) {
      if ( !process.client ) {
        return;
      }

      Object.keys(state.types).forEach((type) => {
        const keyField = KEY_FIELD_FOR[type] || KEY_FIELD_FOR['default'];
        const cache = state.types[type];
        const map = new Map();

        for ( let i = 0 ; i < cache.list.length ; i++ ) {
          const proxy = proxyFor(cache.list[i]);

          cache.list[i] = proxy;
          map.set(proxy[keyField], proxy);
        }

        Vue.set(cache, 'map', map);
        Vue.set(state.types, type, state.types[type]);
      });
    },

    applyConfig(state, config) {
      if ( !state.config ) {
        state.config = {};
      }

      Object.assign(state.config, config);
    },

    registerType(state, type) {
      if ( !state.types[type] ) {
        const obj = {
          list:    [],
          haveAll:   false,
        };

        // Not enumerable so they don't get sent back to the client for SSR
        Object.defineProperty(obj, 'map', { value: new Map() });

        state.types[type] = obj;
      }
    },

    loadAll(state, { type, data }) {
      const cache = state.types[type];
      const keyField = KEY_FIELD_FOR[type] || KEY_FIELD_FOR['default'];

      clear(cache.list);
      cache.map.clear();

      const proxies = data.map(x => proxyFor(x));

      addObjects(cache.list, proxies);

      for ( let i = 0 ; i < data.length ; i++ ) {
        cache.map.set(data[i][keyField], proxies[i]);
      }

      cache.haveAll = true;
    },

    load(state, resource) {
      const type = normalizeType(resource.type);
      const keyField = KEY_FIELD_FOR[type] || KEY_FIELD_FOR['default'];
      const id = resource[keyField];
      const cache = state.types[type];
      const entry = cache.map.get(id);

      if ( entry ) {
        Object.assign(entry, resource);
      } else {
        const proxy = proxyFor(resource);

        addObject(cache.list, proxy);
        cache.map.set(id, proxy);
      }
    },

    remove(state, { type, id }) {
      type = normalizeType(type);
      const entry = state.types[type];

      if ( !entry ) {
        return;
      }

      const obj = entry.map.get(id);

      if ( obj ) {
        removeObject(entry.list, obj);
        entry.map.delete(id);
      }
    }
  },

  actions: {
    request({ dispatch }, opt) {
      // @TODO queue/defer duplicate requests

      opt.depaginate = opt.depaginate !== false;

      return this.$axios(opt).then((res) => {
        const out = res.data;

        if ( res.status === 204 ) {
          return;
        }

        if ( !out ) {
          console.log('-------------------');
          console.log('OPT', opt);
          console.log('RES', res);
          console.log('-------------------');
        }

        if ( opt.depaginate ) {
          // @TODO
          /*
          return new Promise((resolve, reject) => {
            const next = res.pagination.next;
            if (!next ) [
              return resolve();
            }

            dispatch('request')
          });
          */
        }

        Object.defineProperties(out, {
          _status:     { value: res.status },
          _statusText: { value: res.statusText },
          _headers:    { value: res.headers },
          _req:        { value: res.request },
        });

        return out;
      });
    },

    async loadSchemas({
      getters, dispatch, commit, state
    }) {
      const res = await dispatch('findAll', { type: SCHEMA, opt: { url: '/v1/schemas', load: false } });

      res.forEach((schema) => {
        schema._id = normalizeType(schema.id);

        // @TODO
        // const links = schema.links;
        // for ( const k in links ) {
        //  links[k] = links[k].replace('http://localhost:8989', 'https://localhost:8005');
        // }
      });

      commit('registerType', SCHEMA);
      commit('loadAll', { type: SCHEMA, data: res });

      const all = getters.all(SCHEMA);

      return all;
    },

    async findAll({ getters, commit, dispatch }, { type, opt }) {
      console.log('Find All', type);
      type = getters.normalizeType(type);

      if ( getters['haveAll'](type) ) {
        return getters['all'](type);
      }

      opt = opt || {};
      opt.url = getters.urlFor(type, null, opt);

      const res = await dispatch('request', opt);

      if ( opt.load === false ) {
        return res.data;
      }

      if ( !getters.hasType(type) ) {
        commit('registerType', type);
      }

      commit('loadAll', { type, data: res.data });
      dispatch('watchType', { type });

      const all = getters.all(type);

      return all;
    },

    // opt:
    //  filter: Filter by fields, e.g. {field: value, anotherField: anotherValue} (default: none)
    //  limit: Number of reqords to return per page (default: 1000)
    //  sortBy: Sort by field
    //  sortOrder: asc or desc
    //  url: Use this specific URL instead of looking up the URL for the type/id.  This should only be used for bootstraping schemas on startup.
    //  @TODO depaginate: If the response is paginated, retrieve all the pages. (default: true)
    async find({ getters, commit, dispatch }, { type, id, opt }) {
      const existing = getters.byId(type, id);

      type = normalizeType(type);

      if ( existing ) {
        return existing;
      }

      opt = opt || {};
      opt.url = getters.urlFor(type, id, opt);

      console.log('Request', opt);
      const res = await dispatch('request', opt);

      if ( !getters.hasType(type) ) {
        commit('registerType', type);
      }

      const neu = commit('load', res.data );

      return neu;
    },

    watchType({ dispatch }, { type }) {
      return dispatch('ws.send', { resourceType: type });
    },

    watchHaveAllTypes({ state, dispatch }) {
      const promises = [];
      const cache = state.types;
      const keys = Object.keys(state.types);
      const ignore = ['schema'];

      keys.forEach((type) => {
        if ( ignore.includes(type) ) {
          return;
        }

        if ( cache[type].haveAll ) {
          promises.push(dispatch('ws.send', { resourceType: type }));
        }
      });

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
  },
};

export default (config = {}) => {
  const namespace = config.namespace || '';
  // const preserveState = config.preserveState !== false;

  return function(store) {
    store.registerModule(namespace, Norman);
    store.commit(`${ namespace }/applyConfig`, config);
  };
};

function normalizeType(type) {
  type = (type || '').toLowerCase();

  return type;
}

function proxyFor(obj) {
  return new Proxy(obj, {
    get(target, name) {
      if (name === 'displayName') {
        return target.metadata.name || target.id;
      } else if ( name === 'sortName' ) {
        return sortableNumericSuffix(target.metadata.name || target.id).toLowerCase();
      } else if ( name === 'toString' ) {
        return function() {
          return `${ obj.type }:${ obj.id }`;
        };
      }

      return target[name];
    },

    apply(target, thisArg, argumentsList) {

    }
  });
}
