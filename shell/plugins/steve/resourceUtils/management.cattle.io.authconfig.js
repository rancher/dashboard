export function _getProvider(resource, { translateWithFallback }) {
  return translateWithFallback(`model.authConfig.provider."${ resource.id }"`, null, resource.id);
}

export function _getNameDisplay(resource, { translateWithFallback }) {
  return translateWithFallback(`model.authConfig.name."${ resource.id }"`, null, resource.provider);
}

export const calculatedFields = [
  { name: 'provider', func: _getProvider },
  { name: 'nameDisplay', func: _getNameDisplay }
];
