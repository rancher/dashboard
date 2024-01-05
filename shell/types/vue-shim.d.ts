import { ApiPrototype } from '@shell/types/rancher-api';

import RancherApi from '../plugins/rancher-api/rancher-api-class';
import ClusterApi from '../plugins/rancher-api/cluster-api-class';
import ShellApi from '../plugins/rancher-api/shell-api-class';
import ExtensionApi from '../plugins/rancher-api/extension-api-class';

declare module '*.vue' {
  import Vue from 'vue';
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
      t: (key: string, args?: Record<string, any>, raw?: boolean) => string,
      /**
       * Prototypes for Rancher API
       */
      [ApiPrototype.RANCHER_API]: RancherApi;
      [ApiPrototype.CLUSTER_API]: ClusterApi;
      [ApiPrototype.SHELL_API]: ShellApi;
      [ApiPrototype.EXTENSION_API]: ExtensionApi;
  }
}

declare module 'js-yaml';
