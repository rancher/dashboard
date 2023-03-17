export function _getRestartRequired(resource) {
  return !resource.status.dynamic;
}

export const calculatedFields = [
  { name: 'restartRequired', func: _getRestartRequired }
];
