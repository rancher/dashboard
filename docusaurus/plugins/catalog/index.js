// Docusaurus plugin

// Reads the extension catalog and processes it into a single index file
// Declares a watch path, so that changes to the catalog files will
// regenerate the index file
import { parse } from 'yaml';

const fs = require('fs');
const path = require('path');
const FOLDER = './extensions/catalog';

function readAndMergeCatalogFiles(out, folder, group) {
  const files = fs.readdirSync(folder);

  files.forEach((entry) => {
    const fp = path.join(folder, entry);
    const stats = fs.statSync(fp);

    if (stats.isDirectory()) {
      readAndMergeCatalogFiles(out, fp, entry);
    } else if (entry.endsWith('.yaml')) {
      try {
        const yaml = fs.readFileSync(fp);
        const obj = parse(yaml.toString('utf8'));

        obj.group = group;

        out.push(obj);
      } catch (e) {
        console.log(`Error reading file ${ entry }`); // eslint-disable-line no-console
      }
    }
  });
}

function go() {
  const data = [];

  // Discover, read and merge the individual yaml files into an array
  readAndMergeCatalogFiles(data, FOLDER);

  // Sort by name
  data.sort((a, b) => {
    return a.name.localeCompare(b.name);
  });

  // Write the catalog index out to a JSON file
  fs.writeFileSync('./.docusaurus/catalog.json', JSON.stringify(data));
}

// Generate catalog file
// Plugin will ensure the catalog json file is created from the folder of yaml files
// in `extensions/catalog`
export default async function extensionsCatalogPlugin(context, options) {
  return {
    name: 'extensions-catalog-generator',

    getPathsToWatch() {
      return [`${ FOLDER }/**/*.yaml`];
    },

    contentLoaded() {
      // When docusaurus rebuilds, rebuild the catalog index
      go();
    }
  };
}
