export function checkExtensionRouteBinding({ name, params }, locationConfig) {
  // console.log('name && params', name, params);
  // console.log('locationConfig', locationConfig);

  // if no configuration is passed, consider it as global
  if (!Object.keys(locationConfig).length) {
    return true;
  }

  // matches route "name" pattern (if only the "name" is provided)
  if (Object.keys(locationConfig).length === 1 && locationConfig.name && name.includes(locationConfig.name)) {
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
    if (param === 'product') {
      if (locationConfig[param] === 'explorer' && !name.startsWith('c-')) {
        res = false;
      }

      if (locationConfig[param] === params[param]) {
        res = true;
      }
    } else if (locationConfig[param] && locationConfig[param] === params[param]) {
      if (locationConfig.name && name.includes(locationConfig.name)) {
        res = true;
      } else if (!locationConfig.name) {
        res = true;
      }
    }
  });

  return res;
}
