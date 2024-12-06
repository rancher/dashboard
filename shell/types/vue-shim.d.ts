// eslint-disable-next-line no-unused-vars
import Vue, { ComponentCustomProperties } from 'vue';

import { ApiPrototype } from '@shell/types/rancher-api';

// import RancherApi from '@shell/plugins/rancher-api/rancher-api-class';
// import ClusterApi from '@shell/plugins/rancher-api/cluster-api-class';
// import ExtensionApi from '@shell/plugins/rancher-api/extension-api-class';
import ShellApi from '@shell/plugins/rancher-api/shell-api-class';

declare module '*.vue' {
  export default Vue;
}

// This is required to keep typescript from complaining. It is required for
// our i18n plugin. For more info see:
// https://v2.vuejs.org/v2/guide/typescript.html?redirect=true#Augmenting-Types-for-Use-with-Plugins
declare module 'vue/types/vue' {
  // eslint-disable-next-line no-unused-vars
  interface Vue {
    /**
     * Lookup a given string with the given arguments
     * @param raw if set, do not do HTML escaping.
     */
    t: {
      (key: string, args?: Record<string, any>, raw?: boolean): string;
      (options: { k: string; raw?: boolean; tag?: string | Record<string, any>; escapehtml?: boolean }): string;
    };
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

declare module '@vue/runtime-core' {
  // eslint-disable-next-line no-unused-vars
  interface Vue {
    t: {
      (key: string, args?: Record<string, any>, raw?: boolean): string;
      (options: { k: string; raw?: boolean; tag?: string | Record<string, any>; escapehtml?: boolean }): string;
    }
  }

  // eslint-disable-next-line no-unused-vars
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

declare module 'js-yaml';
