import https from 'https';
import { addParam } from '@/utils/url';
import { handleSpoofedRequest } from '@/plugins/core-store/actions';
import { set } from '@/utils/object';
import { deferred } from '@/utils/promise';

export default {
  async request({ state, dispatch, rootGetters }, pOpt ) {
    const opt = pOpt.opt || pOpt;

    const spoofedRes = await handleSpoofedRequest(rootGetters, 'cluster', opt);

    if (spoofedRes) {
      return spoofedRes;
    }

    opt.depaginate = opt.depaginate !== false;
    opt.url = opt.url.replace(/\/*$/g, '');

    const method = (opt.method || 'get').toLowerCase();
    const key = JSON.stringify(opt.headers || {}) + method + opt.url;
    let waiting;

    if ( (method === 'get') ) {
      waiting = state.deferredRequests[key];

      if ( waiting ) {
        const later = deferred();

        waiting.push(later);

        // console.log('Deferred request for', key, waiting.length);

        return later.promise;
      } else {
        // Set it to something so that future requests know to defer.
        waiting = [];
        state.deferredRequests[key] = waiting;
      }
    }

    opt.httpsAgent = new https.Agent({ rejectUnauthorized: false });

    return this.$axios(opt).then((res) => {
      if ( opt.depaginate ) {
        // @TODO but API never sends it
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

      let out;

      if ( opt.responseType ) {
        out = res;
      } else {
        out = responseObject(res);
      }

      finishDeferred(key, out, 'resolve');

      return out;
    }).catch((err) => {
      let out = err;

      if ( err?.response ) {
        const res = err.response;

        // Go to the logout page for 401s, unless redirectUnauthorized specifically disables (for the login page)
        if ( opt.redirectUnauthorized !== false && process.client && res.status === 401 ) {
          dispatch('auth/logout', opt.logoutOnError, { root: true });
        }

        if ( typeof res.data !== 'undefined' ) {
          out = responseObject(res);
        }
      }

      finishDeferred(key, out, 'reject');

      return Promise.reject(out);
    });

    function finishDeferred(key, res, action = 'resolve') {
      const waiting = state.deferredRequests[key] || [];

      // console.log('Resolving deferred for', key, waiting.length);

      while ( waiting.length ) {
        waiting.pop()[action](res);
      }

      delete state.deferredRequests[key];
    }

    function responseObject(res) {
      let out = res.data;

      const fromHeader = res.headers['x-api-cattle-auth'];

      if ( fromHeader && fromHeader !== rootGetters['auth/fromHeader'] ) {
        dispatch('auth/gotHeader', fromHeader, { root: true });
      }

      if ( res.status === 204 || out === null ) {
        out = {};
      }

      if ( typeof out !== 'object' ) {
        out = { data: out };
      }

      Object.defineProperties(out, {
        _status:     { value: res.status },
        _statusText: { value: res.statusText },
        _headers:    { value: res.headers },
        _req:        { value: res.request },
        _url:        { value: opt.url },
      });

      return out;
    }
  },

  promptMove({ commit, state }, resources) {
    commit('action-menu/togglePromptMove', resources, { root: true });
  },

  promptRestore({ commit, state }, resources ) {
    commit('action-menu/togglePromptRestore', resources, { root: true });
  },

  assignTo({ commit, state }, resources = []) {
    commit('action-menu/toggleAssignTo', resources, { root: true });
  },

  async resourceAction({ getters, dispatch }, {
    resource, actionName, body, opt,
  }) {
    opt = opt || {};

    if ( !opt.url ) {
      opt.url = resource.actionLinkFor(actionName);
      // opt.url = (resource.actions || resource.actionLinks)[actionName];
    }

    opt.method = 'post';
    opt.data = body;

    const res = await dispatch('request', { opt });

    if ( opt.load !== false && res.type === 'collection' ) {
      await dispatch('loadMulti', res.data);

      return res.data.map(x => getters.byId(x.type, x.id) || x);
    } else if ( opt.load !== false && res.type && res.id ) {
      return dispatch('load', { data: res });
    } else {
      return res;
    }
  },

  promptUpdate({ commit, state }, resources = []) {
    commit('action-menu/togglePromptUpdate', resources, { root: true });
  },

  async collectionAction({ getters, dispatch }, {
    type, actionName, body, opt
  }) {
    opt = opt || {};

    if ( !opt.url ) {
      // Cheating, but cheaper than loading the whole collection...
      const schema = getters['schemaFor'](type);

      opt.url = addParam(schema.links.collection, 'action', actionName);
    }

    opt.method = 'post';
    opt.data = body;

    const res = await dispatch('request', { opt });

    if ( opt.load !== false && res.type === 'collection' ) {
      await dispatch('loadMulti', res.data);

      return res.data.map(x => getters.byId(x.type, x.id) || x);
    } else if ( opt.load !== false && res.type && res.id ) {
      return dispatch('load', { data: res });
    } else {
      return res;
    }
  },

  cleanForNew(ctx, obj) {
    delete obj.id;
    delete obj.actions;
    delete obj.links;
    delete obj.status;

    if ( obj.metadata ) {
      const m = obj.metadata;

      m.name = '';
      delete m.uid;
      delete m.ownerReferences;
      delete m.generation;
      delete m.resourceVersion;
      delete m.selfLink;
      delete m.creationTimestamp;
      delete m.deletionTimestamp;
      delete m.state;
      dropKeys(m.annotations);
      dropKeys(m.labels);
    }

    if ( obj?.spec?.crd?.spec?.names?.kind ) {
      obj.spec.crd.spec.names.kind = '';
    }

    return obj;
  },

  cleanForDetail(ctx, resource) {
    // Ensure labels & annotations exists, since lots of things need them
    if ( !resource.metadata ) {
      set(resource, 'metadata', {});
    }

    if ( !resource.metadata.annotations ) {
      set(resource, 'metadata.annotations', {});
    }

    if ( !resource.metadata.labels ) {
      set(resource, 'metadata.labels', {});
    }

    return resource;
  },
};

function dropKeys(obj) {
  Object.keys(obj || {}).forEach((key) => {
    if ( !!key.match(/(^|field\.)cattle\.io(\/.*|$)/) ) {
      delete obj[key];
    }
  });
}
