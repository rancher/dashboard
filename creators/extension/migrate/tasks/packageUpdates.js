const fs = require('fs');
const path = require('path');
const glob = require('glob');
const semver = require('semver');
const stats = require('../stats');
const { nodeRequirement, removePlaceholder } = require('../config');
const { writeContent, printContent } = require('../utils/content');

function packageUpdates(params) {
  const files = glob.sync(params.paths || '**/package.json', { ignore: params.ignore });

  files.forEach((file) => {
    const originalContent = fs.readFileSync(file, 'utf8');
    let content = originalContent;

    const [librariesContent, replaceLibraries] = packageUpdatesLibraries(file, content);

    if (replaceLibraries.length) {
      content = librariesContent;
      printContent(file, `Updating libraries`, replaceLibraries);
      stats.libraries.push(file);
    }

    const [nodeContent, replaceNode] = packageUpdatesEngine(file, content);

    if (replaceNode.length) {
      content = nodeContent;
      printContent(file, `Updating node engine`, replaceNode);
      stats.node.push(file);
    }

    const [resolutionContent, replaceResolution] = packageUpdatesResolution(file, content);

    if (replaceResolution.length) {
      content = resolutionContent;
      printContent(file, `Updating resolutions`, replaceResolution);
      stats.libraries.push(file);
    }

    const [annotationsContent, annotationsChanges] = packageUpdatesAnnotations(file, content);

    if (annotationsChanges.length) {
      content = annotationsContent;
      printContent(file, `Updating annotations`, annotationsChanges);
      stats.annotations = stats.annotations || [];
      stats.annotations.push(file);
    }

    if (
      replaceLibraries.length ||
      replaceNode.length ||
      replaceResolution.length ||
      annotationsChanges.length
    ) {
      writeContent(file, content, originalContent);
      stats.total.push(file);
    }
  });
}

function packageUpdatesLibraries(file, oldContent) {
  let content = oldContent;
  let parsedJson = JSON.parse(content);
  const replaceLibraries = [];
  const types = ['dependencies', 'devDependencies', 'peerDependencies'];

  // [Where to apply, Library name, new version or new library, new library version]
  const librariesUpdates = [
    [['root', 'dependencies'], '@rancher/shell', '^3.0.0'],
    [['root', 'dependencies'], '@rancher/components', '^0.3.0-alpha.1'],
    [['root', 'dependencies'], '@nuxt/babel-preset-app', removePlaceholder],
    [['root', 'dependencies'], '@typescript-eslint/eslint-plugin', removePlaceholder],
    [['root', 'dependencies'], '@typescript-eslint/parser', removePlaceholder],
    [['pkg', 'devDependencies'], '@vue/cli-plugin-babel', '~5.0.0'],
    [['pkg', 'devDependencies'], '@vue/cli-service', '~5.0.0'],
    [['pkg', 'devDependencies'], '@vue/cli-plugin-typescript', '~5.0.0'],
    [['root', 'dependencies'], '@vue/test-utils', removePlaceholder],
    [['root', 'dependencies'], 'core-js', removePlaceholder],
    [['root', 'dependencies'], 'cache-loader', removePlaceholder],
    [['root', 'dependencies'], 'node-polyfill-webpack-plugin', removePlaceholder],
    [['root', 'dependencies'], 'portal-vue', removePlaceholder],
    [['root', 'dependencies'], 'sass-loader', removePlaceholder],
    [['root', 'dependencies'], 'typescript', removePlaceholder],
    [['root', 'dependencies'], 'vue-router', removePlaceholder],
    [['root', 'dependencies'], 'vue', removePlaceholder],
    [['root', 'dependencies'], 'vuex', removePlaceholder],
    [['root', 'dependencies'], 'xterm', removePlaceholder],
  ];

  types.forEach((type) => {
    if (parsedJson[type]) {
      librariesUpdates.forEach(([[fileType, place], library, newVersion, newLibraryVersion]) => {
        const currFileType = parsedJson.scripts && parsedJson.scripts.dev && parsedJson.scripts.build ? 'root' : 'pkg';

        if (currFileType === fileType && type === place) {
          if (parsedJson[type][library]) {
            const version = semver.coerce(parsedJson[type][library]);

            if (newVersion === removePlaceholder) {
              // Remove library
              replaceLibraries.push([library, [parsedJson[type][library], removePlaceholder]]);
              delete parsedJson[type][library];
              content = JSON.stringify(parsedJson, null, 2);
            } else if (newLibraryVersion) {
              // Replace with a new library
              replaceLibraries.push([library, [parsedJson[type][library], newVersion, newLibraryVersion]]);
              content = content.replace(
                `"${ library }": "${ parsedJson[type][library] }"`,
                `"${ newVersion }": "${ newLibraryVersion }"`
              );
              parsedJson = JSON.parse(content);
            } else if (version && semver.lt(version, semver.coerce(newVersion))) {
              // Update library version if outdated
              replaceLibraries.push([library, [parsedJson[type][library], newVersion]]);
              content = content.replace(
                `"${ library }": "${ parsedJson[type][library] }"`,
                `"${ library }": "${ newVersion }"`
              );
              parsedJson = JSON.parse(content);
            }
          } else if (newLibraryVersion && library === newVersion) {
            // Add new library if it doesn't exist
            parsedJson[type][library] = newLibraryVersion;
            replaceLibraries.push([library, [null, newLibraryVersion]]);
            content = JSON.stringify(parsedJson, null, 2);
          }
        }
      });
    }
  });

  return [content, replaceLibraries];
}

