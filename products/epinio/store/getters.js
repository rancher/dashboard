
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

    if ( !url.startsWith('/') && !url.startsWith('http') ) {
      const baseUrl = state.config.baseUrl.replace(/\/$/, '');

      url = `${ baseUrl }/${ url }`;
    }

    url = getters.urlOptions(url, opt);

    return url;
  },

  urlOptions: () => (url, opt) => {
    // TODO: RC API determine handle filter, limit, sort
    return url;
  },

};
