/* eslint-disable */
import { ApiPrototype } from '@shell/types/rancher-api';

// import RancherApi from '@shell/plugins/rancher-api/rancher-api-class';
// import ClusterApi from '@shell/plugins/rancher-api/cluster-api-class';
// import ExtensionApi from '@shell/plugins/rancher-api/extension-api-class';
import ShellApi from '@shell/plugins/rancher-api/shell-api-class';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    t: {
      (key: string, args?: Record<string, any>, raw?: boolean): string;
      (options: { k: string; raw?: boolean; tag?: string | Record<string, any>; escapehtml?: boolean }): string;
    },
    $t: {
      (key: string, args?: Record<string, any>, raw?: boolean): string;
      (options: { k: string; raw?: boolean; tag?: string | Record<string, any>; escapehtml?: boolean }): string;
    },
    $store: {
      getters: Record<string, any>,
      dispatch: (action: string, payload?: any) => Promise<any>,
      commit: (mutation: string, payload?: any) => void,
    },
    /**
     * TODO: Add prototypes for Rancher API classes.
     *
     * Prototypes for Rancher API classes.
     */
    // [ApiPrototype.RANCHER_API]: RancherApi;
    // [ApiPrototype.CLUSTER_API]: ClusterApi;
    // [ApiPrototype.EXTENSION_API]: ExtensionApi;
    [ApiPrototype.SHELL_API]: ShellApi;
  }
}
