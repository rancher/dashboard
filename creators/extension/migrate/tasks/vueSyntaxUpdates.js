const glob = require('glob');
const { replaceCases } = require('../utils/content');
const {
  vueSetReplacement, vueDeleteReplacement, vueKeyReplacement, vueTemplateKeyReplacement, vueTemplateKeyRemoval
} = require('../utils/vueSyntax');

function vueSyntaxUpdates(params) {
  const files = glob.sync(
    params.paths || '**/*.{vue,js,ts}',
    {
      ignore: [
        ...params.ignore,
        '**/*.spec.ts',
        '**/*.spec.js',
        '**/__tests__/**',
        '**/*.test.ts',
        'jest.setup.js',
        '**/*.d.ts',
        '**/vue-shim.ts',
      ],
    }
  );

  const replacementCases = [
    // Handle Vue.set and this.$set
    [/\bVue\.set\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g, (match, obj, prop, val) => vueSetReplacement(match, obj, prop, val), 'Replace Vue.set with direct assignment - https://vuejs.org/guide/extras/reactivity-in-depth.html'],
    [/\bthis\.\$set\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g, (match, obj, prop, val) => vueSetReplacement(match, obj, prop, val), 'Replace this.$set with direct assignment - https://vuejs.org/guide/extras/reactivity-in-depth.html'],

    // Handle Vue.delete and this.$delete
    [/\bVue\.delete\(([^,]+),\s*([^)]+)\)/g, (match, obj, prop) => vueDeleteReplacement(match, obj, prop), 'Replace Vue.delete with delete operator - https://vuejs.org/guide/extras/reactivity-in-depth.html'],
    [/\bthis\.\$delete\(([^,]+),\s*([^)]+)\)/g, (match, obj, prop) => vueDeleteReplacement(match, obj, prop), 'Replace this.$delete with delete operator - https://vuejs.org/guide/extras/reactivity-in-depth.html'],

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

    // Add :key to <template v-for> elements if missing
    [
      /(<template\b[^>]*v-for="([^"]*)"[^>]*)(>)/g,
      (match, beforeTagEnd, vForContent, tagClose) => vueKeyReplacement(match, beforeTagEnd, vForContent, tagClose),
      'Add :key to <template v-for> elements if missing, using existing variables',
    ],

    // Move :key from child elements to <template v-for>
    [
      /(<template\b[^>]*v-for="[^"]*"[^>]*>)([\s\S]*?)(<\/template>)/g,
      (match, templateStart, templateContent, templateEnd) => vueTemplateKeyReplacement(match, templateStart, templateContent, templateEnd),
      'Move :key from child elements to <template v-for>',
    ],

    // Remove any remaining :key from child elements within <template v-for>
    [
      /(<template\b[^>]*v-for="[^"]*"[^>]*>)([\s\S]*?)(<\/template>)/g,
      (match, templateStart, templateContent, templateEnd) => vueTemplateKeyRemoval(match, templateStart, templateContent, templateEnd),
      'Remove any remaining :key from child elements within <template v-for>',
    ],

    // For other elements with v-for (excluding <template>), ensure :key is present
    [
      /(<(?!template\b)\w+[^>]*v-for="([^"]*)"[^>]*)(>)/g,
      (match, beforeTagEnd, vForContent, tagClose) => vueKeyReplacement(match, beforeTagEnd, vForContent, tagClose),
      'Add :key to elements with v-for that lack it, using existing variables (excluding <template>)',
    ],

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

  replaceCases('vueSyntax', files, replacementCases, 'Updating Vue syntax', params);
}

module.exports = vueSyntaxUpdates;