function packageUpdatesEngine(file, oldContent) {
  let content = oldContent;
  let parsedJson = JSON.parse(content);
  const replaceNode = [];

  if (parsedJson.engines) {
    const outdated = semver.lt(semver.coerce(parsedJson.engines.node), semver.coerce(nodeRequirement));

    if (outdated) {
      replaceNode.push([parsedJson.engines.node, nodeRequirement]);
      content = content.replace(
        `"node": "${ parsedJson.engines.node }"`,
        `"node": ">=${ nodeRequirement }"`
      );
      parsedJson = JSON.parse(content);
    }
  }

  return [content, replaceNode];
}

function packageUpdatesResolution(file, oldContent) {
  let content = oldContent;
  let parsedJson = JSON.parse(content);
  const replaceResolution = [];
  const resolutions = [
    ['@vue/cli-service/html-webpack-plugin', removePlaceholder],
    ['**/webpack', removePlaceholder],
    ['@types/node', '~20.10.0'],
    ['@types/lodash', '4.17.5'],
  ];

  if (parsedJson.resolutions) {
    resolutions.forEach(([library, newVersion]) => {
      if (newVersion === removePlaceholder) {
        replaceResolution.push([library, [parsedJson.resolutions[library], removePlaceholder]]);
        delete parsedJson.resolutions[library];
        content = JSON.stringify(parsedJson, null, 2);
        parsedJson = JSON.parse(content);
      } else if (!parsedJson.resolutions[library]) {
        parsedJson.resolutions[library] = newVersion;
        replaceResolution.push([library, [null, newVersion]]);
        content = JSON.stringify(parsedJson, null, 2);
        parsedJson = JSON.parse(content);
      } else {
        const outdated = semver.lt(
          semver.coerce(parsedJson.resolutions[library]),
          semver.coerce(newVersion)
        );

        if (outdated) {
          replaceResolution.push([parsedJson.engines.node, nodeRequirement]);
          content = content.replace(
            `"${ library }": "${ parsedJson.resolutions[library] }"`,
            `"${ library }": "${ newVersion }"`
          );
          parsedJson = JSON.parse(content);
        }
      }
    });
  }

  return [content, replaceResolution];
}

function packageUpdatesAnnotations(file, oldContent) {
  let content = oldContent;
  const parsedJson = JSON.parse(content);
  const changesMade = [];

  // Check if the file is in pkg/*/package.json
  const dirName = path.dirname(file); // e.g., 'pkg/extension-name'
  const parentDirName = path.basename(path.dirname(dirName)); // Should be 'pkg'

  if (parentDirName === 'pkg') {
    // The file is in pkg/<extension-name>/package.json
    const annotations = {
      'catalog.cattle.io/rancher-version':       '>= 2.10.0-0',
      'catalog.cattle.io/ui-extensions-version': '>= 3.0.0 < 4.0.0',
    };

    if (!parsedJson.rancher) {
      parsedJson.rancher = { annotations };
      changesMade.push('Added rancher annotations');
    } else if (!parsedJson.rancher.annotations) {
      parsedJson.rancher.annotations = annotations;
      changesMade.push('Added rancher annotations');
    } else {
      // Merge existing annotations with the new ones
      parsedJson.rancher.annotations = {
        ...parsedJson.rancher.annotations,
        ...annotations,
      };
      changesMade.push('Updated rancher annotations');
    }

    // Update content
    content = JSON.stringify(parsedJson, null, 2);
  }

  return [content, changesMade];
}

module.exports = packageUpdates;
