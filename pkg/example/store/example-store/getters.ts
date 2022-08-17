
export default {

  urlFor: (state: any, getters: any) => (type: any, id: any, opt: any) => {
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

    url = getters.urlOptions(url, opt);

    return url;
  },

  urlOptions: () => (url: any, opt: any) => {
    // Add API specific filter, limit, sort params
    return url;
  },

  watchStarted: () => () => {
  }

};
