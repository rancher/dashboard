export function _getProvider(resource, rootGetters) {
  return rootGetters['i18n/translateWithFallback'](`model.authConfig.provider."${ resource.id }"`, null, resource.id);
}

export function _getNameDisplay(resource, rootGetters) {
  return rootGetters['i18n/translateWithFallback'](`model.authConfig.name."${ resource.id }"`, null, resource.provider);
}

export const calculatedFields = [
  { name: 'provider', func: _getProvider },
  { name: 'nameDisplay', func: _getNameDisplay }
];
