const { set, get } = require('@shell/utils/object');

/**
 * Creates a computed property that handles converting strings to numbers and numbers to strings. Particularly when dealing with UnitInput.
 * @param {*} path The path of the real value
 * @returns the computed property
 */
export function integerString(path) {
  return {
    get() {
      return Number.parseFloat(get(this, path));
    },

    set(value) {
      set(this, path, value.toString(10));
    }
  };
}

/**
 * Creates a computed property that handles converting strings a list of strings that look like ['key=value'] into { key: value } and back
 * @param {*} path The path of the real value
 * @param {*} delimiter the character/s used between the key/value. Default value '='.
 * @returns the computed property
 */
export function keyValueStrings(path, delimiter = '=') {
  return {
    get() {
      const result = {};

      get(this, path)?.forEach((entry) => {
        const [key, value] = entry.split(delimiter);

        result[key] = value;
      });

      return result;
    },
    set(value) {
      const newValue = Object.entries(value).map(([key, value]) => `${ key }${ delimiter }${ value }`);

      set(this, path, newValue);
    }
  };
}
