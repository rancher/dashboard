import { clone } from '@shell/utils/object';

export function get(prefsDefinitions, prefsData) {
  return (key) => {
    const definition = prefsDefinitions[key];

    if (!definition) {
      throw new Error(`Unknown preference: ${ key }`);
    }

    const user = prefsData[key];

    if (user !== undefined) {
      return clone(user);
    }

    const def = clone(definition.def);

    return def;
  };
}
