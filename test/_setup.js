// Setup browser environment
import hooks from 'require-extension-hooks';
import { config } from 'vue';

require('jsdom-global')();
require('browser-env')();

// Setup Vue.js to remove production tip
config.productionTip = false;

// https://github.com/nuxt/create-nuxt-app/issues/180#issuecomment-463069941
window.Date = global.Date = Date;

// Setup vue files to be processed by `require-extension-hooks-vue`
hooks('vue').plugin('vue').push();

// Setup vue and js files to be processed by `require-extension-hooks-babel`
hooks(['vue', 'js']).exclude(({ filename }) => filename.match(/\/node_modules\//) || filename.includes('webpack.config.test.js')
).plugin('babel').push();
