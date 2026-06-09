// Main export for APIs, particularly for the composition API

import { inject } from 'vue';
import { ExtensionManager } from '@shell/types/extension-manager';
import { ShellApi as ShellApiImport } from '@shell/apis/intf/shell';
import { ResourcesApiProvider as ResourcesApiProviderImport } from '@shell/apis/intf/resources';
import { VersionApi as VersionApiImport } from '@shell/apis/intf/version';

// Re-export the types for the APIs, so they appear in this module
export type ShellApi = ShellApiImport;
export type ResourcesApiProvider = ResourcesApiProviderImport;
export type ExtensionManagerApi = ExtensionManager;
export type VersionApi = VersionApiImport;

// Re-export resource types and constants
export * from '@shell/apis/intf/resources';

/**
 * Returns an object that can be used to access the registered extension manager instance.
 *
 * @returns Returns an object that can be used to access the registered extension manager instance.
 */
export const useExtensionManager = (): ExtensionManagerApi => {
  return getApi<ExtensionManagerApi>('$extension', 'useExtensionManager');
};

/**
 * Returns an object that implements the ShellApi interface
 *
 * @returns Returns an object that implements the ShellApi interface
 */
export const useShell = (): ShellApi => {
  return getApi<ShellApi>('$shell', 'useShell');
};

/**
 * Returns an object that implements the ResourcesApiProvider interface.
 * Provides type-safe access to cluster and management resources.
 *
 * @returns Returns an object that implements the ResourcesApiProvider interface
 *
 * @example
 * ```ts
 * import { useResources, K8S } from '@shell/apis';
 *
 * // Cluster-scoped resources (current cluster context)
 * const pod = await resources.cluster.find(K8S.POD, 'default/my-pod-123');
 *
 * // Management/global resources
 * const user = await resources.mgmt.find(K8S.USER, 'u-xyz789');
 * ```
 */
export const useResources = (): ResourcesApiProvider => {
  return getApi<ResourcesApiProvider>('$resources', 'useResources');
};

/**
 * Returns an object that implements the VersionApi interface, providing
 * reactive access to Rancher version information.
 *
 * Uses a 3-tier fallback so extensions compiled against a new shell
 * never break on older dashboards:
 * 1. Dedicated $version API (new dashboards)
 * 2. Shell API system property (2.14+ dashboards)
 * 3. Safe defaults (pre-2.14 dashboards)
 *
 * @returns Returns an object that implements the VersionApi interface
 *
 * @example
 * ```ts
 * import { useVersion } from '@shell/apis';
 *
 * const version = useVersion();
 * console.log('Is Prime:', version.isRancherPrime);
 * ```
 */
export const useVersion = (): VersionApi => {
  const provided = inject<VersionApi | null>('$version', null);

  if (provided) {
    return provided;
  }

  const shell = inject<ShellApi | null>('$shell', null);

  if (shell?.system) {
    return {
      get isRancherPrime() {
        return shell.system.isRancherPrime;
      },
      get version() {
        return shell.system.rancherVersion;
      },
      get gitCommit() {
        return shell.system.gitCommit;
      },
      get kubernetesVersion() {
        return shell.system.kubernetesVersion;
      },
    };
  }

  return {
    isRancherPrime:    false,
    version:           '',
    gitCommit:         '',
    kubernetesVersion: '',
  };
};

// =================================================================================================================
// Internal helper to get any API by key with error handling
// =================================================================================================================
function getApi<T>(key: string, name: string): T {
  const api = inject<T>(key);

  if (!api) {
    throw new Error(`${ name } must only be called after ${ key } has been initialized`);
  }

  return api as T;
}
