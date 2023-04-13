export function _getProvider(resource) {
  const allKeys = Object.keys(resource);

  const configKey = allKeys
    .filter(k => resource[k] !== null)
    .find(k => k.endsWith('Config'));

  if ( configKey ) {
    return configKey.replace(/config$/i, '');
  }

  return null;
}

export function _getProviderDisplay(resource, _, rootGetters) {
  const provider = (resource.provider || '').toLowerCase();

  return rootGetters['i18n/translateWithFallback'](`cluster.provider."${ provider }"`, null, 'generic.unknown', true);
}

export const calculatedFields = [
  { name: 'provider', func: _getProvider },
  { name: 'providerDisplay', func: _getProviderDisplay }
];
