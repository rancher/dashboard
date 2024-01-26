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

/**
 * Package updates
 * Files: package.json
 */
const packageUpdates = () => {
  const files = glob.sync('**/package.json', { ignore });

  files.forEach((file) => {
    let content = fs.readFileSync(file, 'utf8');
    const parsedJson = JSON.parse(content);
    const toReplaceNode = false;

    // TODO: Refactor and loop?
    const [librariesContent, replaceLibraries] = packageUpdatesLibraries(file, content, parsedJson);

    if (replaceLibraries.length) {
      content = librariesContent;
      printContent(file, `Updating`, replaceLibraries);
      stats.libraries.push(file);
    }

    const [nodeContent, replaceNode] = packageUpdatesEngine(file, content, parsedJson);

    if (replaceNode.length) {
      printContent(file, `Updating node`, replaceNode);
      content = nodeContent;
      stats.node.push(file);
    }

    const [resolutionContent, replaceResolution] = packageUpdatesResolution(file, content, parsedJson);

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
const packageUpdatesLibraries = (file, oldContent, parsedJson) => {
  let content = oldContent;
  const replaceLibraries = [];
  const types = ['dependencies', 'devDependencies', 'peerDependencies'];
  // [Library name, new version or new library, new library version]
  const librariesUpdates = [
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
    ['require-extension-hooks-babel', '1.0.0'],
    ['require-extension-hooks-vue', '3.0.0'],
    ['require-extension-hooks', '0.3.3'],
    ['sass-loader', '~12.0.0'],
    ['typescript', '~4.5.5'],
    ['vue-router', '~4.0.3'],
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

          // Replace with a new library if present, due breaking changes in Vue3
          if (newLibraryVersion) {
            replaceLibraries.push([library, [parsedJson[type][library], newVersion, newLibraryVersion]]);
            content = content.replaceAll(`"${ library }": "${ parsedJson[type][library] }"`, `"${ newVersion }": "${ newLibraryVersion }"`);
            writeContent(file, content);
          } else if (version && semver.lt(version, semver.coerce(newVersion))) {
            // Update library version if outdated
            replaceLibraries.push([library, [parsedJson[type][library], newVersion]]);
            content = content.replaceAll(`"${ library }": "${ parsedJson[type][library] }"`, `"${ library }": "${ newVersion }"`);
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
const packageUpdatesEngine = (file, oldContent, parsedJson) => {
  let content = oldContent;
  const replaceNode = [];

  // Verify package engines node to latest
  if (parsedJson.engines) {
    const outdated = semver.lt(semver.coerce(parsedJson.engines.node), semver.coerce(nodeRequirement));

    if (outdated) {
      replaceNode.push([parsedJson.engines.node, nodeRequirement]);
      content = content.replaceAll(`"node": "${ parsedJson.engines.node }"`, `"node": ">=${ nodeRequirement }"`);
      writeContent(file, content);
    }
  }

  return [content, replaceNode];
};

/**
 * Add resolutions for VueCLI
 */
const packageUpdatesResolution = (file, oldContent, parsedJson) => {
  let content = oldContent;
  const replaceResolution = [];
  const resolutions = [
    ['@vue/cli-service/html-webpack-plugin', '^5.0.0'],
  ];

  // Verify package engines node to latest
  if (parsedJson.resolutions) {
    resolutions.forEach(([library, newVersion]) => {
      // Add resolution if not present
      if (!parsedJson.resolutions[library]) {
        parsedJson.resolutions[library] = newVersion;
        content = JSON.stringify(parsedJson, null, 2);
        writeContent(file, content);
      } else {
        // Ensure resolution version is up to date
        const outdated = semver.lt(semver.coerce(parsedJson.resolutions[library]), semver.coerce(newVersion));

        if (outdated) {
          replaceResolution.push([parsedJson.engines.node, nodeRequirement]);
          content = content.replaceAll(`"${ library }": "${ parsedJson.resolutions[library] }"`, `"${ library }": "${ newVersion }"`);
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
  const files = glob.sync('.github/workflows/**.{yml,yaml}', { ignore });

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
  const files = glob.sync('**/.nvmrc', { ignore });

  files.forEach((file) => {
    if (file) {
      let content = fs.readFileSync(file, 'utf8');
      const nodeVersionMatch = content.match(/([0-9.x]+)/g);
      const nodeVersion = semver.coerce(nodeVersionMatch[0]);

      // Ensure node version is up to date
      if (nodeVersion && semver.lt(nodeVersion, semver.coerce(nodeRequirement))) {
        printContent(file, `Updating node ${ [nodeVersionMatch[0], nodeRequirement] }`);
        content = content.replaceAll(nodeVersionMatch[0], nodeRequirement);

        writeContent(file, content);
        stats.nvmrc.push(file);
        stats.total.push(file);
      }
    } else {
      writeContent('.nvmrc', nodeRequirement);
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
  const files = glob.sync('vue.config**.js', { ignore });

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
  const files = glob.sync('**/*.{vue,js,ts}', { ignore: [...ignore, '**/*.spec.ts', '**/__tests__/**', '**/*.test.ts', 'jest.setup.js', '**/*.d.ts', '**/vue-shim.ts'] });
  const removePlaceholder = 'REMOVE';
  const replacementCases = [
    // Prioritize set and delete to be converted since removed in Vue3
    [/Vue\.set\((.*?),\s*(.*?),\s*(.*?)\)/g, (_, obj, prop, val) => `${ obj.trim() }[${ prop.trim() }] = ${ val.trim() }`, 'removed and unnecessary due new reactivity https://vuejs.org/guide/extras/reactivity-in-depth.html'],
    [/Vue\.set\((.*?),\s*'([^']*?)',\s*\{([\s\S]*?)\}\)/g, (_, obj, prop, val) => `${ obj.trim() }['${ prop }'] = {${ val.trim() }}`, 'removed and unnecessary due new reactivity https://vuejs.org/guide/extras/reactivity-in-depth.html'],
    [/Vue\.set\((.*?),\s*'([^']*?)',\s*(.*?)\)/g, (_, obj, prop, val) => `${ obj.trim() }.${ prop } = ${ val.trim() }`, 'removed and unnecessary due new reactivity https://vuejs.org/guide/extras/reactivity-in-depth.html'],
    [/Vue\.delete\((.*?),\s*(.*?)\)/g, (_, obj, prop) => `delete ${ obj.trim() }[${ prop.trim() }]`, 'removed and unnecessary due new reactivity https://vuejs.org/guide/extras/reactivity-in-depth.html'],

    // Replace imports for all the cases where createApp is needed, before the rest of the replacements
    [`import Vue from 'vue';`, `import { createApp } from 'vue';
const vueApp = createApp({});`, `https://v3-migration.vuejs.org/breaking-changes/global-api.html#a-new-global-api-createapp`],
    [`Vue.config`, `vueApp.config()`, `https://v3-migration.vuejs.org/breaking-changes/global-api.html`],
    [`Vue.directive`, `vueApp.directive`, `https://v3-migration.vuejs.org/breaking-changes/global-api.html`],
    [`Vue.filter(`, `vueApp.filter(`, `https://v3-migration.vuejs.org/breaking-changes/global-api.html`],
    [`Vue.mixin(`, `vueApp.mixin(`, `https://v3-migration.vuejs.org/breaking-changes/global-api.html`],
    [`Vue.component(`, `vueApp.component(`, `https://v3-migration.vuejs.org/breaking-changes/global-api.html`],
    [`Vue.use(`, `vueApp.use(`, `https://v3-migration.vuejs.org/breaking-changes/global-api.html`],
    [`Vue.prototype`, `vueApp.config.globalProperties`, `https://v3-migration.vuejs.org/breaking-changes/global-api.html`],
    // [`Vue.extend`, removePlaceholder, 'https://v3-migration.vuejs.org/breaking-changes/global-api.html#vue-extend-removed'],
    // [`Vue.extend`, `createApp({})`], //  (mixins)
    [`Vue.nextTick`, `nextTick`, 'https://v3-migration.vuejs.org/breaking-changes/global-api-treeshaking.html#global-api-treeshaking'],

    [/( {6}default)\(\)\s*\{([\s\S]*?)this\.([\s\S]*?\}\s*\})/g, (_, before, middle, after) => `${ before }(props) {${ middle }props.${ after }`, 'https://v3-migration.vuejs.org/breaking-changes/props-default-this.html'],
    [`value=`, `modelValue=`],
    [`@input=`, `@update:modelValue=`],
    // [`v-bind.sync=`, `:modelValue=`, `https://v3-migration.vuejs.org/breaking-changes/v-model.html#using-v-bind-sync`],
    [`click.native`, `click`, `https://v3-migration.vuejs.org/breaking-changes/v-model.html#using-v-bind-sync`],
    ['this.$slots', ``, 'https://eslint.vuejs.org/rules/require-slots-as-functions.html'],
    [`v-on="$listeners"`, removePlaceholder, `removed and integrated with $attrs https://v3-migration.vuejs.org/breaking-changes/listeners-removed.html`],
    [`:listeners="$listeners"`, `:v-bind="$attrs"`, `removed and integrated with $attrs https://v3-migration.vuejs.org/breaking-changes/listeners-removed.html`],

    [/this\.\$scopedSlots\[(\w+)\]|this\.\$scopedSlots\.(\w+)/, (match, key1, key2) => `this.$slots.${ key1 || key2 }()`, `(many components loop through them) https://v3-migration.vuejs.org/breaking-changes/slots-unification.html`],
    [` $scopedSlots`, ` $slots`, `(many components loop through them) https://v3-migration.vuejs.org/breaking-changes/slots-unification.html`],
    [/slot="(\w+:\w+)"\s+slot-scope="(\w+)"/g, `$1="$2"`, `not mentioned in migration https://vuejs.org/guide/components/slots.html#scoped-slots`],
    [/this\.\$slots\['([^']+)'\]/g, `this.$slots[\'$1\']()`, `not mentioned in migration https://vuejs.org/guide/components/slots.html#scoped-slots`],

    // TODO: probably requires JSDom
    // [/<template v-for="([\s\S]*?)">\s*<([\s\S]*?)\s*([\s\S]*?):key="([\s\S]*?)"([\s\S]*?)<\/([\s\S]*?)>\s*<\/template>/gs, '<template v-for="$1" :key="$4"><$3 $5>$6</$7>\n</template>', `https://v3-migration.vuejs.org/breaking-changes/key-attribute.html#with-template-v-for`],

    // TODO: except for <components /> elements, probably requires JSDom
    [' is=', ``, `https://v3-migration.vuejs.org/breaking-changes/custom-elements-interop.html#customized-built-in-elements`],
    [' :is=', ``, `https://v3-migration.vuejs.org/breaking-changes/custom-elements-interop.html#customized-built-in-elements`],

    // Directive updates
    [`bind(`, '', `beforeMount( but there's too many bind cases https://v3-migration.vuejs.org/breaking-changes/custom-directives.html`],
    [`update(`, '', `removed, also common term https://v3-migration.vuejs.org/breaking-changes/custom-directives.html`],
    [`inserted(`, `mounted(`, 'https://v3-migration.vuejs.org/breaking-changes/custom-directives.html'],
    [`componentUpdated(`, `updated(`, 'https://v3-migration.vuejs.org/breaking-changes/custom-directives.html'],
    [`unbind`, `unmounted`, 'https://v3-migration.vuejs.org/breaking-changes/custom-directives.html'],

    // [`propsData (app creation)`, ``, `use second argument of createApp({}) https://v3-migration.vuejs.org/breaking-changes/props-data.html`],
    [`@hook:lifecycleHook`, `@vue:lifecycleHook`, `https://v3-migration.vuejs.org/breaking-changes/vnode-lifecycle-events.html`],

    // Nuxt and initalize case only
    // TODO: Use eventbus replacement as temporary solution?
    // [`$on('event', callback)`, '', `no migration, existing lib, https://v3-migration.vuejs.org/breaking-changes/events-api.html`],
    // [`$off('event', callback)`, '', `no migration, existing lib, https://v3-migration.vuejs.org/breaking-changes/events-api.html`],
    // [`$once('event', callback)`, '', `no migration, existing lib, https://v3-migration.vuejs.org/breaking-changes/events-api.html`],

    // [`$children`, ``, `no migration, $refs are suggested as communication https://v3-migration.vuejs.org/breaking-changes/children.html`],

    // Extra cases TBD (it seems like we already use the suggested way for arrays)
    // watch option used on arrays not triggered by mutations https://v3-migration.vuejs.org/breaking-changes/watch.html
  ];

  files.forEach((file) => {
    let content = fs.readFileSync(file, 'utf8');
    const matchedCases = [];

    replacementCases.forEach(([text, replacement, notes]) => {
      // Simple text
      if (typeof text === 'string') {
        if (content.includes(text)) {
          // Exclude cases without replacement
          if (replacement) {
            // Remove discontinued functionalities which do not break
            content = content.replaceAll(text, replacement === removePlaceholder ? '' : replacement);
          }
          matchedCases.push([text, replacement, notes]);
        }
      } else {
        // Regex case
        if (text.test(content)) {
          content = content.replace(new RegExp(text, 'g'), replacement);
          matchedCases.push([text, replacement, notes]);
        }
      }
    });

    if (matchedCases.length) {
      writeContent(file, content);
      printContent(file, `Updating Vue syntax`, matchedCases);
      stats.vueSyntax.push(file);
      stats.total.push(file);
    }
  });
};

/**
 * Vue Router
 * Files: .vue, .js, .ts
 *
 * RouteConfig -> RouteRecordRaw
 * Location -> RouteLocation
 * Imported Router -> router = createRouter({})
 * router.name is now string | Symbol
 * mode:   'history' -> history: createWebHistory()
 */
const routerUpdates = () => {
  const files = glob.sync('**/*.{vue,js,ts}', { ignore });
  const cases = [
    'RouteConfig',
    'Location',
    'imported Router',
    'router.name',
    'mode: \'history\''
  ];

  files.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8');
    // TODO: Add case for existing terms (replaceReserved)

    const isCase = cases.some((text) => content.includes(text));

    if (isCase) {
      stats.router.push(file);
      stats.total.push(file);
    }
  });
};

/**
 * Jest update
 * https://test-utils.vuejs.org/migration
 * Files: .spec.js, .spec.ts, .test.js, .test.ts
 *
 * Verify presence of vue2-jest in jest config
 * config.mocks.$myGlobal -> config.global.mocks.$myGlobal
 * Remove createLocalVue
 * new Vuex.Store -> createStore
 * store -> global.store
 * propsData -> props
 * localVue.extend({}) removed and need component mount (used to test mixins)
 * Vue.nextTick -> await wrapper.vm.$nextTick()
 * mocks and stubs are now in global
 * Not keeping stubbed slots content -> config.global.renderStubDefaultSlot = true
 * findAll().at(0) removed -> findAll()[0]
 */
const jestUpdates = () => {
  const files = glob.sync('**/*.{spec.js,spec.ts,test.js,test.ts}', { ignore });
  const cases = [
    'config.mocks.$myGlobal',
    'createLocalVue',
    'new Vuex.Store',
    'store',
    'propsData',
    'localVue.extend({})',
    'Vue.nextTick',
    'mocks',
    'stubs',
    'config.global.renderStubDefaultSlot = false',
    'findAll().at(0)'
  ];

  files.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8');
    const isCase = cases.some((text) => content.includes(text));

    if (isCase) {
      stats.jest.push(file);
      stats.total.push(file);
    }
  });
};

/**
 * Jest config updates
 * Files: jest.config.js, .json, .ts
 *
 * /node_modules/@vue/vue2-jest --> reference needs new library version
 */
const jestConfigUpdates = () => {
  const files = glob.sync('**/jest.config.{js,ts,json}', { ignore });
  const cases = [
    ['/node_modules/@vue/vue2-jest', '/node_modules/@vue/vue3-jest']
  ];

  files.forEach((file) => {
    let content = fs.readFileSync(file, 'utf8');

    // Adopt new library for Vue3
    cases.forEach(([text, replacement]) => {
      const isCase = content.includes(text);

      if (isCase) {
        printContent(file, `Updating ${ text } to ${ replacement }`);
        content = content.replaceAll(text, replacement);

        writeContent(file, content);
        stats.jest.push(file);
        stats.total.push(file);
      }
    });
  });
};

/**
 * ESLint Updates
 * Files: .eslintrc.js, .eslintrc.json, .eslintrc.yml
 */
const eslintUpdates = () => {
  const files = glob.sync('**/.eslintrc.*{js,json,yml}', { ignore });
  // Add cases introduced with new recommended settings
  const replacePlugins = [
    ['plugin:vue/essential', 'plugin:vue/vue3-essential'],
    ['plugin:vue/strongly-recommended', 'plugin:vue/vue3-strongly-recommended'],
    ['plugin:vue/recommended', 'plugin:vue/vue3-recommended']
  ];
  const newRules = {
    'vue/one-component-per-file':         'off',
    'vue/no-deprecated-slot-attribute':   'off',
    'vue/require-explicit-emits':         'off',
    'vue/v-on-event-hyphenation':         'off',
    'vue/no-v-for-template-key-on-child': 'off',
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
    const eslintConfigPath = path.join(__dirname, `../${ file }`);
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
  const files = glob.sync('**/*.{vue, scss}', { ignore });
  const cases = [
    ['::v-deep', ':deep()'],
  ];

  files.forEach((file) => {
    const matchedCases = [];
    let content = fs.readFileSync(file, 'utf8');

    cases.forEach(([text, replacement]) => {
      const hasMatch = content.includes(text);

      if (hasMatch) {
        content = content.replaceAll(text, replacement);
        matchedCases.push(text);
      }
    });

    if (matchedCases.length) {
      writeContent(file, content);
      printContent(file, `Updating style`, matchedCases);
      stats.style.push(file);
      stats.total.push(file);
    }
  });
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

/**
 * Init application
 */
(function() {
  packageUpdates();
  gitHubActionsUpdates();
  nvmUpdates();
  vueConfigUpdates();
  vueSyntaxUpdates();
  routerUpdates();
  jestUpdates();
  jestConfigUpdates();
  eslintUpdates();
  tsUpdates();
  stylesUpdates();

  printLog();
})();
