const fs = require('fs');
const path = require('path');
const contextFolders = ['chart', 'cloud-credential', 'content', 'detail', 'edit', 'list', 'machine-config', 'models', 'promptRemove', 'l10n', 'windowComponents', 'dialog'];
const contextMap = contextFolders.reduce((map, obj) => {
  map[obj] = true;

  return map;
}, {});

function replaceAll(str, find, replace) {
  return str.split(find).join(replace);
}

// This function is used to generate the code to register models, edit, detail, list etc for a type
// This is used when building as a library - it does not use require.context - it scans the file system and build time.
// This ensures that the webpackChunkName is respected (require.context does not support this) - so when build as a library
// the code splitting will be respected
function generateTypeImport(pkg, dir) {
  let content = 'export function importTypes($plugin) { \n';

  // Auto-import if the folder exists
  contextFolders.forEach((f) => {
    if (fs.existsSync(path.join(dir, f))) {
      fs.readdirSync(path.join(dir, f)).forEach((file) => {
        const name = file.replace(/\.[^/.]+$/, '');
        const importType = (f === 'models') ? 'require' : 'import';
        const chunkName = (f === 'l10n') ? '' : `/* webpackChunkName: "${ f }" */`;

        content += `  $plugin.register('${ f }', '${ name }', () => ${ importType }(${ chunkName }'${ pkg }/${ f }/${ file }'));\n`;
      });
    }
  });

  content += `};\n`;

  return content;
}

// This function is used to generate the code to register models, edit, detail, list etc for a type
// This is used when building for dev when plugins are loaded into the app for development - it uses require.context - which ensures
// that any changes made will be picked up by hot module replacement. It will not respect code splitting, but this is okay
// for development. Also note the top-level folders are not watched, so if you don't have a 'list' folder (for example), you must create it
// and then restart the dev server for it to be picked up.
function generateDynamicTypeImport(pkg, dir) {
  const template = fs.readFileSync(path.join(__dirname, 'import.js'), { encoding: 'utf8' });
  let content = 'export function importTypes($plugin) { \n';

  // Auto-import if the folder exists
  contextFolders.forEach((f) => {
    if (fs.existsSync(path.join(dir, f))) {
      const safeName = f.replace(/\/|-/g, '_');
      let genImport = replaceAll(template, 'NAME', safeName);

      genImport = replaceAll(genImport, 'DIR', f );
      const importType = (f === 'models') ? 'require' : 'import';
      // Ensure i18n chunks are named with the request name (which will be the locale)
      const chunk = (f === 'l10n') ? '[request]' : f;
      let chunkName = `/* webpackChunkName: "${ chunk }" */ `;

      // Don't use chunk names with require
      if (importType === 'require') {
        chunkName = '';
      }

      const ext = (f === 'l10n') ? '.yaml' : '';

      genImport = replaceAll(genImport, 'BASE', pkg);
      genImport = replaceAll(genImport, 'CHUNK', chunkName);
      genImport = replaceAll(genImport, 'EXT', ext);
      content += replaceAll(genImport, 'REQUIRE', importType);
    }
  });

  content += `};\n`;

  return content;
}

module.exports = {
  contextFolders,
  contextMap,
  generateTypeImport,
  generateDynamicTypeImport
};
