// Main export for APIs, particularly for the composition API

import { inject } from 'vue';
import { ExtensionManager } from '@shell/types/extension-manager';
import { ShellApi as ShellApiImport } from '@shell/apis/intf/shell';

// Re-export the types for the APIs, so they appear in this module
export type ShellApi = ShellApiImport;
export type ExtensionManagerApi = ExtensionManager;

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
