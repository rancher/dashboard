// This plugin loads any UI Plugins at app load time
import { allHashSettled } from '@shell/utils/promise';
import { shouldNotLoadPlugin, UI_PLUGIN_BASE_URL } from '@shell/config/uiplugins';
import { NORMAN, CAPI, MANAGEMENT } from '@shell/config/types';

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
    // TODO: Get rancher version using the new API (can't use setting as we have not loading the store)
    const rancherVersion = undefined;

    const reqs = await allHashSettled({
      // fetch clusters to get local cluster kube version
      clusters: context.store.dispatch('management/request', {
        url:                  `v3/clusters/local`,
        method:               'GET',
        headers:              { accept: 'application/json' },
        redirectUnauthorized: false,
      }),
      // Fetch list of installed plugins from endpoint
      installedPlugins: context.store.dispatch('management/request', {
        url:                  `${ UI_PLUGIN_BASE_URL }/index.json`,
        method:               'GET',
        headers:              { accept: 'application/json' },
        redirectUnauthorized: false,
      })
    });

    if (reqs.installedPlugins.status === 'fulfilled' && reqs.installedPlugins.value._status === 200) {
      const entries = reqs.installedPlugins.value.entries || reqs.installedPlugins.value.Entries || {};

      let currKubeVersion = '';

      if (reqs.clusters.status === 'fulfilled' && reqs.clusters.value._status === 200) {
        const localCluster = reqs.clusters.value;

        if (localCluster) {
          // norman cluster
          if (localCluster.type === NORMAN.CLUSTER) {
            currKubeVersion = localCluster.k3sConfig?.kubernetesVersion || localCluster.version?.gitVersion || '';
          }

          // prov cluster
          if (localCluster.type === CAPI.RANCHER_CLUSTER) {
            const fromStatus = localCluster.status?.version?.gitVersion;
            const fromSpec = localCluster.spec?.kubernetesVersion;

            currKubeVersion = fromStatus || fromSpec || '';
          }

          // mgmt cluster
          if (localCluster.type === MANAGEMENT.CLUSTER) {
            const fromStatus = localCluster.status?.version?.gitVersion;
            const fromSpec = localCluster.spec?.[`${ localCluster.status?.driver ? localCluster.status.driver : 'imported' }Config`]?.kubernetesVersion;

            currKubeVersion = fromStatus || fromSpec || '';
          }
        }
      }

      Object.values(entries).forEach((plugin) => {
        const shouldNotLoad = shouldNotLoadPlugin(plugin, rancherVersion, currKubeVersion, context.store.getters['uiplugins/plugins'] || []); // Error key string or boolean

        if (!shouldNotLoad) {
          hash[plugin.name] = context.$plugin.loadPluginAsync(plugin);
        } else {
          context.store.dispatch('uiplugins/setError', { name: plugin.name, error: shouldNotLoad });
        }
      });
    } else {
      if (reqs.installedPlugins?.value?._status.code === 404) {
      // Not found, so extensions operator probably not installed
        console.log('Could not load UI Extensions list (Extensions Operator may not be installed)'); // eslint-disable-line no-console
      } else {
        console.error('Could not load UI Extensions list', reqs.installedPlugins.reason); // eslint-disable-line no-console
      }
    }

    // Load all of the plugins
    const pluginLoads = await allHashSettled(hash);

    // Some plugins may have failed to load - store this
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
