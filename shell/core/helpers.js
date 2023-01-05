export function checkExtensionRouteBinding({ name, params, query }, locationConfig) {
  // console.log('name && params', name, params);

  // if no configuration is passed, consider it as global
  if (!Object.keys(locationConfig).length) {
    return true;
  }

  // "params" to be checked based on the locationConfig
  const paramsToCheck = [
    'product',
    'resource',
    'namespace',
    'cluster',
    'id',
    'mode'
  ];

  let res = false;

  for (let i = 0; i < paramsToCheck.length; i++) {
    const param = paramsToCheck[i];

    if (locationConfig[param]) {
      // handle "product" in a separate way...
      if (param === 'product') {
        if (locationConfig[param] === 'home' && !name.startsWith('c-')) {
          res = true;
        } else if (locationConfig[param] === 'explorer' && name.startsWith('c-')) {
          res = true;
        } else if (locationConfig[param] === params[param]) {
          res = true;
        } else {
          res = false;
          break;
        }
        // also handle "mode" in a separate way because it mainly depends on query params
      } else if (param === 'mode') {
        if (locationConfig[param] === 'edit' && query.mode && query.mode === 'edit') {
          res = true;
        } else if (locationConfig[param] === 'config' && query.as && query.as === 'config') {
          res = true;
        } else if (locationConfig[param] === 'detail' && name.includes('-id')) {
          res = true;
        } else if (locationConfig[param] === 'list' && !name.includes('-id')) {
          res = true;
        } else {
          res = false;
          break;
        }
      } else if (locationConfig[param] === params[param]) {
        res = true;
      } else {
        res = false;
        break;
      }
    } else {
      continue;
    }
  }

  return res;
}
