import { isArray } from '@shell/utils/array';
import { BY_TYPE } from '@shell/plugins/dashboard-store/classify';
import { lookup } from '@shell/plugins/dashboard-store/model-loader';
import { NAMESPACE, SCHEMA, COUNT, UI } from '@shell/config/types';

import SteveModel from './steve-class';
import HybridModel, { cleanHybridResources } from './hybrid-class';
import NormanModel from './norman-class';
import { urlFor } from '@shell/plugins/dashboard-store/getters';
import { normalizeType } from '@shell/plugins/dashboard-store/normalize';
import pAndNFiltering from '@shell/utils/projectAndNamespaceFiltering.utils';
import { parse } from '@shell/utils/url';

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
    const parsedUrl = parse(url);
    const isSteve = parsedUrl.path.startsWith('/v1');

    // Filter
    // Steve's filter options work differently nowadays (https://github.com/rancher/steve#filter) #9341
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

    // `opt.namespaced` is either
    // - a string representing a single namespace - add restriction to the url
    // - an array of namespaces or projects - add restriction as a param
    const namespaceProjectFilter = pAndNFiltering.checkAndCreateParam(opt);

    if (namespaceProjectFilter) {
      url += `${ (url.includes('?') ? '&' : '?') + namespaceProjectFilter }`;
    }
    // End: Filter

    // Exclude
    // excludeFields should be an array of strings representing the paths of the fields to exclude
    // only works on Steve but is ignored without error by Norman
    if (isSteve) {
      if (Array.isArray(opt?.excludeFields)) {
        opt.excludeFields = [...opt.excludeFields, 'metadata.managedFields'];
      } else {
        opt.excludeFields = ['metadata.managedFields'];
      }
      const excludeParamsString = opt.excludeFields.map((field) => `exclude=${ field }`).join('&');

      url += `${ url.includes('?') ? '&' : '?' }${ excludeParamsString }`;
    }
    // End: Exclude

    // Limit
    const limit = opt.limit;

    if ( limit ) {
      url += `${ url.includes('?') ? '&' : '?' }limit=${ limit }`;
    }
    // End: Limit

    // Sort
    // Steve's sort options work differently nowadays (https://github.com/rancher/steve#sort) #9341
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

    // `namespaced` is either
    // - a string representing a single namespace - add restriction to the url
    // - an array of namespaces or projects - add restriction as a param
    if (opt?.namespaced && !pAndNFiltering.isApplicable(opt)) {
      const parts = url.split('/');

      url = `${ parts.join('/') }/${ opt.namespaced }`;
    }

    return url;
  },

  defaultModel: (state) => (obj) => {
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
    /**
   * Resource counts are contained within a single 'count' resource with a 'counts' field that is a map of resource types
   * When counts are updated through the websocket, only the resources that changed are sent so we can't load the new 'count' resource into the store as we would another resource
   */
    if (data?.type === COUNT && existing) {
      data.counts = { ...existing.counts, ...data.counts };

      return data;
    }

    // If the existing model has a cleanResource method, use it
    if (existing?.cleanResource && typeof existing.cleanResource === 'function') {
      return existing.cleanResource(data);
    }

    const typeSuperClass = Object.getPrototypeOf(Object.getPrototypeOf(existing))?.constructor;

    return typeSuperClass === HybridModel ? cleanHybridResources(data) : data;
  },

  // Return all the pods for a given namespace
  podsByNamespace: (state) => (namespace) => {
    const map = state.podsByNamespace[namespace];

    return map?.list || [];
  },

  gcIgnoreTypes: () => {
    return GC_IGNORE_TYPES;
  },

  currentGeneration: (state) => (type) => {
    type = normalizeType(type);

    const cache = state.types[type];

    if ( !cache ) {
      return null;
    }

    return cache.generation;
  },

};
