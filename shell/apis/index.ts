// Main export for APIs, particularly for the composition API

import { inject } from 'vue';
import { ExtensionManager } from '@shell/types/extension-manager';
import { ShellApi as ShellApiImport } from '@shell/apis/intf/shell';
import { ResourcesApi as ResourcesApiImport } from '@shell/apis/intf/resources';

// Re-export the types for the APIs, so they appear in this module
export type ShellApi = ShellApiImport;
export type ResourcesApi = ResourcesApiImport;
export type ExtensionManagerApi = ExtensionManager;

// Re-export resource types and constants
export * from '@shell/apis/intf/resources';
export * from '@shell/types/resources';

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
 * Returns an object that implements the ResourcesApi interface.
 * Provides type-safe access to cluster and management resources.
 *
 * @returns Returns an object that implements the ResourcesApi interface
 *
 * @example
 * ```ts
 * import { useResources, K8S } from '@shell/apis';
 * import type { Pod } from '@shell/types/resources';
 *
 * const resources = useResources();
 * const pods = await resources.cluster.list<Pod>(K8S.POD);
 * ```
 */
export const useResources = (): ResourcesApi => {
  return getApi<ResourcesApi>('$resources', 'useResources');
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
