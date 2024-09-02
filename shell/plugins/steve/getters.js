import { isArray } from '@shell/utils/array';
import { BY_TYPE } from '@shell/plugins/dashboard-store/classify';
import { lookup } from '@shell/plugins/dashboard-store/model-loader';
import { NAMESPACE, SCHEMA, COUNT, UI } from '@shell/config/types';

import SteveModel from './steve-class';
import HybridModel, { cleanHybridResources } from './hybrid-class';
import NormanModel from './norman-class';
import { urlFor } from '@shell/plugins/dashboard-store/getters';
import { normalizeType } from '@shell/plugins/dashboard-store/normalize';
import pAndNFiltering from '@shell/plugins/steve/projectAndNamespaceFiltering.utils';
import stevePaginationUtils from '@shell/plugins/steve/steve-pagination-utils';
import { parse } from '@shell/utils/url';
import { splitObjectPath } from '@shell/utils/string';
import { parseType } from '@shell/models/schema';
import {
  STEVE_AGE_COL,
  STEVE_ID_COL, STEVE_LIST_GROUPS, STEVE_NAMESPACE_COL, STEVE_STATE_COL
} from '@shell/config/pagination-table-headers';
import { createHeaders } from '@shell/store/type-map.utils';

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

// Include calls to /v1 AND /k8s/clusters/<cluster id>/v1
const steveRegEx = new RegExp('(/v1)|(\/k8s\/clusters\/[a-z0-9-]+\/v1)');

