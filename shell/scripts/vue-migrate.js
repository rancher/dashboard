#!/usr/bin/node
/* eslint-disable no-console */

const fs = require('fs');
const glob = require('glob');
const semver = require('semver');
const path = require('path');

/**
 * Init logger
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
const ignore = [
  '**/node_modules/**',
  '**/dist/**',
  '**/scripts/vue-migrate.js',
  'docusaurus/**',
  'storybook-static/**',
  'storybook/**',
];
const nodeRequirement = '20.0.0';
const isDry = process.argv.includes('--dry');
const isVerbose = process.argv.includes('--verbose');
const removePlaceholder = 'REMOVE';
const params = { paths: null };

/**
 * Package updates
 * Files: package.json
 */
const packageUpdates = () => {
  const files = glob.sync(params.paths || '**/package.json', { ignore });

  files.forEach((file) => {
    let content = fs.readFileSync(file, 'utf8');
    const toReplaceNode = false;

    // TODO: Refactor and loop?
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

    if (replaceLibraries || toReplaceNode || replaceResolution) {
      stats.total.push(file);
    }
  });
};

/**
 * Verify package vue related libraries versions
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
            // Replace with a new library if present, due breaking changes in Vue3
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
        }
      });
    }
  });

  return [content, replaceLibraries];
};

/**
 * Verify package engines node to latest
 */
