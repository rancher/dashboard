export const fields = {
  keysDisplay: (resource) => {
    const keys = [
      ...Object.keys(resource.data || []),
      ...Object.keys(resource.binaryData || [])
    ];

    if ( !keys.length ) {
      return '(none)';
    }

    return keys.join(', ');
  }
};

export const calculatedFields = [
  { name: fields.keysDisplay.name, func: fields.keysDisplay }
];
