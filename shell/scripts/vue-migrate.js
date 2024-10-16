#!/usr/bin/node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const semver = require('semver');
const { createPatch } = require('diff');

/**
 * Initialize statistics for tracking changes
 */
const stats = {
  libraries:     [],
  node:          [],
  githubActions: [],
  nvmrc:         [],
  webpack:       [],
  jest:          [],
  router:        [],
  resolution:    [],
  eslint:        [],
  vueSyntax:     [],
  style:         [],
  total:         [],
};

// Directories and files to ignore during migration
let ignore = [
  '**/node_modules/**',
  '**/dist/**',
  '**/scripts/vue-migrate.js',
  'docusaurus/**',
  'storybook-static/**',
  'storybook/**'
];

const nodeRequirement = '20.0.0';
const isDry = process.argv.includes('--dry');
const isVerbose = process.argv.includes('--verbose');
const isSuggest = process.argv.includes('--suggest');
const removePlaceholder = 'REMOVE';
const params = { paths: null, ignorePatterns: [] };
const diffOutput = []; // Array to store diffs for suggest mode

/**
 * Package updates
 * Files: package.json
 */
const packageUpdates = () => {
  const files = glob.sync(params.paths || '**/package.json', { ignore });

  files.forEach((file) => {
    const originalContent = fs.readFileSync(file, 'utf8');
    let content = originalContent;

    const [librariesContent, replaceLibraries] = packageUpdatesLibraries(file, content);

    if (replaceLibraries.length) {
      content = librariesContent;
      printContent(file, `Updating`, replaceLibraries);
      stats.libraries.push(file);
    }

    const [nodeContent, replaceNode] = packageUpdatesEngine(file, content);

    if (replaceNode.length) {
      printContent(file, `Updating node`, replaceNode);
      content = nodeContent;
      stats.node.push(file);
    }

    const [resolutionContent, replaceResolution] = packageUpdatesResolution(file, content);

    if (replaceResolution.length) {
      printContent(file, `Updating resolution`, replaceResolution);
      content = resolutionContent;
      stats.libraries.push(file);
    }

    if (replaceLibraries.length || replaceNode.length || replaceResolution.length) {
      writeContent(file, content, originalContent);
      stats.total.push(file);
    }
  });
};

/**
 * Update Vue-related libraries in package.json
 */
const packageUpdatesLibraries = (file, oldContent) => {
  let content = oldContent;
  let parsedJson = JSON.parse(content);
  const replaceLibraries = [];
  const types = ['dependencies', 'devDependencies', 'peerDependencies'];

  // [Library name, new version or new library, new library version]
  const librariesUpdates = [
    ['@nuxt/babel-preset-app', removePlaceholder],
    ['@types/jest', '^29.5.2'],
    ['@typescript-eslint/eslint-plugin', '~5.4.0'],
    ['@typescript-eslint/parser', '~5.4.0'],
    ['@vue/cli-plugin-babel', '~5.0.0'],
    ['@vue/cli-plugin-e2e-cypress', '~5.0.0'],
    ['@vue/cli-plugin-eslint', '~5.0.0'],
    ['@vue/cli-plugin-router', '~5.0.0'],
    ['@vue/cli-plugin-typescript', '~5.0.0'],
    ['@vue/cli-plugin-unit-jest', '~5.0.0'],
    ['@vue/cli-plugin-vuex', '~5.0.0'],
    ['@vue/cli-service', '~5.0.0'],
    ['@vue/eslint-config-typescript', '~9.1.0'],
    ['@vue/vue2-jest', '@vue/vue3-jest', '^27.0.0-alpha.1'],
    ['@vue/test-utils', '~2.0.0-0'],
    ['core-js', '3.25.3'],
    ['cache-loader', '^4.1.0'],
    ['node-polyfill-webpack-plugin', '^3.0.0'],
    ['portal-vue', '~3.0.0'],
    ['require-extension-hooks-babel', '1.0.0'],
    ['require-extension-hooks-vue', '3.0.0'],
    ['require-extension-hooks', '0.3.3'],
    ['sass-loader', '~12.0.0'],
    ['typescript', '~4.5.5'],
    ['vue-router', '~4.0.3'],
    ['vue-virtual-scroll-list', 'vue3-virtual-scroll-list', '0.2.1'],
    ['vue', '~3.2.13'],
    ['vuex', '~4.0.0'],
    ['xterm', '5.2.1'],
  ];

  // Loop through each type of dependencies since many often not correctly placed or hard to track
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
            writeContent(file, content);
          } else if (newLibraryVersion) {
            // Replace with a new library
            replaceLibraries.push([library, [parsedJson[type][library], newVersion, newLibraryVersion]]);
            content = content.replaceAll(`"${ library }": "${ parsedJson[type][library] }"`, `"${ newVersion }": "${ newLibraryVersion }"`);
            parsedJson = JSON.parse(content);
            writeContent(file, content);
          } else if (version && semver.lt(version, semver.coerce(newVersion))) {
            // Update library version if outdated
            replaceLibraries.push([library, [parsedJson[type][library], newVersion]]);
            content = content.replaceAll(`"${ library }": "${ parsedJson[type][library] }"`, `"${ library }": "${ newVersion }"`);
            parsedJson = JSON.parse(content);
            writeContent(file, content);
          }
        } else if (newLibraryVersion && library === newVersion) {
          // Add new library if it doesn't exist
          parsedJson[type][library] = newLibraryVersion;
          replaceLibraries.push([library, [null, newLibraryVersion]]);
          content = JSON.stringify(parsedJson, null, 2);
          writeContent(file, content);
        }
      });
    }
  });

  return [content, replaceLibraries];
};