export default {
  urlOptions: () => (url, opt, schema) => {
    opt = opt || {};
    const parsedUrl = parse(url);
    const isSteve = steveRegEx.test(parsedUrl.path);

    const stevePagination = stevePaginationUtils.createParamsForPagination(schema, opt);

    if (stevePagination) {
      url += `${ (url.includes('?') ? '&' : '?') + stevePagination }`;
    } else {
      // labelSelector
      if ( opt.labelSelector ) {
        url += `${ url.includes('?') ? '&' : '?' }labelSelector=${ opt.labelSelector }`;
      }
      // End: labelSelector

      // Filter
      if ( opt.filter ) {
        url += `${ (url.includes('?') ? '&' : '?') }`;
        const keys = Object.keys(opt.filter);

        keys.forEach((key) => {
          let vals = opt.filter[key];

          if ( !isArray(vals) ) {
            vals = [vals];
          }

          // Steve's filter options now support more complex filtering not yet implemented here #9341
          if (isSteve) {
            url += `${ (url.includes('filter=') ? '&' : 'filter=') }`;
          }

          const filterStrings = vals.map((val) => {
            return `${ encodeURI(key) }=${ encodeURI(val) }`;
          });
          const urlEnding = url.charAt(url.length - 1);
          const nextStringConnector = ['&', '?', '='].includes(urlEnding) ? '' : '&';

          url += `${ nextStringConnector }${ filterStrings.join('&') }`;
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

      // Limit
      const limit = opt.limit;

      if ( limit ) {
        url += `${ url.includes('?') ? '&' : '?' }limit=${ limit }`;
      }
      // End: Limit

      // Sort
      // Steve's sort options supports multi-column sorting and column specific sort orders, not implemented yet #9341
      const sortBy = opt.sortBy;
      const orderBy = opt.sortOrder;

      if ( sortBy ) {
        if (isSteve) {
          url += `${ url.includes('?') ? '&' : '?' }sort=${ (orderBy === 'desc' ? '-' : '') + encodeURI(sortBy) }`;
        } else {
          url += `${ url.includes('?') ? '&' : '?' }sort=${ encodeURI(sortBy) }`;
          if ( orderBy ) {
            url += `${ url.includes('?') ? '&' : '?' }order=${ encodeURI(orderBy) }`;
          }
        }
      }
      // End: Sort
    }

    // Exclude
    // excludeFields should be an array of strings representing the paths of the fields to exclude
    // only works on Steve but is ignored without error by Norman
    if (isSteve) {
      if (!Array.isArray(opt?.excludeFields)) {
        const excludeFields = ['metadata.managedFields'];

        // for some resources, we might want to include fields, excluded by default.
        opt.excludeFields = Array.isArray(opt?.omitExcludeFields) ? excludeFields.filter((f) => !f.includes(opt.omitExcludeFields)) : excludeFields;
      }

      const excludeParamsString = opt.excludeFields.map((field) => `exclude=${ field }`).join('&');

      url += `${ url.includes('?') ? '&' : '?' }${ excludeParamsString }`;
    }
    // End: Exclude

    return url;
  },

  urlFor: (state, getters) => (type, id, opt) => {
    let url = urlFor(state, getters)(type, id, opt);

    // `namespaced` is either
    // - a string representing a single namespace - add restriction to the url
    // - an array of namespaces or projects - add restriction as a param
    if (!opt?.url && opt?.namespaced && !pAndNFiltering.isApplicable(opt)) {
      // Update path to include `namespace`, but take into account
      // - if there is an id
      // - if there are query params

      // Construct a url so query params / fragments are avoided
      const urlObj = new URL(url);
      const path = urlObj.pathname;

      if (!!path?.length && path[path.length - 1] === '/') {
        urlObj.pathname = path.substring(0, path.length - 1);
      }
      const parts = urlObj.pathname.split('/');

      if (id) {
        // namespace should go before the id in the path
        parts.splice(parts.length - 1, 0, opt.namespaced);
        urlObj.pathname = parts.join('/');
      } else {
        // namespace should go at the end of the path
        urlObj.pathname = `${ urlObj.pathname.split('/').join('/') }/${ opt.namespaced }`;
      }

      url = urlObj.toString();
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

  /**
   * Checks the norman or steve schema resourceFields for the given path
   */
  pathExistsInSchema: (state, getters) => (type, path) => {
    const schema = getters.schemaFor(type);

    if (schema.requiresResourceFields && !schema.hasResourceFields) {
      console.warn(`pathExistsInSchema requires schema ${ schema.id } to have resources fields via schema definition but none were found. has the schema 'fetchResourceFields' been called?`); // eslint-disable-line no-console

      return false;
    }

    const schemaDefinitions = schema.requiresResourceFields ? schema.schemaDefinitions : null;
    const parts = splitObjectPath(path);
    let schemaOrSchemaDefinition = schema;

    // Iterate down the parts (properties) until there are no parts left (success) or the path cannot be found (failure)
    while ( parts.length ) {
      const key = parts.shift();

      const field = schemaOrSchemaDefinition.resourceFields?.[key];

      type = field?.type;

      if ( !type ) {
        return false;
      }

      if ( parts.length ) {
        type = parseType(type, field).pop(); // Get the main part of array[map[something]] => something

        schemaOrSchemaDefinition = schemaDefinitions ? schemaDefinitions?.[type] : getters.schemaFor(type);

        if ( !schema ) {
          return false;
        }
      }
    }

    return true;
  },

  /*
   * Override the vanilla type-map headersFor. This allows custom columns
   */
  headersFor: (state, getters, rootState, rootGetters) => ({
    getters: typeMapGetters,
    state: typeMapState,
  }, { schema, pagination }) => {
    if (!pagination ) {
      return;
    }

    return createHeaders({
      state: typeMapState, getters: typeMapGetters, rootGetters
    }, {
      headers:     typeMapState.paginationHeaders,
      typeOptions: typeMapGetters['optionsFor'](schema, true),
      schema,
      columns:     {
        state:     STEVE_STATE_COL,
        namespace: STEVE_NAMESPACE_COL,
        age:       STEVE_AGE_COL,
        id:        STEVE_ID_COL
      }
    });
  },

  /**
   * Override the vanilla type-map optionsFor. This allows custom list values
   */
  optionsFor: () => (ctx, { schema, pagination, opts }) => {
    if (pagination) {
      // As headers are hardcoded each list should have specific default sort option
      // This avoids the sortable table adding both name and id (which when combined with group would result in 3 sort args, which isn't supported)
      const steveOpts = { listMandatorySort: [] };

      if (!opts.listGroupsWillOverride && schema.attributes.namespaced) {
        // There's no pre-configured settings... and we're paginating... so use pagination specific groups
        steveOpts.listGroups = STEVE_LIST_GROUPS;
        steveOpts.listGroupsWillOverride = true;
      }

      return steveOpts;
    }
  },

};
