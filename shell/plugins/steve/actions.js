import https from 'https';
import { addParam, parse as parseUrl, stringify as unParseUrl } from '@shell/utils/url';
import { handleSpoofedRequest, loadSchemas } from '@shell/plugins/dashboard-store/actions';
import { dropKeys, set } from '@shell/utils/object';
import { deferred } from '@shell/utils/promise';
import { streamJson, streamingSupported } from '@shell/utils/stream';
import isObject from 'lodash/isObject';
import { classify } from '@shell/plugins/dashboard-store/classify';
import { NAMESPACE } from '@shell/config/types';
import { handleKubeApiHeaderWarnings } from '@shell/plugins/steve/header-warnings';
import { steveCleanForDownload } from '@shell/plugins/steve/resource-utils';
import paginationUtils from '@shell/utils/pagination-utils';

export default {

  // Need to override this, so that the 'this' context is correct (this class not the base class)
  async loadSchemas(ctx, watch = true) {
    return await loadSchemas(ctx, watch);
  },

  async request({
    state, dispatch, rootGetters, getters
  }, pOpt ) {
    const opt = pOpt.opt || pOpt;
    const spoofedRes = await handleSpoofedRequest(rootGetters, 'cluster', opt);

    if (spoofedRes) {
      return spoofedRes;
    }

    opt.url = opt.url.replace(/\/*$/g, '');

    // FIXME: RC Standalone - Tech Debt move this to steve store get/set prependPath
    // Cover cases where the steve store isn't actually going out to steve (epinio standalone)
    const prependPath = this.$config.rancherEnv === 'epinio' ? `/pp/v1/epinio/rancher` : '';

    if (prependPath) {
      if (opt.url.startsWith('/')) {
        opt.url = prependPath + opt.url;
      } else {
        const url = parseUrl(opt.url);

        if (!url.path.startsWith(prependPath)) {
          url.path = prependPath + url.path;
          opt.url = unParseUrl(url);
        }
      }
    }

    opt.httpsAgent = new https.Agent({ rejectUnauthorized: false });

    const method = (opt.method || 'get').toLowerCase();
    const headers = (opt.headers || {});
    const key = JSON.stringify(headers) + method + opt.url;
    let waiting;

    if ( (method === 'get') ) {
      waiting = state.deferredRequests[key];

      if ( waiting ) {
        // A matching request has already been made and is currently waiting to complete
        // Avoid making another request, just wait for the original one to complete
        // and return the result of the first call (see `waiting` being processed far below)
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

    if ( opt.stream && state.allowStreaming && state.config.supportsStream && streamingSupported() ) {
      // console.log('Using Streaming for', opt.url);

      return streamJson(opt.url, opt, opt.onData).then(() => {
        return { finishDeferred: finishDeferred.bind(null, key, 'resolve') };
      }).catch((err) => {
        return onError(err);
      });
    } else {
      // console.log('NOT Using Streaming for', opt.url);
    }

    let paginatedResult;
    const isSteveCacheUrl = getters.isSteveCacheUrl(opt.url);

    while (true) {
      try {
        const out = await makeRequest(this, opt, rootGetters);

        if (!opt.depaginate) {
          return out;
        }

        if (!paginatedResult) {
          const pageByNumber = isSteveCacheUrl && opt.url.includes(`pagesize=${ paginationUtils.defaultPageSize }`) ? {
            total: out.count,
            page:  1,
            url:   opt.url,
          } : null;
          const pageByLimit = !pageByNumber ? { } : null;

          paginatedResult = {
            // initialise some settings
            pageByLimit,
            pageByNumber,
            // First result, so store it
            out
          };
        } else {
          // Subsequent request, so add to it
          paginatedResult.out.data = paginatedResult.out.data.concat(out.data);
        }

        const { total, page, url } = paginatedResult.pageByNumber || {};

        if (paginatedResult.pageByLimit && out?.pagination?.next) {
          opt.url = out?.pagination?.next;
        } else if (paginatedResult.pageByNumber && (total > paginationUtils.defaultPageSize * page)) {
          paginatedResult.pageByNumber.page += 1;

          opt.url = addParam(url, 'page', `${ paginatedResult.pageByNumber.page }`);
        } else {
          // No more results, so clear out the pagination section (which will be stale from the first request)
          delete paginatedResult.out.pagination?.first;
          delete paginatedResult.out.pagination?.last;
          delete paginatedResult.out.pagination?.next;
          delete paginatedResult.out.pagination?.partial;
          delete paginatedResult.out.continue;

          return paginatedResult.out;
        }
      } catch (err) {
        return onError(err);
      }
    }

    function makeRequest(that, opt, rootGetters) {
      return that.$axios(opt).then((res) => {
        let out;

        if ( opt.responseType ) {
          out = res;
        } else {
          out = responseObject(res);
        }

        finishDeferred(key, 'resolve', out);

        handleKubeApiHeaderWarnings(res, dispatch, rootGetters, opt.method);

        return out;
      });
    }

    function finishDeferred(key, action = 'resolve', res) {
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

    function onError(err) {
      let out = err;

      if ( err?.response ) {
        const res = err.response;

        // Go to the logout page for 401s, unless redirectUnauthorized specifically disables (for the login page)
        if ( opt.redirectUnauthorized !== false && res.status === 401 ) {
          dispatch('auth/logout', opt.logoutOnError, { root: true });
        }

        if ( typeof res.data !== 'undefined' ) {
          out = responseObject(res);
        }
      }

      finishDeferred(key, 'reject', out);

      return Promise.reject(out);
    }
  },

  promptRestore({ commit, state }, resources ) {
    commit('action-menu/togglePromptRestore', resources, { root: true });
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

      return res.data.map((x) => getters.byId(x.type, x.id) || x);
    } else if ( opt.load !== false && res.type && res.id ) {
      return dispatch('load', { data: res });
    } else {
      return res;
    }
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

      return res.data.map((x) => getters.byId(x.type, x.id) || x);
    } else if ( opt.load !== false && res.type && res.id ) {
      return dispatch('load', { data: res });
    } else {
      return res;
    }
  },

  createNamespace(ctx, obj) {
    return classify(ctx, {
      type:     NAMESPACE,
      metadata: { name: obj.name }
    });
  },

  cleanForNew(ctx, obj) {
    const m = obj.metadata || {};

    dropKeys(obj, newRootKeys);
    dropKeys(m, newMetadataKeys);
    dropCattleKeys(m.annotations);
    dropCattleKeys(m.labels);

    m.name = '';

    if ( obj?.spec?.crd?.spec?.names?.kind ) {
      obj.spec.crd.spec.names.kind = '';
    }

    return obj;
  },

  cleanForDiff(ctx, obj) {
    const m = obj.metadata || {};

    if ( !m.labels ) {
      m.labels = {};
    }

    if ( !m.annotations ) {
      m.annotations = {};
    }

    dropUnderscores(obj);
    dropKeys(obj, diffRootKeys);
    dropKeys(m, diffMetadataKeys);
    dropCattleKeys(m.annotations);
    dropCattleKeys(m.labels);

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

  // remove fields added by steve before showing/downloading yamls
  cleanForDownload(ctx, yaml) {
    return steveCleanForDownload(yaml);
  }
};

const diffRootKeys = [
  'actions', 'links', 'status', '__rehydrate', '__clone'
];

const diffMetadataKeys = [
  'ownerReferences',
  'selfLink',
  'creationTimestamp',
  'deletionTimestamp',
  'state',
  'fields',
  'relationships',
  'generation',
  'managedFields',
  'resourceVersion',
];

const newRootKeys = [
  'actions', 'links', 'status', 'id'
];

const newMetadataKeys = [
  ...diffMetadataKeys,
  'uid',
];

function dropUnderscores(obj) {
  for ( const k in obj ) {
    if ( k.startsWith('__') ) {
      delete obj[k];
    } else {
      const v = obj[k];

      if ( isObject(v) ) {
        dropUnderscores(v);
      }
    }
  }
}

function dropCattleKeys(obj) {
  if ( !obj ) {
    return;
  }

  Object.keys(obj).forEach((key) => {
    if ( !!key.match(/(^|field\.)cattle\.io(\/.*|$)/) ) {
      delete obj[key];
    }
  });
}