/**
 * Update Node engine version in package.json
 */
const packageUpdatesEngine = (file, oldContent) => {
  let content = oldContent;
  let parsedJson = JSON.parse(content);
  const replaceNode = [];

  if (parsedJson.engines) {
    const outdated = semver.lt(semver.coerce(parsedJson.engines.node), semver.coerce(nodeRequirement));

    if (outdated) {
      replaceNode.push([parsedJson.engines.node, nodeRequirement]);
      content = content.replaceAll(`"node": "${ parsedJson.engines.node }"`, `"node": ">=${ nodeRequirement }"`);
      parsedJson = JSON.parse(content);
      writeContent(file, content);
    }
  }

  return [content, replaceNode];
};

/**
 * Add resolutions for VueCLI
 */
const packageUpdatesResolution = (file, oldContent) => {
  let content = oldContent;
  let parsedJson = JSON.parse(content);
  const replaceResolution = [];
  const resolutions = [
    ['@vue/cli-service/html-webpack-plugin', '^5.0.0'],
    ['**/webpack', removePlaceholder],
  ];

  // Verify package engines node to latest
  if (parsedJson.resolutions) {
    resolutions.forEach(([library, newVersion]) => {
      if (newVersion === removePlaceholder) {
        delete parsedJson.resolutions[library];
        content = JSON.stringify(parsedJson, null, 2);
        parsedJson = JSON.parse(content);
        writeContent(file, content);
      } else if (!parsedJson.resolutions[library]) {
        // Add resolution if not present
        parsedJson.resolutions[library] = newVersion;
        content = JSON.stringify(parsedJson, null, 2);
        parsedJson = JSON.parse(content);
        writeContent(file, content);
      } else {
        // Ensure resolution version is up to date
        const outdated = semver.lt(semver.coerce(parsedJson.resolutions[library]), semver.coerce(newVersion));

        if (outdated) {
          replaceResolution.push([parsedJson.engines.node, nodeRequirement]);
          content = content.replaceAll(`"${ library }": "${ parsedJson.resolutions[library] }"`, `"${ library }": "${ newVersion }"`);
          parsedJson = JSON.parse(content);
          writeContent(file, content);
        }
      }
    });
  }

  return [content, replaceResolution];
};

/**
 * GitHub Actions updates
 * Files: .github/workflows/**.yml
 *
 * Verify GitHub Actions use of current node version, e.g. node-version: '<18'
 */
