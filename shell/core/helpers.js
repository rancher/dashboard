export function checkExtensionRouteBinding({ name, params }, locationConfig) {
  console.log('name', name);
  console.log('params', params);
  console.log('locationConfig', locationConfig);

  // if no configuration is passed, consider it as global
  if (!Object.keys(locationConfig).length) {
    return true;
  }

  // matches route "name" pattern
  if (locationConfig.name && name.includes(locationConfig.name)) {
    return true;
  }

  // matches "product" param on route
  if (locationConfig.product) {
    if (locationConfig.product === 'explorer' && !name.startsWith('c-')) {
      return false;
    }

    if (locationConfig.product === params.product) {
      return true;
    }
  }

  // matches "resource" param on route
  if (locationConfig.resource && locationConfig.resource === params.resource) {
    return true;
  }

  // matches "namespace" param on route
  if (locationConfig.namespace && locationConfig.namespace === params.namespace) {
    return true;
  }

  // matches "cluster" param on route
  if (locationConfig.cluster && locationConfig.cluster === params.cluster) {
    return true;
  }

  // matches "id" param on route
  if (locationConfig.id && locationConfig.id === params.id) {
    return true;
  }

  return false;
}
