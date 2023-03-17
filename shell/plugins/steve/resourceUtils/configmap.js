export function _getKeysDisplay(resource) {
  const keys = [
    ...Object.keys(resource.data || []),
    ...Object.keys(resource.binaryData || [])
  ];

  if ( !keys.length ) {
    return '(none)';
  }

  return keys.join(', ');
}

export const calculatedFields = [
  { name: 'keysDisplay', func: _getKeysDisplay }
];
