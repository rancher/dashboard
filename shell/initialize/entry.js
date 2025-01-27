import fetch from 'unfetch';
import { extendApp } from './app-extended.js';
import fetchMixin from '@shell/mixins/fetch.client.js';
import { loadDebugger, mountApp } from '@shell/initialize/entry-helpers';
import { installDirectives } from '@shell/initialize/install-directives.js';
import { installComponents } from '@shell/initialize/install-components.js';
import { installPlugins } from '@shell/initialize/install-plugins.js';
import App from '@shell/initialize/App.vue';
import { createApp } from 'vue';

const vueApp = createApp(App);

// Fetch mixin
vueApp.mixin(fetchMixin);

// Bulk install components
installComponents(vueApp);

// Bulk install directives
installDirectives(vueApp);

// Bulk install Plugins. Note: Some are added within the App itself
installPlugins(vueApp);

if (!global.fetch) {
  global.fetch = fetch;
}
const debug = process.env.dev;
if(debug){
    loadDebugger(vueApp);
} else {
    //Need to add some error handler for production
    vueApp.config.errorHandler = async(err, vm, info, ...rest) => {
        if (vm?._component?.methods?.handleError) {
            vm._component.methods.handleError(err);
        }
    }
}

// Create and mount App
extendApp(vueApp).then((appPartials) => mountApp(appPartials, vueApp)).catch((err) => {
    return vueApp.config.errorHandler ? vueApp.config.errorHandler(err, vueApp) : console.error(err);
  }); // eslint-disable-line no-undef
