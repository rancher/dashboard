// Utilities for processing Open API definitions

type OpenApIDefinition = any;

type OpenApIDefinitions = {
  [name: string]: OpenApIDefinition;
};

// Regex for more info in descriptions
// Some kube docs use a common pattern for a URL with more info - we extract these and show a link icon, rather than clogging up the UI
// with a long URL - this makes it easier to read
const MORE_INFO_REGEX = /More info:\s*(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*))/;

function extractMoreInfo(property: any) {
  const description = property.description || '';
  const found = description.match(MORE_INFO_REGEX);

  if (found?.length > 0) {
    let url = found[0];
    const updated = description.replace(url, '').trim();
    const index = url.indexOf('http');

    url = url.substr(index);

    if (url.endsWith('.')) {
      url = url.substr(0, url.length - 1);
    }

    property.$moreInfo = url;
    property.description = updated;
  }
}

/**
 * Expand an Open API definition.
 *
 * This recursively expands the definitions for each property of a definition and
 * adds a few fields that make it easier to render in the UI.
 *
 * It also extracts any links that follow the 'More Info' pattern that is commonly used
 *
 * @param definitions All Open API definitions
 * @param definition Definition to expand
 * @param breadcrumbs Current breadcrumbs to use as a breadcrumb path to the definition
 */
export function expandDefinition(definitions: OpenApIDefinitions, definition: OpenApIDefinition, breadcrumbs = []): void {
  Object.keys(definition?.properties || {}).forEach((propName) => {
    const prop = definition.properties[propName];
    const propRef = prop.$ref || prop.items?.$ref;

    if (propRef && propRef.startsWith('#/definitions/')) {
      const p = propRef.split('/');
      const id = p[p.length - 1];

      const ref = definitions[id];

      if (ref) {
        prop.$$ref = ref;
        prop.$refName = id;
        prop.$breadcrumbs = [
          ...breadcrumbs,
          id,
        ];

        const parts = prop.$refName.split('.');

        prop.$refNameShort = parts[parts.length - 1];

        expandDefinition(definitions, ref, prop.$breadcrumbs);
      } else {
        console.warn(`Can not find definition for ${ id }`); // eslint-disable-line no-console
      }
    }

    extractMoreInfo(prop);
  });
}
