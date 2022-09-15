// This plugin loads any UI Plugins at app load time
import { allHashSettled } from '@shell/utils/promise';

import { UI_PLUGIN } from '@shell/config/types';

const META_NAME_PREFIX = 'app-autoload-';

export default async(context) => {
  // UI Plugins declared in the HTML head
  const meta = context.app?.head?.meta || [];
  const hash = {};

  meta.forEach((m) => {
    const metaName = m.name || '';

    if (metaName.indexOf(META_NAME_PREFIX) === 0) {
      const name = metaName.substr(META_NAME_PREFIX.length);

      hash[name] = context.$plugin.loadAsync(name, m.content);
    }
  });

  // Discover all of the UI Plugins CRs

  let loadPlugins = true;

  // TODO: Might only want to do this if the user is an admin
  // Not sure we can tell this at this point
  // Provide a mechanism to load the UI without the plugins loaded - in case there is a problem
  if (context.route?.path === '/safeMode') {
    loadPlugins = false;
    console.warn('Safe Mode - plugins will not be loaded'); // eslint-disable-line no-console
  }

  const { store, $plugin, app } = context;

  try {
    const res = await store.dispatch('management/request', {
      url:     `/v1/${ UI_PLUGIN }`,
      timeout: 5000,
      headers: { accept: 'application/json' }
    });

    if (loadPlugins && res && res.data) {
      (res.data || []).forEach((resource) => {
        const plugin = resource.spec?.plugin;

        if (plugin) {
          const id = `${ plugin.name }-${ plugin.version }`;
          const url = `http://127.0.0.1:4500/${ id }/${ id }.umd.min.js`;

          hash[plugin.name] = $plugin.loadAsync(id, url);
        }
      });
    }
  } catch (e) {
    console.error('Could not load UI Plugins'); // eslint-disable-line no-console
    console.log(e); // eslint-disable-line no-console
  }

  // TODO: Need to load routes after app has loaded
  // Need a Nuxt window.onready

  // TODO - use the API
  // Load all of the plugins
  const pluginLoads = await allHashSettled(hash);

  // Some pluigns may have failed to load - store this
  Object.keys(pluginLoads).forEach((name) => {
    const res = pluginLoads[name];

    if (res?.status === 'rejected') {
      console.error(`Failed to load plugin: ${ name }`); // eslint-disable-line no-console

      // Record error in the uiplugins store, so that we can show this to the user
      context.store.dispatch('uiplugins/setError', { name, error: true });
    }
  });
};
