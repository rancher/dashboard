export function _getState(resource) {
  if ( resource.spec?.suspend ) {
    return 'suspended';
  }

  if ( this.spec?.paused === true ) {
    return 'paused';
  }

  return this.stateObj?.name || 'unknown';
}

export const calculatedFields = [
  { name: 'state', func: _getState },
];
