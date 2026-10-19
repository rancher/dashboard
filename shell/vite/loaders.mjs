import jsyaml from 'js-yaml';
import Papa from 'papaparse';

const YAML = /\.ya?ml$/;
const CSV = /\.csv$/;
const MARKDOWN = /\.md$/;
const FRONT_MATTER = /^\uFEFF?---\r?\n[\s\S]*?\r?\n---(\r?\n|$)/;

const cleanId = (id) => id.split('?')[0];

/**
 * Imports of yaml (for example translations) and csv files yield their parsed contents as the default export, and
 * imports of markdown yield `{ body }`, as their webpack loaders did
 */
export function rancherLoaders() {
  return {
    name: 'rancher:loaders',

    transform(code, id) {
      const file = cleanId(id);

      if (YAML.test(file)) {
        return { code: `export default ${ JSON.stringify(jsyaml.load(code)) };`, map: null };
      }

      if (CSV.test(file)) {
        const { data } = Papa.parse(code, {
          dynamicTyping: true, header: true, skipEmptyLines: true
        });

        return { code: `export default ${ JSON.stringify(data) };`, map: null };
      }

      if (MARKDOWN.test(file)) {
        const body = code.replace(FRONT_MATTER, '');

        return { code: `export const body = ${ JSON.stringify(body) };\nexport default { body };`, map: null };
      }
    },
  };
}
