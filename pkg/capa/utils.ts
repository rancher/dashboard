export function removeEmptyFields(input: any): any {
  if (Array.isArray(input)) {
    const cleanedArray = input
      .map((item) => removeEmptyFields(item))
      .filter((item) => item !== undefined);

    return cleanedArray.length ? cleanedArray : undefined;
  }

  if (input && typeof input === 'object') {
    const cleanedObject = Object.entries(input).reduce((acc: Record<string, any>, [key, val]) => {
      const cleanedValue = removeEmptyFields(val);

      if (cleanedValue !== undefined) {
        acc[key] = cleanedValue;
      }

      return acc;
    }, {});

    return Object.keys(cleanedObject).length ? cleanedObject : undefined;
  }

  if (input === undefined || input === null || input === '') {
    return undefined;
  }

  return input;
}
