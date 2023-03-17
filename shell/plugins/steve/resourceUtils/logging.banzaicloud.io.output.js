export function _getProviders(resource) {
  const spec = resource.spec || {};

  return Object.keys(spec)
    .filter(provider => provider !== 'loggingRef');
}

export function _getProvidersDisplay(resource, { translate }) {
  return resource.providers.map((p) => {
    const translation = translate(`logging.outputProviders.${ p }`);

    return translation || translate('logging.outputProviders.unknown');
  });
}

export function _getProvidersSortable(resource) {
  const copy = [...resource.providersDisplay];

  copy.sort();

  return copy.join('');
}

export const calculatedFields = [
  { name: 'providers', func: _getProviders },
  { name: 'providersDisplay', func: _getProvidersDisplay },
  { name: 'providerSortable', func: _getProvidersSortable },
];
