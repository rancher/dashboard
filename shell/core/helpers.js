export function checkExtensionRouteBinding({
  name, params, path, query
}, locationConfig) {
  // console.log('name && params', name, params);

  // if no configuration is passed, consider it as global
  if (!Object.keys(locationConfig).length) {
    return true;
  }

  // matches route "name" pattern (if only the "name" is provided)
  if (Object.keys(locationConfig).length === 1 && locationConfig.name && name === locationConfig.name) {
    return true;
  }
  // matches route "path" pattern (if only the "path" is provided)
  if (Object.keys(locationConfig).length === 1 && locationConfig.path && path === locationConfig.path) {
    return true;
  }

  // "params" to be checked based on the locationConfig
  const paramsToCheck = [
    'product',
    'resource',
    'namespace',
    'cluster',
    'id'
  ];

  let res = false;

  paramsToCheck.forEach((param) => {
    // handle "product" in a separate way...
    if (param === 'product') {
      if (locationConfig[param] === 'explorer' && !name.startsWith('c-')) {
        res = false;
      }

      if (locationConfig[param] === params[param]) {
        res = true;
      }
    // handle multiple locationConfig definitions at the same time "param" + "name" + "query"
    } else if (locationConfig[param] && locationConfig[param] === params[param]) {
      // check "name"
      if (locationConfig.name && name === locationConfig.name) {
        // check "query"
        if (query && Object.keys(query).length && locationConfig.query && Object.keys(locationConfig.query).length) {
          let matching = true;

          Object.keys(locationConfig.query).forEach((key) => {
            if (!query[key] || query[key] !== locationConfig.query[key]) {
              matching = false;
            }
          });

          matching ? res = true : res = false;
        } else {
          res = true;
        }
      } else if (!locationConfig.name) {
        // check "query"
        if (query && Object.keys(query).length && locationConfig.query && Object.keys(locationConfig.query).length) {
          let matching = true;

          Object.keys(locationConfig.query).forEach((key) => {
            if (!query[key] || query[key] !== locationConfig.query[key]) {
              matching = false;
            }
          });

          matching ? res = true : res = false;
        } else {
          res = true;
        }
      }
    }
  });

  return res;
}
