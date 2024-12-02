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

  // [Library name, new version or new library, new library version]
  const librariesUpdates = [
    ['@rancher/shell', '^3.0.0'], // ok - dependency - root package.json - DONE!!!
    ['@rancher/components', '^0.3.0-alpha.1'], // ok - dependency - root package.json - DONE!!!
    ['@nuxt/babel-preset-app', removePlaceholder], // ok - DONE!!!
    ['@types/jest', '^29.5.2'], // why didn't it add this to elemental 2.0.0? - NOT IN SHELL!
    ['@typescript-eslint/eslint-plugin', '~5.4.0'], // why didn't it add this to elemental 2.0.0? - // **** TO REMOVE !!!! was a dependency in root package.json, now is a shell dependency!!!
    ['@typescript-eslint/parser', '~5.4.0'], // why didn't it add this to elemental 2.0.0? - // **** TO REMOVE !!!! was a dependency in root package.json, now is a shell dependency!!!
    ['@vue/cli-plugin-babel', '~5.0.0'], // ok - devDependency - pkg/package.json - DONE!!!
    ['@vue/cli-plugin-e2e-cypress', '~5.0.0'], // why didn't it add this to elemental 2.0.0? - NOT IN SHELL!
    ['@vue/cli-plugin-eslint', '~5.0.0'], // why didn't it add this to elemental 2.0.0? - NOT IN SHELL!
    ['@vue/cli-plugin-router', '~5.0.0'], // why didn't it add this to elemental 2.0.0? - NOT IN SHELL!
    ['@vue/cli-plugin-typescript', '~5.0.0'], // ok - devDependency - pkg/package.json - DONE!!!
    ['@vue/cli-plugin-unit-jest', '~5.0.0'], // why didn't it add this to elemental 2.0.0? - NOT IN SHELL!
    ['@vue/cli-plugin-vuex', '~5.0.0'], // why didn't it add this to elemental 2.0.0? - NOT IN SHELL!
    ['@vue/cli-service', '~5.0.0'], // ok - devDependency - pkg/package.json - DONE!!!
    ['@vue/eslint-config-typescript', '~9.1.0'], // why didn't it add this to elemental 2.0.0? - NOT IN SHELL!
    ['@vue/vue2-jest', '@vue/vue3-jest', '^27.0.0-alpha.1'], // ok - replacing - will only happen if exists
    ['@vue/test-utils', '~2.0.0-0'], // why didn't it add this to elemental 2.0.0? - // **** TO REMOVE !!!! was a dependency in root package.json, now is a shell dependency!!!
    ['core-js', '3.25.3'], // **** TO REMOVE !!!! was a dependency in root package.json, now is a shell dependency!!!
    ['cache-loader', '^4.1.0'], // why didn't it add this to elemental 2.0.0? - **** TO REMOVE !!!! was a dependency in root package.json, now is a shell dependency!!!
    ['node-polyfill-webpack-plugin', '^3.0.0'], // why didn't it add this to elemental 2.0.0? - **** TO REMOVE !!!! was a dependency in root package.json, now is a shell dependency!!!
    ['portal-vue', '~3.0.0'], // why didn't it add this to elemental 2.0.0? - **** TO REMOVE !!!! was a dependency in root package.json, now is a shell dependency!!!
    ['require-extension-hooks-babel', '1.0.0'], // why didn't it add this to elemental 2.0.0? - NOT IN SHELL!
    ['require-extension-hooks-vue', '3.0.0'], // why didn't it add this to elemental 2.0.0? - NOT IN SHELL!
    ['require-extension-hooks', '0.3.3'], // why didn't it add this to elemental 2.0.0? - NOT IN SHELL!
    ['sass-loader', '~12.0.0'], // why didn't it add this to elemental 2.0.0? - **** TO REMOVE !!!! was a dependency in root package.json, now is a shell dependency!!!
    ['typescript', '~4.5.5'], // why didn't it add this to elemental 2.0.0? - **** TO REMOVE !!!! was a dependency in root package.json, now is a shell dependency!!!
    ['vue-router', '~4.0.3'], // why didn't it add this to elemental 2.0.0? - **** TO REMOVE !!!! was a dependency in root package.json, now is a shell dependency!!!
    ['vue-virtual-scroll-list', 'vue3-virtual-scroll-list', '0.2.1'], // SOMETHING WRONG HERE AS IT ADDED IT to devDependencies and dependencies in both files!!!!!
    ['vue', '~3.2.13'], // why didn't it add this to elemental 2.0.0? - **** TO REMOVE !!!! was a dependency in root package.json, now is a shell dependency!!!
    ['vuex', '~4.0.0'], // why didn't it add this to elemental 2.0.0? - **** TO REMOVE !!!! was a dependency in root package.json, now is a shell dependency!!!
    ['xterm', '5.2.1'], // why didn't it add this to elemental 2.0.0? - **** TO REMOVE !!!! was a dependency in root package.json, now is a shell dependency!!!
  ];

  types.forEach((type) => {
    if (parsedJson[type]) {
      librariesUpdates.forEach(([library, newVersion, newLibraryVersion]) => {
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
    ['**/webpack', removePlaceholder],
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
