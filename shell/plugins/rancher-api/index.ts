// shell/plugins/rancher-api/index.ts

import { Store } from 'vuex';
import { ApiPrototype } from '@shell/types/rancher-api';
// import RancherApi from './rancher-api-class';
// import ClusterApi from './cluster-api-class';
// import ExtensionApi from './extension-api-class';
import ShellApi from './shell-api-class';

interface PluginContext {
  store: Store<any>;
  [key: string]: any;
}

export default function (context: PluginContext, inject: (key: string, value: any) => void) {
  const { store } = context;

  /**
   * TODO: Inject Rancher, Cluster, and Extension APIs
   */
  // Initialize API classes
  // const rancherApi = new RancherApi({ store });
  // const clusterApi = new ClusterApi({ store });
  // const extensionApi = new ExtensionApi({ store });
  const shellApi = new ShellApi({ store });

  // Inject the APIs
  // Remove the `$` prefix as it will be prefixed by the inject method in `@shell/initialize/install-plugin.js`
  // inject(ApiPrototype.RANCHER_API.substring(1), rancherApi);
  // inject(ApiPrototype.CLUSTER_API.substring(1), clusterApi);
  // inject(ApiPrototype.EXTENSION_API.substring(1), extensionApi);
  inject(ApiPrototype.SHELL_API.substring(1), shellApi);
}
