// Main export for APIs, particularly for the composition API

import { inject } from 'vue';
import { ExtensionManager } from '@shell/types/extension-manager';
import { ShellApi as ShellApiImport } from '@shell/apis/intf/shell';

// Re-export the types for the APIs, so they appear in this module
export type ShellApi = ShellApiImport;
export type ExtensionManagerApi = ExtensionManager;

/**
 * Provides access to the registered extension manager instance.
 *
 * @returns The extension manager API
 */
export const useExtensionManager = (): ExtensionManagerApi => {
  return getApi<ExtensionManagerApi>('$extension', 'useExtensionManager');
};

/**
 * Returns the Shell API
 *
 * @returns The shell API
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
