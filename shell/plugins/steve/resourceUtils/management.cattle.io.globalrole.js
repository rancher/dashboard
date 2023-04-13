export function _getNameDisplay(resource, _, rootGetters) {
  const path = `rbac.globalRoles.role.${ resource.id }.label`;
  const label = resource.displayName || resource.metadata?.name || resource.id;

  return rootGetters['i18n/translateWithFallback'](path, label);
}

export function _getDefault(resource) {
  return !!resource.newUserDefault;
}

export const calculatedFields = [
  { name: 'nameDisplay', func: _getNameDisplay },
  { name: 'default', func: _getDefault }
];