const packageUpdatesEngine = (file, oldContent) => {
  let content = oldContent;
  let parsedJson = JSON.parse(content);
  const replaceNode = [];

  // Verify package engines node to latest
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

  files.forEach((file) => {
    if (file) {
      let content = fs.readFileSync(file, 'utf8');
      const nodeVersionMatch = content.match(/([0-9.x]+)/g);
      const nodeVersion = semver.coerce(nodeVersionMatch[0]);

      // Ensure node version is up to date
      if (nodeVersion && semver.lt(nodeVersion, semver.coerce(nodeRequirement))) {
        printContent(file, `Updating node ${ [nodeVersionMatch[0], nvmRequirement] }`);
        content = content.replaceAll(nodeVersionMatch[0], nvmRequirement);

        writeContent(file, content);
        stats.nvmrc.push(file);
        stats.total.push(file);
      }
    } else {
      writeContent('.nvmrc', nvmRequirement);
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
    const content = fs.readFileSync(file, 'utf8');

    // Verify vue.config presence of deprecated Webpack5 options
    if (content.includes('devServer.public: \'path\'')) {
      stats.webpack.push(file);
      stats.total.push(file);
      // TODO: Add replacement
    }
  });
};

/**
 * Vue syntax update (to do not mix with tests)
 * Files: .vue, .js, .ts (not .spec.ts, not .test.ts)
 */
const vueSyntaxUpdates = () => {
  const files = glob.sync(params.paths || '**/*.{vue,js,ts}', { ignore: [...ignore, '**/*.spec.ts', '**/__tests__/**', '**/*.test.ts', 'jest.setup.js', '**/*.d.ts', '**/vue-shim.ts'] });
  const replacementCases = [
    // Prioritize set and delete to be converted since removed in Vue3
    [/\=\> Vue\.set\((.*?),\s*(.*?),\s*(.*?)\)/g, (_, obj, prop, val) => `=> (${ obj.trim() }[${ prop.trim() }] = ${ val.trim() })`, 'removed and unnecessary due new reactivity https://vuejs.org/guide/extras/reactivity-in-depth.html'],
    [/\=\> Vue\.set\((.*?),\s*'([^']*?)',\s*\{([\s\S]*?)\}\)/g, (_, obj, prop, val) => `=> (${ obj.trim() }['${ prop }'] = {${ val.trim() }})`, 'removed and unnecessary due new reactivity https://vuejs.org/guide/extras/reactivity-in-depth.html'],
    [/\=\> Vue\.set\((.*?),\s*'([^']*?)',\s*(.*?)\)/g, (_, obj, prop, val) => `=> (${ obj.trim() }.${ prop } = ${ val.trim() })`, 'removed and unnecessary due new reactivity https://vuejs.org/guide/extras/reactivity-in-depth.html'],

    [/Vue\.set\((.*?),\s*(.*?),\s*(.*?)\)/g, (_, obj, prop, val) => `${ obj.trim() }[${ prop.trim() }] = ${ val.trim() }`, 'removed and unnecessary due new reactivity https://vuejs.org/guide/extras/reactivity-in-depth.html'],
    [/Vue\.set\((.*?),\s*'([^']*?)',\s*\{([\s\S]*?)\}\)/g, (_, obj, prop, val) => `${ obj.trim() }['${ prop }'] = {${ val.trim() }}`, 'removed and unnecessary due new reactivity https://vuejs.org/guide/extras/reactivity-in-depth.html'],
    [/Vue\.set\((.*?),\s*'([^']*?)',\s*(.*?)\)/g, (_, obj, prop, val) => `${ obj.trim() }.${ prop } = ${ val.trim() }`, 'removed and unnecessary due new reactivity https://vuejs.org/guide/extras/reactivity-in-depth.html'],
    [/Vue\.delete\((.*?),\s*(.*?)\)/g, (_, obj, prop) => `delete ${ obj.trim() }[${ prop.trim() }]`, 'removed and unnecessary due new reactivity https://vuejs.org/guide/extras/reactivity-in-depth.html'],

    [/\=\> this\.\$set\((.*?),\s*(.*?),\s*(.*?)\)/g, (_, obj, prop, val) => `=> (${ obj.trim() }[${ prop.trim() }] = ${ val.trim() })`, 'removed and unnecessary due new reactivity https://vuejs.org/guide/extras/reactivity-in-depth.html'],
    [/\=\> this\.\$set\((.*?),\s*'([^']*?)',\s*\{([\s\S]*?)\}\)/g, (_, obj, prop, val) => `=> (${ obj.trim() }['${ prop }'] = {${ val.trim() }})`, 'removed and unnecessary due new reactivity https://vuejs.org/guide/extras/reactivity-in-depth.html'],
    [/\=\> this\.\$set\((.*?),\s*'([^']*?)',\s*(.*?)\)/g, (_, obj, prop, val) => `=> (${ obj.trim() }.${ prop } = ${ val.trim() })`, 'removed and unnecessary due new reactivity https://vuejs.org/guide/extras/reactivity-in-depth.html'],

    [/this.\$set\((.*?),\s*'([^']*?)',\s*(.*?)\)/g, (_, obj, prop, val) => obj.trim() === 'this' ? `this['${ prop }'] = ${ val }` : `${ obj.trim() }['${ prop }'] = ${ val }`, 'removed and unnecessary due new reactivity https://vuejs.org/guide/extras/reactivity-in-depth.html'],

    [/this\.\$set\((.*?),\s*(.*?),\s*(.*?)\)/g, (_, obj, prop, val) => `${ obj.trim() }[${ prop.trim() }] = ${ val.trim() }`, 'removed and unnecessary due new reactivity https://vuejs.org/guide/extras/reactivity-in-depth.html'],
    [/this\.\$set\((.*?),\s*'([^']*?)',\s*\{([\s\S]*?)\}\)/g, (_, obj, prop, val) => `${ obj.trim() }['${ prop }'] = {${ val.trim() }}`, 'removed and unnecessary due new reactivity https://vuejs.org/guide/extras/reactivity-in-depth.html'],
    [/this\.\$set\((.*?),\s*'([^']*?)',\s*(.*?)\)/g, (_, obj, prop, val) => `${ obj.trim() }.${ prop } = ${ val.trim() }`, 'removed and unnecessary due new reactivity https://vuejs.org/guide/extras/reactivity-in-depth.html'],
    [/this\.\$delete\((.*?),\s*(.*?)\)/g, (_, obj, prop) => `delete ${ obj.trim() }[${ prop.trim() }]`, 'removed and unnecessary due new reactivity https://vuejs.org/guide/extras/reactivity-in-depth.html'],

    // Replace imports for all the cases where createApp is needed, before the rest of the replacements
    [/import Vue from 'vue';?/g, `import { createApp } from \'vue\';\nconst vueApp = createApp({});`, `https://v3-migration.vuejs.org/breaking-changes/global-api.html#a-new-global-api-createapp`],
    [`new Vue(`, `createApp(`, `https://v3-migration.vuejs.org/breaking-changes/global-api.html#a-new-global-api-createapp`],
    [`Vue.config`, `vueApp.config`, `https://v3-migration.vuejs.org/breaking-changes/global-api.html#a-new-global-api-createapp`],
    [`Vue.directive`, `vueApp.directive`, `https://v3-migration.vuejs.org/breaking-changes/global-api.html#a-new-global-api-createapp`],
    [`Vue.filter(`, `vueApp.filter(`, `https://v3-migration.vuejs.org/breaking-changes/global-api.html#a-new-global-api-createapp`],
    [`Vue.mixin(`, `vueApp.mixin(`, `https://v3-migration.vuejs.org/breaking-changes/global-api.html#a-new-global-api-createapp`],
    [`Vue.component(`, `vueApp.component(`, `https://v3-migration.vuejs.org/breaking-changes/global-api.html#a-new-global-api-createapp`],
    [`Vue.use(`, `vueApp.use(`, `https://v3-migration.vuejs.org/breaking-changes/global-api.html#a-new-global-api-createapp`],
    [`Vue.prototype`, `vueApp.config.globalProperties`, `https://v3-migration.vuejs.org/breaking-changes/global-api.html#a-new-global-api-createapp`],
    ['Vue.util', '', 'Vue.util is private and no longer available https://v3-migration.vuejs.org/migration-build.html#partially-compatible-with-caveats'],
    // [`Vue.extend`, removePlaceholder, 'https://v3-migration.vuejs.org/breaking-changes/global-api.html#vue-extend-removed'],
    // [`Vue.extend`, `createApp({})`], //  (mixins)

    [`vue-virtual-scroll-list`, `vue3-virtual-scroll-list`, 'library update'],

    [`Vue.nextTick`, `nextTick`, 'https://v3-migration.vuejs.org/breaking-changes/global-api-treeshaking.html#global-api-treeshaking'],
    [`this.nextTick`, `nextTick`, 'https://v3-migration.vuejs.org/breaking-changes/global-api-treeshaking.html#global-api-treeshaking'],
    // TODO: Add missing import

    [/( {4,}default)\(\)\s*\{([\s\S]*?)this\.([\s\S]*?\}\s*\})/g, (_, before, middle, after) => `${ before }(props) {${ middle }props.${ after }`, 'https://v3-migration.vuejs.org/breaking-changes/props-default-this.html'],
    // [`value=`, `modelValue=`],
    // [`@input=`, `@update:modelValue=`],
    [/\@input=\"((?!.*plainInputEvent).+)\"/g, (_, betweenQuotes) => `@update:value="${ betweenQuotes }"`], // Matches @input while avoiding `@input="($plainInputEvent) => onInput($plainInputEvent)"` which we used on plain <input elements since they differ in vue3
    [`v-model=`, `v-model:value=`],
    // [`v-bind.sync=`, `:modelValue=`, `https://v3-migration.vuejs.org/breaking-changes/v-model.html#using-v-bind-sync`],
    // ['v-model=', ':modelValue=', ''],
    [/:([a-z-0-9]+)\.sync/g, (_, propName) => `v-model:${ propName }`, `https://v3-migration.vuejs.org/breaking-changes/v-model.html#migration-strategy`],
    [`click.native`, `click`, `https://v3-migration.vuejs.org/breaking-changes/v-model.html#using-v-bind-sync`],
    [`v-on="$listeners"`, removePlaceholder, `removed and integrated with $attrs https://v3-migration.vuejs.org/breaking-changes/listeners-removed.html`],
    [`:listeners="$listeners"`, `:v-bind="$attrs"`, `removed and integrated with $attrs https://v3-migration.vuejs.org/breaking-changes/listeners-removed.html`],

    [/this\.\$scopedSlots\[(\w+)\]|this\.\$scopedSlots\.(\w+)/, (match, key1, key2) => `this.$slots.${ key1 || key2 }()`, `(many components loop through them) https://v3-migration.vuejs.org/breaking-changes/slots-unification.html`],
    [` $scopedSlots`, ` $slots`, `(many components loop through them) https://v3-migration.vuejs.org/breaking-changes/slots-unification.html`],
    [/slot="(\w+:\w+)"\s+slot-scope="(\w+)"/g, `$1="$2"`, `not mentioned in migration https://vuejs.org/guide/components/slots.html#scoped-slots`],
    [/this\.\$slots\['([^']+)'\]/g, `this.$slots[\'$1\']()`, `not mentioned in migration https://vuejs.org/guide/components/slots.html#scoped-slots`],
    // [/this\.\$slots\.([^']+)'/g, `this.$slots.$1()`, `not mentioned in migration https://vuejs.org/guide/components/slots.html#scoped-slots`],
    // [/this\.\$slots(?!\s*\(\))(\b|\?|['"\[])/g, `this.$slots()$1`, `https://eslint.vuejs.org/rules/require-slots-as-functions.html`], // TODO: Add exception for existing brackets

    // Portals are now Vue3 Teleports
    [/<portal|<portal-target|<\/portal|<\/portal-target/g, '', `https://v3.vuejs.org/guide/teleport.html`],

    // TODO: probably requires JSDom
    // [/<template v-for="([\s\S]*?)">\s*<([\s\S]*?)\s*([\s\S]*?):key="([\s\S]*?)"([\s\S]*?)<\/([\s\S]*?)>\s*<\/template>/gs, '<template v-for="$1" :key="$4"><$3 $5>$6</$7>\n</template>', `https://v3-migration.vuejs.org/breaking-changes/key-attribute.html#with-template-v-for`],
    // [/(<\w+(?!.*?v-for=)[^>]*?)\s*:key="[^"]*"\s*([^>]*>)/g, '$1$2', `https://v3-migration.vuejs.org/breaking-changes/key-attribute.html#with-template-v-for`],
    [/(<\w+[^>v\-for]*?):key="[^"]*"\s*([^>]*>)/g, '$1$2', `https://v3-migration.vuejs.org/breaking-changes/key-attribute.html#with-template-v-for`],
    [/(\<\w+\s+(?:[^>]*?\s+)?v-for="\(.*?,\s*(\w+)\s*\).*?")(?:\s*:key=".*"\s*)?([^>]*>)/g, '$1 :key="$2"$3', `https://v3-migration.vuejs.org/breaking-changes/key-attribute.html#with-template-v-for`],
    [/(\<\w+\s+(?:[^>]*?\s+)?)v-for="(?!\*?\s+.*?\s+.*?)([^,]+?)\s+in\s+([^"]+?)"(?:\s*:key=".*"\s*)?([^>]*>)/g, '$1 v-for="($2, i) in $3" :key="i" $4', `https://v3-migration.vuejs.org/breaking-changes/key-attribute.html#with-template-v-for`],

    // TODO: except for <components /> elements, probably requires JSDom
    // [' is=', ``, `https://v3-migration.vuejs.org/breaking-changes/custom-elements-interop.html#customized-built-in-elements`],
    // [' :is=', ``, `https://v3-migration.vuejs.org/breaking-changes/custom-elements-interop.html#customized-built-in-elements`],

    // Directive updates
    // [`bind(`, '', `beforeMount( but there's too many bind cases https://v3-migration.vuejs.org/breaking-changes/custom-directives.html`], // TODO: Restrict to directives and context
    // [`update(`, '', `removed, also common term https://v3-migration.vuejs.org/breaking-changes/custom-directives.html`], // TODO: Restrict to directives and context
    [`inserted(`, `mounted(`, 'https://v3-migration.vuejs.org/breaking-changes/custom-directives.html'],
    [`componentUpdated(`, `updated(`, 'https://v3-migration.vuejs.org/breaking-changes/custom-directives.html'],
    [`unbind`, `unmounted`, 'https://v3-migration.vuejs.org/breaking-changes/custom-directives.html'],

    // [`propsData (app creation)`, ``, `use second argument of createApp({}) https://v3-migration.vuejs.org/breaking-changes/props-data.html`],
    [`@hook:lifecycleHook`, `@vue:lifecycleHook`, `https://v3-migration.vuejs.org/breaking-changes/vnode-lifecycle-events.html`],

    // Nuxt and initalize case only
    // TODO: Use eventbus replacement as temporary solution?
    [`$on('event', callback)`, '', `no migration, existing lib, https://v3-migration.vuejs.org/breaking-changes/events-api.html`],
    [`$off('event', callback)`, '', `no migration, existing lib, https://v3-migration.vuejs.org/breaking-changes/events-api.html`],
    [`$once('event', callback)`, '', `no migration, existing lib, https://v3-migration.vuejs.org/breaking-changes/events-api.html`],

    // [`$children`, ``, `no migration, $refs are suggested as communication https://v3-migration.vuejs.org/breaking-changes/children.html`],

    // Vuex
    [`new Vuex.Store(`, `createStore(`, 'To install Vuex to a Vue instance, pass the store instead of Vuex https://vuex.vuejs.org/guide/migrating-to-4-0-from-3-x.html#installation-process'],
    [`import Vuex from 'vuex'`, `import { createStore } from 'vuex'`, 'To install Vuex to a Vue instance, pass the store instead of Vuex https://vuex.vuejs.org/guide/migrating-to-4-0-from-3-x.html#installation-process'],

    // Extra cases TBD (it seems like we already use the suggested way for arrays)
    // watch option used on arrays not triggered by mutations https://v3-migration.vuejs.org/breaking-changes/watch.html
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
    [`import Router from 'vue-router'`, `import { createRouter } from 'vue-router'`],
    [`Vue.use(Router)`, `const router = createRouter({})`],
    // [`currentRoute`, '', 'The currentRoute property is now a ref() https://router.vuejs.org/guide/migration/#The-currentRoute-property-is-now-a-ref-'],
    [/import\s*\{([^}]*)\s* RouteConfig\s*([^}]*)\}\s*from\s*'vue-router'/g, (match, before, after) => `import {${ before.trim() } RouteRecordRaw ${ after.trim() }} from 'vue-router'`],
    [/import\s*\{([^}]*)\s* Location\s*([^}]*)\}\s*from\s*'vue-router'/g, (match, before, after) => `import {${ before.trim() } RouteLocation ${ after.trim() }} from 'vue-router'`],
    ['imported Router', ''],
    ['router.name', '', 'now string | Symbol'],
    [`mode: \'history\'`, 'history: createWebHistory()'],
    // ['getMatchedComponents', '', 'https://router.vuejs.org/guide/migration/#Removal-of-router-getMatchedComponents-'],
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
  // Add cases introduced with new recommended settings
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
    let content = fs.readFileSync(file, 'utf8');
    const matchedCases = [];

    replacePlugins.forEach(([text, replacement]) => {
      const isCase = content.includes(text);

      if (isCase) {
        content = content.replaceAll(text, replacement);
        matchedCases.push([text, replacement]);

        writeContent(file, content);
      }
    });

    // Add the new rules if they don't exist
    const eslintConfigPath = path.join(process.cwd(), `${ file }`);
    const eslintConfig = require(eslintConfigPath);

    Object.keys(newRules).forEach((rule) => {
      if (!eslintConfig.rules[rule]) {
        eslintConfig.rules[rule] = newRules[rule];
        matchedCases.push(rule);
      }
    });
    writeContent(eslintConfigPath, `module.exports = ${ JSON.stringify(eslintConfig, null, 2) }`);

    if (matchedCases.length) {
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
 * Styles updates
 */
const stylesUpdates = () => {
  const files = glob.sync(params.paths || '**/*.{vue, scss}', { ignore });
  const cases = [
    ['::v-deep', ':deep()'],
  ];

  replaceCases('style', files, cases, `Updating styles`);
};

/**
 * Hook to write content
 */
const writeContent = (...args) => {
  if (!isDry) {
    fs.writeFileSync(...args);
  }
};

/**
 * Hook to print content
 */
const printContent = (...args) => {
  if (isVerbose) {
    console.log(...args);
  }
};

/**
 * Replace all cases for the provided files
 */
const replaceCases = (fileType, files, replacementCases, printText) => {
  files.forEach((file) => {
    const matchedCases = [];
    let content = fs.readFileSync(file, 'utf8');

    replacementCases.forEach(([text, replacement, notes]) => {
      // Simple text
      if (typeof text === 'string') {
        if (content.includes(text)) {
          // Exclude cases without replacement
          if (replacement) {
            // Remove discontinued functionalities which do not break
            content = content.replaceAll(text, replacement === removePlaceholder ? '' : replacement);
          }
          if (!matchedCases.includes(`${ text }, ${ replacement }, ${ notes }`)) {
            matchedCases.push(`${ text }, ${ replacement }, ${ notes }`);
          }
        }
      } else {
        // Regex case
        // TODO: Fix issue not replacing all
        if (text.test(content) && replacement) {
          content = content.replace(new RegExp(text, 'g'), replacement);
          if (!matchedCases.includes(`${ text }, ${ replacement }, ${ notes }`)) {
            matchedCases.push(`${ text }, ${ replacement }, ${ notes }`);
          }
        }
      }
    });

    if (matchedCases.length) {
      writeContent(file, content);
      printContent(file, printText, matchedCases);
      stats[fileType].push(file);
      stats.total.push(file);
    }
  });
};

/**
 * Print log
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

  if (process.argv.includes('--log')) {
    fs.writeFileSync('stats.json', JSON.stringify(stats, null, 2));
  }
};

const setParams = () => {
  const args = process.argv.slice(2);
  const paramKeys = ['paths'];

  args.forEach((val) => {
    paramKeys.forEach((key) => {
      if (val.startsWith(`--${ key }=`)) {
        params[key] = val.split('=')[1];
      }
    });
  });
};

/**
 * Init application
 */
(function() {
  setParams();

  packageUpdates();
  gitHubActionsUpdates();
  nvmUpdates();
  vueConfigUpdates();
  vueSyntaxUpdates();
  routerUpdates();
  // jestUpdates();
  jestConfigUpdates();
  eslintUpdates();
  tsUpdates();
  stylesUpdates();

  printLog();
})();
