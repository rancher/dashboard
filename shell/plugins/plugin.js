// This plugin loads any UI Plugins at app load time
import { allHashSettled } from '@shell/utils/promise';
import { shouldLoadPlugin, UI_PLUGIN_BASE_URL } from '@shell/config/uiplugins';

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

  // Provide a mechanism to load the UI without the plugins loaded - in case there is a problem
  let loadPlugins = true;

  if (context.route?.path.endsWith('/safeMode')) {
    loadPlugins = false;
    console.warn('Safe Mode - plugins will not be loaded'); // eslint-disable-line no-console
  }

  if (loadPlugins) {
    const { store, $plugin } = context;

    // Fetch list of installed plugins from endpoint
    try {
      const res = await store.dispatch('management/request', {
        url:     `${ UI_PLUGIN_BASE_URL }/index.json`,
        headers: { accept: 'application/json' }
      });

      if (res) {
        const entries = res.entries || res.Entries || {};

        Object.values(entries).forEach((plugin) => {
          if (shouldLoadPlugin(plugin)) {
            let url;

            if (plugin?.metadata?.['direct'] === 'true') {
              url = plugin.endpoint;
            }

            hash[plugin.name] = $plugin.loadAsyncByNameAndVersion(plugin.name, plugin.version, url);
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
        context.store.dispatch('uiplugins/setError', { name, error: true });
      }
    });
  }
};
