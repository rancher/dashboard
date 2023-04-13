export function _getProvider(resource) {
  const principals = resource.principalIds || [];
  let isSystem = false;
  let isLocal = true;
  let provider = '';

  for ( const principal of principals ) {
    const idx = principal.indexOf(':');
    const driver = principal.substr(0, idx).toLowerCase().split('_')[0];

    if ( driver === 'system' ) {
      isSystem = true;
    } else if ( driver === 'local' ) {
      // Do nothing, defaults to local
    } else {
      isLocal = false;

      if ( provider ) {
        provider = 'multiple';
      } else {
        provider = driver;
      }
    }
  }

  let key;

  if ( isSystem ) {
    key = 'system';
  } else if ( isLocal ) {
    key = 'local';
  } else {
    key = provider;
  }

  return key;
}

export function _getNameDisplay(resource) {
  return resource.displayName || resource.username || resource.id;
}

export function _getProviderDisplay(resource, _, rootGetters) {
  return rootGetters['i18n/translateWithFallback'](`model.authConfig.provider."${ resource.provider }"`, null, resource.provider);
}

export function _getDescription(resource) {
  return resource._description;
}

export function _getLabelForSelect(resource) {
  const name = resource.nameDisplay;
  const id = resource.id;

  if ( name === id ) {
    return id;
  } else {
    return `${ name } (${ id })`;
  }
}

export const calculatedFields = [
  { name: 'provider', func: _getProvider },
  { name: 'nameDisplay', func: _getNameDisplay },
  { name: 'providerDisplay', func: _getProviderDisplay },
  { name: 'description', func: _getDescription },
  { name: 'labelForSelect', func: _getLabelForSelect }
];
