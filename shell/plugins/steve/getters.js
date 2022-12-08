import { isArray } from '@shell/utils/array';
import { BY_TYPE } from '@shell/plugins/dashboard-store/classify';
import { lookup } from '@shell/plugins/dashboard-store/model-loader';
import { NAMESPACE, SCHEMA, COUNT, UI } from '@shell/config/types';

import SteveModel from './steve-class';
import HybridModel, { cleanHybridResources } from './hybrid-class';
import NormanModel from './norman-class';
import { urlFor } from '@shell/plugins/dashboard-store/getters';

export const STEVE_MODEL_TYPES = {
  NORMAN:  'norman',
  STEVE:   'steve',
  BY_TYPE: 'byType'
};

const GC_IGNORE_TYPES = {
  [COUNT]:       true,
  [NAMESPACE]:   true,
  [SCHEMA]:      true,
  [UI.NAV_LINK]: true,
};

export default {
  urlOptions: () => (url, opt) => {
    opt = opt || {};

    // Filter
    if ( opt.filter ) {
      const keys = Object.keys(opt.filter);

      keys.forEach((key) => {
        let vals = opt.filter[key];

        if ( !isArray(vals) ) {
          vals = [vals];
        }

        vals.forEach((val) => {
          url += `${ (url.includes('?') ? '&' : '?') + encodeURIComponent(key) }=${ encodeURIComponent(val) }`;
        });
      });
    }
    // End: Filter

    // Limit
    const limit = opt.limit;

    if ( limit ) {
      url += `${ url.includes('?') ? '&' : '?' }limit=${ limit }`;
    }
    // End: Limit

    // Sort
    const sortBy = opt.sortBy;

    if ( sortBy ) {
      url += `${ url.includes('?') ? '&' : '?' }sort=${ encodeURIComponent(sortBy) }`;
    }

    const orderBy = opt.sortOrder;

    if ( orderBy ) {
      url += `${ url.includes('?') ? '&' : '?' }order=${ encodeURIComponent(orderBy) }`;
    }
    // End: Sort

    return url;
  },

  urlFor: (state, getters) => (type, id, opt) => {
    let url = urlFor(state, getters)(type, id, opt);

    if (opt.namespaced) {
      const parts = url.split('/');

      url = `${ parts.join('/') }/${ opt.namespaced }`;

      return url;
    }

    return url;
  },

  defaultModel: state => (obj) => {
    const which = state.config.modelBaseClass || STEVE_MODEL_TYPES.BY_TYPE.STEVE;

    if ( which === STEVE_MODEL_TYPES.BY_TYPE ) {
      if ( obj?.type?.startsWith('management.cattle.io.') || obj?.type?.startsWith('project.cattle.io.')) {
        return HybridModel;
      } else {
        return SteveModel;
      }
    } else if ( which === STEVE_MODEL_TYPES.NORMAN ) {
      return NormanModel;
    } else {
      return SteveModel;
    }
  },

  classify: (state, getters, rootState) => (obj) => {
    const customModel = lookup(state.config.namespace, obj?.type, obj?.metadata?.name, rootState);

    if (customModel) {
      return customModel;
    }

    const which = state.config.modelBaseClass || BY_TYPE;

    if ( which === BY_TYPE ) {
      if ( obj?.type?.startsWith('management.cattle.io.') || obj?.type?.startsWith('project.cattle.io.')) {
        return HybridModel;
      } else {
        return SteveModel;
      }
    } else if ( which === STEVE_MODEL_TYPES.NORMAN ) {
      return NormanModel;
    } else {
      return SteveModel;
    }
  },

  cleanResource: () => (existing, data) => {
    const typeSuperClass = Object.getPrototypeOf(Object.getPrototypeOf(existing))?.constructor;

    return typeSuperClass === HybridModel ? cleanHybridResources(data) : data;
  },

  // Return all the pods for a given namespace
  podsByNamespace: state => (namespace) => {
    const map = state.podsByNamespace[namespace];

    return map?.list || [];
  },

  gcIgnoreTypes: () => {
    return GC_IGNORE_TYPES;
  }

};
