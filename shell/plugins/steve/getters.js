
import { BY_TYPE } from '@shell/plugins/dashboard-store/classify';
import { lookup } from '@shell/plugins/dashboard-store/model-loader';
import { NAMESPACE, SCHEMA, COUNT, UI } from '@shell/config/types';

import SteveModel from './steve-class';
import HybridModel, { cleanHybridResources } from './hybrid-class';
import NormanModel from './norman-class';
import { normalizeType } from '@shell/plugins/dashboard-store/normalize';
import { steveUrlOptions } from './getters.utils';
import { urlFor } from '@shell/plugins/dashboard-store/getters.utils';

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
  urlOptions: () => steveUrlOptions,

  urlFor: (state, getters) => (type, id, opt) => {
    const url = urlFor({
      normalizeType: getters.normalizeType, schemaFor: getters.schemaFor, baseUrl: state.config.baseUrl
    }, {
      type, namespace: opt.namespaced, id, opt
    });

    return getters.urlOptions(url, opt);
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
  podsByNamespace: state => (namespace) => {
    const map = state.podsByNamespace[namespace];

    return map?.list || [];
  },

  gcIgnoreTypes: () => {
    return GC_IGNORE_TYPES;
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
