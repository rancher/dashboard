// This plugin loads any UI Plugins at app load time
import { allHashSettled } from '@shell/utils/promise';
import { shouldNotLoadPlugin, UI_PLUGIN_BASE_URL } from '@shell/config/uiplugins';
import { setVersionData, setKubeVersionData } from '@shell/config/version';

export default async function(context) {
  if (process.env.excludeOperatorPkg === 'true') {
    return;
  }

  const hash = {};

  // Provide a mechanism to load the UI without the plugins loaded - in case there is a problem
  let loadPlugins = true;

  const queryKeys = Object.keys(context.route?.query || {}).map((q) => q.toLowerCase());

  if (queryKeys.includes('safemode')) {
    loadPlugins = false;
    console.warn('Safe Mode - plugins will not be loaded'); // eslint-disable-line no-console
    setTimeout(() => {
      context.store.dispatch('growl/success', {
        title:   context.store.getters['i18n/t']('plugins.safeMode.title'),
        message: context.store.getters['i18n/t']('plugins.safeMode.message')
      }, { root: true });
    }, 1000);
  }

  if (loadPlugins) {
    let rancherVersion;
    let kubeVersion;

    const reqs = [];

    // Fetch rancher version metadata
    reqs.push(context.store.dispatch('rancher/request', {
      url:                  '/rancherversion',
      method:               'get',
      redirectUnauthorized: false
    }));

    // Fetch kubernetes version metadata
    reqs.push(context.store.dispatch('rancher/request', {
      url:                  '/version',
      method:               'get',
      redirectUnauthorized: false
    }));

    // Fetch list of installed plugins from endpoint
    reqs.push(context.store.dispatch('management/request', {
      url:                  `${ UI_PLUGIN_BASE_URL }`,
      method:               'GET',
      headers:              { accept: 'application/json' },
      redirectUnauthorized: false,
    }));

    const response = await Promise.allSettled(reqs);

    if (response[0]?.status === 'rejected') {
      console.warn('Failed to fetch Rancher version metadata', response[0]?.reason?.message); // eslint-disable-line no-console
    }

    if (response[1]?.status === 'rejected') {
      console.warn('Failed to fetch Kube version metadata', response[1]?.reason?.message); // eslint-disable-line no-console
    }

    if (response[2]?.status === 'rejected') {
      console.warn('Could not load UI Extensions list', response[2]?.reason?.message); // eslint-disable-line no-console
    }

    if (response[0]?.status === 'fulfilled') {
      rancherVersion = response[0]?.value?.Version;
      setVersionData(response[0]?.value);
    }

    if (response[1]?.status === 'fulfilled') {
      kubeVersion = response[1]?.value?.gitVersion;
      setKubeVersionData(response[1]?.value);
    }

    if (response[2]?.status === 'fulfilled' && response[2]?.value) {
      const entries = response[2]?.value.entries || response[2]?.value.Entries || {};

      Object.values(entries).forEach((plugin) => {
        const shouldNotLoad = shouldNotLoadPlugin(plugin, { rancherVersion, kubeVersion }, context.store.getters['uiplugins/plugins'] || []); // Error key string or boolean

        if (!shouldNotLoad) {
          hash[plugin.name] = context.$plugin.loadPluginAsync(plugin);
        } else {
          context.store.dispatch('uiplugins/setError', { name: plugin.name, error: shouldNotLoad });
        }
      });
    }

    // Load all of the plugins
    const pluginLoads = await allHashSettled(hash);

    // Some pluigns may have failed to load - store this
    Object.keys(pluginLoads).forEach((name) => {
      const res = pluginLoads[name];

      if (res?.status === 'rejected') {
        console.error(`Failed to load plugin: ${ name }. `, res.reason || 'Unknown reason'); // eslint-disable-line no-console

        // Record error in the uiplugins store, so that we can show this to the user
        context.store.dispatch('uiplugins/setError', { name, error: 'plugins.error.load' }); // i18n-uses plugins.error.load
      }
    });
  }

  return true;
}
