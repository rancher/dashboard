import https from 'https';
import { addParam } from '@/utils/url';
import { handleSpoofedRequest } from '@/plugins/core-store/actions';
import { set } from '@/utils/object';

export default {
  async request({ dispatch, rootGetters }, pOpt ) {
    const opt = pOpt.opt || pOpt;

    const spoofedRes = await handleSpoofedRequest(rootGetters, 'cluster', opt);

    if (spoofedRes) {
      return spoofedRes;
    }

    // @TODO queue/defer duplicate requests
    opt.depaginate = opt.depaginate !== false;
    opt.url = opt.url.replace(/\/*$/g, '');

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

      if ( opt.responseType ) {
        return res;
      } else {
        return responseObject(res);
      }
    }).catch((err) => {
      if ( !err || !err.response ) {
        return Promise.reject(err);
      }

      const res = err.response;

      // Go to the logout page for 401s, unless redirectUnauthorized specifically disables (for the login page)
      if ( opt.redirectUnauthorized !== false && process.client && res.status === 401 ) {
        dispatch('auth/logout', opt.logoutOnError, { root: true });
      }

      if ( typeof res.data !== 'undefined' ) {
        return Promise.reject(responseObject(res));
      }

      return Promise.reject(err);
    });

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
