import { VueConstructor } from 'vue';
import { ApiPrototype } from '@shell/types/rancher-api';

import { PluginOptions, installPlugin } from './utils';
import RancherApi from './rancher-api-class';
import ClusterApi from './cluster-api-class';
import ShellApi from './shell-api-class';
import ExtensionApi from './extension-api-class';

export const rancherApiPlugin = {
  install(Vue: VueConstructor, options: PluginOptions): void {
    const { store, prototypeName = ApiPrototype.RANCHER_API } = options;

    installPlugin(Vue, {
      store, className: RancherApi, prototypeName
    });
  },
};

export const clusterApiPlugin = {
  install(Vue: VueConstructor, options: PluginOptions): void {
    const { store, prototypeName = ApiPrototype.CLUSTER_API } = options;

    installPlugin(Vue, {
      store, className: ClusterApi, prototypeName
    });
  },
};

export const shellApiPlugin = {
  install(Vue: VueConstructor, options: PluginOptions): void {
    const { store, prototypeName = ApiPrototype.SHELL_API } = options;

    installPlugin(Vue, {
      store, className: ShellApi, prototypeName
    });
  },
};

export const extensionApiPlugin = {
  install(Vue: VueConstructor, options: PluginOptions): void {
    const { store, prototypeName = ApiPrototype.EXTENSION_API } = options;

    installPlugin(Vue, {
      store, className: ExtensionApi, prototypeName
    });
  },
};