const gitHubActionsUpdates = () => {
  const files = glob.sync(params.paths || '.github/{actions,workflows}/**.{yml,yaml}', { ignore });

  files.forEach((file) => {
    let content = fs.readFileSync(file, 'utf8');
    const nodeVersionMatches = content.matchAll(/node-version: \'([0-9.x]+)\'/g);
    const toReplace = [];

    // Check all the node occurrences within the test file
    if (nodeVersionMatches) {
      for (const matches of nodeVersionMatches) {
        for (const match of matches) {
          const nodeVersion = semver.coerce(match);

          if (nodeVersion && semver.lt(nodeVersion, semver.coerce(nodeRequirement))) {
            content = content.replaceAll(`node-version: '${ match }'`, `node-version: '20.x'`);

            writeContent(file, content);
            toReplace.push([match, nodeRequirement]);
          }
        }
      }

      if (toReplace.length) {
        printContent(file, `Updating node`, toReplace);
        stats.githubActions.push(file);
        stats.total.push(file);
      }
    }
  });
};

/**
 * NVM updates
 * Files: .nvmrc
 *
 * Verify presence of .nvmrc, create one if none, update if any
 */
const nvmUpdates = () => {
  const files = glob.sync(params.paths || '**/.nvmrc', { ignore });
  const nvmRequirement = 20;

  if (files.length === 0) {
    // If no .nvmrc files found, create one
    const newFilePath = '.nvmrc';

    if (!isDry && !isSuggest) {
      fs.writeFileSync(newFilePath, nvmRequirement.toString());
      printContent(newFilePath, `Created ${ newFilePath } with Node version ${ nvmRequirement }`, '');
    }

    writeContent(newFilePath, nvmRequirement.toString(), '');
    stats.nvmrc.push(newFilePath);
    stats.total.push(newFilePath);
  }

  files.forEach((file) => {
    if (file) {
      const originalContent = fs.readFileSync(file, 'utf8');
      let content = originalContent;
      const nodeVersionMatch = content.match(/([0-9.x]+)/g);
      const nodeVersion = semver.coerce(nodeVersionMatch[0]);

      // Ensure node version is up to date
      if (nodeVersion && semver.lt(nodeVersion, semver.coerce(nodeRequirement))) {
        printContent(file, `Updating node ${ [nodeVersionMatch[0], nvmRequirement] }`);
        content = content.replaceAll(nodeVersionMatch[0], nvmRequirement);
        writeContent(file, content, originalContent);
        stats.nvmrc.push(file);
        stats.total.push(file);
      }
    }
  });
};

/**
 * Vue config update
 * Files: vue.config.js
 *
 * Verify vue.config presence of deprecated Webpack5 options
 * - devServer.public: 'path' -> client: { webSocketURL: 'path' }
 */
const vueConfigUpdates = () => {
  const files = glob.sync(params.paths || 'vue.config**.js', { ignore });

  files.forEach((file) => {
    const originalContent = fs.readFileSync(file, 'utf8');
    const content = originalContent;

    // Verify vue.config presence of deprecated Webpack5 options
    if (content.includes('devServer.public: \'path\'')) {
      writeContent(file, content, originalContent);
      stats.webpack.push(file);
      stats.total.push(file);
      // TODO: Add replacement
    }
  });
};

/**
 * Vue syntax update
 * Files: .vue, .js, .ts (not .spec.ts, not .test.ts)
 */
const vueSyntaxUpdates = () => {
  const files = glob.sync(params.paths || '**/*.{vue,js,ts}', { ignore: [...ignore, '**/*.spec.ts', '**/*.spec.js', '**/__tests__/**', '**/*.test.ts', 'jest.setup.js', '**/*.d.ts', '**/vue-shim.ts'] });

  // Helper functions
  const isSimpleIdentifier = (str) => /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(str.trim());
  const isBracketedExpression = (str) => str.trim().startsWith('[') && str.trim().endsWith(']');
  const isStringLiteral = (str) => /^['"].*['"]$/.test(str.trim());

  const replacementCases = [
    // Handle Vue.set
    [/\bVue\.set\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g, (match, obj, prop, val) => {
      prop = prop.trim();
      obj = obj.trim();
      val = val.trim();

      if (isBracketedExpression(prop)) {
        return `${ obj }${ prop } = ${ val }`;
      } else if (isStringLiteral(prop)) {
        return `${ obj }[${ prop }] = ${ val }`;
      } else if (isSimpleIdentifier(prop)) {
        return `${ obj }.${ prop } = ${ val }`;
      } else {
        return `${ obj }[${ prop }] = ${ val }`;
      }
    }, 'Replace Vue.set with direct assignment - https://vuejs.org/guide/extras/reactivity-in-depth.html'],

    // Handle this.$set
    [/\bthis\.\$set\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g, (match, obj, prop, val) => {
      prop = prop.trim();
      obj = obj.trim();
      val = val.trim();

      if (isBracketedExpression(prop)) {
        return `${ obj }${ prop } = ${ val }`;
      } else if (isStringLiteral(prop)) {
        return `${ obj }[${ prop }] = ${ val }`;
      } else if (isSimpleIdentifier(prop)) {
        return `${ obj }.${ prop } = ${ val }`;
      } else {
        return `${ obj }[${ prop }] = ${ val }`;
      }
    }, 'Replace this.$set with direct assignment - https://vuejs.org/guide/extras/reactivity-in-depth.html'],

    // Handle Vue.delete
    [/\bVue\.delete\(([^,]+),\s*([^)]+)\)/g, (match, obj, prop) => {
      prop = prop.trim();
      obj = obj.trim();

      if (isBracketedExpression(prop)) {
        return `delete ${ obj }${ prop }`;
      } else if (isStringLiteral(prop)) {
        return `delete ${ obj }[${ prop }]`;
      } else if (isSimpleIdentifier(prop)) {
        return `delete ${ obj }.${ prop }`;
      } else {
        return `delete ${ obj }[${ prop }]`;
      }
    }, 'Replace Vue.delete with delete operator - https://vuejs.org/guide/extras/reactivity-in-depth.html'],

    [/\bthis\.\$delete\(([^,]+),\s*([^)]+)\)/g, (match, obj, prop) => {
      prop = prop.trim();
      obj = obj.trim();

      if (isBracketedExpression(prop)) {
        return `delete ${ obj }${ prop }`;
      } else if (isStringLiteral(prop)) {
        return `delete ${ obj }[${ prop }]`;
      } else if (isSimpleIdentifier(prop)) {
        return `delete ${ obj }.${ prop }`;
      } else {
        return `delete ${ obj }[${ prop }]`;
      }
    }, 'Replace this.$delete with delete operator - https://vuejs.org/guide/extras/reactivity-in-depth.html'],

    // Replace Vue import with createApp and initialize vueApp
    [/import Vue from 'vue';?/g, `import { createApp } from 'vue';\nconst vueApp = createApp({});`, 'Replace Vue import with createApp - https://v3-migration.vuejs.org/breaking-changes/global-api.html#a-new-global-api-createapp'],

    // Replace new Vue({}) with createApp({})
    [/new Vue\(/g, 'createApp(', 'Replace new Vue with createApp - https://v3-migration.vuejs.org/breaking-changes/global-api.html#a-new-global-api-createapp'],

    // Replace Vue global methods with vueApp methods
    [/\bVue\.(config|directive|filter|mixin|component|use|prototype)\b/g, (match, method) => `vueApp.${ method }`, 'Replace Vue global methods with vueApp methods - https://v3-migration.vuejs.org/breaking-changes/global-api.html#a-new-global-api-createapp'],

    // Update Vue.prototype to vueApp.config.globalProperties
    [/Vue\.prototype/g, 'vueApp.config.globalProperties', 'Update Vue.prototype to vueApp.config.globalProperties - https://v3-migration.vuejs.org/breaking-changes/global-api.html#a-new-global-api-createapp'],

    // Remove Vue.util as it's no longer available
    [/Vue\.util/g, '', 'Vue.util is private and no longer available - https://v3-migration.vuejs.org/migration-build.html#partially-compatible-with-caveats'],

    // Replace vue-virtual-scroll-list with vue3-virtual-scroll-list
    [`vue-virtual-scroll-list`, `vue3-virtual-scroll-list`, 'library update'],

    // Update Vue.nextTick
    [/\bVue\.nextTick\b/g, 'nextTick', 'Update Vue.nextTick to nextTick - https://v3-migration.vuejs.org/breaking-changes/global-api-treeshaking.html#global-api-treeshaking'],
    [/\bthis\.nextTick\b/g, 'nextTick', 'Update this.nextTick to nextTick - https://v3-migration.vuejs.org/breaking-changes/global-api-treeshaking.html#global-api-treeshaking'],
    // Note: You may need to import nextTick from 'vue' where used.

    // Update props default function context
    [/(default)\(\)\s*\{([\s\S]*?)return\s+([\s\S]*?)\}/g, (match, def, middle, retVal) => `${ def }(props) {${ middle }return ${ retVal }}`, 'Update props default function context - https://v3-migration.vuejs.org/breaking-changes/props-default-this.html'],

    // Replace @input with @update:value (excluding plainInputEvent)
    [/@input="((?!.*plainInputEvent).+?)"/g, (_, handler) => `@update:value="${ handler }"`, 'Update @input to @update:value'],

    // Update v-model syntax
    [/v-model=/g, 'v-model:value=', 'Update v-model to v-model:value'],

    // Replace .sync modifier with v-model
    [/:([a-zA-Z0-9_-]+)\.sync=/g, 'v-model:$1=', 'Update .sync modifier to v-model'],

    // Replace click.native with click
    [/(\b@click)\.native/g, '$1', 'Remove .native modifier from @click'],

    // Remove v-on="$listeners"
    [/v-on="\$listeners"/g, '', 'Remove v-on="$listeners" as it is no longer needed - https://v3-migration.vuejs.org/breaking-changes/listeners-removed.html'],

    // Update :listeners="$listeners" to v-bind="$attrs"
    [/:listeners="\$listeners"/g, 'v-bind="$attrs"', 'Update :listeners="$listeners" to v-bind="$attrs" - https://v3-migration.vuejs.org/breaking-changes/listeners-removed.html'],

    // Update $scopedSlots to $slots
    [/\$scopedSlots/g, '$slots', 'Update $scopedSlots to $slots - https://v3-migration.vuejs.org/breaking-changes/slots-unification.html'],

    // Update slot-scope to v-slot
    [/slot-scope="([^"]+)"/g, 'v-slot="$1"', 'Update slot-scope to v-slot - https://vuejs.org/guide/components/slots.html#scoped-slots'],

    // Update this.$slots['name'] to this.$slots.name()
    [/this\.\$slots\['([^']+)'\]/g, `this.$slots[\'$1\']()`, `Update this.$slots['name'] to this.$slots.name() - https://vuejs.org/guide/components/slots.html#scoped-slots`],

    // Remove portal-vue components (now use Teleport)
    [/<\/?portal(-target)?\b[^>]*>/g, '', 'Remove portal components (use Teleport instead) - https://v3.vuejs.org/guide/teleport.html'],

    // Update custom directives hooks
    [/\binserted\s*\(/g, 'mounted(', 'Update inserted hook to mounted - https://v3-migration.vuejs.org/breaking-changes/custom-directives.html'],
    [/\bcomponentUpdated\s*\(/g, 'updated(', 'Update componentUpdated hook to updated - https://v3-migration.vuejs.org/breaking-changes/custom-directives.html'],
    [/\bunbind\b/g, 'unmounted', 'Update unbind hook to unmounted - https://v3-migration.vuejs.org/breaking-changes/custom-directives.html'],

    // Update hook events
    [/@hook:/g, '@vue:', 'Update @hook: events to @vue: - https://v3-migration.vuejs.org/breaking-changes/vnode-lifecycle-events.html'],

    // Remove events API ($on, $off, $once)
    [/\$on\(/g, '', 'Remove $on as the events API has been removed - https://v3-migration.vuejs.org/breaking-changes/events-api.html'],
    [/\$off\(/g, '', 'Remove $off as the events API has been removed - https://v3-migration.vuejs.org/breaking-changes/events-api.html'],
    [/\$once\(/g, '', 'Remove $once as the events API has been removed - https://v3-migration.vuejs.org/breaking-changes/events-api.html'],

    // Update Vuex store creation
    [/new Vuex\.Store\(/g, 'createStore(', 'Update Vuex store creation - https://vuex.vuejs.org/guide/migrating-to-4-0-from-3-x.html#installation-process'],
    [/import Vuex from 'vuex'/g, `import { createStore } from 'vuex'`, 'Update Vuex import - https://vuex.vuejs.org/guide/migrating-to-4-0-from-3-x.html#installation-process'],

    // Replace n-link with router-link
    [/<\/?n-link(\s|>)/g, (match) => match.replace('n-link', 'router-link'), 'Replace n-link with router-link'],

    // Replace v-popover with VDropdown
    [/\bv-popover\b/g, 'VDropdown', 'Replace v-popover with VDropdown'],
    [/<template\s+#popover>/g, '<template #popper>', 'Update slot name from #popover to #popper'],

    // Extra cases TBD (it seems like we already use the suggested way for arrays)
    // watch option used on arrays not triggered by mutations - https://v3-migration.vuejs.org/breaking-changes/watch.html
  ];

  replaceCases('vueSyntax', files, replacementCases, `Updating Vue syntax`);
};

/**
 * Vue Router
 * Files: .vue, .js, .ts
 */
const routerUpdates = () => {
  const files = glob.sync(params.paths || '**/*.{vue,js,ts}', { ignore });
  const replacementCases = [
    [`import Router from 'vue-router'`, `import { createRouter } from 'vue-router'`, 'Ensure correct import of createRouter'],
    [`vueApp.use(Router)`, `const router = createRouter({})`, 'Update router initialization'],
    [`Vue.use(Router)`, `const router = createRouter({})`, 'Update router initialization'],

    [/import\s*\{([^}]*)\s* RouteConfig\s*([^}]*)\}\s*from\s*'vue-router'/g, (match, before, after) => `import {${ before.trim() } RouteRecordRaw ${ after.trim() }} from 'vue-router'`, 'Update RouteConfig to RouteRecordRaw'],
    [/import\s*\{([^}]*)\s* Location\s*([^}]*)\}\s*from\s*'vue-router'/g, (match, before, after) => `import {${ before.trim() } RouteLocation ${ after.trim() }} from 'vue-router'`, 'Update Location to RouteLocation'],
    ['mode: \'history\'', 'history: createWebHistory()', 'Update router mode to history'],
  ];

  replaceCases('router', files, replacementCases, `Updating Vue Router`);
};

/**
 * Jest update
 * https://test-utils.vuejs.org/migration
 * Files: .spec.js, .spec.ts, .test.js, .test.ts
 */
// eslint-disable-next-line no-unused-vars
const jestUpdates = () => {
  const files = glob.sync(params.paths || '**/*.{test.js,test.ts}', { ignore });

  const cases = [
    ['config.mocks.$myGlobal', '', ''],
    ['createLocalVue', '', 'https://test-utils.vuejs.org/migration/#No-more-createLocalVue'],
    ['new Vuex.Store', '', ''],
    ['store', '', ''],
    ['propsData', 'props', 'https://test-utils.vuejs.org/migration/#propsData-is-now-props'],
    ['localVue.extend({})', '', ''],
    ['Vue.nextTick', '', ''],
    ['$destroy', '$unmount', 'https://test-utils.vuejs.org/migration/#destroy-is-now-unmount-to-match-Vue-3'],
    ['mocks', '', 'https://test-utils.vuejs.org/migration/#mocks-and-stubs-are-now-in-global'],
    ['stubs', '', 'https://test-utils.vuejs.org/migration/#mocks-and-stubs-are-now-in-global'],
    ['mixins', '', 'https://test-utils.vuejs.org/migration/#mocks-and-stubs-are-now-in-global'],
    ['plugins', '', 'https://test-utils.vuejs.org/migration/#mocks-and-stubs-are-now-in-global'],
    ['component', '', 'https://test-utils.vuejs.org/migration/#mocks-and-stubs-are-now-in-global'],
    ['directives', '', 'https://test-utils.vuejs.org/migration/#mocks-and-stubs-are-now-in-global'],
    ['slots', '', 'slots‘s scope is now exposed as params https://test-utils.vuejs.org/migration/#slots-s-scope-is-now-exposed-as-params'],
    ['scopedSlots', '', 'scopedSlots is now merged with slots https://test-utils.vuejs.org/migration/#scopedSlots-is-now-merged-with-slots'],
    ['parentComponent', '', 'deprecated '],
    ['contains', 'find', 'deprecated '],
    ['config.global.renderStubDefaultSlot = false', '', ''],
    ['findAll().at(0)', '', '']
  ];

  replaceCases('jest', files, cases, `Updating Jest`);
};

/**
 * Jest config updates
 * Files: jest.config.js, .json, .ts
 *
 * /node_modules/@vue/vue2-jest --> reference needs new library version
 */
const jestConfigUpdates = () => {
  const files = glob.sync(params.paths || '**/jest.config.{js,ts,json}', { ignore });
  const cases = [
    ['/node_modules/@vue/vue2-jest', '/node_modules/@vue/vue3-jest']
  ];

  replaceCases('jest', files, cases, `Updating Jest config`);
};

/**
 * ESLint Updates
 * Files: .eslintrc.js, .eslintrc.json, .eslintrc.yml
 */
const eslintUpdates = () => {
  const files = glob.sync(params.paths || '**/.eslintrc.*{js,json,yml}', { ignore });
  const replacePlugins = [
    ['plugin:vue/essential', 'plugin:vue/vue3-essential'],
    ['plugin:vue/strongly-recommended', 'plugin:vue/vue3-strongly-recommended'],
    ['plugin:vue/recommended', 'plugin:vue/vue3-recommended']
  ];
  const newRules = {
    'vue/one-component-per-file':       'off',
    'vue/no-deprecated-slot-attribute': 'off',
    'vue/require-explicit-emits':       'off',
    'vue/v-on-event-hyphenation':       'off',
  };

  files.forEach((file) => {
    const originalContent = fs.readFileSync(file, 'utf8');
    let content = originalContent;
    const matchedCases = [];

    replacePlugins.forEach(([text, replacement]) => {
      if (content.includes(text)) {
        content = content.replaceAll(text, replacement);
        matchedCases.push([text, replacement]);

        writeContent(file, content, originalContent);
      }
    });

    const eslintConfigPath = path.join(process.cwd(), `${ file }`);
    let eslintConfig;

    try {
      eslintConfig = require(eslintConfigPath);
    } catch (error) {
      eslintConfig = {};
    }

    if (!eslintConfig.rules) {
      eslintConfig.rules = {};
    }

    Object.keys(newRules).forEach((rule) => {
      if (!eslintConfig.rules[rule]) {
        eslintConfig.rules[rule] = newRules[rule];
        matchedCases.push(rule);
      }
    });

    if (matchedCases.length) {
      const updatedConfig = `module.exports = ${ JSON.stringify(eslintConfig, null, 2) }`;

      writeContent(file, updatedConfig, originalContent);
      printContent(file, `Updating ESLint`, matchedCases);
      stats.eslint.push(file);
      stats.total.push(file);
    }
  });
};

/**
 * TS Updates
 * Files: tsconfig*.json
 *
 * Add information about TS issues, recommend @ts-nocheck as temporary solution
 */
const tsUpdates = () => {
  console.warn('TS checks are stricter and may require to be fixed manually.',
    'Use @ts-nocheck to give you time to fix them.',
    'Add exception to your ESLint config to avoid linting errors.');
  // TODO: Add case
};

/**
 * Update styles (e.g., replace ::v-deep with :deep)
 */
const stylesUpdates = () => {
  const files = glob.sync(params.paths || '**/*.{vue,scss,css}', { ignore });
  const cases = [
    // Replace '::v-deep' without parentheses with ':deep()'
    [/::v-deep(?!\()/g, ':deep()', 'Replace ::v-deep with :deep()'],
    // Replace '::v-deep(' with ':deep('
    [/::v-deep\(/g, ':deep(', 'Replace ::v-deep( with :deep('],
  ];

  replaceCases('style', files, cases, `Updating styles`);
};

/**
 * Function to write content to files or generate diffs in suggest mode
 */
const writeContent = (file, content, originalContent) => {
  if (!isDry && !isSuggest) {
    fs.writeFileSync(file, content);
  } else if (isSuggest) {
    // Ensure originalContent is defined
    if (typeof originalContent === 'undefined') {
      originalContent = fs.readFileSync(file, 'utf8');
    }
    // Generate diff with limited context and store in diffOutput
    const diff = createPatch(file, originalContent, content, '', '', { context: 3 });

    if (diff.trim()) {
      diffOutput.push({ file, diff });
    }
  }
};

/**
 * Function to print content based on verbosity
 */
const printContent = (...args) => {
  if (isVerbose) {
    console.log(...args);
  }
};

/**
 * Replace cases in files based on provided patterns
 */
const replaceCases = (fileType, files, replacementCases, printText) => {
  files.forEach((file) => {
    const originalContent = fs.readFileSync(file, 'utf8');
    let content = originalContent;
    const matchedCases = [];

    replacementCases.forEach(([pattern, replacement, notes]) => {
      let matches = false;

      // Simple text replacement
      if (typeof pattern === 'string') {
        const regex = new RegExp(escapeRegExp(pattern), 'g');

        if (regex.test(content)) {
          matches = true;
          content = content.replace(regex, replacement);
        }
      } else if (pattern.test(content)) {
        matches = true;
        content = content.replace(pattern, replacement);
      }

      if (matches) {
        matchedCases.push({
          pattern: pattern.toString(), replacement, notes
        });
      }
    });

    if (matchedCases.length) {
      writeContent(file, content, originalContent);
      printContent(file, printText, matchedCases);
      stats[fileType].push(file);
      stats.total.push(file);
    }
  });
};

/**
 * Utility function to escape special regex characters in a string
 */
const escapeRegExp = (string) => {
  return string.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Print migration statistics and diffs if in suggest mode
 */
const printLog = () => {
  if (process.argv.includes('--files')) {
    console.dir(stats, { compact: true });
  }

  const statsCount = Object.entries(stats).reduce((acc, [key, value]) => ({
    ...acc,
    [key]: value.length
  }), {});

  console.table(statsCount);

  if (isSuggest && diffOutput.length > 0) {
    const diffFile = 'suggested_changes.diff';
    let diffContent = '';

    diffOutput.forEach(({ file, diff }) => {
      diffContent += `--- ${ file }\n+++ ${ file }\n${ diff }\n`;
    });

    fs.writeFileSync(diffFile, diffContent);
    console.log(`\nSuggested changes have been written to ${ diffFile }`);
  }

  if (process.argv.includes('--log')) {
    fs.writeFileSync('stats.json', JSON.stringify(stats, null, 2));
  }
};

/**
 * Parse command-line arguments
 */
const setParams = () => {
  const args = process.argv.slice(2);
  const paramKeys = ['paths', 'ignore'];

  args.forEach((val) => {
    paramKeys.forEach((key) => {
      if (val.startsWith(`--${ key }=`)) {
        const value = val.split('=')[1];

        if (key === 'ignore') {
          params.ignorePatterns = value.split(',').map((pattern) => pattern.trim());
        } else {
          params[key] = value;
        }
      }
    });
  });

  // Add user-specified ignore patterns
  if (params.ignorePatterns.length > 0) {
    ignore = ignore.concat(params.ignorePatterns);
  }
};

/**
 * Main function to initiate migration
 */
(function() {
  setParams();

  packageUpdates();
  // gitHubActionsUpdates();
  nvmUpdates();
  vueConfigUpdates();
  vueSyntaxUpdates();
  jestUpdates();
  jestConfigUpdates();
  routerUpdates();
  eslintUpdates();
  tsUpdates();
  stylesUpdates();

  printLog();
})();
