const glob = require('glob');
const { replaceCases } = require('../utils/content');

/**
 * Vue Router
 * Files: .vue, .js, .ts
 */
const routerUpdates = (params) => {
  const files = glob.sync(params.paths || '**/*.{vue,js,ts}', { ignore: params.ignore });
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

module.exports = routerUpdates;
