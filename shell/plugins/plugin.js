// This plugin loads any UI Plugins at app load time
import { allHashSettled } from '@shell/utils/promise';
import { shouldNotLoadPlugin, UI_PLUGIN_BASE_URL } from '@shell/config/uiplugins';

const META_NAME_PREFIX = 'app-autoload-';

export default async function(context) {
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

  // Provide a mechanism to load the UI without the plugins loaded - in case there is a problem
  let loadPlugins = true;

  if (context.route?.path.endsWith('/safeMode')) {
    loadPlugins = false;
    console.warn('Safe Mode - plugins will not be loaded'); // eslint-disable-line no-console
  }

  if (loadPlugins) {
    // TODO: Get rancher version using the new API (can't use setting as we have not loading the store)
    const rancherVersion = undefined;

    // Fetch list of installed plugins from endpoint
    try {
      const res = await context.store.dispatch('management/request', {
        url:                  `${ UI_PLUGIN_BASE_URL }/index.json`,
        method:               'GET',
        headers:              { accept: 'application/json' },
        redirectUnauthorized: false,
      });

      if (res) {
        const entries = res.entries || res.Entries || {};

        Object.values(entries).forEach((plugin) => {
          const shouldNotLoad = shouldNotLoadPlugin(plugin, rancherVersion); // Error key string or false

          if (!shouldNotLoad) {
            hash[plugin.name] = context.$plugin.loadPluginAsync(plugin);
          } else {
            context.store.dispatch('uiplugins/setError', { name: plugin.name, error: shouldNotLoad });
          }
        });
      }
    } catch (e) {
      console.error('Could not load UI Plugin list', e); // eslint-disable-line no-console
    }

    // Load all of the plugins
    const pluginLoads = await allHashSettled(hash);

    // Some pluigns may have failed to load - store this
    Object.keys(pluginLoads).forEach((name) => {
      const res = pluginLoads[name];

      if (res?.status === 'rejected') {
        console.error(`Failed to load plugin: ${ name }`); // eslint-disable-line no-console

        // Record error in the uiplugins store, so that we can show this to the user
        context.store.dispatch('uiplugins/setError', { name, error: 'plugins.error.load' });
      }
    });
  }

  return true;
}
