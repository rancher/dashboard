export const urlFor = ({ normalizeType, schemaFor, baseUrl }, {
  type, namespace, id, opt
}) => {
  opt = opt || {};
  type = normalizeType(type);
  let url = opt.url;

  if ( !url ) {
    const schema = schemaFor(type);

    if ( !schema ) {
      throw new Error(`Unknown schema for type: ${ type }`);
    }

    url = schema.links.collection;

    if ( !url ) {
      throw new Error(`You don't have permission to list this type: ${ type }`);
    }

    if ( namespace ) {
      url += `/${ namespace }`;
    }

    if ( id ) {
      url += `/${ id }`;
    }
  }

  if ( !url.startsWith('/') && !url.startsWith('http') ) {
    const safeBaseUrl = baseUrl.replace(/\/$/, '');

    url = `${ safeBaseUrl }/${ url }`;
  }

  return url;
};
