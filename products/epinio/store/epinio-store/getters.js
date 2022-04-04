import { EPINIO_TYPES } from '@/products/epinio/types';
import {
  NAMESPACE_FILTER_SPECIAL as SPECIAL,
  NAMESPACE_FILTER_ALL as ALL
} from '@/utils/namespace-filter';

export default {

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
        const slash = id.indexOf('/');

        if (schema.attributes?.namespaced && slash > 0) {
          const ns = id.slice(0, slash);
          const realId = id.slice(slash + 1, id.length);
          const type = url.indexOf(schema.id);

          url = `${ url.slice(0, type) }namespaces/${ ns }/${ url.slice(type, url.length) }/${ realId }`;
        } else {
          url += `/${ id }`;
        }
      }
    }

    url = getters.urlOptions(url, opt);

    return url;
  },

  urlOptions: () => (url, opt) => {
    // This is where Epinio API filter, limit, sort will be applied
    return url;
  },

  namespaceFilterOptions: (state, getters, rootState, rootGetters) => ({
    addNamespace,
    divider
  }) => {
    const out = [{
      id:    ALL,
      kind:  SPECIAL,
      label: rootGetters['i18n/t']('nav.ns.all'),
    }];

    divider(out);
    addNamespace(out, getters.all(EPINIO_TYPES.NAMESPACE));

    return out;
  },

  singleProductCNSI: state => () => state.singleProductCNSI

};
