// Main export for APIs, particularly for the composition API

import { inject } from 'vue';
import { ExtensionManager } from '@shell/types/extension-manager';
import { ShellApi as ShellApiImport } from '@shell/apis/intf/shell';
import { ResourcesApiProvider as ResourcesApiProviderImport } from '@shell/apis/intf/resources';

// Re-export the types for the APIs, so they appear in this module
export type ShellApi = ShellApiImport;
export type ResourcesApiProvider = ResourcesApiProviderImport;
export type ExtensionManagerApi = ExtensionManager;

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
